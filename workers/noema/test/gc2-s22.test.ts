import { describe, expect, it } from "vitest";
import { CONSTRUCT_COSTS, SHARE_COST, SHARE_MAX_CO_OWNERS } from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, helpText } from "../src/actions";
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
    world_id: "test.hosted-canonical.gc2-s22",
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

describe("GC2-S22 mapper", () => {
  it("keeps SHARE cost, caps at four co-owners, and stays silent", () => {
    expect(SHARE_COST).toEqual({ compute: 1 });
    expect(SHARE_MAX_CO_OWNERS).toBeGreaterThanOrEqual(4);
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "SHARE" })).toBeNull();
    expect(helpText()).not.toMatch(/\bSHARE\b/i);
  });
});

describe("GC2-S22 world path", () => {
  it("lets the owner name a fourth co-owner and rejects re-sharing that partner", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    const c = principal("player.oriole");
    const d = principal("player.kite");
    const e = principal("player.tern");
    const f = principal("player.auk");
    await run(w, a, "ENTER_WORLD");
    w.players[a.player_id].handle = "Nacre";
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[a.player_id].budgets.storage = 16 - (CONSTRUCT_COSTS.workshop.storage || 0);
    const built = await run(w, a, "BUILD", { operation: "CONSTRUCT", class: "workshop" });
    expect(built.ok).toBe(true);
    const opened = await run(w, a, "WAIT");
    expect(opened.ok).toBe(true);
    await run(w, b, "ENTER_WORLD");
    await run(w, c, "ENTER_WORLD");
    await run(w, d, "ENTER_WORLD");
    await run(w, e, "ENTER_WORLD");
    await run(w, f, "ENTER_WORLD");
    w.players[b.player_id].handle = "Vesper";
    w.players[c.player_id].handle = "Oriole";
    w.players[d.player_id].handle = "Kite";
    w.players[e.player_id].handle = "Tern";
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[c.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[d.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[e.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const shop = w.rooms["room.hub"].entities.find((ent) => ent.infra_type === "workshop")!;
    const entityId = shop.entity_id;

    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    expect((await run(w, a, "BUILD", { operation: "SHARE", entity_id: entityId, player_id: b.player_id })).ok).toBe(true);
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    expect((await run(w, a, "BUILD", { operation: "SHARE", entity_id: entityId, player_id: c.player_id })).ok).toBe(true);
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    expect((await run(w, a, "BUILD", { operation: "SHARE", entity_id: entityId, player_id: d.player_id })).ok).toBe(true);

    const byCoOwner = await run(w, d, "BUILD", {
      operation: "SHARE",
      entity_id: entityId,
      player_id: e.player_id,
    });
    expect(byCoOwner.ok).toBe(false);
    expect(byCoOwner.error?.code).toBe("NOT_OWNER");

    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const fourth = await run(w, a, "BUILD", {
      operation: "SHARE",
      entity_id: entityId,
      player_id: e.player_id,
    });
    expect(fourth.ok).toBe(true);
    expect(fourth.events?.map((ev) => ev.event_type).sort()).toEqual(["BUDGET_CONSUMED", "ENTITY_UPDATE"]);
    expect(JSON.stringify(fourth.events || [])).not.toMatch(/STRUCTURE_/);
    const after = w.rooms["room.hub"].entities.find((ent) => ent.entity_id === entityId)!;
    expect(after.co_owner_id).toBe(b.player_id);
    expect(after.co_owner_2_id).toBe(c.player_id);
    expect(after.co_owner_3_id).toBe(d.player_id);
    expect(after.co_owner_4_id).toBe(e.player_id);
    expect(fourth.observation?.consequence).toMatch(/share the workshop with Tern/i);

    const again = await run(w, a, "BUILD", {
      operation: "SHARE",
      entity_id: entityId,
      player_id: e.player_id,
    });
    expect(again.ok).toBe(false);
    expect(again.error?.code).toBe("NOT_ADDRESSABLE");

    const upgrade = await run(w, e, "BUILD", { operation: "UPGRADE", entity_id: entityId });
    expect(upgrade.ok).toBe(true);

    w.players[a.player_id].room_id = "room.vault";
    const hidden = await run(w, a, "BUILD", {
      operation: "SHARE",
      entity_id: entityId,
      player_id: f.player_id,
    });
    expect(hidden.ok).toBe(false);
    expect(hidden.error?.code).toBe("NOT_OBSERVABLE");
  });
});
