import { describe, expect, it } from "vitest";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { canonicalEventsForCommit, commitCanonicalSettlement } from "../src/settle";
import type { CommandEnvelope, Env, PlayerPrincipal } from "../src/types";

function principal(id = "player.nacre"): PlayerPrincipal {
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
        description: "A frontier anchor.",
        exits: [],
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

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: {},
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("canonicalEventsForCommit", () => {
  it("drops observational WAIT/LOOK ids and keeps ledger ids", () => {
    expect(
      canonicalEventsForCommit([
        { event_id: "evt.obs.abc", event_type: "WAIT", sequence: 94 },
        { event_id: "evt.000095", event_type: "AGENT_ENTERED_WORLD", sequence: 95 },
        { event_id: "evt.000096", event_type: "WAIT", sequence: 96 },
      ]).map((e) => e.event_id),
    ).toEqual(["evt.000095", "evt.000096"]);
    expect(canonicalEventsForCommit(undefined)).toEqual([]);
  });
});

describe("WAIT vs canonical sequence", () => {
  it("does not increment sequence when WAIT does not commit a cycle", async () => {
    const w = fixtureWorld();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    const afterEnter = w.sequence;
    const r = await run(w, a, "WAIT");
    expect(r.ok).toBe(true);
    expect(r.events?.[0]?.payload?.cycle_committed).toBe(false);
    expect(w.sequence).toBe(afterEnter);
    expect(r.events?.[0]?.event_id.startsWith("evt.obs.")).toBe(true);
    expect(canonicalEventsForCommit(r.events)).toEqual([]);
  });

  it("increments sequence when solo WAIT commits a cycle so settlement can ACK", async () => {
    const w = fixtureWorld();
    const p = principal();
    await run(w, p, "ENTER_WORLD");
    const afterEnter = w.sequence;
    const r = await run(w, p, "WAIT");
    expect(r.ok).toBe(true);
    expect(r.events?.[0]?.payload?.cycle_committed).toBe(true);
    expect(w.sequence).toBe(afterEnter + 1);
    expect(r.events?.[0]?.event_id).toBe(`evt.${w.sequence.toString().padStart(6, "0")}`);
    expect(canonicalEventsForCommit(r.events)).toHaveLength(1);
  });
});

describe("commitCanonicalSettlement error surface", () => {
  it("returns the Postgres RAISE message instead of P0001", async () => {
    const env = {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
    } as Env;
    const orig = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ code: "P0001", message: "NONCONTIGUOUS_SEQUENCE" }), {
        status: 400,
      })) as typeof fetch;
    try {
      const committed = await commitCanonicalSettlement(env, {
        settlement_id: "settlement.test",
        expected_revision: 1,
        writer_generation: "do.1",
        status: "ACTIVE",
        settlement_health: "HEALTHY",
        world: fixtureWorld(),
        principal: principal(),
        events: [
          {
            event_id: "evt.000001",
            event_type: "AGENT_ENTERED_WORLD",
            sequence: 1,
            payload: {},
          },
        ],
        previous_digest: null,
      });
      expect(committed).toEqual({ ok: false, code: "NONCONTIGUOUS_SEQUENCE" });
    } finally {
      globalThis.fetch = orig;
    }
  });
});
