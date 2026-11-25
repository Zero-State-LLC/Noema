/**
 * D6 "Push and paced playback" — transport policy for the WATCH socket.
 * Pure: the decision is testable without a Durable Object.
 *
 * The pushed message is exactly the watch-live/1.0 snapshot the socket
 * already serves; this module only decides WHEN it is worth sending one.
 */

/** At most one pushed snapshot per public event burst. */
export const WATCH_PUSH_MIN_INTERVAL_MS = 2000;

/**
 * Should the current public sequence be pushed, and if so when?
 * - never re-push a sequence already pushed (or an older one);
 * - otherwise push now if nothing was pushed yet or the min interval elapsed;
 * - otherwise push, but only after the remaining interval.
 */
export function watchPushDecision(s: {
  lastPushAt: number | null;
  lastPushedSequence: number | null;
  now: number;
  sequence: number;
}): { push: boolean; delayMs: number } {
  if (s.lastPushedSequence !== null && s.sequence <= s.lastPushedSequence) {
    return { push: false, delayMs: 0 };
  }
  if (s.lastPushAt === null) return { push: true, delayMs: 0 };
  const since = s.now - s.lastPushAt;
  if (since >= WATCH_PUSH_MIN_INTERVAL_MS) return { push: true, delayMs: 0 };
  return { push: true, delayMs: WATCH_PUSH_MIN_INTERVAL_MS - since };
}
