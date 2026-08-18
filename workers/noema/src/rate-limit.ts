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
