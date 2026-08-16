/**
 * GC3-S0–S6 social memory. Derived, not WorldState.
 * Authority: Noema-Specs RFC-0007 / RFC-0022 / RFC-0034–0038.
 */

export const SOCIAL_MEMORY_CATALOG_ID = "social-memory-catalog/gc3-s0";
export const DANGER_MEMORY_CATALOG_ID = "social-memory-catalog/gc3-s1";
export const WATCH_PUBLIC_CATALOG_ID = "social-memory-catalog/gc3-s2";
export const INSTITUTION_MEMORY_CATALOG_ID = "social-memory-catalog/gc3-s3";
export const DECAY_CATALOG_ID = "social-memory-catalog/gc3-s4";
export const TRADE_CAUTION_CATALOG_ID = "social-memory-catalog/gc3-s5";
export const DECEPTIVE_MEMORY_CATALOG_ID = "social-memory-catalog/gc3-s6";
export const TRADED_THRESHOLD = 1;
export const RELIABLE_THRESHOLD = 3;
export const DANGER_THRESHOLD = 1;
export const DECAY_CYCLES = 12;
export const REHAB_TRADES = 3;
export const TRADE_CAUTION_EXTRA = 1;
export const TRADE_CAUTION_CODE = "TRADE_CAUTION";
export const DANGER_LINE = "You have found {name} dangerous.";
export const DECEPTIVE_LINE = "You have found {name} deceptive.";
export const PUBLIC_DANGER_LINE = "{name} is publicly dangerous.";
export const PUBLIC_DECEPTIVE_LINE = "{name} is publicly deceptive.";
export const CAUTION_LINE = "You proceed with caution toward {name}.";
export const MAX_SOCIAL_LINES = 3;
export const DANGER_EVIDENCE_EVENTS = ["CONTEST_RESOLVED", "AGREEMENT_BROKEN", "CRIME_DETECTED"] as const;
export const DANGER_IGNORED_EVENTS = ["TRADE_REJECTED", "CONTEST_DECLARED"] as const;
export const DECEPTIVE_EVIDENCE_EVENTS = ["AGREEMENT_BROKEN", "ATTEST"] as const;
export const DECEPTIVE_IGNORED_EVENTS = [
  "TRADE_REJECTED",
  "CONTEST_DECLARED",
  "CONTEST_RESOLVED",
  "MESSAGE",
] as const;

export type TradeMemoryState = {
  catalog_id: typeof SOCIAL_MEMORY_CATALOG_ID;
  /** object_player_id → distinct accepted trade_ids */
  edges: Record<string, string[]>;
  /** object → evidence id → cycle credited */
  at?: Record<string, Record<string, number>>;
};

export type DangerMemoryState = {
  catalog_id: typeof DANGER_MEMORY_CATALOG_ID;
  /** object_player_id → distinct danger evidence ids */
  edges: Record<string, string[]>;
  at?: Record<string, Record<string, number>>;
};

export type DeceptiveMemoryState = {
  catalog_id: typeof DECEPTIVE_MEMORY_CATALOG_ID;
  edges: Record<string, string[]>;
  at?: Record<string, Record<string, number>>;
};

export type InstitutionMemoryState = {
  catalog_id: typeof INSTITUTION_MEMORY_CATALOG_ID;
  trades: Record<string, string[]>;
  trade_at?: Record<string, Record<string, number>>;
  members: Record<string, "member" | "removed">;
  danger: Record<string, string[]>;
  danger_at?: Record<string, Record<string, number>>;
};

export type SocialLineOpts = {
  asOfCycle?: number;
  deceptive?: DeceptiveMemoryState | null;
  institutionLines?: string[];
  publicLines?: string[];
};

export type SocialEvent = {
  event_id: string;
  event_type: string;
  payload?: Record<string, unknown>;
};

export function emptyTradeMemory(): TradeMemoryState {
  return { catalog_id: SOCIAL_MEMORY_CATALOG_ID, edges: {}, at: {} };
}

export function emptyDangerMemory(): DangerMemoryState {
  return { catalog_id: DANGER_MEMORY_CATALOG_ID, edges: {}, at: {} };
}

export function emptyDeceptiveMemory(): DeceptiveMemoryState {
  return { catalog_id: DECEPTIVE_MEMORY_CATALOG_ID, edges: {}, at: {} };
}

export function emptyInstitutionMemory(): InstitutionMemoryState {
  return {
    catalog_id: INSTITUTION_MEMORY_CATALOG_ID,
    trades: {},
    trade_at: {},
    members: {},
    danger: {},
    danger_at: {},
  };
}

export function ensureTradeMemory(raw: TradeMemoryState | undefined | null): TradeMemoryState {
  if (!raw || raw.catalog_id !== SOCIAL_MEMORY_CATALOG_ID) return emptyTradeMemory();
  return {
    catalog_id: SOCIAL_MEMORY_CATALOG_ID,
    edges: { ...(raw.edges || {}) },
    at: { ...(raw.at || {}) },
  };
}

export function ensureDangerMemory(raw: DangerMemoryState | undefined | null): DangerMemoryState {
  if (!raw || raw.catalog_id !== DANGER_MEMORY_CATALOG_ID) return emptyDangerMemory();
  return {
    catalog_id: DANGER_MEMORY_CATALOG_ID,
    edges: { ...(raw.edges || {}) },
    at: { ...(raw.at || {}) },
  };
}

export function ensureDeceptiveMemory(raw: DeceptiveMemoryState | undefined | null): DeceptiveMemoryState {
  if (!raw || raw.catalog_id !== DECEPTIVE_MEMORY_CATALOG_ID) return emptyDeceptiveMemory();
  return {
    catalog_id: DECEPTIVE_MEMORY_CATALOG_ID,
    edges: { ...(raw.edges || {}) },
    at: { ...(raw.at || {}) },
  };
}

export function ensureInstitutionMemory(
  raw: InstitutionMemoryState | undefined | null,
): InstitutionMemoryState {
  if (!raw || raw.catalog_id !== INSTITUTION_MEMORY_CATALOG_ID) return emptyInstitutionMemory();
  return {
    catalog_id: INSTITUTION_MEMORY_CATALOG_ID,
    trades: { ...(raw.trades || {}) },
    trade_at: { ...(raw.trade_at || {}) },
    members: { ...(raw.members || {}) },
    danger: { ...(raw.danger || {}) },
    danger_at: { ...(raw.danger_at || {}) },
  };
}

function stampAt(
  at: Record<string, Record<string, number>> | undefined,
  other: string,
  id: string,
  cycle: number,
): Record<string, Record<string, number>> {
  const next = { ...(at || {}) };
  next[other] = { ...(next[other] || {}), [id]: cycle };
  return next;
}

export function creditAcceptedTrade(
  state: TradeMemoryState | undefined,
  otherPlayerId: string,
  tradeId: string,
  cycle = 0,
): TradeMemoryState {
  const next = ensureTradeMemory(state);
  if (!otherPlayerId || !tradeId || otherPlayerId === tradeId) return next;
  const ids = [...(next.edges[otherPlayerId] || [])];
  if (!ids.includes(tradeId)) ids.push(tradeId);
  next.edges[otherPlayerId] = ids;
  next.at = stampAt(next.at, otherPlayerId, tradeId, cycle);
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
  cycle = 0,
): DangerMemoryState {
  const next = ensureDangerMemory(state);
  if (!otherPlayerId || !evidenceId || otherPlayerId === evidenceId) return next;
  const ids = [...(next.edges[otherPlayerId] || [])];
  if (!ids.includes(evidenceId)) ids.push(evidenceId);
  next.edges[otherPlayerId] = ids;
  next.at = stampAt(next.at, otherPlayerId, evidenceId, cycle);
  return next;
}

export function creditDeceptiveEvidence(
  state: DeceptiveMemoryState | undefined,
  otherPlayerId: string,
  evidenceId: string,
  cycle = 0,
): DeceptiveMemoryState {
  const next = ensureDeceptiveMemory(state);
  if (!otherPlayerId || !evidenceId || otherPlayerId === evidenceId) return next;
  const ids = [...(next.edges[otherPlayerId] || [])];
  if (!ids.includes(evidenceId)) ids.push(evidenceId);
  next.edges[otherPlayerId] = ids;
  next.at = stampAt(next.at, otherPlayerId, evidenceId, cycle);
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

function lastCycle(at: Record<string, number> | undefined, ids: string[]): number | undefined {
  if (!ids.length) return undefined;
  let max = 0;
  let any = false;
  for (const id of ids) {
    const c = at?.[id];
    if (typeof c === "number") {
      any = true;
      if (c > max) max = c;
    }
  }
  return any ? max : 0;
}

function familyLive(
  ids: string[],
  at: Record<string, number> | undefined,
  asOfCycle: number | undefined,
): boolean {
  if (!ids.length) return false;
  if (asOfCycle === undefined) return true;
  const last = lastCycle(at, ids);
  if (last === undefined) return true;
  return asOfCycle - last < DECAY_CYCLES;
}

function rehabbedHostile(
  trade: TradeMemoryState,
  other: string,
  lastHostileCycle: number | undefined,
): boolean {
  if (lastHostileCycle === undefined) return false;
  const ids = trade.edges[other] || [];
  const at = trade.at?.[other] || {};
  const after = ids.filter((id) => (at[id] ?? 0) > lastHostileCycle);
  return after.length >= REHAB_TRADES;
}

export function socialMemoryLines(
  state: TradeMemoryState | undefined | null,
  names: Record<string, string | undefined>,
  danger?: DangerMemoryState | undefined | null,
  opts?: SocialLineOpts,
): string[] {
  const snap = ensureTradeMemory(state);
  const asOf = opts?.asOfCycle;
  const rows: Array<{ other: string; count: number; line: string }> = [];
  for (const [other, ids] of Object.entries(snap.edges)) {
    if (!familyLive(ids, snap.at?.[other], asOf)) continue;
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
    const lastH = lastCycle(dangerSnap.at?.[other], ids);
    if (rehabbedHostile(snap, other, lastH)) continue;
    if (!familyLive(ids, dangerSnap.at?.[other], asOf)) continue;
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

  const deceptiveSnap = ensureDeceptiveMemory(opts?.deceptive);
  const deceptiveRows: string[] = [];
  for (const [other, ids] of Object.entries(deceptiveSnap.edges)) {
    const lastH = lastCycle(deceptiveSnap.at?.[other], ids);
    if (rehabbedHostile(snap, other, lastH)) continue;
    if (!familyLive(ids, deceptiveSnap.at?.[other], asOf)) continue;
    if (ids.length < 1) continue;
    deceptiveRows.push(DECEPTIVE_LINE.replace("{name}", displayName(other, names)));
  }

  return [
    ...tradeLines,
    ...dangerRows.map((r) => r.line),
    ...deceptiveRows,
    ...(opts?.institutionLines || []),
    ...(opts?.publicLines || []),
  ];
}

export function liveHostileToward(
  danger: DangerMemoryState | undefined | null,
  deceptive: DeceptiveMemoryState | undefined | null,
  trade: TradeMemoryState | undefined | null,
  otherId: string,
  asOfCycle?: number,
): boolean {
  const d = ensureDangerMemory(danger);
  const dec = ensureDeceptiveMemory(deceptive);
  const tr = ensureTradeMemory(trade);
  const dIds = d.edges[otherId] || [];
  const decIds = dec.edges[otherId] || [];
  const dLast = lastCycle(d.at?.[otherId], dIds);
  const decLast = lastCycle(dec.at?.[otherId], decIds);
  const dangerLive = dIds.length > 0 && familyLive(dIds, d.at?.[otherId], asOfCycle) && !rehabbedHostile(tr, otherId, dLast);
  const deceptiveLive =
    decIds.length > 0 && familyLive(decIds, dec.at?.[otherId], asOfCycle) && !rehabbedHostile(tr, otherId, decLast);
  return dangerLive || deceptiveLive;
}

export function liveReliableToward(
  trade: TradeMemoryState | undefined | null,
  otherId: string,
  asOfCycle?: number,
): boolean {
  const tr = ensureTradeMemory(trade);
  const ids = tr.edges[otherId] || [];
  return ids.length >= RELIABLE_THRESHOLD && familyLive(ids, tr.at?.[otherId], asOfCycle);
}

export function liveInstitutionReliableToward(
  state: InstitutionMemoryState | undefined | null,
  otherId: string,
  asOfCycle?: number,
): boolean {
  const snap = ensureInstitutionMemory(state);
  const ids = snap.trades[otherId] || [];
  return ids.length >= RELIABLE_THRESHOLD && familyLive(ids, snap.trade_at?.[otherId], asOfCycle);
}

export function tradeCautionCost(liveHostile: boolean, liveReliable = false): {
  extra_compute: number;
  auto_reject: false;
  auto_accept: false;
  reason_code: string | null;
  total_compute: number;
} {
  const extra = liveHostile && !liveReliable ? TRADE_CAUTION_EXTRA : 0;
  return {
    extra_compute: extra,
    auto_reject: false,
    auto_accept: false,
    reason_code: extra ? TRADE_CAUTION_CODE : null,
    total_compute: 1 + extra,
  };
}

function attestContradictionCredits(events: SocialEvent[]): Array<{ other_id: string; evidence_id: string }> {
  const groups = new Map<string, SocialEvent[]>();
  for (const ev of events) {
    if (ev.event_type !== "ATTEST") continue;
    const p = ev.payload || {};
    if (p.visibility && p.visibility !== "PUBLIC") continue;
    const sid = typeof p.subject_entity_id === "string" ? p.subject_entity_id : "";
    if (!sid) continue;
    const list = groups.get(sid) || [];
    list.push(ev);
    groups.set(sid, list);
  }
  const out: Array<{ other_id: string; evidence_id: string }> = [];
  for (const group of groups.values()) {
    const ordered = [...group].sort((a, b) => String(a.event_id).localeCompare(String(b.event_id)));
    for (let i = 0; i < ordered.length; i += 1) {
      const later = ordered[i];
      const laterClaim = later.payload?.archive_claim;
      const laterId = later.event_id;
      if (!laterClaim || !laterId) continue;
      for (const earlier of ordered.slice(0, i)) {
        const earlyClaim = earlier.payload?.archive_claim;
        const attester = earlier.payload?.attester_id;
        if (typeof attester === "string" && earlyClaim && earlyClaim !== laterClaim) {
          out.push({ other_id: attester, evidence_id: laterId });
          break;
        }
      }
    }
  }
  return out;
}

export function creditsFromDeceptiveEvent(
  ev: SocialEvent,
  allEvents: SocialEvent[] = [],
): Array<{ player_id: string; other_id: string; evidence_id: string }> {
  const et = ev.event_type;
  if ((DECEPTIVE_IGNORED_EVENTS as readonly string[]).includes(et)) return [];
  if (et === "AGREEMENT_BROKEN") {
    return creditsFromDangerEvent(ev).map((c) => ({
      player_id: c.player_id,
      other_id: c.other_id,
      evidence_id: c.evidence_id,
    }));
  }
  if (et === "ATTEST") {
    const hits = attestContradictionCredits(allEvents.length ? allEvents : [ev]);
    return hits.map((h) => ({ player_id: "*", other_id: h.other_id, evidence_id: h.evidence_id }));
  }
  return [];
}

export function watchPublicDescriptorLines(
  events: SocialEvent[],
  names: Record<string, string | undefined>,
): string[] {
  const dangerous = new Map<string, Set<string>>();
  const deceptive = new Map<string, Set<string>>();
  const seen = new Set<string>();
  for (const ev of events) {
    const et = ev.event_type;
    const p = ev.payload || {};
    if (et === "TRADE_ACCEPTED" || et === "TRADE_REJECTED" || et === "MESSAGE" || et === "CONTEST_DECLARED") {
      continue;
    }
    if (et === "CONTEST_RESOLVED") {
      const evidence = (typeof p.contest_id === "string" && p.contest_id) || ev.event_id;
      const actor = typeof p.declarer_id === "string" ? p.declarer_id : "";
      if (evidence && actor && !seen.has(evidence)) {
        seen.add(evidence);
        const set = dangerous.get(actor) || new Set();
        set.add(evidence);
        dangerous.set(actor, set);
      }
    } else if (et === "CRIME_DETECTED" && p.visibility === "PUBLIC") {
      const evidence = (typeof p.detection_id === "string" && p.detection_id) || ev.event_id;
      const actor = typeof p.subject_id === "string" ? p.subject_id : "";
      if (evidence && actor && !seen.has(evidence)) {
        seen.add(evidence);
        const set = dangerous.get(actor) || new Set();
        set.add(evidence);
        dangerous.set(actor, set);
      }
    } else if (et === "AGREEMENT_BROKEN" && p.visibility === "PUBLIC") {
      const evidence = (typeof p.breach_id === "string" && p.breach_id) || ev.event_id;
      const actor = typeof p.broken_by === "string" ? p.broken_by : "";
      if (evidence && actor && !seen.has(evidence)) {
        seen.add(evidence);
        const set = deceptive.get(actor) || new Set();
        set.add(evidence);
        deceptive.set(actor, set);
      }
    }
  }
  for (const hit of attestContradictionCredits(events)) {
    if (seen.has(hit.evidence_id)) continue;
    seen.add(hit.evidence_id);
    const set = deceptive.get(hit.other_id) || new Set();
    set.add(hit.evidence_id);
    deceptive.set(hit.other_id, set);
  }
  const lines: string[] = [];
  const actors = [...new Set([...dangerous.keys(), ...deceptive.keys()])].sort();
  for (const actor of actors) {
    const name = displayName(actor, names);
    if (dangerous.has(actor)) lines.push(PUBLIC_DANGER_LINE.replace("{name}", name));
    if (deceptive.has(actor)) lines.push(PUBLIC_DECEPTIVE_LINE.replace("{name}", name));
  }
  return lines;
}

export function creditInstitutionTrade(
  state: InstitutionMemoryState | undefined,
  playerId: string,
  tradeId: string,
  cycle = 0,
): InstitutionMemoryState {
  const next = ensureInstitutionMemory(state);
  if (!playerId || !tradeId) return next;
  const ids = [...(next.trades[playerId] || [])];
  if (!ids.includes(tradeId)) ids.push(tradeId);
  next.trades[playerId] = ids;
  next.trade_at = stampAt(next.trade_at, playerId, tradeId, cycle);
  return next;
}

export function creditInstitutionMember(
  state: InstitutionMemoryState | undefined,
  playerId: string,
  status: "member" | "removed",
): InstitutionMemoryState {
  const next = ensureInstitutionMemory(state);
  if (!playerId) return next;
  next.members[playerId] = status;
  return next;
}

export function creditInstitutionDanger(
  state: InstitutionMemoryState | undefined,
  playerId: string,
  evidenceId: string,
  cycle = 0,
): InstitutionMemoryState {
  const next = ensureInstitutionMemory(state);
  if (!playerId || !evidenceId) return next;
  const ids = [...(next.danger[playerId] || [])];
  if (!ids.includes(evidenceId)) ids.push(evidenceId);
  next.danger[playerId] = ids;
  next.danger_at = stampAt(next.danger_at, playerId, evidenceId, cycle);
  return next;
}

export function institutionMemoryLines(
  state: InstitutionMemoryState | undefined | null,
  orgName: string,
  viewerRole: "officer" | "member" | "other",
  viewerId: string,
  names: Record<string, string | undefined>,
  asOfCycle?: number,
): string[] {
  if (viewerRole === "other") return [];
  const snap = ensureInstitutionMemory(state);
  const lines: string[] = [];
  const emit = (other: string, template: string) => {
    if (viewerRole === "member" && other !== viewerId) return;
    const name = displayName(other, names);
    lines.push(template.replace("{org}", orgName).replace("{name}", name));
  };
  for (const [other, ids] of Object.entries(snap.trades)) {
    if (!familyLive(ids, snap.trade_at?.[other], asOfCycle)) continue;
    if (ids.length >= RELIABLE_THRESHOLD) emit(other, "{org} has found {name} reliable in trade.");
    else if (ids.length >= TRADED_THRESHOLD) emit(other, "{org} has traded with {name}.");
  }
  for (const [other, status] of Object.entries(snap.members)) {
    emit(other, status === "member" ? "{org} records {name} as a member." : "{org} records {name} as removed.");
  }
  for (const [other, ids] of Object.entries(snap.danger)) {
    if (!familyLive(ids, snap.danger_at?.[other], asOfCycle)) continue;
    if (ids.length) emit(other, "{org} records {name} as dangerous.");
  }
  return lines;
}

export function liveInstitutionHostileToward(
  state: InstitutionMemoryState | undefined | null,
  otherId: string,
  asOfCycle?: number,
): boolean {
  const snap = ensureInstitutionMemory(state);
  const ids = snap.danger[otherId] || [];
  return ids.length > 0 && familyLive(ids, snap.danger_at?.[otherId], asOfCycle);
}
