import { describe, expect, it } from "vitest";
import { allowThrottled, SlidingWindowThrottle } from "../src/rate-limit";

describe("SlidingWindowThrottle", () => {
  it("allows up to the limit then refuses", () => {
    const t = new SlidingWindowThrottle(2, 60_000);
    expect(t.hit("k", 1_000)).toBe(true);
    expect(t.hit("k", 1_001)).toBe(true);
    expect(t.hit("k", 1_002)).toBe(false);
  });

  it("expires hits outside the window", () => {
    const t = new SlidingWindowThrottle(1, 100);
    expect(t.hit("k", 0)).toBe(true);
    expect(t.hit("k", 50)).toBe(false);
    expect(t.hit("k", 101)).toBe(true);
  });
});

function durableNs(handler: (url: string, init?: RequestInit) => Promise<Response>): DurableObjectNamespace {
  return {
    idFromName: (name: string) => ({ name }) as unknown as DurableObjectId,
    get: () => ({
      fetch: (url: string, init?: RequestInit) => handler(url, init),
    }),
  } as unknown as DurableObjectNamespace;
}

describe("allowThrottled", () => {
  it("denies from isolate-local without calling the DO", async () => {
    const local = new SlidingWindowThrottle(1, 60_000);
    let calls = 0;
    const env = {
      WORLD_DO: durableNs(async () => {
        calls += 1;
        return Response.json({ allowed: true });
      }),
    };
    expect(await allowThrottled(local, env, "k", 1, 60_000, 1)).toBe(true);
    expect(await allowThrottled(local, env, "k", 1, 60_000, 2)).toBe(false);
    expect(calls).toBe(1);
  });

  it("honors a durable { allowed: false } after the local window still has room", async () => {
    const local = new SlidingWindowThrottle(10, 60_000);
    const env = {
      WORLD_DO: durableNs(async () => Response.json({ allowed: false })),
    };
    expect(await allowThrottled(local, env, "player:1", 10, 60_000, 1)).toBe(false);
  });

  it("ignores mock DO bags that do not speak allowed", async () => {
    const local = new SlidingWindowThrottle(10, 60_000);
    const env = {
      WORLD_DO: durableNs(async () => Response.json({ ok: true })),
    };
    expect(await allowThrottled(local, env, "player:1", 10, 60_000, 1)).toBe(true);
  });
});
