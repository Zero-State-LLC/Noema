/**
 * GC5-S0 relay bands on existing MESSAGE. Delivery only, not price.
 * Authority: Noema-Specs docs/GC5-FIRST-SLICE.md / RFC-0009.
 */

import { enrichEntity } from "./actions";

export const COMMUNICATION_CATALOG_ID = "communication-catalog/gc5-s0";
export const LONG_RANGE_MIN_CONDITION = 25;
export const UNREACHABLE_REASON = "UNREACHABLE";
export const UNREACHABLE_MESSAGE = "The destination cannot be reached.";

export type RelayLike = {
  entity_id: string;
  label: string;
  entity_type: string;
  condition?: number;
};

export function isRelayEntity(e: RelayLike): boolean {
  if ((e.entity_type || "").toUpperCase() !== "INFRASTRUCTURE") return false;
  const blob = `${e.entity_id} ${e.label}`.toLowerCase();
  return blob.includes("relay");
}

/** Maximum condition among live relays. None live → null (no path). */
export function bestLiveRelayCondition(relays: RelayLike[]): number | null {
  let best: number | null = null;
  for (const e of relays) {
    if (!isRelayEntity(e)) continue;
    const cond = typeof e.condition === "number" ? e.condition : 0;
    if (best === null || cond > best) best = cond;
  }
  return best;
}

export function longRangeDeliverable(
  best: number | null,
  min = LONG_RANGE_MIN_CONDITION,
): boolean {
  return best !== null && best >= min;
}

export function collectLiveRelays(
  rooms: Record<string, { entities?: RelayLike[] }>,
): RelayLike[] {
  const out: RelayLike[] = [];
  for (const room of Object.values(rooms || {})) {
    for (const e of room.entities || []) {
      const live = enrichEntity(e);
      if (isRelayEntity(live)) out.push(live);
    }
  }
  return out;
}
