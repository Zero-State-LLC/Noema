import { describe, expect, it } from "vitest";
import {
  DELAYED_MESSAGE,
  LONG_RANGE_MIN_CONDITION,
  SAME_CYCLE_MIN_CONDITION,
  UNREACHABLE_MESSAGE,
  UNREACHABLE_REASON,
  bestLiveRelayCondition,
  collectLiveRelays,
  isRelayEntity,
  longRangeBand,
  longRangeDeliverable,
} from "../src/communication";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

describe("GC5-S0 mapper", () => {
  const relay = (condition: number, extra: Partial<Parameters<typeof isRelayEntity>[0]> = {}) => ({
    entity_id: "entity.relay-7",
    label: "scarred-conduit",
    entity_type: "INFRASTRUCTURE",
    condition,
    ...extra,
  });

  it("classifies only INFRASTRUCTURE whose id or label is relay", () => {
    expect(isRelayEntity(relay(80))).toBe(true);
    expect(
      isRelayEntity({
        entity_id: "entity.storage-cell-cache",
        label: "bond-board",
        entity_type: "INFRASTRUCTURE",
        condition: 100,
      }),
    ).toBe(false);
    expect(
      isRelayEntity({
        entity_id: "entity.relay-ruin",
        label: "dead-relay",
        entity_type: "RUIN",
        condition: 80,
      }),
    ).toBe(false);
  });

  it("takes the best live condition and treats none as no path", () => {
    expect(bestLiveRelayCondition([])).toBeNull();
    expect(bestLiveRelayCondition([relay(10), relay(24)])).toBe(24);
    expect(bestLiveRelayCondition([relay(24), relay(25)])).toBe(25);
    expect(longRangeDeliverable(null)).toBe(false);
    expect(longRangeDeliverable(24)).toBe(false);
    expect(longRangeDeliverable(LONG_RANGE_MIN_CONDITION)).toBe(true);
    expect(longRangeBand(null)).toBe("UNREACHABLE");
    expect(longRangeBand(24)).toBe("UNREACHABLE");
    expect(longRangeBand(25)).toBe("DELAYED");
    expect(longRangeBand(49)).toBe("DELAYED");
    expect(longRangeBand(SAME_CYCLE_MIN_CONDITION)).toBe("IMMEDIATE");
    expect(
      collectLiveRelays({
        "room.hub": { entities: [relay(0)] },
        "room.east": {
          entities: [
            {
              entity_id: "entity.storage-cell-cache",
              label: "bond-board",
              entity_type: "INFRASTRUCTURE",
              condition: 100,
            },
          ],
        },
      }),
    ).toHaveLength(1);
  });
});

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

function fixtureWorld(opts?: { condition?: number | null; includeRelay?: boolean }): WorldRuntime {
  const includeRelay = opts?.includeRelay !== false;
  const entities = includeRelay
    ? [
        enrichEntity({
          entity_id: "entity.relay-7",
          label: "scarred-conduit",
          entity_type: "INFRASTRUCTURE",
          ...(opts?.condition != null ? { condition: opts.condition } : {}),
        }),
      ]
    : [
        enrichEntity({
          entity_id: "entity.storage-cell-cache",
          label: "bond-board",
          entity_type: "INFRASTRUCTURE",
          condition: 100,
        }),
      ];
  if (includeRelay && opts?.condition === 0) entities[0].condition = 0;
  if (includeRelay && typeof opts?.condition === "number") entities[0].condition = opts.condition;
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
        description: "A frontier anchor.",
        exits: [{ direction: "east", to_room_id: "room.east" }],
        entities,
      },
      "room.east": {
        room_id: "room.east",
        name: "Coldline",
        description: "A thin route.",
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

async function enterPair(w: WorldRuntime) {
  const nacre = principal("player.nacre");
  const vesper = principal("player.vesper");
  await run(w, nacre, "ENTER_WORLD");
  await run(w, vesper, "ENTER_WORLD");
  w.players[nacre.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  w.players[vesper.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
  return { nacre, vesper };
}

function leakBlob(r: { error?: { code?: string; message?: string } }) {
  return `${r.error?.code || ""} ${r.error?.message || ""}`;
}

describe("GC5-S0 world delivery", () => {
  it("delivers same-room MESSAGE while the best live relay is at condition 0", async () => {
    const w = fixtureWorld({ condition: 0 });
    const { nacre, vesper } = await enterPair(w);
    const before = w.players[nacre.player_id].budgets.compute;
    const seq = w.sequence;
    const r = await run(w, nacre, "MESSAGE", {
      recipient_id: vesper.player_id,
      text: "Stay in the exchange.",
    });
    expect(r.ok).toBe(true);
    expect(r.events?.map((e) => e.event_type)).toEqual(["MESSAGE", "MESSAGE_DELIVERED"]);
    expect(w.players[nacre.player_id].budgets.compute).toBe(before - 1);
    expect(w.sequence).toBe(seq + 2);
    const look = await run(w, vesper, "LOOK");
    expect(look.observation?.messages?.some((m) => m.text === "Stay in the exchange.")).toBe(true);
  });

  it("delivers different-room MESSAGE same-cycle at condition 50", async () => {
    const w = fixtureWorld({ condition: 50 });
    const { nacre, vesper } = await enterPair(w);
    const moved = await run(w, nacre, "MOVE", { direction: "east" });
    expect(moved.ok).toBe(true);
    const r = await run(w, nacre, "MESSAGE", {
      recipient_id: vesper.player_id,
      text: "Hold the gate.",
    });
    expect(r.ok).toBe(true);
    expect(r.events?.map((e) => e.event_type)).toEqual(["MESSAGE", "MESSAGE_DELIVERED"]);
    const look = await run(w, vesper, "LOOK");
    expect(look.observation?.messages?.some((m) => m.text === "Hold the gate.")).toBe(true);
  });

  it("queues different-room MESSAGE at condition 25 and delivers on the next cycle", async () => {
    const w = fixtureWorld({ condition: 25 });
    const { nacre, vesper } = await enterPair(w);
    await run(w, nacre, "MOVE", { direction: "east" });
    const r = await run(w, nacre, "MESSAGE", {
      recipient_id: vesper.player_id,
      text: "Hold the gate.",
    });
    expect(r.ok).toBe(true);
    expect(r.observation?.consequence).toBe(DELAYED_MESSAGE);
    expect(r.events?.map((e) => e.event_type)).toEqual(["MESSAGE"]);
    expect(JSON.stringify(r.error || {})).not.toMatch(/entity\.relay-7|hidden|topology/i);
    const before = await run(w, vesper, "LOOK");
    expect(before.observation?.messages?.some((m) => m.text === "Hold the gate.")).toBeFalsy();
    w.players[vesper.player_id].wait_until_cycle = w.cycle + 1;
    const waited = await run(w, nacre, "WAIT");
    expect(waited.events?.map((e) => e.event_type)).toContain("MESSAGE_DELIVERED");
    const after = await run(w, vesper, "LOOK");
    expect(after.observation?.messages?.some((m) => m.text === "Hold the gate.")).toBe(true);
  });

  it("rejects different-room MESSAGE at condition 24 with UNREACHABLE and no events", async () => {
    const w = fixtureWorld({ condition: 24 });
    const { nacre, vesper } = await enterPair(w);
    await run(w, nacre, "MOVE", { direction: "east" });
    const before = w.players[nacre.player_id].budgets.compute;
    const seq = w.sequence;
    const secret = "secret-signal";
    const r = await run(w, nacre, "MESSAGE", {
      recipient_id: vesper.player_id,
      text: secret,
    });
    expect(r.ok).toBe(false);
    expect(r.error?.code).toBe(UNREACHABLE_REASON);
    expect(r.error?.message).toBe(UNREACHABLE_MESSAGE);
    expect(r.events || []).toEqual([]);
    expect(w.sequence).toBe(seq);
    expect(w.messages).toEqual([]);
    expect(w.players[nacre.player_id].budgets.compute).toBe(before);
    const blob = leakBlob(r);
    expect(blob).not.toMatch(/entity\.relay-7|hidden|topology|room\.east|room\.hub/i);
    expect(blob).not.toContain(secret);
    const look = await run(w, vesper, "LOOK");
    expect(look.observation?.messages || []).toEqual([]);
  });

  it("rejects different-room MESSAGE when no live relay exists", async () => {
    const w = fixtureWorld({ includeRelay: false });
    const { nacre, vesper } = await enterPair(w);
    await run(w, nacre, "MOVE", { direction: "east" });
    const r = await run(w, nacre, "MESSAGE", {
      recipient_id: vesper.player_id,
      text: "Where are you?",
    });
    expect(r.ok).toBe(false);
    expect(r.error?.code).toBe(UNREACHABLE_REASON);
    expect(r.error?.message).toBe(UNREACHABLE_MESSAGE);
    expect(r.events || []).toEqual([]);
    expect(leakBlob(r)).not.toMatch(/entity\.|hidden|topology|room\./i);
  });

  it("restores long-range after repair raises the best live relay through 25", async () => {
    const w = fixtureWorld({ condition: 24 });
    const { nacre, vesper } = await enterPair(w);
    await run(w, nacre, "MOVE", { direction: "east" });
    const blocked = await run(w, nacre, "MESSAGE", {
      recipient_id: vesper.player_id,
      text: "Hold.",
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.error?.code).toBe(UNREACHABLE_REASON);

    await run(w, nacre, "MOVE", { direction: "west" });
    const repaired = await run(w, nacre, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay-7",
    });
    expect(repaired.ok).toBe(true);
    expect(w.rooms["room.hub"].entities[0].condition).toBeGreaterThanOrEqual(25);

    await run(w, nacre, "MOVE", { direction: "east" });
    const r = await run(w, nacre, "MESSAGE", {
      recipient_id: vesper.player_id,
      text: "Path restored.",
    });
    expect(r.ok).toBe(true);
    expect(r.events?.map((e) => e.event_type)).toEqual(["MESSAGE"]);
    expect(r.observation?.consequence).toBe(DELAYED_MESSAGE);
  });

  it("keeps recipient-not-entered as FORBIDDEN and does not debit", async () => {
    const w = fixtureWorld({ condition: 80 });
    const nacre = principal("player.nacre");
    await run(w, nacre, "ENTER_WORLD");
    w.players[nacre.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const before = w.players[nacre.player_id].budgets.compute;
    const r = await run(w, nacre, "MESSAGE", {
      recipient_id: "player.absent",
      text: "hello",
    });
    expect(r.ok).toBe(false);
    expect(r.error?.code).toBe("FORBIDDEN");
    expect(w.players[nacre.player_id].budgets.compute).toBe(before);
  });
});
