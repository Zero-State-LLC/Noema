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
