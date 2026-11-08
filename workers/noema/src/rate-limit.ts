import { sha256Hex } from "./genesis";

/** Sliding-window throttle. Isolate-local; reset between tests. */

export class SlidingWindowThrottle {
  private hits = new Map<string, number[]>();
  private pruneAt = 0;
  constructor(
    private limit: number,
    private windowMs: number,
  ) {}

  hit(key: string, now = Date.now()): boolean {
    const cut = now - this.windowMs;
    if (now >= this.pruneAt) {
      // Once per window, forget keys with no hit left in it, so raw keys do not live as long as the isolate.
      for (const [k, ts] of this.hits) if (!ts.some((t) => t > cut)) this.hits.delete(k);
      this.pruneAt = now + this.windowMs;
    }
    const prev = (this.hits.get(key) || []).filter((t) => t > cut);
    if (prev.length >= this.limit) {
      this.hits.set(key, prev);
      return false;
    }
    prev.push(now);
    this.hits.set(key, prev);
    return true;
  }

  /** Keys currently held. */
  get size(): number {
    return this.hits.size;
  }

  reset(): void {
    this.hits.clear();
    this.pruneAt = 0;
  }
}

/** PLAY/command: 120 actions per minute per player. */
export const commandThrottle = new SlidingWindowThrottle(120, 60_000);

/** Device enrollment start: 20 per hour per client IP. */
export const deviceThrottle = new SlidingWindowThrottle(20, 3_600_000);

/** Admin operator-token mint: 30 per hour per client IP. */
export const adminSessionThrottle = new SlidingWindowThrottle(30, 3_600_000);

export const LOGIN_LIMIT = 5;
export const LOGIN_WINDOW_MS = 3_600_000;
export const ADMIN_SESSION_LIMIT = 30;
export const ADMIN_SESSION_WINDOW_MS = 3_600_000;

export async function allowLoginThrottled(
  local: SlidingWindowThrottle,
  env: RateLimitEnv,
  ip: string,
  email: string,
  now = Date.now(),
): Promise<boolean> {
  if (!(await allowThrottled(local, env, `login-ip:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS, now))) {
    return false;
  }
  return allowThrottled(local, env, `login-email:${email}`, LOGIN_LIMIT, LOGIN_WINDOW_MS, now);
}

export const RATE_LIMIT_DO_NAME = "__noema_rate_limits__";

type RateLimitEnv = {
  WORLD_DO?: DurableObjectNamespace;
};

/**
 * Isolate-local first, then the shared WORLD_DO bag when that stub speaks `{ allowed: boolean }`.
 * Mocks that return `{ ok: true }` or 404/400 are treated as "no durable backend".
 */
export async function allowThrottled(
  local: SlidingWindowThrottle,
  env: RateLimitEnv,
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): Promise<boolean> {
  if (!local.hit(key, now)) return false;
  const ns = env.WORLD_DO;
  if (!ns?.idFromName) return true;
  try {
    const stub = ns.get(ns.idFromName(RATE_LIMIT_DO_NAME));
    const res = await stub.fetch("https://do/ratelimit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, limit, windowMs, now }),
    });
    if (!res.ok) return true;
    const body = (await res.json()) as { allowed?: unknown };
    if (typeof body.allowed === "boolean") return body.allowed;
    return true;
  } catch {
    return true;
  }
}

// ——— Durable rows inside the `__noema_rate_limits__` Durable Object ———

/** Row keys are `rl:` + SHA-256 hex of the caller key, so emails and IPs are not key names. */
export const RATE_LIMIT_ROW_PREFIX = "rl:";
/** Present only on the limiter instance. Its alarm sweeps rows instead of running world tempo. */
export const RATE_LIMIT_SWEEP_MARKER = "ratelimit_sweep";
/** Last row key a partial sweep reached. Outside the `rl:` prefix so it is never swept. */
export const RATE_LIMIT_SWEEP_CURSOR = "ratelimit_sweep_cursor";
/** While any row exists an alarm is pending at most this far out. */
export const RATE_LIMIT_SWEEP_INTERVAL_MS = 300_000;
/** Rows read per alarm. Also the platform cap on keys per `delete`. */
export const RATE_LIMIT_SWEEP_BATCH = 128;
/** Delay before a sweep that stopped at the batch cap carries on. */
export const RATE_LIMIT_SWEEP_CONTINUE_MS = 1_000;

export type RateLimitRow = { hits: number[]; expires_at: number };

type RateLimitStorage = Pick<DurableObjectStorage, "get" | "put" | "delete" | "list" | "getAlarm" | "setAlarm">;

export async function rateLimitRowKey(key: string): Promise<string> {
  return `${RATE_LIMIT_ROW_PREFIX}${await sha256Hex(key)}`;
}

function rowHits(value: unknown): number[] {
  const hits = (value as Partial<RateLimitRow> | undefined)?.hits;
  return Array.isArray(hits) ? hits.filter((t): t is number => typeof t === "number" && Number.isFinite(t)) : [];
}

/**
 * When the newest hit leaves its window; the row is empty from then on. Rows without
 * `expires_at` count as expired: that covers raw-key rows from before hashing (bare
 * timestamp arrays), which nothing reads any more.
 */
export function rateLimitRowExpiresAt(value: unknown): number {
  const at = (value as Partial<RateLimitRow> | undefined)?.expires_at;
  return typeof at === "number" && Number.isFinite(at) ? at : 0;
}

/** One `/ratelimit` hit. Same sliding window as before; only the row key and shape changed. */
export async function durableRateLimitHit(
  storage: RateLimitStorage,
  key: string,
  limit: number,
  windowMs: number,
  now: number,
): Promise<boolean> {
  const rowKey = await rateLimitRowKey(key);
  const hits = rowHits(await storage.get(rowKey)).filter((t) => t > now - windowMs);
  const allowed = hits.length < limit;
  if (allowed) hits.push(now);
  if (hits.length) {
    const row: RateLimitRow = { hits, expires_at: Math.max(...hits) + windowMs };
    await storage.put(rowKey, row);
  } else {
    // Unreachable while limit >= 1, kept so an empty row is never written.
    await storage.delete(rowKey);
  }
  return allowed;
}

/** Mark this instance as the limiter and make sure a sweep alarm is pending. */
export async function armRateLimitSweep(storage: RateLimitStorage, now: number): Promise<void> {
  if ((await storage.getAlarm()) != null) return;
  if (!(await storage.get(RATE_LIMIT_SWEEP_MARKER))) await storage.put(RATE_LIMIT_SWEEP_MARKER, true);
  await storage.setAlarm(now + RATE_LIMIT_SWEEP_INTERVAL_MS);
}

/**
 * Delete expired rows, at most one batch per alarm. A row nobody touches again is
 * gone within RATE_LIMIT_SWEEP_INTERVAL_MS (plus batch carry-on) of expiring.
 */
export async function sweepRateLimitRows(storage: RateLimitStorage, now: number): Promise<void> {
  const cursor = await storage.get<string>(RATE_LIMIT_SWEEP_CURSOR);
  const page = await storage.list({
    prefix: RATE_LIMIT_ROW_PREFIX,
    limit: RATE_LIMIT_SWEEP_BATCH,
    ...(cursor ? { startAfter: cursor } : {}),
  });
  const expired = [...page].filter(([, value]) => rateLimitRowExpiresAt(value) <= now).map(([rowKey]) => rowKey);
  if (expired.length) await storage.delete(expired);
  if (page.size === RATE_LIMIT_SWEEP_BATCH) {
    await storage.put(RATE_LIMIT_SWEEP_CURSOR, [...page.keys()][page.size - 1]);
    await storage.setAlarm(now + RATE_LIMIT_SWEEP_CONTINUE_MS);
    return;
  }
  if (cursor) await storage.delete(RATE_LIMIT_SWEEP_CURSOR);
  const left = await storage.list({ prefix: RATE_LIMIT_ROW_PREFIX, limit: 1 });
  if (left.size) await storage.setAlarm(now + RATE_LIMIT_SWEEP_INTERVAL_MS);
}
