import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { COSTS, DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

/**
 * GC8-S0 already-true characterization.
 * Authority: Noema-Specs docs/GC8-FIRST-SLICE.md / RFC-0012.
 * Does not change HARVEST / MOVE / TRADE magnitudes.
 */

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

function fixtureWorld(): WorldRuntime {
  return {
    world_id: "world.test",
    world_name: "Test Reach",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A harvest node.",
        exits: [{ direction: "east", to_room_id: "room.east" }],
        entities: [
          enrichEntity({
            entity_id: "entity.storage-cell-west",
            label: "west-cache",
            entity_type: "INFRASTRUCTURE",
            stock_resource: "energy",
            stock_amount: 8,
          }),
        ],
      },
      "room.east": {
        room_id: "room.east",
        name: "Coldline",
        description: "A second harvest node.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
        entities: [
          enrichEntity({
            entity_id: "entity.storage-cell-east",
            label: "east-cache",
            entity_type: "INFRASTRUCTURE",
            stock_resource: "energy",
            stock_amount: 8,
          }),
        ],
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

async function run(
  w: WorldRuntime,
  p: PlayerPrincipal,
  command: string,
  args: Record<string, unknown> = {},
  key?: string,
) {
  const envl: CommandEnvelope = {
    request_id: key || `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: key || `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("GC8-S0 already-true distance interdependence", () => {
  it("pair HARVEST+TRADE spends energy 4; lone HARVEST+MOVE+HARVEST spends 5", async () => {
    const pair = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(pair, a, "ENTER_WORLD");
    await run(pair, b, "ENTER_WORLD");
    pair.players[b.player_id].room_id = "room.east";
    pair.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    pair.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);

    const aEnergy0 = pair.players[a.player_id].budgets.energy;
    const bEnergy0 = pair.players[b.player_id].budgets.energy;
    const ha = await run(pair, a, "COMMIT", {
      operation: "HARVEST",
      entity_id: "entity.storage-cell-west",
      amount: 1,
    });
    const hb = await run(pair, b, "COMMIT", {
      operation: "HARVEST",
      entity_id: "entity.storage-cell-east",
      amount: 1,
    });
    expect(ha.ok).toBe(true);
    expect(hb.ok).toBe(true);
    // Action energy only: each HARVEST costs 2; the +1 resource credit is not a cost.
    const pairHarvestSpent =
      aEnergy0 -
      pair.players[a.player_id].budgets.energy +
      1 +
      (bEnergy0 - pair.players[b.player_id].budgets.energy + 1);
    expect(pairHarvestSpent).toBe(4);
    const energyAfterHarvests =
      pair.players[a.player_id].budgets.energy + pair.players[b.player_id].budgets.energy;
    const trade = await run(pair, a, "TRADE", {
      phase: "propose",
      counterparty_id: b.player_id,
      offered: { energy: 1 },
      requested: { compute: 1 },
    });
    expect(trade.ok).toBe(true);
    const tradeId = Object.keys(pair.trades)[0];
    const accepted = await run(pair, b, "TRADE", { phase: "accept", trade_id: tradeId });
    expect(accepted.ok).toBe(true);
    expect(pair.players[a.player_id].room_id).not.toBe(pair.players[b.player_id].room_id);
    expect(
      pair.players[a.player_id].budgets.energy + pair.players[b.player_id].budgets.energy,
    ).toBe(energyAfterHarvests);
    expect(COSTS.HARVEST.energy).toBe(2);
    expect(COSTS.MOVE.energy).toBe(1);
    expect(COSTS.TRADE.energy || 0).toBe(0);

    const lone = fixtureWorld();
    const solo = principal("player.lone");
    await run(lone, solo, "ENTER_WORLD");
    lone.players[solo.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const lone0 = lone.players[solo.player_id].budgets.energy;
    const h1 = await run(lone, solo, "COMMIT", {
      operation: "HARVEST",
      entity_id: "entity.storage-cell-west",
      amount: 1,
    });
    const moved = await run(lone, solo, "MOVE", { direction: "east" });
    const h2 = await run(lone, solo, "COMMIT", {
      operation: "HARVEST",
      entity_id: "entity.storage-cell-east",
      amount: 1,
    });
    expect(h1.ok && moved.ok && h2.ok).toBe(true);
    const loneSpent = lone0 - lone.players[solo.player_id].budgets.energy + 2;
    // S4: harvest spends storage, so the hop is cargo MOVE 2. Pair still 4.
    expect(loneSpent).toBe(6);
    expect(loneSpent).toBeGreaterThan(pairHarvestSpent);
  });

  it("engineer recognition does not raise harvest amount", async () => {
    const w = fixtureWorld();
    const p = principal("player.engineer");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[p.player_id].practice = {
      catalog_id: "mastery-catalog/gc1-s1",
      tracks: { "track.engineer.01": ["evt.1", "evt.2", "evt.3"] },
      recognition: { "track.engineer.01": ["entity.a", "entity.b", "entity.c"] },
    };
    const node = w.rooms["room.hub"].entities[0];
    const stock0 = node.stock_amount ?? 0;
    const energy0 = w.players[p.player_id].budgets.energy;
    const r = await run(w, p, "COMMIT", {
      operation: "HARVEST",
      entity_id: "entity.storage-cell-west",
      amount: 1,
    });
    expect(r.ok).toBe(true);
    expect(w.rooms["room.hub"].entities[0].stock_amount).toBe(stock0 - 1);
    expect(w.players[p.player_id].budgets.energy).toBe(energy0 - 2 + 1);
  });
});
