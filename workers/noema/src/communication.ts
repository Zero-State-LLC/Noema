/**
 * GC5-S0 relay bands on existing MESSAGE. Delivery only, not price.
 * Authority: Noema-Specs docs/GC5-FIRST-SLICE.md / RFC-0009.
 */

import { enrichEntity } from "./actions";

export const COMMUNICATION_CATALOG_ID = "communication-catalog/gc5-s12";
/** GC5-S9. Last public shout drops after this many committed cycles. */
export const SHOUT_EXPIRE_AFTER_CYCLES = 1;
/** GC5-S10. Public board notices drop after this many committed cycles. */
export const BOARD_EXPIRE_AFTER_CYCLES = 1;
/** GC5-S11. Occupied institution notice drops after this many committed cycles. */
export const NOTICE_EXPIRE_AFTER_CYCLES = 1;
/** GC5-S12. Last org channel note drops after this many committed cycles. */
export const CHANNEL_EXPIRE_AFTER_CYCLES = 1;
export const LONG_RANGE_MIN_CONDITION = 25;
export const SAME_CYCLE_MIN_CONDITION = 50;
export const DELAY_CYCLES = 1;
export const UNREACHABLE_REASON = "UNREACHABLE";
export const UNREACHABLE_MESSAGE = "The destination cannot be reached.";
export const DELAYED_MESSAGE = "Message sent. Delivery is delayed.";

export type LongRangeBand = "UNREACHABLE" | "DELAYED" | "IMMEDIATE";

export function longRangeBand(
  best: number | null,
  failBelow = LONG_RANGE_MIN_CONDITION,
  immediateAt = SAME_CYCLE_MIN_CONDITION,
): LongRangeBand {
  if (best === null || best < failBelow) return "UNREACHABLE";
  if (best < immediateAt) return "DELAYED";
  return "IMMEDIATE";
}

export type RelayLike = {
  entity_id: string;
  label: string;
  entity_type: string;
  condition?: number;
  in_progress?: boolean;
};

export function isRelayEntity(e: RelayLike): boolean {
  if ((e.entity_type || "").toUpperCase() !== "INFRASTRUCTURE") return false;
  if (e.in_progress === true) return false;
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
  return longRangeBand(best, min) !== "UNREACHABLE";
}

export type PendingMessage = {
  message_id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
  sent_cycle: number;
  deliver_at_cycle: number;
  claim?: import("./rumor").ClaimPayload;
};

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
