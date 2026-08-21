import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import { emptyTreasury } from "../src/offices";
import { previewGenesis } from "../src/genesis";
import { buildWatchLive } from "../src/watch-live";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function fixture(): WorldRuntime {
  return {
    world_id: "world.dt-ratchet",
    world_name: "Ratchet",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Hub.",
        exits: [],
        entities: [
          enrichEntity({ entity_id: "entity.relay-7", label: "relay", entity_type: "INFRASTRUCTURE", condition: 90 }),
          enrichEntity({ entity_id: "entity.archive-ledger", label: "ledger", entity_type: "ARTIFACT" }),
          {
            ...enrichEntity({
              entity_id: "entity.salvage-cache",
              label: "salvage",
              entity_type: "RESOURCE",
              stock_resource: "materials",
              stock_amount: 8,
            }),
            max_stock: 18,
            regen_rate: 1,
          },
        ],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
    co_evolution: { harvest_pressure: { "room.hub": 0 }, regen_mod: {} },
  };
}

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("p5-dt-03 path-dependence ratchet", () => {
  it("second ORG_CREATE pays reversal_cost extra influence", async () => {
    const w = fixture();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, influence: 5, compute: 8 });
    const first = await run(w, p, "ORG_CREATE", { name: "First", charter: "Keep the line." });
    expect(first.ok).toBe(true);
    expect(w.norm_ratchets?.org_create?.reversal_cost).toBe(1);
    expect(w.players[p.player_id].budgets.influence).toBe(0);
    const secondCheap = await run(w, p, "ORG_CREATE", { name: "Second", charter: "Undo the line." });
    expect(secondCheap.ok).toBe(false);
    expect(secondCheap.error?.code).toBe("BUDGET_EXCEEDED");
    w.players[p.player_id].budgets.influence = 6;
    w.players[p.player_id].budgets.compute = 8;
    const second = await run(w, p, "ORG_CREATE", { name: "Second", charter: "Undo the line." });
    expect(second.ok).toBe(true);
    expect(w.norm_ratchets?.org_create?.hits).toBe(2);
    expect(w.norm_ratchets?.org_create?.path_dependence_strength).toBeGreaterThan(0);
  });
});

describe("p5-dt-04 succession inheritance", () => {
  it("consensus successor inherits scar_vector, digest, lore_seeds", async () => {
    const w = fixture();
    const founder = principal("player.nacre");
    const sable = principal("player.sable");
    const vesper = principal("player.vesper");
    await run(w, founder, "ENTER_WORLD");
    await run(w, sable, "ENTER_WORLD");
    await run(w, vesper, "ENTER_WORLD");
    for (const p of [founder, sable, vesper]) {
      w.players[p.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, influence: 8, compute: 8, energy: 20, storage: 12 });
    }
    for (let i = 0; i < 3; i++) {
      expect((await run(w, founder, "HARVEST", { entity_id: "entity.salvage-cache", amount: 1 })).ok).toBe(true);
    }
    const createdOrg = await run(w, founder, "ORG_CREATE", { name: "Line", charter: "Keep", org_id: "org.line" });
    expect(createdOrg.ok).toBe(true);
    const orgId = Object.keys(w.organizations)[0];
    w.players[founder.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, influence: 8, compute: 8 });
    const add1 = await run(w, founder, "ORG_MEMBER_ADD", { org_id: orgId, agent_id: sable.player_id, role: "member" });
    expect(add1.ok).toBe(true);
    w.players[founder.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, influence: 8, compute: 8 });
    const add2 = await run(w, founder, "ORG_MEMBER_ADD", { org_id: orgId, agent_id: vesper.player_id, role: "member" });
    expect(add2.ok).toBe(true);
    w.organizations[orgId].treasury = { ...emptyTreasury(), compute: 8 };
    w.players[founder.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, influence: 8, compute: 8 });
    const created = await run(w, founder, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Notice",
      authority_profile: "PUBLISH_NOTICE",
    });
    expect(created.ok).toBe(true);
    const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
    w.organizations[orgId].offices![officeId].status = "VACANT";
    delete w.organizations[orgId].offices![officeId].holder_player_id;
    const first = await run(w, sable, "ORG_SUCCESSION_CONSENT", { office_id: officeId, agent_id: vesper.player_id });
    expect(first.ok).toBe(true);
    const seated = await run(w, founder, "ORG_SUCCESSION_CONSENT", { office_id: officeId, agent_id: vesper.player_id });
    expect(seated.ok).toBe(true);
    const inherited = w.players[vesper.player_id].inherited;
    expect(inherited).toBeTruthy();
    expect(inherited!.scar_vector.length).toBeGreaterThanOrEqual(1);
    expect(inherited!.trajectory_digest.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(inherited!.lore_seeds)).toBe(true);
  });
});

describe("p5-dt-05 lore attractors", () => {
  it("slow coevolve crystallizes a room attractor; LOOK lists it; WATCH has no reputation", async () => {
    const w = fixture();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, energy: 40, compute: 40, storage: 16, attention: 12 });
    for (let i = 0; i < 3; i++) {
      expect((await run(w, p, "HARVEST", { entity_id: "entity.salvage-cache", amount: 1 })).ok).toBe(true);
    }
    w.cycle = 5;
    const attest = await run(w, p, "ATTEST", {
      entity_id: "entity.archive-ledger",
      subject_entity_id: "entity.relay-7",
      archive_claim: "OPERATING",
      signal: { grounding: "observed" },
    });
    expect(attest.ok).toBe(true);
    expect((w.lore_attractors || []).some((a) => a.room_id === "room.hub")).toBe(true);
    const look = await run(w, p, "LOOK");
    expect((look.observation?.lore_attractors || []).length).toBeGreaterThanOrEqual(1);
    const watch = JSON.stringify(
      buildWatchLive({
        world_id: w.world_id,
        cycle: w.cycle,
        sequence: 1,
        rooms: { "room.hub": { room_id: "room.hub", name: "Hub", description: "", exits: [], entities: [] } },
        players: [{ player_id: p.player_id, handle: "nacre", room_id: "room.hub", entered: true, last_seen_ms: Date.now() }],
        events: [],
      }),
    );
    expect(watch).not.toMatch(/reputation_summary/);
    expect(watch).not.toMatch(/image_score/);
  });

  it("EWM_ENHANCED seeds a lore prototype", async () => {
    const a = await previewGenesis({
      world_name: "Perihelion Reach",
      world_seed: "ewm-cutover-test-fixture",
      profile_id: "EWM_ENHANCED",
      story_seed_ids: ["OLD_TRADE_NETWORK", "RESOURCE_CRISIS"],
      world_id: "test.hosted-canonical.ewm-cutover",
    });
    expect(a.cycle0.lore_prototypes?.[0]?.room_id).toBe("room.civic-exchange");
  });
});
