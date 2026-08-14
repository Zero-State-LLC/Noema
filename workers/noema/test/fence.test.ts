import { describe, expect, it } from "vitest";
import {
  STALE_HEAD,
  STALE_FENCE,
  checkExpectedHead,
  restoreOrIncident,
  retrySettle,
  settleBatch,
  type MemStore,
} from "../src/settle-fence";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { expireStalePresence } from "../src/ops";
import { DEFAULT_BUDGETS, cloneBudgets, enrichEntity } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function store(): MemStore {
  return { head: null, events: {}, committed: false };
}

const baseNext = {
  world_id: "world.test",
  sequence: 3,
  cycle: 0,
  ledger_head_event_id: "evt.3",
  writer_generation: "do.1",
};

describe("RFC-0017 fence crash/retry", () => {
  it("A: crash before write leaves no events or head", () => {
    const s = store();
    const r = settleBatch(s, 0, ["evt.1"], baseNext, "before_write");
    expect(r.ok).toBe(false);
    expect(s.head).toBeNull();
    expect(s.events).toEqual({});
  });

  it("B: crash during write leaves unchanged head", () => {
    const s = store();
    settleBatch(s, 0, ["evt.1"], baseNext, null);
    const r = settleBatch(s, 1, ["evt.2"], { ...baseNext, sequence: 4 }, "during_write");
    expect(r.ok).toBe(false);
    expect(s.head?.revision).toBe(1);
    expect(s.events["evt.2"]).toBeUndefined();
  });

  it("C+D: commit then lost ACK; retry is idempotent", () => {
    const s = store();
    const lost = settleBatch(s, 0, ["evt.1"], baseNext, "after_commit_before_ack");
    expect(lost.ok).toBe(false);
    expect(s.committed).toBe(true);
    const retry = retrySettle(s, 0, ["evt.1"], baseNext);
    expect(retry.ok).toBe(true);
    expect(Object.keys(s.events)).toEqual(["evt.1"]);
    expect(s.head?.revision).toBe(1);
  });

  it("E: stale DO cannot overwrite newer head", () => {
    const s = store();
    settleBatch(s, 0, ["evt.1"], baseNext, null);
    const stale = settleBatch(s, 0, ["evt.stale"], { ...baseNext, sequence: 99 }, null);
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.code).toBe(STALE_HEAD);
    expect(s.head?.sequence).toBe(3);
  });

  it("F: restart with valid head restores", () => {
    const s = store();
    settleBatch(s, 0, ["evt.1"], baseNext, null);
    expect(restoreOrIncident(s.head).ok).toBe(true);
  });

  it("G: restart with missing head is INCIDENT", () => {
    expect(restoreOrIncident(null).ok).toBe(false);
  });

  it("H: duplicate settlement retry does not double-apply", () => {
    const s = store();
    settleBatch(s, 0, ["evt.1", "evt.2"], baseNext, null);
    retrySettle(s, 1, ["evt.1", "evt.2"], { ...baseNext, sequence: 3 });
    expect(Object.keys(s.events)).toHaveLength(2);
  });

  it("checkExpectedHead matches revisions", () => {
    expect(checkExpectedHead(0, null).ok).toBe(true);
    expect(checkExpectedHead(1, { world_id: "w", revision: 1, sequence: 1, cycle: 0 }).ok).toBe(true);
    expect(checkExpectedHead(0, { world_id: "w", revision: 2, sequence: 2, cycle: 0 }).ok).toBe(false);
  });

  it("rejects a stale writer generation without advancing the head", () => {
    const durable = { world_id: "w", revision: 1, sequence: 1, cycle: 0, writer_generation: "do.2" };
    const gate = checkExpectedHead(1, durable, "do.1");
    expect(gate).toEqual({ ok: false, code: STALE_FENCE });
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

function world(): WorldRuntime {
  return {
    world_id: "world.test",
    cycle: 4,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Hub",
        exits: [],
        entities: [enrichEntity({ entity_id: "e", label: "x", entity_type: "INFRASTRUCTURE" })],
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

describe("WAIT does not advance World.cycle alone", () => {
  it("sets wait_until_cycle; a second present Player blocks commit", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    w.players[a.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[b.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const before = w.cycle;
    const r = await run(w, a, "WAIT");
    expect(r.ok).toBe(true);
    expect(w.cycle).toBe(before);
    expect(w.players[a.player_id].wait_until_cycle).toBe(before + 1);
    expect(r.events?.map((e) => e.event_type)).toEqual(["WAIT"]);
    expect(r.events?.[0]?.payload?.cycle_committed).toBe(false);
  });
});

describe("idle presence is not leave-world", () => {
  it("keeps entered and room after idle; live count uses last_seen", () => {
    const now = 2_000_000_000_000;
    const players = {
      "player.nacre": {
        entered: true,
        room_id: "room.hub",
        last_seen_ms: now - 40 * 60 * 1000,
        actor_kind: "live" as const,
      },
    };
    expireStalePresence(players, now);
    expect(players["player.nacre"].entered).toBe(true);
    expect(players["player.nacre"].room_id).toBe("room.hub");
  });
});
