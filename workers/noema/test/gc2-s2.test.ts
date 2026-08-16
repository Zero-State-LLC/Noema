import { describe, expect, it } from "vitest";
import { CONSTRUCT_COSTS, parseConstructibleClass, withWorkshopStorage } from "../src/construction";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { COSTS, DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText } from "../src/actions";
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
    world_id: "test.hosted-canonical.gc2-s2",
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
        entities: [
          enrichEntity({
            entity_id: "entity.relay-a",
            label: "north-relay",
            entity_type: "INFRASTRUCTURE",
            condition: 40,
          }),
        ],
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

describe("GC2-S2 mapper", () => {
  it("parses workshop and discounts storage without changing help", () => {
    expect(parseConstructibleClass("workshop")).toBe("workshop");
    expect(withWorkshopStorage({ storage: 4 }, true).storage).toBe(3);
    expect(withWorkshopStorage({ ...COSTS.REPAIR }, true).storage).toBeUndefined();
    expect(helpText()).not.toMatch(/\bBUILD\b/);
  });
});

describe("GC2-S2 world path", () => {
  it("opens a workshop, discounts in-room construct and repair, and rejects hidden construct", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const first = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "workshop" });
    expect(first.ok).toBe(true);
    expect(first.observation?.consequence).toMatch(/workshop is open/i);
    expect(w.players[p.player_id].budgets.storage).toBe(DEFAULT_BUDGETS.storage - 5);

    const storageBeforeGen = w.players[p.player_id].budgets.storage;
    const gen = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "generator" });
    expect(gen.ok).toBe(true);
    expect(w.players[p.player_id].budgets.storage).toBe(storageBeforeGen - ((CONSTRUCT_COSTS.generator.storage || 0) - 1));

    const storageBeforeRepair = w.players[p.player_id].budgets.storage;
    const repaired = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay-a" });
    expect(repaired.ok).toBe(true);
    expect(w.players[p.player_id].budgets.storage).toBe(storageBeforeRepair);
    expect(w.players[p.player_id].budgets.energy).toBeLessThan(DEFAULT_BUDGETS.energy);

    const hidden = world();
    const q = principal("player.vesper");
    await run(hidden, q, "ENTER_WORLD");
    hidden.players[q.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    hidden.players[q.player_id].room_id = "room.vault";
    const blocked = await run(hidden, q, "BUILD", { operation: "CONSTRUCT", class: "workshop" });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("NOT_OBSERVABLE");
  });
});
