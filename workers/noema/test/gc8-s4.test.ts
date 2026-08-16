import { describe, expect, it } from "vitest";
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
    world_id: "test.hosted-canonical.gc8-s4",
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

describe("GC8-S4 mapper", () => {
  it("keeps empty MOVE at 1 and charges 2 when storage is below the grant", () => {
    expect(moveEnergyCost(16)).toBe(1);
    expect(moveEnergyCost(15)).toBe(2);
    expect(moveEnergyCost(0)).toBe(2);
    expect(helpText()).not.toMatch(/\bcurrency\b/i);
    expect(helpText()).not.toMatch(/\bcourier\b/i);
  });
});

describe("GC8-S4 world path", () => {
  it("charges empty MOVE 1 and cargo MOVE 2 after harvest", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const emptyBefore = w.players[p.player_id].budgets.energy;
    const empty = await run(w, p, "MOVE", { direction: "east" });
    expect(empty.ok).toBe(true);
    expect(w.players[p.player_id].budgets.energy).toBe(emptyBefore - 1);
    expect(empty.observation?.lot_lines || []).not.toContain(CARGO_LINE);

    const back = await run(w, p, "MOVE", { direction: "west" });
    expect(back.ok).toBe(true);
    const harvested = await run(w, p, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell", amount: 1 });
    expect(harvested.ok).toBe(true);
    expect(w.players[p.player_id].budgets.storage).toBeLessThan(DEFAULT_BUDGETS.storage);
    const cargoBefore = w.players[p.player_id].budgets.energy;
    const cargo = await run(w, p, "MOVE", { direction: "east" });
    expect(cargo.ok).toBe(true);
    expect(w.players[p.player_id].budgets.energy).toBe(cargoBefore - 2);
    expect(cargo.observation?.lot_lines).toContain(CARGO_LINE);
    expect(String(cargo.events?.[0]?.payload?.cost_paid || "")).not.toMatch(/room\.vault|Hidden/);
  });
});
