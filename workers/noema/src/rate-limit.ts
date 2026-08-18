/** Sliding-window throttle. Isolate-local; reset between tests. */

export class SlidingWindowThrottle {
  private hits = new Map<string, number[]>();
  constructor(
    private limit: number,
    private windowMs: number,
  ) {}

  hit(key: string, now = Date.now()): boolean {
    const cut = now - this.windowMs;
    const prev = (this.hits.get(key) || []).filter((t) => t > cut);
    if (prev.length >= this.limit) {
      this.hits.set(key, prev);
      return false;
    }
    prev.push(now);
    this.hits.set(key, prev);
    return true;
  }

  reset(): void {
    this.hits.clear();
  }
}

/** PLAY/command: 120 actions per minute per player. */
export const commandThrottle = new SlidingWindowThrottle(120, 60_000);

/** Device enrollment start: 20 per hour per client IP. */
export const deviceThrottle = new SlidingWindowThrottle(20, 3_600_000);

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
