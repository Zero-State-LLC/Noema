import { describe, expect, it, vi } from "vitest";
import {
  commitAdoptedLiveHead,
  compareHeadSequences,
  HEAD_SEQUENCE_CLAMP_LOG_EVENT,
  liveSequenceSkewedFromHead,
  putWorldHead,
  replayUnsettled,
  shouldRestoreFromHead,
  summarizeCanonicalHead,
  worldFromHead,
  type WorldHead,
} from "../src/settle";
import type { Env } from "../src/types";
import type { WorldRuntime } from "../src/world-actions";
import worker from "../src/index";
import { mintAdminSession } from "../src/admin-auth";
import { mintHumanPlatformToken, mintControllerToken } from "../src/auth";

function emptyWorld(id = "world.test"): WorldRuntime {
  return {
    world_id: id,
    cycle: 0,
    sequence: 0,
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

describe("RFC-0016 restore rules", () => {
  it("restores only when DO storage has no world", () => {
    expect(shouldRestoreFromHead(null)).toBe(true);
    expect(shouldRestoreFromHead(undefined)).toBe(true);
    expect(shouldRestoreFromHead(emptyWorld())).toBe(false);
  });

  it("uses head state_json when present and falls back otherwise", () => {
    const fallback = emptyWorld("world.fallback");
    const restored = emptyWorld("world.perihelion-reach");
    restored.sequence = 75;
    const head: WorldHead = {
      world_id: "world.perihelion-reach",
      sequence: 75,
      cycle: 0,
      status: "ACTIVE",
      settlement_health: "HEALTHY",
      state_json: restored,
    };
    expect(worldFromHead(head, fallback).world_id).toBe("world.perihelion-reach");
    expect(worldFromHead(head, fallback).sequence).toBe(75);
    expect(worldFromHead(null, fallback).world_id).toBe("world.fallback");
  });

  it("clamps state_json.sequence to heads.sequence and logs the mismatch", () => {
    const fallback = emptyWorld("world.fallback");
    const snap = emptyWorld("world.perihelion-reach-3");
    snap.sequence = 42292;
    snap.cycle = 18014;
    const head: WorldHead = {
      world_id: "world.perihelion-reach-3",
      sequence: 42291,
      cycle: 18013,
      status: "ACTIVE",
      settlement_health: "HEALTHY",
      revision: 20866,
      state_json: snap,
    };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const restored = worldFromHead(head, fallback);
      expect(restored.sequence).toBe(42291);
      expect(restored.cycle).toBe(18013);
      expect(restored.world_id).toBe("world.perihelion-reach-3");
      expect(snap.sequence).toBe(42292);
      expect(snap.cycle).toBe(18014);
      expect(warn).toHaveBeenCalledWith(
        HEAD_SEQUENCE_CLAMP_LOG_EVENT,
        expect.objectContaining({
          world_id: "world.perihelion-reach-3",
          head_sequence: 42291,
          state_json_sequence: 42292,
          head_cycle: 18013,
          state_json_cycle: 18014,
        }),
      );
    } finally {
      warn.mockRestore();
    }
  });
});

describe("liveSequenceSkewedFromHead", () => {
  it("is true only when both sides are numbers and they differ", () => {
    expect(liveSequenceSkewedFromHead(42292, 42291)).toBe(true);
    expect(liveSequenceSkewedFromHead(42291, 42291)).toBe(false);
    expect(liveSequenceSkewedFromHead(undefined, 42291)).toBe(false);
    expect(liveSequenceSkewedFromHead(42292, undefined)).toBe(false);
  });
});

describe("RFC-0016 world head upsert", () => {
  it("treats a missing table as skip, not PLAY failure", async () => {
    const env = {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
    } as Env;
    const orig = globalThis.fetch;
    globalThis.fetch = (async () => new Response("missing", { status: 404 })) as typeof fetch;
    try {
      const ok = await putWorldHead(env, {
        world_id: "world.test",
        sequence: 1,
        cycle: 0,
        status: "ACTIVE",
        settlement_health: "HEALTHY",
        state_json: emptyWorld(),
      });
      expect(ok).toBe(true);
    } finally {
      globalThis.fetch = orig;
    }
  });
});

describe("adopt live world head", () => {
  it("persists the live snapshot through the adopt RPC and invents no events", async () => {
    const env = {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
    } as Env;
    const calls: Array<{ url: string; body: Record<string, unknown> | null }> = [];
    const orig = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const body = typeof init?.body === "string" ? JSON.parse(init.body) as Record<string, unknown> : null;
      calls.push({ url, body });
      if (url.includes("noema_world_heads?") && (!init || init.method === undefined || init.method === "GET")) {
        return new Response("[]", { status: 200 });
      }
      if (url.includes("noema_adopt_live_world_head")) {
        return new Response(JSON.stringify({ ok: true, revision: 1, sequence: 92, idempotent: false }), { status: 200 });
      }
      return new Response("unexpected", { status: 500 });
    }) as typeof fetch;
    try {
      const world = emptyWorld("world.perihelion-reach");
      world.sequence = 92;
      const committed = await commitAdoptedLiveHead(env, {
        settlement_id: "settlement.adopt-live.world.perihelion-reach",
        writer_generation: "do.1",
        status: "ACTIVE",
        settlement_health: "HEALTHY",
        world,
      });
      expect(committed).toEqual({ ok: true, revision: 1, sequence: 92, idempotent: false });
      const rpc = calls.find((c) => c.url.includes("noema_adopt_live_world_head"));
      expect(rpc?.body?.p_world_id).toBe("world.perihelion-reach");
      expect(rpc?.body?.p_sequence).toBe(92);
      expect(rpc?.body).not.toHaveProperty("p_events");
      expect(rpc?.body).not.toHaveProperty("p_allow_bootstrap");
      expect(calls.some((c) => c.url.includes("noema_settled_events"))).toBe(false);
    } finally {
      globalThis.fetch = orig;
    }
  });

  it("falls back to a strict head insert when the adopt RPC is missing", async () => {
    const env = {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
    } as Env;
    const calls: string[] = [];
    const orig = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push(`${init?.method || "GET"} ${url}`);
      if (url.includes("noema_world_heads?") && (!init || !init.method || init.method === "GET")) {
        return new Response("[]", { status: 200 });
      }
      if (url.includes("noema_adopt_live_world_head")) {
        return new Response("missing", { status: 404 });
      }
      if (url.endsWith("/rest/v1/noema_world_heads") && init?.method === "POST") {
        const body = JSON.parse(String(init.body)) as Record<string, unknown>;
        expect(body.world_id).toBe("world.perihelion-reach");
        expect(body.sequence).toBe(92);
        expect(body.settlement_health).toBe("HEALTHY");
        expect(typeof body.state_digest).toBe("string");
        expect(body).not.toHaveProperty("events");
        return new Response(JSON.stringify([body]), { status: 201 });
      }
      return new Response("unexpected", { status: 500 });
    }) as typeof fetch;
    try {
      const world = emptyWorld("world.perihelion-reach");
      world.sequence = 92;
      const committed = await commitAdoptedLiveHead(env, {
        settlement_id: "settlement.adopt-live.world.perihelion-reach",
        writer_generation: "do.1",
        status: "ACTIVE",
        settlement_health: "HEALTHY",
        world,
      });
      expect(committed.ok).toBe(true);
      if (committed.ok) expect(committed.revision).toBe(1);
      expect(calls.some((c) => c.includes("noema_settled_events"))).toBe(false);
    } finally {
      globalThis.fetch = orig;
    }
  });

  it("refuses to clobber an existing head", async () => {
    const env = {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
    } as Env;
    const orig = globalThis.fetch;
    globalThis.fetch = (async () => new Response(JSON.stringify([{
      world_id: "world.perihelion-reach",
      sequence: 10,
      cycle: 0,
      status: "ACTIVE",
      settlement_health: "HEALTHY",
      state_json: emptyWorld("world.perihelion-reach"),
      revision: 3,
    }]), { status: 200 })) as typeof fetch;
    try {
      const committed = await commitAdoptedLiveHead(env, {
        settlement_id: "settlement.adopt-live.world.perihelion-reach",
        writer_generation: "do.1",
        status: "ACTIVE",
        settlement_health: "HEALTHY",
        world: emptyWorld("world.perihelion-reach"),
      });
      expect(committed).toEqual({ ok: false, code: "HEAD_ALREADY_PRESENT" });
    } finally {
      globalThis.fetch = orig;
    }
  });
});

describe("RFC-0016 unsettled replay", () => {
  it("drops items that settle and keeps failures", async () => {
    const calls: string[] = [];
    const env = {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
    } as Env;
    const orig = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push(url);
      const body = typeof init?.body === "string" ? init.body : "";
      const fail = body.includes("evt.fail");
      return new Response(null, { status: fail ? 500 : 201 });
    }) as typeof fetch;
    try {
      const left = await replayUnsettled(env, "world.test", [
        { event_id: "evt.ok", event_type: "LOOK", sequence: 1, payload: {} },
        { event_id: "evt.fail", event_type: "LOOK", sequence: 2, payload: {} },
      ]);
      expect(left.map((u) => u.event_id)).toEqual(["evt.fail"]);
      expect(calls.some((u) => u.includes("noema_settled_events"))).toBe(true);
    } finally {
      globalThis.fetch = orig;
    }
  });
});

describe("canonical head pulse", () => {
  it("reports missing head without leaking state_json", () => {
    const pulse = summarizeCanonicalHead(null, { sequence: 92, cycle: 0, revision: 3 });
    expect(pulse).toEqual({
      head_present: false,
      head_revision: null,
      head_sequence: null,
      head_cycle: null,
      do_sequence: 92,
      do_cycle: 0,
      do_revision: 3,
      state_json_sequence: null,
      do_ne_head: false,
      head_ne_state_json: false,
      mismatch: null,
    });
    expect(JSON.stringify(pulse)).not.toMatch(/"state_json"|world_seed/);
  });

  it("reports a present head next to the live DO counters", () => {
    const snap = emptyWorld("world.perihelion-reach");
    snap.sequence = 92;
    const pulse = summarizeCanonicalHead(
      {
        world_id: "world.perihelion-reach",
        sequence: 92,
        cycle: 0,
        status: "ACTIVE",
        settlement_health: "HEALTHY",
        revision: 4,
        state_json: snap,
      },
      { sequence: 92, cycle: 0, revision: 4 },
    );
    expect(pulse.head_present).toBe(true);
    expect(pulse.head_sequence).toBe(92);
    expect(pulse.head_revision).toBe(4);
    expect(pulse.do_sequence).toBe(92);
    expect(pulse.state_json_sequence).toBe(92);
    expect(pulse.do_ne_head).toBe(false);
    expect(pulse.head_ne_state_json).toBe(false);
    expect(pulse.mismatch).toBeNull();
    expect(JSON.stringify(pulse)).not.toContain("room.hub");
  });

  it("flags DO sequence ahead of durable head (Gate E perihelion shape)", () => {
    const snap = emptyWorld("world.perihelion-reach-3");
    snap.sequence = 42291;
    const check = compareHeadSequences(
      {
        world_id: "world.perihelion-reach-3",
        sequence: 42291,
        cycle: 18013,
        status: "ACTIVE",
        settlement_health: "HEALTHY",
        revision: 20866,
        state_json: snap,
      },
      { sequence: 42292 },
    );
    expect(check).toEqual({
      head_sequence: 42291,
      state_json_sequence: 42291,
      do_sequence: 42292,
      do_ne_head: true,
      head_ne_state_json: false,
      mismatch: "DO sequence 42292 ≠ durable head sequence 42291",
    });
  });

  it("flags heads.sequence ≠ state_json.sequence without a live DO", () => {
    const snap = emptyWorld("world.perihelion-reach-3");
    snap.sequence = 42292;
    const check = compareHeadSequences(
      {
        world_id: "world.perihelion-reach-3",
        sequence: 42291,
        cycle: 18013,
        status: "ACTIVE",
        settlement_health: "HEALTHY",
        revision: 20866,
        state_json: snap,
      },
      {},
    );
    expect(check.do_ne_head).toBe(false);
    expect(check.head_ne_state_json).toBe(true);
    expect(check.mismatch).toBe("durable head sequence 42291 ≠ state_json.sequence 42292");
  });
});

describe("admin overview head pulse auth", () => {
  const bare = { NOEMA_ENV: "production", TOKEN_SIGNING_SECRET: "test-signing-secret" } as unknown as Env;

  it("rejects anonymous and Player tokens", async () => {
    const anon = await worker.fetch(new Request("https://noema.guru/v1/admin/overview"), bare);
    expect(anon.status).toBe(401);
    const play = await mintHumanPlatformToken(bare, { identityId: "id.vesper", handle: "vesper" });
    const asPlayer = await worker.fetch(
      new Request("https://noema.guru/v1/admin/overview", {
        headers: { Authorization: `Bearer ${play.access_token}` },
      }),
      bare,
    );
    expect([401, 403]).toContain(asPlayer.status);
    const text = await asPlayer.text();
    expect(text).not.toMatch(/head_present|state_json/);
  });

  it("surfaces DO ≠ durable head on the admin overview pulse", async () => {
    const snap = emptyWorld("world.perihelion-reach-3");
    snap.sequence = 42291;
    const env = {
      NOEMA_ENV: "production",
      TOKEN_SIGNING_SECRET: "test-signing-secret",
      ADMIN_OPERATOR_TOKEN: "operator-token-value-ok",
      DEFAULT_WORLD_ID: "world.perihelion-reach-3",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
      WORLD_DO: {
        idFromName(name: string) {
          return { name };
        },
        get() {
          return {
            fetch: async () =>
              new Response(
                JSON.stringify({
                  world_id: "world.perihelion-reach-3",
                  sequence: 42292,
                  cycle: 18013,
                  meta: { status: "ACTIVE", revision: 20866, settlement_ok: true, genesis_id: "genesis.test" },
                }),
                { status: 200, headers: { "content-type": "application/json" } },
              ),
          };
        },
      },
    } as unknown as Env;
    const orig = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("noema_world_heads")) {
        return new Response(
          JSON.stringify([
            {
              world_id: "world.perihelion-reach-3",
              sequence: 42291,
              cycle: 18013,
              status: "ACTIVE",
              settlement_health: "HEALTHY",
              revision: 20866,
              writer_generation: "do.1",
              state_json: snap,
            },
          ]),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response("unexpected", { status: 500 });
    }) as typeof fetch;
    try {
      const minted = await mintAdminSession(env, "operator-token-value-ok");
      if (minted instanceof Response) throw new Error("failed to mint admin");
      const res = await worker.fetch(
        new Request("https://noema.guru/v1/admin/overview", {
          headers: { Authorization: `Bearer ${minted.access_token}` },
        }),
        env,
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        canonical_head: {
          do_ne_head: boolean;
          head_ne_state_json: boolean;
          mismatch: string | null;
          do_sequence: number;
          head_sequence: number;
          state_json_sequence: number;
        };
        attention: Array<{ message: string; level: string }>;
      };
      expect(body.canonical_head.do_sequence).toBe(42292);
      expect(body.canonical_head.head_sequence).toBe(42291);
      expect(body.canonical_head.state_json_sequence).toBe(42291);
      expect(body.canonical_head.do_ne_head).toBe(true);
      expect(body.canonical_head.head_ne_state_json).toBe(false);
      expect(body.canonical_head.mismatch).toBe("DO sequence 42292 ≠ durable head sequence 42291");
      expect(body.attention.some((row) => row.message === body.canonical_head.mismatch)).toBe(true);
      expect(JSON.stringify(body.canonical_head)).not.toMatch(/room\.hub|world_seed/);
    } finally {
      globalThis.fetch = orig;
    }
  });
});
