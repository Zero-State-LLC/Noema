/** heads.sequence is SoT on soft_restore. Next commit must be head.sequence + 1. */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canonicalEventsForCommit,
  commitCanonicalSettlement,
  HEAD_SEQUENCE_CLAMP_LOG_EVENT,
  resolveSoftSettlementFailure,
  worldFromHead,
  type WorldHead,
} from "../src/settle";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, Env, PlayerPrincipal } from "../src/types";
import { fixtureWorld as transportWorld, harness, WORLD } from "./agent-http-do-fixture";

afterEach(() => vi.unstubAllGlobals());

const N = 42291;

function principal(id = "player.nacre"): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function fixtureWorld(sequence: number): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.head-sequence-sot",
    world_name: "SoT fixture",
    cycle: 18013,
    sequence,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Restored.",
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

function skewedHead(stateSequence: number, headSequence: number): WorldHead {
  return {
    world_id: "test.hosted-canonical.head-sequence-sot",
    sequence: headSequence,
    cycle: 18013,
    status: "ACTIVE",
    settlement_health: "HEALTHY",
    revision: 20866,
    state_json: fixtureWorld(stateSequence),
    ledger_head_digest: "sha256:head",
  };
}

describe("F1+F3 heads.sequence SoT", () => {
  it("soft_restore with state_json N+1 yields world sequence N; next ENTER commits N+1", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const head = skewedHead(N + 1, N);
    try {
      const out = await resolveSoftSettlementFailure({
        code: "NONCONTIGUOUS_SEQUENCE",
        before: fixtureWorld(N + 2),
        request_id: "r.sot.commit",
        getHead: async () => head,
        writer_generation: "do.1",
      });
      expect(out.mode).toBe("soft_restore");
      expect(out.world?.sequence).toBe(N);
      expect(warn).toHaveBeenCalledWith(
        HEAD_SEQUENCE_CLAMP_LOG_EVENT,
        expect.objectContaining({ head_sequence: N, state_json_sequence: N + 1 }),
      );

      const restored = out.world!;
      const envl: CommandEnvelope = {
        request_id: "r.enter",
        idempotency_key: "i.enter",
        command: "ENTER_WORLD",
        arguments: {},
      };
      const applied = await applyWorldCommand(restored, principal(), envl, async () => true);
      expect(applied.ok).toBe(true);
      const ledger = canonicalEventsForCommit(applied.events);
      expect(ledger).toHaveLength(1);
      expect(ledger[0].sequence).toBe(N + 1);

      const env = {
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
      } as Env;
      const orig = globalThis.fetch;
      let acceptedSequence: number | null = null;
      globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
        const body = typeof init?.body === "string" ? JSON.parse(init.body) as {
          p_events: Array<{ sequence: number }>;
        } : null;
        const next = body?.p_events?.[0]?.sequence;
        if (next !== N + 1) {
          return new Response(JSON.stringify({ code: "P0001", message: "NONCONTIGUOUS_SEQUENCE" }), {
            status: 400,
          });
        }
        acceptedSequence = next;
        return new Response(JSON.stringify({ ok: true, revision: 20867, sequence: N + 1, idempotent: false }), {
          status: 200,
        });
      }) as typeof fetch;
      try {
        const committed = await commitCanonicalSettlement(env, {
          settlement_id: "settlement.sot",
          expected_revision: 20866,
          writer_generation: "do.1",
          status: "ACTIVE",
          settlement_health: "HEALTHY",
          world: restored,
          principal: principal(),
          events: ledger,
          previous_digest: "sha256:head",
        });
        expect(committed).toEqual({ ok: true, revision: 20867, sequence: N + 1, idempotent: false });
        expect(acceptedSequence).toBe(N + 1);
      } finally {
        globalThis.fetch = orig;
      }
    } finally {
      warn.mockRestore();
    }
  });

  it("worldFromHead clamp is what makes the next event contiguous", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const unclamped = skewedHead(N + 1, N).state_json;
      expect(unclamped.sequence).toBe(N + 1);
      const restored = worldFromHead(skewedHead(N + 1, N), fixtureWorld(0));
      expect(restored.sequence).toBe(N);
      expect(restored.sequence + 1).toBe(N + 1);
    } finally {
      warn.mockRestore();
    }
  });
});

describe("F2 pre-command admit when DO sequence ≠ heads.sequence", () => {
  it("restores/clamps before apply so ENTER proposes heads.sequence+1", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const start = transportWorld();
    start.sequence = N + 1;
    start.cycle = 18013;
    const h = harness(start);
    const token = (await h.agent()).access_token;
    const snap = structuredClone(start);
    let head: WorldHead = {
      world_id: WORLD,
      sequence: N,
      cycle: 18013,
      revision: 0,
      status: "ACTIVE",
      settlement_health: "HEALTHY",
      state_json: snap,
      ledger_head_digest: "sha256:head",
    };
    const unexpected: string[] = [];
    h.env.SUPABASE_URL = "https://settlement.invalid";
    h.env.SUPABASE_SERVICE_ROLE_KEY = "local-fixture-only-not-a-service-key";
    try {
      vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = new URL(input instanceof Request ? input.url : String(input));
        if (url.origin !== "https://settlement.invalid") {
          unexpected.push(url.origin + url.pathname);
          throw new Error("External network forbidden");
        }
        if (url.pathname === "/rest/v1/noema_world_heads") {
          return Response.json([structuredClone(head)]);
        }
        if (url.pathname === "/rest/v1/rpc/noema_commit_canonical_settlement") {
          const body = JSON.parse(String(init?.body)) as {
            p_events: Array<{ event_type: string; sequence: number }>;
            p_state_json: WorldRuntime;
          };
          const next = body.p_events[0]?.sequence;
          if (next !== N + 1) {
            return Response.json({ ok: false, code: "NONCONTIGUOUS_SEQUENCE" }, { status: 409 });
          }
          head = {
            ...head,
            revision: 1,
            sequence: body.p_state_json.sequence,
            state_json: structuredClone(body.p_state_json),
          };
          return Response.json({ ok: true, revision: 1, sequence: N + 1, idempotent: false });
        }
        unexpected.push(url.pathname);
        throw new Error("Unexpected fake settlement route");
      }));
      const res = await h.command(token, "ENTER_WORLD");
      expect(res.status).toBe(200);
      const body = await res.json() as { ok: boolean; error?: { code: string } };
      expect(body.ok).toBe(true);
      expect(body.error).toBeUndefined();
      const persisted = (await h.persistedWorld())!;
      expect(persisted.sequence).toBe(N + 1);
      expect(unexpected).toEqual([]);
      expect(warn).toHaveBeenCalledWith(
        HEAD_SEQUENCE_CLAMP_LOG_EVENT,
        expect.objectContaining({ head_sequence: N, state_json_sequence: N + 1 }),
      );
    } finally {
      warn.mockRestore();
    }
  });
});
