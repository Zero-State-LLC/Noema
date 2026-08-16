import { describe, expect, it } from "vitest";
import {
  commitAdoptedLiveHead,
  putWorldHead,
  replayUnsettled,
  shouldRestoreFromHead,
  worldFromHead,
  type WorldHead,
} from "../src/settle";
import type { Env } from "../src/types";
import type { WorldRuntime } from "../src/world-actions";

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
