/**
 * Isolated canonical-head proof (A2).
 * Drives shipped commitCanonicalSettlement / recover / fence on
 * test.hosted-canonical.* only. Never Perihelion. Never Genesis.
 */
import { describe, expect, it } from "vitest";
import { runIncidentRecover } from "../src/incident-recover";
import { checkExpectedHead, STALE_HEAD } from "../src/settle-fence";
import { commitCanonicalSettlement } from "../src/settle";
import type { Env, PlayerPrincipal } from "../src/types";
import type { WorldRuntime } from "../src/world-actions";

const ISOLATED = "test.hosted-canonical.ack-s3";

function principal(): PlayerPrincipal {
  return {
    player_id: "player.ack-s0",
    agent_id: "agent.ack-s0",
    session_id: "sess.ack-s0",
    controller_id: "ctrl.ack-s0",
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function isolatedWorld(): WorldRuntime {
  return {
    world_id: ISOLATED,
    world_name: "Isolated ACK",
    cycle: 0,
    sequence: 1,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Isolated.",
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

function settleInput(overrides: Record<string, unknown> = {}) {
  return {
    settlement_id: "settlement.isolated.ack-s3.1",
    expected_revision: 0,
    writer_generation: "do.1",
    genesis_id: null,
    status: "ACTIVE",
    settlement_health: "HEALTHY",
    world: isolatedWorld(),
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
    allow_bootstrap: false,
    ...overrides,
  };
}

describe("isolated canonical settle (shipped RPC)", () => {
  it("sends events + digest with p_allow_bootstrap=false and bumps revision", async () => {
    const env = {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
    } as Env;
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const orig = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const body = typeof init?.body === "string" ? JSON.parse(init.body) as Record<string, unknown> : {};
      calls.push({ url, body });
      expect(url).toContain("/rest/v1/rpc/noema_commit_canonical_settlement");
      expect(body.p_world_id).toBe(ISOLATED);
      expect(body.p_world_id).not.toBe("world.perihelion-reach");
      expect(body.p_allow_bootstrap).toBe(false);
      expect(Array.isArray(body.p_events)).toBe(true);
      expect((body.p_events as Array<{ event_id: string }>)[0]?.event_id).toBe("evt.000001");
      expect(String(body.p_state_digest)).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(body.p_expected_revision).toBe(0);
      return new Response(JSON.stringify({ ok: true, revision: 1, sequence: 1, idempotent: false }), {
        status: 200,
      });
    }) as typeof fetch;
    try {
      const committed = await commitCanonicalSettlement(env, settleInput());
      expect(committed).toEqual({ ok: true, revision: 1, sequence: 1, idempotent: false });
      expect(calls).toHaveLength(1);
    } finally {
      globalThis.fetch = orig;
    }
  });

  it("treats a same settlement_id retry as idempotent", async () => {
    const env = {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
    } as Env;
    let n = 0;
    const orig = globalThis.fetch;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      n += 1;
      const body = typeof init?.body === "string" ? JSON.parse(init.body) as Record<string, unknown> : {};
      expect(body.p_settlement_id).toBe("settlement.isolated.ack-s3.1");
      const idempotent = n > 1;
      return new Response(
        JSON.stringify({ ok: true, revision: 1, sequence: 1, idempotent }),
        { status: 200 },
      );
    }) as typeof fetch;
    try {
      const first = await commitCanonicalSettlement(env, settleInput());
      const retry = await commitCanonicalSettlement(env, settleInput());
      expect(first).toEqual({ ok: true, revision: 1, sequence: 1, idempotent: false });
      expect(retry).toEqual({ ok: true, revision: 1, sequence: 1, idempotent: true });
    } finally {
      globalThis.fetch = orig;
    }
  });

  it("fail-closes STALE_HEAD from the fence and from the RPC", async () => {
    const gate = checkExpectedHead(0, {
      world_id: ISOLATED,
      revision: 2,
      sequence: 2,
      cycle: 0,
      writer_generation: "do.1",
    }, "do.1");
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.code).toBe(STALE_HEAD);

    const env = {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
    } as Env;
    const orig = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ code: "P0001", message: "STALE_HEAD" }), { status: 400 })) as typeof fetch;
    try {
      const committed = await commitCanonicalSettlement(env, settleInput({ expected_revision: 0 }));
      expect(committed).toEqual({ ok: false, code: "STALE_HEAD" });
    } finally {
      globalThis.fetch = orig;
    }
  });
});

describe("isolated recover (DO-with-state, missing SQL head)", () => {
  it("adopts the live snapshot and never reseeds Genesis", async () => {
    const stored = isolatedWorld();
    const adoptedHead = {
      world_id: ISOLATED,
      sequence: 1,
      cycle: 0,
      status: "ACTIVE",
      settlement_health: "HEALTHY",
      state_json: stored,
      revision: 1,
      state_digest: "sha256:isolated",
    };
    const adoptLiveHead = async (input: { world: WorldRuntime; genesis_id?: string | null }) => {
      expect(input.world.world_id).toBe(ISOLATED);
      expect(input.world.world_id).not.toBe("world.perihelion-reach");
      expect(JSON.stringify(input)).not.toMatch(/reseed|force-supersede|activate/i);
      return { ok: true as const, revision: 1, sequence: 1, idempotent: false };
    };
    let headReads = 0;
    const getHead = async () => {
      headReads += 1;
      return headReads === 1 ? null : adoptedHead;
    };
    const result = await runIncidentRecover(
      {
        status: "INCIDENT",
        settlement: "BLOCKING",
        storedWorld: stored,
        currentWorld: stored,
        genesisId: "genesis.isolated-fixture",
        writerGeneration: "do.1",
      },
      { getHead, adoptLiveHead },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mode).toBe("adopt");
    expect(result.revision).toBe(1);
    expect(result.world.world_id).toBe(ISOLATED);
    expect(result.world.sequence).toBe(1);
  });
});
