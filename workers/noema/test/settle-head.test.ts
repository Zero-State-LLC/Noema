import { describe, expect, it } from "vitest";
import {
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
