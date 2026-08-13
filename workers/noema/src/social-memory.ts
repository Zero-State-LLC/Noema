/**
 * GC3-S0 dyadic trade memory. Derived, not WorldState.
 * Authority: Noema-Specs docs/GC3-FIRST-SLICE.md / RFC-0007.
 */

export const SOCIAL_MEMORY_CATALOG_ID = "social-memory-catalog/gc3-s0";
export const TRADED_THRESHOLD = 1;
export const RELIABLE_THRESHOLD = 3;
export const MAX_SOCIAL_LINES = 3;

export type TradeMemoryState = {
  catalog_id: typeof SOCIAL_MEMORY_CATALOG_ID;
  /** object_player_id → distinct accepted trade_ids */
  edges: Record<string, string[]>;
};

export type SocialEvent = {
  event_id: string;
  event_type: string;
  payload?: Record<string, unknown>;
};

export function emptyTradeMemory(): TradeMemoryState {
  return { catalog_id: SOCIAL_MEMORY_CATALOG_ID, edges: {} };
}

export function ensureTradeMemory(raw: TradeMemoryState | undefined | null): TradeMemoryState {
  if (!raw || raw.catalog_id !== SOCIAL_MEMORY_CATALOG_ID) return emptyTradeMemory();
  return { catalog_id: SOCIAL_MEMORY_CATALOG_ID, edges: { ...(raw.edges || {}) } };
}

export function creditAcceptedTrade(
  state: TradeMemoryState | undefined,
  otherPlayerId: string,
  tradeId: string,
): TradeMemoryState {
  const next = ensureTradeMemory(state);
  if (!otherPlayerId || !tradeId || otherPlayerId === tradeId) return next;
  const ids = [...(next.edges[otherPlayerId] || [])];
  if (!ids.includes(tradeId)) ids.push(tradeId);
  next.edges[otherPlayerId] = ids;
  return next;
}

/** Credit both parties on TRADE_ACCEPTED. */
export function creditsFromTradeAccepted(
  ev: SocialEvent,
  trades: Record<string, { proposer_id: string; counterparty_id: string }>,
): Array<{ player_id: string; other_id: string; trade_id: string }> {
  if (ev.event_type !== "TRADE_ACCEPTED") return [];
  const tradeId = ev.payload?.trade_id;
  if (typeof tradeId !== "string") return [];
  const trade = trades[tradeId];
  if (!trade?.proposer_id || !trade.counterparty_id) return [];
  if (trade.proposer_id === trade.counterparty_id) return [];
  return [
    { player_id: trade.proposer_id, other_id: trade.counterparty_id, trade_id: tradeId },
    { player_id: trade.counterparty_id, other_id: trade.proposer_id, trade_id: tradeId },
  ];
}

export function socialMemoryLines(
  state: TradeMemoryState | undefined | null,
  names: Record<string, string | undefined>,
): string[] {
  const snap = ensureTradeMemory(state);
  const rows: Array<{ other: string; count: number; line: string }> = [];
  for (const [other, ids] of Object.entries(snap.edges)) {
    const count = ids.length;
    if (count < TRADED_THRESHOLD) continue;
    const name = (names[other] || other.replace(/^player\./, "")).trim() || other;
    const line =
      count >= RELIABLE_THRESHOLD
        ? `You have found ${name} reliable in trade.`
        : `You have traded with ${name}.`;
    rows.push({ other, count, line });
  }
  rows.sort((a, b) => b.count - a.count || a.other.localeCompare(b.other));
  return rows.slice(0, MAX_SOCIAL_LINES).map((r) => r.line);
}
