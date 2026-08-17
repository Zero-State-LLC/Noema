import { describe, expect, it } from "vitest";
import {
  BROKER_TRACK,
  EXPLORER_TRACK,
  SURVEYOR_TRACK,
  applyPracticeCredits,
  brokerWaivesCaution,
  emptyPractice,
  inspectAttentionCost,
  lookAttentionCost,
} from "../src/practice";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity, helpText } from "../src/actions";
import { emptyDangerMemory } from "../src/social-memory";
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

function recognize(track: typeof EXPLORER_TRACK | typeof SURVEYOR_TRACK | typeof BROKER_TRACK, n: number) {
  const units = Array.from({ length: n }, (_, i) => `${track}.${i}`);
  return applyPracticeCredits(
    emptyPractice(),
    units.map((unit) => ({ track_id: track, unit, recognition_unit: unit })),
    0,
  );
}

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.gc1-s4",
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

describe("GC1-S4 mapper", () => {
  it("waives repeat LOOK/INSPECT and prior-party caution only while maintained", () => {
    const explorer = applyPracticeCredits(recognize(EXPLORER_TRACK, 5), [
      { track_id: EXPLORER_TRACK, unit: "room.hub", recognition_unit: "room.hub" },
    ], 0);
    expect(lookAttentionCost(explorer, "room.hub", 0)).toEqual({});
    expect(lookAttentionCost(explorer, "room.east", 0)).toEqual({ attention: 1 });
    expect(lookAttentionCost(explorer, "room.hub", 12)).toEqual({ attention: 1 });

    const surveyor = applyPracticeCredits(recognize(SURVEYOR_TRACK, 5), [
      { track_id: SURVEYOR_TRACK, unit: "entity.relay-a", recognition_unit: "entity.relay-a" },
    ], 0);
    expect(inspectAttentionCost(surveyor, "entity.relay-a", 0)).toEqual({});
    expect(inspectAttentionCost(surveyor, "entity.other", 0)).toEqual({ attention: 2 });

    let broker = recognize(BROKER_TRACK, 3);
    broker = applyPracticeCredits(broker, [
      { track_id: BROKER_TRACK, unit: "trade.x", recognition_unit: "trade.x", party_id: "player.vesper" },
    ], 0);
    expect(brokerWaivesCaution(broker, "player.vesper", 0)).toBe(true);
    expect(brokerWaivesCaution(broker, "player.oriel", 0)).toBe(false);
    expect(brokerWaivesCaution(broker, "player.vesper", 12)).toBe(false);
    expect(helpText()).toMatch(/\bBUILD\b/);
    expect(helpText()).not.toMatch(/\bCONTEST\b|\bATTEST\b|\bWED\b/);
  });
});

describe("GC1-S4 world path", () => {
  it("recognized Explorer does not pay attention to LOOK a known room", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[p.player_id].practice = applyPracticeCredits(recognize(EXPLORER_TRACK, 5), [
      { track_id: EXPLORER_TRACK, unit: "room.hub", recognition_unit: "room.hub" },
    ], 0);
    const before = w.players[p.player_id].budgets.attention;
    const looked = await run(w, p, "LOOK");
    expect(looked.ok).toBe(true);
    expect(w.players[p.player_id].budgets.attention).toBe(before);
  });

  it("recognized Surveyor does not pay attention to re-inspect a known entity; seal still forbids", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[p.player_id].practice = applyPracticeCredits(recognize(SURVEYOR_TRACK, 5), [
      { track_id: SURVEYOR_TRACK, unit: "entity.relay-a", recognition_unit: "entity.relay-a" },
    ], 0);
    const before = w.players[p.player_id].budgets.attention;
    const inspected = await run(w, p, "INSPECT", { entity_id: "entity.relay-a" });
    expect(inspected.ok).toBe(true);
    expect(w.players[p.player_id].budgets.attention).toBe(before);
    w.rooms["room.hub"].entities[0].inspect_restricted_until = 8;
    const sealed = await run(w, p, "INSPECT", { entity_id: "entity.relay-a" });
    expect(sealed.ok).toBe(false);
    expect(sealed.error?.code).toBe("FORBIDDEN");
  });

  it("recognized Broker skips TRADE_CAUTION for a prior party and still pays for a stranger", async () => {
    const w = world();
    const a = principal("player.nacre");
    const known = principal("player.vesper");
    const stranger = principal("player.oriel");
    await run(w, a, "ENTER_WORLD");
    await run(w, known, "ENTER_WORLD");
    await run(w, stranger, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[known.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[stranger.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[a.player_id].practice = applyPracticeCredits(recognize(BROKER_TRACK, 3), [
      { track_id: BROKER_TRACK, unit: "trade.old", recognition_unit: "trade.old", party_id: known.player_id },
    ], 0);
    w.players[a.player_id].danger_memory = emptyDangerMemory();
    w.players[a.player_id].danger_memory.edges[known.player_id] = ["ev.danger.1"];
    w.players[a.player_id].danger_memory.edges[stranger.player_id] = ["ev.danger.2"];
    const beforeKnown = w.players[a.player_id].budgets.compute;
    const prior = await run(w, a, "TRADE", {
      phase: "propose",
      counterparty_id: known.player_id,
      offered: { energy: 1 },
      requested: { storage: 1 },
    });
    expect(prior.ok).toBe(true);
    expect(w.players[a.player_id].budgets.compute).toBe(beforeKnown - 1);
    const beforeStranger = w.players[a.player_id].budgets.compute;
    const fresh = await run(w, a, "TRADE", {
      phase: "propose",
      counterparty_id: stranger.player_id,
      offered: { energy: 1 },
      requested: { storage: 1 },
    });
    expect(fresh.ok).toBe(true);
    expect(w.players[a.player_id].budgets.compute).toBe(beforeStranger - 2);
  });
});
