/**
 * GC3-S0 dyadic trade memory + GC3-S1 danger edges. Derived, not WorldState.
 * Authority: Noema-Specs RFC-0007 / RFC-0022.
 */

export const SOCIAL_MEMORY_CATALOG_ID = "social-memory-catalog/gc3-s0";
export const DANGER_MEMORY_CATALOG_ID = "social-memory-catalog/gc3-s1";
export const TRADED_THRESHOLD = 1;
export const RELIABLE_THRESHOLD = 3;
export const DANGER_THRESHOLD = 1;
export const DANGER_LINE = "You have found {name} dangerous.";
export const MAX_SOCIAL_LINES = 3;
export const DANGER_EVIDENCE_EVENTS = ["CONTEST_RESOLVED", "AGREEMENT_BROKEN", "CRIME_DETECTED"] as const;
export const DANGER_IGNORED_EVENTS = ["TRADE_REJECTED", "CONTEST_DECLARED"] as const;

export type TradeMemoryState = {
  catalog_id: typeof SOCIAL_MEMORY_CATALOG_ID;
  /** object_player_id → distinct accepted trade_ids */
  edges: Record<string, string[]>;
};

export type DangerMemoryState = {
  catalog_id: typeof DANGER_MEMORY_CATALOG_ID;
  /** object_player_id → distinct danger evidence ids */
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

export function emptyDangerMemory(): DangerMemoryState {
  return { catalog_id: DANGER_MEMORY_CATALOG_ID, edges: {} };
}

export function ensureTradeMemory(raw: TradeMemoryState | undefined | null): TradeMemoryState {
  if (!raw || raw.catalog_id !== SOCIAL_MEMORY_CATALOG_ID) return emptyTradeMemory();
  return { catalog_id: SOCIAL_MEMORY_CATALOG_ID, edges: { ...(raw.edges || {}) } };
}

export function ensureDangerMemory(raw: DangerMemoryState | undefined | null): DangerMemoryState {
  if (!raw || raw.catalog_id !== DANGER_MEMORY_CATALOG_ID) return emptyDangerMemory();
  return { catalog_id: DANGER_MEMORY_CATALOG_ID, edges: { ...(raw.edges || {}) } };
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

export function creditDangerEvidence(
  state: DangerMemoryState | undefined,
  otherPlayerId: string,
  evidenceId: string,
): DangerMemoryState {
  const next = ensureDangerMemory(state);
  if (!otherPlayerId || !evidenceId || otherPlayerId === evidenceId) return next;
  const ids = [...(next.edges[otherPlayerId] || [])];
  if (!ids.includes(evidenceId)) ids.push(evidenceId);
  next.edges[otherPlayerId] = ids;
  return next;
}

function strField(payload: Record<string, unknown> | undefined, key: string): string | null {
  const v = payload?.[key];
  return typeof v === "string" && v.length ? v : null;
}

/** Victim → actor credits from contest/breach/crime events. TRADE_REJECTED and CONTEST_DECLARED ignored. */
export function creditsFromDangerEvent(
  ev: SocialEvent,
): Array<{ player_id: string; other_id: string; evidence_id: string }> {
  const et = ev.event_type;
  if ((DANGER_IGNORED_EVENTS as readonly string[]).includes(et)) return [];
  if (!(DANGER_EVIDENCE_EVENTS as readonly string[]).includes(et)) return [];
  const payload = ev.payload || {};
  const out: Array<{ player_id: string; other_id: string; evidence_id: string }> = [];
  if (et === "CONTEST_RESOLVED") {
    if (payload.outcome === "ABORTED") return [];
    const evidence = strField(payload, "contest_id") || ev.event_id;
    const declarer = strField(payload, "declarer_id");
    const victims = new Set<string>();
    const defender = strField(payload, "defender_id");
    if (defender) victims.add(defender);
    const target = payload.target;
    if (target && typeof target === "object" && !Array.isArray(target)) {
      const t = target as Record<string, unknown>;
      if (t.kind === "AGENT" && typeof t.agent_id === "string" && t.agent_id) {
        victims.add(t.agent_id);
      }
    }
    if (evidence && declarer) {
      for (const victim of victims) {
        if (victim !== declarer) {
          out.push({ player_id: victim, other_id: declarer, evidence_id: evidence });
        }
      }
    }
    return out;
  }
  if (et === "AGREEMENT_BROKEN") {
    const evidence = strField(payload, "breach_id") || ev.event_id;
    const broken = strField(payload, "broken_by");
    const parties = payload.party_ids;
    if (!evidence || !broken || !Array.isArray(parties)) return [];
    for (const party of parties) {
      if (typeof party === "string" && party && party !== broken) {
        out.push({ player_id: party, other_id: broken, evidence_id: evidence });
      }
    }
    return out;
  }
  if (et === "CRIME_DETECTED") {
    const evidence = strField(payload, "detection_id") || ev.event_id;
    const victim = strField(payload, "victim_id");
    const subject = strField(payload, "subject_id");
    if (evidence && victim && subject && victim !== subject) {
      out.push({ player_id: victim, other_id: subject, evidence_id: evidence });
    }
  }
  return out;
}

function displayName(other: string, names: Record<string, string | undefined>): string {
  return (names[other] || other.replace(/^player\./, "")).trim() || other;
}

export function socialMemoryLines(
  state: TradeMemoryState | undefined | null,
  names: Record<string, string | undefined>,
  danger?: DangerMemoryState | undefined | null,
): string[] {
  const snap = ensureTradeMemory(state);
  const rows: Array<{ other: string; count: number; line: string }> = [];
  for (const [other, ids] of Object.entries(snap.edges)) {
    const count = ids.length;
    if (count < TRADED_THRESHOLD) continue;
    const name = displayName(other, names);
    const line =
      count >= RELIABLE_THRESHOLD
        ? `You have found ${name} reliable in trade.`
        : `You have traded with ${name}.`;
    rows.push({ other, count, line });
  }
  rows.sort((a, b) => b.count - a.count || a.other.localeCompare(b.other));
  const tradeLines = rows.slice(0, MAX_SOCIAL_LINES).map((r) => r.line);

  const dangerSnap = ensureDangerMemory(danger);
  const dangerRows: Array<{ other: string; count: number; line: string }> = [];
  for (const [other, ids] of Object.entries(dangerSnap.edges)) {
    const count = ids.length;
    if (count < DANGER_THRESHOLD) continue;
    const name = displayName(other, names);
    dangerRows.push({
      other,
      count,
      line: DANGER_LINE.replace("{name}", name),
    });
  }
  dangerRows.sort((a, b) => b.count - a.count || a.other.localeCompare(b.other));
  return [...tradeLines, ...dangerRows.map((r) => r.line)];
}
