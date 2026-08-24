import { describe, expect, it } from "vitest";
import { sanitizeTradeAmounts } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";
import { enrichEntity } from "../src/actions";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.human.${id}`,
    controller_type: "human",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "world.test",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Test hub.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.x",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
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
  idem?: string,
) {
  const envl: CommandEnvelope = {
    request_id: `req.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
    idempotency_key: idem,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("sanitizeTradeAmounts", () => {
  it("accepts known positive integers", () => {
    expect(sanitizeTradeAmounts({ energy: 2, compute: 1 })).toEqual({ energy: 2, compute: 1 });
  });

  it("rejects negatives, zero, fractions, and unknown keys", () => {
    expect(sanitizeTradeAmounts({ energy: -1 })).toBeNull();
    expect(sanitizeTradeAmounts({ energy: 0 })).toBeNull();
    expect(sanitizeTradeAmounts({ energy: 1.5 })).toBeNull();
    expect(sanitizeTradeAmounts({ gold: 1 })).toBeNull();
    expect(sanitizeTradeAmounts({})).toBeNull();
  });
});

describe("structured TRADE amounts", () => {
  it("rejects negative structured TRADE offers", async () => {
    const w = world();
    const a = principal("player.a");
    const b = principal("player.b");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    const bad = await run(w, a, "TRADE", {
      phase: "propose",
      counterparty_id: b.player_id,
      offered: { energy: -3 },
      requested: { compute: 1 },
    });
    expect(bad.ok).toBe(false);
    expect(bad.error?.code).toBe("INVALID_REQUEST");
    expect(Object.keys(w.trades)).toHaveLength(0);
  });
});

describe("player-scoped idempotency", () => {
  it("does not replay another player's cached result", async () => {
    const w = world();
    const a = principal("player.a");
    const b = principal("player.b");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    const first = await run(w, a, "LOOK", {}, "shared-key");
    expect(first.ok).toBe(true);
    expect(first.observation?.player_id).toBe(a.player_id);
    const second = await run(w, b, "LOOK", {}, "shared-key");
    expect(second.ok).toBe(true);
    expect(second.observation?.player_id).toBe(b.player_id);
    expect(second.observation?.player_id).not.toBe(first.observation?.player_id);
  });
});

describe("trade accept once", () => {
  it("rejects a second accept and does not transfer again", async () => {
    const w = world();
    const a = principal("player.a");
    const b = principal("player.b");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    const energyA = w.players[a.player_id].budgets.energy;
    const energyB = w.players[b.player_id].budgets.energy;
    const proposed = await run(w, a, "TRADE", {
      phase: "propose",
      counterparty_id: b.player_id,
      offered: { energy: 2 },
      requested: { compute: 1 },
    });
    expect(proposed.ok).toBe(true);
    const tradeId = Object.keys(w.trades)[0];
    const first = await run(w, b, "TRADE", { phase: "accept", trade_id: tradeId });
    expect(first.ok).toBe(true);
    expect(w.trades[tradeId].status).toBe("SETTLED");
    const afterA = w.players[a.player_id].budgets.energy;
    const afterB = w.players[b.player_id].budgets.energy;
    const second = await run(w, b, "TRADE", { phase: "accept", trade_id: tradeId });
    expect(second.ok).toBe(false);
    expect(second.error?.code).toBe("TRADE_FAILED");
    expect(w.players[a.player_id].budgets.energy).toBe(afterA);
    expect(w.players[b.player_id].budgets.energy).toBe(afterB);
    expect(afterA).toBe(energyA - 2);
    expect(afterB).toBe(energyB + 2);
  });
});

describe("settlement backlog", () => {
  it("records failed settle on unsettled and does not duplicate event_id", async () => {
    const w = world();
    const a = principal("player.a");
    const envl: CommandEnvelope = {
      request_id: "req.settle-fail",
      idempotency_key: "idem.settle-fail",
      command: "ENTER_WORLD",
      arguments: {},
    };
    const r = await applyWorldCommand(w, a, envl, async () => false);
    expect(r.ok).toBe(true);
    expect(w.unsettled.length).toBeGreaterThan(0);
    const ids = w.unsettled.map((u) => u.event_id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("accepted replay invariant — agent-protocol-v1 §idempotency", () => {
  /**
   * "Duplicate accepted replays MUST NOT consume budgets twice or append a
   * second world event." The replay path returns the cached result before any
   * budget or event code runs — correct by construction, pinned nowhere. The
   * existing tests cover the TRADE-specific double-accept; this pins the
   * general clause on an ordinary budget-consuming mutation.
   */
  it("replaying an accepted MOVE consumes no budget and appends no event", async () => {
    const w = world();
    w.rooms["room.hub"].exits = [{ direction: "north", to_room_id: "room.north" }];
    w.rooms["room.north"] = {
      room_id: "room.north",
      name: "North",
      description: "North room.",
      exits: [{ direction: "south", to_room_id: "room.hub" }],
      entities: [],
    };
    const a = principal("player.a");
    await run(w, a, "ENTER_WORLD");

    const first = await run(w, a, "MOVE", { direction: "north" }, "idem.move-1");
    expect(first.ok).toBe(true);
    const budgetsAfter = JSON.stringify(w.players[a.player_id].budgets);
    // Ledger appends are exactly sequence increments (pushEvent), so an
    // unchanged sequence IS "no second world event".
    const sequenceAfter = w.sequence;
    const roomAfter = w.players[a.player_id].room_id;

    const replay = await run(w, a, "MOVE", { direction: "north" }, "idem.move-1");
    // The cached result, not a re-execution: same request_id, same payload.
    expect(replay).toBe(first);
    // No budget consumed twice, no second world event, no sequence advance,
    // and the player did not move again.
    expect(JSON.stringify(w.players[a.player_id].budgets)).toBe(budgetsAfter);
    expect(w.sequence).toBe(sequenceAfter);
    expect(w.players[a.player_id].room_id).toBe(roomAfter);
  });

  it("a different key is a new action, not a replay", async () => {
    const w = world();
    w.rooms["room.hub"].exits = [{ direction: "north", to_room_id: "room.north" }];
    w.rooms["room.north"] = {
      room_id: "room.north",
      name: "North",
      description: "North room.",
      exits: [{ direction: "south", to_room_id: "room.hub" }],
      entities: [],
    };
    const a = principal("player.a");
    await run(w, a, "ENTER_WORLD");
    const first = await run(w, a, "MOVE", { direction: "north" }, "idem.k1");
    expect(first.ok).toBe(true);
    const south = await run(w, a, "MOVE", { direction: "south" }, "idem.k2");
    expect(south.ok).toBe(true);
    expect(south).not.toBe(first);
    expect(w.players[a.player_id].room_id).toBe("room.hub");
  });

  it("a FAILED command is not cached — a same-key retry re-evaluates", async () => {
    // Deliberate, and load-bearing: only accepted results are cached (all 63
    // write sites store success() results). The spec clause covers "duplicate
    // ACCEPTED replays", and the SETTLEMENT_RESYNC contract (§8, #544) retries
    // with the SAME idempotency_key expecting re-execution after the head
    // resyncs — caching failures would replay the failure forever and the
    // mandated retry could never succeed. A failed evaluation consumes no
    // budget, so re-evaluating is free.
    const w = world();
    const a = principal("player.a");
    await run(w, a, "ENTER_WORLD");
    const bad = await run(w, a, "MOVE", { direction: "nowhere" }, "idem.bad");
    expect(bad.ok).toBe(false);
    const budgets = JSON.stringify(w.players[a.player_id].budgets);
    const retry = await run(w, a, "MOVE", { direction: "nowhere" }, "idem.bad");
    expect(retry.ok).toBe(false);
    expect(retry).not.toBe(bad); // re-evaluated, not replayed
    expect(JSON.stringify(w.players[a.player_id].budgets)).toBe(budgets);
    // And the same key SUCCEEDS once the world state allows it — the resync
    // retry story end to end.
    w.rooms["room.hub"].exits = [{ direction: "nowhere", to_room_id: "room.hub" }];
    const healed = await run(w, a, "MOVE", { direction: "nowhere" }, "idem.bad");
    expect(healed.ok).toBe(true);
  });
});
