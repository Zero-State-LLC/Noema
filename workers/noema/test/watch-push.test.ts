import { describe, expect, it } from "vitest";
import { WATCH_PUSH_MIN_INTERVAL_MS, watchPushDecision } from "../src/watch-push";

describe("watchPushDecision", () => {
  it("pushes now when nothing has been pushed yet", () => {
    expect(watchPushDecision({ lastPushAt: null, lastPushedSequence: null, now: 1_000, sequence: 0 }))
      .toEqual({ push: true, delayMs: 0 });
    expect(watchPushDecision({ lastPushAt: null, lastPushedSequence: null, now: 0, sequence: 12 }))
      .toEqual({ push: true, delayMs: 0 });
  });

  it("never re-pushes a sequence already pushed, or an older one", () => {
    const s = { lastPushAt: 0, lastPushedSequence: 5, now: 10 * WATCH_PUSH_MIN_INTERVAL_MS };
    expect(watchPushDecision({ ...s, sequence: 5 })).toEqual({ push: false, delayMs: 0 });
    expect(watchPushDecision({ ...s, sequence: 4 })).toEqual({ push: false, delayMs: 0 });
    expect(watchPushDecision({ ...s, sequence: 6 })).toEqual({ push: true, delayMs: 0 });
  });

  it("paces a push that arrives sooner than the minimum interval", () => {
    const d = watchPushDecision({ lastPushAt: 400, lastPushedSequence: 1, now: 1_000, sequence: 2 });
    expect(d).toEqual({ push: true, delayMs: WATCH_PUSH_MIN_INTERVAL_MS - 600 });
    expect(d.delayMs).toBeGreaterThan(0);
    expect(d.delayMs).toBeLessThanOrEqual(WATCH_PUSH_MIN_INTERVAL_MS);
  });

  it("pushes now at exactly the minimum interval boundary", () => {
    const d = watchPushDecision({
      lastPushAt: 400,
      lastPushedSequence: 1,
      now: 400 + WATCH_PUSH_MIN_INTERVAL_MS,
      sequence: 2,
    });
    expect(d).toEqual({ push: true, delayMs: 0 });
  });

  it("pushes now once the minimum interval has elapsed", () => {
    const d = watchPushDecision({
      lastPushAt: 400,
      lastPushedSequence: 1,
      now: 400 + WATCH_PUSH_MIN_INTERVAL_MS + 5_000,
      sequence: 9,
    });
    expect(d).toEqual({ push: true, delayMs: 0 });
  });

  it("suppresses a stale sequence even when the interval has long elapsed", () => {
    const d = watchPushDecision({
      lastPushAt: 1_000,
      lastPushedSequence: 42,
      now: 1_000 + 100 * WATCH_PUSH_MIN_INTERVAL_MS,
      sequence: 42,
    });
    expect(d).toEqual({ push: false, delayMs: 0 });
  });
});
