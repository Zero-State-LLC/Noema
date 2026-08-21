import { describe, expect, it } from "vitest";
import { applyWorldCommand, migrateWorldRuntime, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import { buildWatchLive } from "../src/watch-live";
import { previewGenesis } from "../src/genesis";
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
    world_id: "world.deep-time",
    world_name: "Deep",
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
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "relay",
            entity_type: "INFRASTRUCTURE",
            condition: 90,
          }),
          enrichEntity({ entity_id: "entity.archive-ledger", label: "ledger", entity_type: "ARTIFACT" }),
          {
            ...enrichEntity({
              entity_id: "entity.salvage-cache",
              label: "salvage cache",
              entity_type: "RESOURCE",
              stock_resource: "materials",
              stock_amount: 8,
            }),
            max_stock: 18,
            regen_rate: 1.0,
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

describe("p5-dt-01 scars", () => {
  it("three HARVESTs open a public economic scar and attach it to LOOK", async () => {
    const w = fixture();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, energy: 40, compute: 40, storage: 16 });
    const salvage = () => w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.salvage-cache")!;
    const regen0 = salvage().regen_rate ?? 1;
    for (let i = 0; i < 3; i++) {
      const h = await run(w, p, "HARVEST", { entity_id: "entity.salvage-cache", amount: 1 });
      expect(h.ok).toBe(true);
    }
    expect((w.scars || []).length).toBeGreaterThanOrEqual(1);
    const scar = w.scars!.find((s) => s.domain === "economic");
    expect(scar?.visibility).toBe("public");
    expect(scar!.strength).toBeGreaterThan(0);
    const look = await run(w, p, "LOOK");
    expect(look.observation?.scars?.length).toBeGreaterThanOrEqual(1);
    expect(look.observation?.historical_context?.fragments).toBeGreaterThanOrEqual(3);
    expect(look.observation?.path_dependence_index).toBeGreaterThan(0);
    const regen1 = salvage().regen_rate ?? 0;
    expect(regen1).toBeLessThan(regen0);
    expect(w.co_evolution?.deep_time?.scars?.length).toBeGreaterThanOrEqual(1);
    const revived = JSON.parse(JSON.stringify(w)) as WorldRuntime;
    revived.scars = [];
    revived.evidence_fragments = [];
    revived.trajectory_digest = {};
    migrateWorldRuntime(revived);
    expect((revived.scars || []).length).toBeGreaterThanOrEqual(1);
    expect((revived.evidence_fragments || []).length).toBeGreaterThanOrEqual(3);
  });
});

describe("p5-dt-02 evidence + reconstruct fidelity", () => {
  it("ATTEST writes a fragment; RECONSTRUCT with LIVE_INSPECT eases the scar", async () => {
    const w = fixture();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets({
      ...DEFAULT_BUDGETS,
      energy: 40,
      compute: 40,
      storage: 16,
      attention: 20,
    });
    for (let i = 0; i < 3; i++) {
      expect((await run(w, p, "HARVEST", { entity_id: "entity.salvage-cache", amount: 1 })).ok).toBe(true);
    }
    const strengthBefore = w.scars![0].strength;
    const attest = await run(w, p, "ATTEST", {
      entity_id: "entity.archive-ledger",
      subject_entity_id: "entity.relay-7",
      archive_claim: "OPERATING",
      signal: { grounding: "observed" },
    });
    expect(attest.ok).toBe(true);
    expect((w.evidence_fragments || []).some((f) => f.kind === "ATTEST")).toBe(true);

    const inspected = await run(w, p, "INSPECT", { entity_id: "entity.salvage-cache" });
    expect(inspected.ok).toBe(true);

    const rec = await run(w, p, "RECONSTRUCT", {
      subject_ref: "entity.salvage-cache",
      claim: "over-harvest scarred this salvage cache",
      evidence: ["LIVE_INSPECT"],
    });
    expect(rec.ok).toBe(true);
    const recorded = Object.values(w.reconstructions || {})[0];
    expect(recorded.fidelity).toBeGreaterThan(0.4);
    expect(w.scars![0].strength).toBeLessThan(strengthBefore);
  });
});

describe("p5-dt-06 slow coevolve", () => {
  it("deepTimeCoEvolve on cycle%5 decays non-fossilized scars", async () => {
    const w = fixture();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, energy: 40, compute: 40, storage: 16 });
    for (let i = 0; i < 3; i++) {
      expect((await run(w, p, "HARVEST", { entity_id: "entity.salvage-cache", amount: 1 })).ok).toBe(true);
    }
    const before = w.scars![0].strength;
    w.cycle = 5;
    const attest = await run(w, p, "ATTEST", {
      entity_id: "entity.archive-ledger",
      subject_entity_id: "entity.relay-7",
      archive_claim: "OPERATING",
      signal: { grounding: "observed" },
    });
    expect(attest.ok).toBe(true);
    expect(w.scars![0].strength).toBeLessThan(before);
  });
});

describe("WATCH leak-closed + genesis seed", () => {
  it("WATCH JSON has no reputation_summary; public entity.scar may appear", () => {
    const snap = buildWatchLive({
      world_id: "world.test",
      cycle: 0,
      sequence: 1,
      rooms: {
        "room.hub": {
          room_id: "room.hub",
          name: "Hub",
          description: "",
          exits: [],
          entities: [{ entity_id: "e1", label: "ruin", entity_type: "RUIN", scar: true }],
        },
      },
      players: [{ player_id: "player.a", handle: "a", room_id: "room.hub", entered: true, last_seen_ms: Date.now() }],
      events: [],
    });
    const text = JSON.stringify(snap);
    expect(text).not.toMatch(/reputation_summary/);
    expect(text).not.toMatch(/image_score/);
    expect(text).toMatch(/scar/);
  });

  it("EWM_ENHANCED Cycle 0 seeds a civic-exchange scar prototype", async () => {
    const a = await previewGenesis({
      world_name: "Perihelion Reach",
      world_seed: "ewm-cutover-test-fixture",
      profile_id: "EWM_ENHANCED",
      story_seed_ids: ["OLD_TRADE_NETWORK", "RESOURCE_CRISIS"],
      world_id: "test.hosted-canonical.ewm-cutover",
    });
    expect(a.cycle0.scar_seeds?.[0]?.room_id).toBe("room.civic-exchange");
    expect(a.cycle0.scar_seeds?.[0]?.domain).toBe("economic");
  });
});
