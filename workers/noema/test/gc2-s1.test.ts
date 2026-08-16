import { describe, expect, it } from "vitest";
import { parseConstructibleClass } from "../src/construction";
import { CARGO_LINE, moveEnergyCost } from "../src/transport";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText } from "../src/actions";
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
    world_id: "test.hosted-canonical.gc2-s1",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Grid.",
        exits: [{ direction: "east", to_room_id: "room.east" }],
        entities: [
          enrichEntity({
            entity_id: "entity.cell",
            label: "storage-cell",
            entity_type: "RESOURCE",
            condition: 80,
            stock_resource: "energy",
            stock_amount: 8,
          }),
        ],
      },
      "room.east": {
        room_id: "room.east",
        name: "Coldline",
        description: "A second node.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
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

describe("GC2-S1 mapper", () => {
  it("accepts route_link and waives cargo when the flag is set", () => {
    expect(parseConstructibleClass("route_link")).toBe("route_link");
    expect(moveEnergyCost(15)).toBe(2);
    expect(moveEnergyCost(15, undefined, true)).toBe(1);
    expect(helpText()).not.toMatch(/\bBUILD\b/);
  });
});

describe("GC2-S1 world path", () => {
  it("opens a route_link, waives cargo MOVE, and rejects hidden construct", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets({ ...DEFAULT_BUDGETS, energy: 80, storage: 16 });
    const built = await run(w, p, "BUILD", { operation: "CONSTRUCT", class: "route_link" });
    expect(built.ok).toBe(true);
    expect(built.observation?.consequence).toMatch(/route link was opened/i);
    const harvested = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell", amount: 1 });
    expect(harvested.ok).toBe(true);
    expect(w.players[p.player_id].budgets.storage).toBeLessThan(16);
    expect(harvested.observation?.lot_lines || []).not.toContain(CARGO_LINE);
    const before = w.players[p.player_id].budgets.energy;
    const moved = await run(w, p, "MOVE", { direction: "east" });
    expect(moved.ok).toBe(true);
    expect(w.players[p.player_id].budgets.energy).toBe(before - 1);
    expect(String(moved.observation?.consequence || "")).not.toMatch(/Carrying lots cost extra/);

    const hidden = world();
    const q = principal("player.vesper");
    await run(hidden, q, "ENTER_WORLD");
    hidden.players[q.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    hidden.players[q.player_id].room_id = "room.vault";
    const blocked = await run(hidden, q, "BUILD", { operation: "CONSTRUCT", class: "route_link" });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe("NOT_OBSERVABLE");
  });
});
