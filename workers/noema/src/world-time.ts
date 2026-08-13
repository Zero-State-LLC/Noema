/**
 * RFC-0019 hosted world-time. WAIT does not advance World.cycle alone.
 * Cycle commit is world-ops when every present Player is waiting.
 * Authority: Noema-Specs rfcs/RFC-0019-hosted-world-time.md
 */

import { PRESENCE_IDLE_MS } from "./ops";

export type WorldTimePlayer = {
  entered?: boolean;
  last_seen_ms?: number;
  wait_until_cycle?: number;
};

export function presentPlayerIds(
  players: Record<string, WorldTimePlayer> | undefined,
  now: number,
  idleMs = PRESENCE_IDLE_MS,
): string[] {
  if (!players) return [];
  return Object.entries(players)
    .filter(([, p]) => Boolean(p.entered) && p.last_seen_ms != null && now - p.last_seen_ms <= idleMs)
    .map(([id]) => id);
}

export function allPresentWaiting(
  players: Record<string, WorldTimePlayer> | undefined,
  cycle: number,
  now: number,
  idleMs = PRESENCE_IDLE_MS,
): boolean {
  const present = presentPlayerIds(players, now, idleMs);
  if (!present.length) return false;
  return present.every((id) => (players?.[id]?.wait_until_cycle ?? Number.NEGATIVE_INFINITY) > cycle);
}

/** Sole hosted writer of World.cycle. Callers may then resolve contests / schedule pressure. */
export function commitCycleIfReady<T extends { cycle: number; players: Record<string, WorldTimePlayer> }>(
  w: T,
  now = Date.now(),
  idleMs = PRESENCE_IDLE_MS,
): boolean {
  if (!allPresentWaiting(w.players, w.cycle, now, idleMs)) return false;
  w.cycle += 1;
  return true;
}
