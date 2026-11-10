import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_SESSION_LIMIT,
  ADMIN_SESSION_WINDOW_MS,
  allowLoginThrottled,
  allowThrottled,
  LOGIN_LIMIT,
  LOGIN_WINDOW_MS,
  RATE_LIMIT_DO_NAME,
  RATE_LIMIT_SWEEP_BATCH,
  RATE_LIMIT_SWEEP_CONTINUE_MS,
  RATE_LIMIT_SWEEP_CURSOR,
  RATE_LIMIT_SWEEP_INTERVAL_MS,
  RATE_LIMIT_SWEEP_MARKER,
  rateLimitRowKey,
  SlidingWindowThrottle,
} from "../src/rate-limit";
import type { Env } from "../src/types";
import { NoemaWorldDO } from "../src/world-do";
import { harness, WORLD } from "./agent-http-do-fixture";

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

  it("forgets keys whose hits have all left the window", () => {
    const t = new SlidingWindowThrottle(5, 100);
    expect(t.hit("login-email:old@example.com", 0)).toBe(true);
    expect(t.hit("login-email:live@example.com", 50)).toBe(true);
    expect(t.size).toBe(2);
    expect(t.hit("login-email:new@example.com", 120)).toBe(true);
    expect(t.size).toBe(2);
    expect(t.hit("login-email:live@example.com", 121)).toBe(true);
    expect(t.size).toBe(2);
    t.reset();
    expect(t.size).toBe(0);
  });

  it("still refuses a key at its limit after other keys are pruned", () => {
    const t = new SlidingWindowThrottle(2, 100);
    expect(t.hit("other", 0)).toBe(true);
    expect(t.hit("k", 95)).toBe(true);
    expect(t.hit("k", 100)).toBe(true); // this call prunes "other"
    expect(t.size).toBe(1);
    expect(t.hit("k", 101)).toBe(false);
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

/** In-memory stand-in for the limiter Durable Object's storage. Keys list in sorted order like the platform. */
class MemoryStorage {
  rows = new Map<string, unknown>();
  alarm: number | null = null;
  deleteBatches: number[] = [];
  failSetAlarm = false;
  async get<T>(key: string): Promise<T | undefined> {
    return structuredClone(this.rows.get(key)) as T | undefined;
  }
  async put(key: string, value: unknown): Promise<void> {
    this.rows.set(key, structuredClone(value));
  }
  async delete(keys: string | string[]): Promise<number | boolean> {
    const list = Array.isArray(keys) ? keys : [keys];
    if (list.length > 128) throw new Error("platform caps delete at 128 keys");
    this.deleteBatches.push(list.length);
    const n = list.filter((k) => this.rows.delete(k)).length;
    return Array.isArray(keys) ? n : n > 0;
  }
  async list(opts: { prefix?: string; startAfter?: string; limit?: number } = {}): Promise<Map<string, unknown>> {
    const keys = [...this.rows.keys()]
      .filter((k) => (opts.prefix === undefined || k.startsWith(opts.prefix)) && (opts.startAfter === undefined || k > opts.startAfter))
      .sort();
    return new Map(keys.slice(0, opts.limit ?? keys.length).map((k) => [k, structuredClone(this.rows.get(k))]));
  }
  async getAlarm(): Promise<number | null> {
    return this.alarm;
  }
  async setAlarm(at: number): Promise<void> {
    if (this.failSetAlarm) throw new Error("setAlarm unavailable");
    this.alarm = at;
  }
  async deleteAlarm(): Promise<void> {
    this.alarm = null;
  }
}

/** The real NoemaWorldDO `/ratelimit` handler and alarm, behind a WORLD_DO namespace. */
function limiter() {
  const storage = new MemoryStorage();
  const object = new NoemaWorldDO({ storage } as unknown as DurableObjectState, { NOEMA_ENV: "test" } as unknown as Env);
  const names: string[] = [];
  const env = {
    WORLD_DO: {
      idFromName: (name: string) => ({ name }) as unknown as DurableObjectId,
      get: ({ name }: { name: string }) => {
        names.push(name);
        return { fetch: (url: string, init?: RequestInit) => object.fetch(new Request(url, init)) };
      },
    } as unknown as DurableObjectNamespace,
  };
  /** Fire the pending alarm at its scheduled time, as the platform does (cleared before the handler runs). */
  async function fire(): Promise<void> {
    const at = storage.alarm;
    if (at == null) throw new Error("no alarm pending");
    vi.setSystemTime(Math.max(at, Date.now()));
    storage.alarm = null;
    await object.alarm();
  }
  return { storage, object, env, names, fire };
}

/** A fresh isolate each call, so the Durable Object is what enforces the limit. */
const isolate = () => new SlidingWindowThrottle(1_000, 3_600_000);

const T0 = 1_800_000_000_000;
const ROW = /^rl:[0-9a-f]{64}$/;

describe("__noema_rate_limits__ Durable Object rows", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(T0);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the published limits: login 5/hour, admin session 30/hour", () => {
    expect(LOGIN_LIMIT).toBe(5);
    expect(LOGIN_WINDOW_MS).toBe(3_600_000);
    expect(ADMIN_SESSION_LIMIT).toBe(30);
    expect(ADMIN_SESSION_WINDOW_MS).toBe(3_600_000);
  });

  it("enforces 5 sign-in requests an hour per email across isolates", async () => {
    const { env, names } = limiter();
    for (let i = 0; i < LOGIN_LIMIT; i++) {
      expect(await allowLoginThrottled(isolate(), env, `203.0.113.${i}`, "alice@example.com", T0 + i)).toBe(true);
    }
    expect(await allowLoginThrottled(isolate(), env, "203.0.113.99", "alice@example.com", T0 + 10)).toBe(false);
    expect(await allowLoginThrottled(isolate(), env, "203.0.113.98", "bob@example.com", T0 + 11)).toBe(true);
    expect(await allowLoginThrottled(isolate(), env, "203.0.113.97", "alice@example.com", T0 + LOGIN_WINDOW_MS + 10)).toBe(true);
    expect(new Set(names)).toEqual(new Set([RATE_LIMIT_DO_NAME]));
  });

  it("enforces 5 sign-in requests an hour per IP across isolates", async () => {
    const { env } = limiter();
    for (let i = 0; i < LOGIN_LIMIT; i++) {
      expect(await allowLoginThrottled(isolate(), env, "198.51.100.7", `user${i}@example.com`, T0 + i)).toBe(true);
    }
    expect(await allowLoginThrottled(isolate(), env, "198.51.100.7", "fresh@example.com", T0 + 10)).toBe(false);
  });

  it("keeps the admin session limit at 30 an hour per IP", async () => {
    const { env } = limiter();
    const key = "admin-session-ip:198.51.100.7";
    for (let i = 0; i < ADMIN_SESSION_LIMIT; i++) {
      expect(await allowThrottled(isolate(), env, key, ADMIN_SESSION_LIMIT, ADMIN_SESSION_WINDOW_MS, T0 + i)).toBe(true);
    }
    expect(await allowThrottled(isolate(), env, key, ADMIN_SESSION_LIMIT, ADMIN_SESSION_WINDOW_MS, T0 + 100)).toBe(false);
    expect(await allowThrottled(isolate(), env, key, ADMIN_SESSION_LIMIT, ADMIN_SESSION_WINDOW_MS, T0 + ADMIN_SESSION_WINDOW_MS + 100)).toBe(true);
  });

  it("names rows by SHA-256 of the key and never stores the raw email or IP", async () => {
    const { env, storage } = limiter();
    expect(await allowLoginThrottled(isolate(), env, "203.0.113.5", "alice@example.com", T0)).toBe(true);
    const emailRow = "rl:" + createHash("sha256").update("login-email:alice@example.com").digest("hex");
    const ipRow = "rl:" + createHash("sha256").update("login-ip:203.0.113.5").digest("hex");
    expect(await rateLimitRowKey("login-email:alice@example.com")).toBe(emailRow);
    expect([...storage.rows.keys()].sort()).toEqual([emailRow, ipRow, RATE_LIMIT_SWEEP_MARKER].sort());
    expect(storage.rows.get(emailRow)).toEqual({ hits: [T0], expires_at: T0 + LOGIN_WINDOW_MS });
    const dump = JSON.stringify([...storage.rows]);
    expect(dump).not.toContain("alice");
    expect(dump).not.toContain("203.0.113.5");
  });

  it("rewrites a row touched after its window with only the new hit", async () => {
    const { env, storage } = limiter();
    const key = "login-email:alice@example.com";
    expect(await allowThrottled(isolate(), env, key, LOGIN_LIMIT, LOGIN_WINDOW_MS, T0)).toBe(true);
    const later = T0 + LOGIN_WINDOW_MS + 1;
    expect(await allowThrottled(isolate(), env, key, LOGIN_LIMIT, LOGIN_WINDOW_MS, later)).toBe(true);
    expect(storage.rows.get(await rateLimitRowKey(key))).toEqual({ hits: [later], expires_at: later + LOGIN_WINDOW_MS });
  });

  it("deletes rows nobody touches again within one sweep interval of their window ending", async () => {
    const { env, storage, fire } = limiter();
    expect(await allowLoginThrottled(isolate(), env, "203.0.113.5", "alice@example.com", T0)).toBe(true);
    expect(storage.alarm).toBe(T0 + RATE_LIMIT_SWEEP_INTERVAL_MS);
    vi.setSystemTime(T0 + 1_800_000);
    const adminRow = await rateLimitRowKey("admin-session-ip:198.51.100.7");
    expect(await allowThrottled(isolate(), env, "admin-session-ip:198.51.100.7", ADMIN_SESSION_LIMIT, ADMIN_SESSION_WINDOW_MS, Date.now())).toBe(true);

    const loginRows = [await rateLimitRowKey("login-email:alice@example.com"), await rateLimitRowKey("login-ip:203.0.113.5")];
    // Run the real alarm cadence until just past the login rows' bound.
    while (storage.alarm != null && storage.alarm <= T0 + LOGIN_WINDOW_MS + RATE_LIMIT_SWEEP_INTERVAL_MS) await fire();
    for (const row of loginRows) expect(storage.rows.has(row)).toBe(false);
    expect(storage.rows.has(adminRow)).toBe(true);
    expect(storage.alarm).not.toBeNull();

    while (storage.alarm != null) await fire();
    expect(Date.now()).toBeLessThanOrEqual(T0 + 1_800_000 + ADMIN_SESSION_WINDOW_MS + RATE_LIMIT_SWEEP_INTERVAL_MS);
    expect([...storage.rows.keys()].filter((k) => k.startsWith("rl:"))).toEqual([]);
    expect(storage.rows.has(RATE_LIMIT_SWEEP_CURSOR)).toBe(false);
    expect(storage.alarm).toBeNull();
  });

  it("deletes raw-key rows written before hashing on the first sweep, however recent", async () => {
    const { env, storage, fire } = limiter();
    storage.rows.set("rl:login-email:legacy@example.com", [T0 - 10]);
    storage.rows.set("rl:login-ip:192.0.2.1", [T0 - 20, T0 - 5]);
    storage.rows.set("rl:login-email:recent@example.com", [T0]);
    expect(await allowLoginThrottled(isolate(), env, "192.0.2.1", "recent@example.com", T0)).toBe(true);
    await fire();
    expect(Date.now()).toBe(T0 + RATE_LIMIT_SWEEP_INTERVAL_MS);
    expect([...storage.rows.keys()].filter((k) => k.startsWith("rl:") && !ROW.test(k))).toEqual([]);
    expect(storage.rows.has(await rateLimitRowKey("login-email:recent@example.com"))).toBe(true);
    expect(storage.rows.has(await rateLimitRowKey("login-ip:192.0.2.1"))).toBe(true);
  });

  it("deletes at most one batch per alarm and carries on from a cursor", async () => {
    const { env, storage, fire } = limiter();
    const live = await rateLimitRowKey("login-email:live@example.com");
    const expired: string[] = [];
    for (let i = 0; i < 300; i++) {
      const row = await rateLimitRowKey(`login-ip:10.0.${i >> 8}.${i & 255}`);
      expired.push(row);
      storage.rows.set(row, { hits: [T0 - LOGIN_WINDOW_MS], expires_at: T0 });
    }
    expect(await allowThrottled(isolate(), env, "login-email:live@example.com", LOGIN_LIMIT, LOGIN_WINDOW_MS, T0)).toBe(true);
    expect(storage.alarm).toBe(T0 + RATE_LIMIT_SWEEP_INTERVAL_MS);

    await fire();
    const firstPage = [...expired, live].sort().slice(0, RATE_LIMIT_SWEEP_BATCH);
    expect(storage.deleteBatches).toEqual([firstPage.filter((row) => row !== live).length]);
    expect(storage.rows.get(RATE_LIMIT_SWEEP_CURSOR)).toMatch(ROW);
    expect(storage.alarm).toBe(Date.now() + RATE_LIMIT_SWEEP_CONTINUE_MS);

    let alarms = 1;
    while (storage.rows.has(RATE_LIMIT_SWEEP_CURSOR)) {
      await fire();
      alarms += 1;
    }
    expect(alarms).toBe(Math.ceil(301 / RATE_LIMIT_SWEEP_BATCH));
    expect(Math.max(...storage.deleteBatches)).toBeLessThanOrEqual(RATE_LIMIT_SWEEP_BATCH);
    expect(storage.deleteBatches.reduce((a, b) => a + b, 0)).toBe(300 + 1); // 300 rows + the cursor key
    for (const row of expired) expect(storage.rows.has(row)).toBe(false);
    expect(storage.rows.has(live)).toBe(true);
    expect(storage.alarm).toBe(Date.now() + RATE_LIMIT_SWEEP_INTERVAL_MS);
  });

  it("answers the hit even when the sweep alarm cannot be set, and arms on a later hit", async () => {
    const { env, storage } = limiter();
    storage.failSetAlarm = true;
    expect(await allowThrottled(isolate(), env, "login-email:alice@example.com", LOGIN_LIMIT, LOGIN_WINDOW_MS, T0)).toBe(true);
    expect(storage.alarm).toBeNull();
    storage.failSetAlarm = false;
    expect(await allowThrottled(isolate(), env, "login-email:alice@example.com", LOGIN_LIMIT, LOGIN_WINDOW_MS, T0 + 1)).toBe(true);
    expect(storage.alarm).toBe(T0 + RATE_LIMIT_SWEEP_INTERVAL_MS);
  });

  it("arms the sweep only on the limiter instance and leaves the world alarm on its tempo path", async () => {
    vi.useRealTimers();
    const h = harness();
    const token = (await h.agent()).access_token;
    expect((await h.command(token, "ENTER_WORLD")).status).toBe(200);
    expect((await h.command(token, "LOOK")).status).toBe(200);
    expect(h.writes.filter((w) => w.key === RATE_LIMIT_SWEEP_MARKER)).toEqual([
      { name: RATE_LIMIT_DO_NAME, key: RATE_LIMIT_SWEEP_MARKER },
    ]);
    expect(h.writes.filter((w) => w.name === RATE_LIMIT_DO_NAME).every((w) => w.key === RATE_LIMIT_SWEEP_MARKER || ROW.test(w.key))).toBe(true);
    expect(h.alarms.filter((a) => a.name !== WORLD)).toEqual([{ name: RATE_LIMIT_DO_NAME, at: expect.any(Number) }]);
    // The fixture's storage has no list/delete, so a sweep on the world instance would throw here.
    await expect(h.runAlarm(WORLD)).resolves.toBeUndefined();
  });
});
