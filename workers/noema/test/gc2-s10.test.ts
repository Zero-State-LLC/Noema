import { describe, expect, it } from "vitest";
import { VEST_COST } from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, helpText, parseHumanCommand } from "../src/actions";
import { projectionIdForEvent } from "../src/watch-live";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${id}`,
    controller_type: "human",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.gc2-s10",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Grid.",
        exits: [],
        entities: [],
      },
      "room.vault": {
        room_id: "room.vault",
        name: "Hidden Vault",
        description: "Unadvertised.",
        exits: [],
        entities: [],
        hidden: true,
        tags: ["hidden"],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
  };
}

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("GC2-S10 mapper", () => {
  it("parses vest and keeps help quiet", () => {
    const parsed = parseHumanCommand("vest workshop to org.x");
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "BUILD") {
      expect(parsed.action.arguments).toEqual({ operation: "VEST", entity_id: "workshop", org_id: "org.x" });
    }
    expect(VEST_COST).toEqual({ compute: 1 });
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "VEST" })).toBeNull();
    expect(helpText()).not.toMatch(/\bvest\b/i);
  });
});

describe("GC2-S10 world path", () => {
  it("vests an owned public workshop to an occupied named-asset office", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const built = await run(w, a, "BUILD", { operation: "CONSTRUCT", class: "workshop" });
    expect(built.ok).toBe(true);
    const opened = await run(w, a, "WAIT");
    expect(opened.ok).toBe(true);
    await run(w, b, "ENTER_WORLD");
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const shop = w.rooms["room.hub"].entities.find((e) => e.infra_type === "workshop")!;
    const entityId = shop.entity_id;

    const formed = await run(w, a, "ORG_CREATE", { name: "Nacre Compact", charter: "works" });
    expect(formed.ok).toBe(true);
    const orgId = Object.keys(w.organizations)[0];
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const vacant = await run(w, a, "BUILD", { operation: "VEST", entity_id: entityId, org_id: orgId });
    expect(vacant.ok).toBe(false);
    expect(vacant.error?.code).toBe("FORBIDDEN");

    const created = await run(w, a, "ORG_OFFICE_CREATE", {
      org_id: orgId,
      display_name: "Works",
      authority_profile: "OPERATE_NAMED_ASSET",
    });
    expect(created.ok).toBe(true);
    const officeId = Object.keys(w.organizations[orgId].offices || {})[0];
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const stillVacant = await run(w, a, "BUILD", { operation: "VEST", entity_id: entityId, org_id: orgId });
    expect(stillVacant.ok).toBe(false);
    expect(stillVacant.error?.code).toBe("FORBIDDEN");

    const assigned = await run(w, a, "ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: a.player_id });
    expect(assigned.ok).toBe(true);
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const stranger = await run(w, b, "BUILD", { operation: "VEST", entity_id: entityId, org_id: orgId });
    expect(stranger.ok).toBe(false);
    expect(stranger.error?.code).toBe("NOT_OWNER");

    const vested = await run(w, a, "BUILD", { operation: "VEST", entity_id: entityId, org_id: orgId });
    expect(vested.ok).toBe(true);
    expect(vested.events?.map((e) => e.event_type).sort()).toEqual(["BUDGET_CONSUMED", "ENTITY_UPDATE"]);
    expect(JSON.stringify(vested.events || [])).not.toMatch(/STRUCTURE_/);
    const after = w.rooms["room.hub"].entities.find((e) => e.entity_id === entityId)!;
    expect(after.owner_id).toBe(orgId);
    expect(vested.observation?.consequence).toMatch(/held by Nacre Compact/);

    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const upgrade = await run(w, a, "BUILD", { operation: "UPGRADE", entity_id: entityId });
    expect(upgrade.ok).toBe(true);

    const outsiderUp = await run(w, b, "BUILD", { operation: "UPGRADE", entity_id: entityId });
    expect(outsiderUp.ok).toBe(false);
    expect(outsiderUp.error?.code).toBe("NOT_OWNER");
  });

  it("rejects hidden-room vest", async () => {
    const w = world();
    const p = principal("player.vesper");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[p.player_id].room_id = "room.vault";
    const blocked = await run(w, p, "BUILD", {
      operation: "VEST",
      entity_id: "entity.workshop.x",
      org_id: "org.x",
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("NOT_OBSERVABLE");
  });
});
