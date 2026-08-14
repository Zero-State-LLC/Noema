/**
 * GC5-S2 rumor provenance. Claim + MESSAGE lineage, not truth.
 * Authority: Noema-Specs docs/GC5-S2-RUMOR.md / RFC-0028.
 */

export const RUMOR_CATALOG_ID = "communication-catalog/gc5-s2";
export const STALE_AFTER_CYCLES = 8;
export const WATCH_REPORT_PULSE = "A report is circulating.";
export const WATCH_CONFLICT_PULSE = "Conflicting accounts are circulating.";

export type ClaimOriginClass = "PLAYER_MESSAGE" | "INSTITUTION_NOTICE" | "RECONSTRUCTION";
export type ClaimVisibility = "PRIVATE" | "INSTITUTIONAL" | "PUBLIC";
export type ClaimEpistemic = "REPORTED" | "CORROBORATED" | "CONTESTED" | "STALE";

export type ClaimRecord = {
  claim_id: string;
  originator_ref: string;
  subject_ref?: string;
  content: string;
  created_cycle: number;
  derived_from?: string;
  origin_class: ClaimOriginClass;
  visibility: ClaimVisibility;
  origin_claim_id: string;
};

export type TransmissionRecord = {
  transmission_id: string;
  claim_id: string;
  sender_ref: string;
  recipient_ref: string;
  message_id: string;
  parent_transmission_id?: string;
  received_cycle: number;
};

export type RumorState = {
  catalog_id: typeof RUMOR_CATALOG_ID;
  claims: Record<string, ClaimRecord>;
  transmissions: TransmissionRecord[];
  holders: Record<string, string[]>;
};

export function emptyRumor(): RumorState {
  return { catalog_id: RUMOR_CATALOG_ID, claims: {}, transmissions: [], holders: {} };
}

export function ensureRumor(raw: RumorState | undefined | null): RumorState {
  if (!raw || raw.catalog_id !== RUMOR_CATALOG_ID) return emptyRumor();
  return {
    catalog_id: RUMOR_CATALOG_ID,
    claims: { ...(raw.claims || {}) },
    transmissions: Array.isArray(raw.transmissions) ? raw.transmissions.slice() : [],
    holders: { ...(raw.holders || {}) },
  };
}

export function normalizeClaimText(text: string): string {
  return String(text || "").trim().replace(/\s+/g, " ");
}

export function allocateClaimId(): string {
  return `claim.${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function holdsClaim(state: RumorState, playerId: string, claimId: string): boolean {
  return (state.holders[playerId] || []).includes(claimId);
}

function grantHold(state: RumorState, playerId: string, claimId: string): void {
  const have = state.holders[playerId] || [];
  if (!have.includes(claimId)) state.holders[playerId] = [...have, claimId];
}

export function rememberClaim(state: RumorState, claim: ClaimRecord, holderId: string): void {
  state.claims[claim.claim_id] = claim;
  grantHold(state, holderId, claim.claim_id);
}

export function recordTransmission(state: RumorState, tx: TransmissionRecord): void {
  if (state.transmissions.some((t) => t.message_id === tx.message_id)) return;
  state.transmissions.push(tx);
  grantHold(state, tx.recipient_ref, tx.claim_id);
}

export function latestTransmissionTo(
  state: RumorState,
  claimId: string,
  recipientId: string,
): TransmissionRecord | undefined {
  return [...state.transmissions]
    .reverse()
    .find((t) => t.claim_id === claimId && t.recipient_ref === recipientId);
}

export function resolveRetell(
  state: RumorState,
  senderId: string,
  parentClaimId: string | undefined,
  text: string,
  cycle: number,
):
  | { ok: true; claim: ClaimRecord; same_claim: boolean; derived: boolean }
  | { ok: false; code: "NOT_FOUND" } {
  const content = normalizeClaimText(text);
  if (!parentClaimId) {
    return { ok: false, code: "NOT_FOUND" };
  }
  const parent = state.claims[parentClaimId];
  if (!parent || !holdsClaim(state, senderId, parentClaimId)) {
    return { ok: false, code: "NOT_FOUND" };
  }
  if (normalizeClaimText(parent.content) === content) {
    return { ok: true, claim: parent, same_claim: true, derived: false };
  }
  const claim_id = allocateClaimId();
  const derived: ClaimRecord = {
    claim_id,
    originator_ref: senderId,
    subject_ref: parent.subject_ref,
    content,
    created_cycle: cycle,
    derived_from: parent.claim_id,
    origin_class: "PLAYER_MESSAGE",
    visibility: parent.visibility,
    origin_claim_id: parent.origin_claim_id,
  };
  return { ok: true, claim: derived, same_claim: false, derived: true };
}

export function epistemicFor(
  state: RumorState,
  claim: ClaimRecord,
  cycle: number,
): ClaimEpistemic {
  if (cycle - claim.created_cycle >= STALE_AFTER_CYCLES) return "STALE";
  if (!claim.subject_ref) return "REPORTED";
  const peers = Object.values(state.claims).filter((c) => c.subject_ref === claim.subject_ref);
  const roots = new Set(peers.map((c) => c.origin_claim_id));
  if (roots.size < 2) return "REPORTED";
  const same = peers.filter((c) => normalizeClaimText(c.content) === normalizeClaimText(claim.content));
  const sameRoots = new Set(same.map((c) => c.origin_claim_id));
  if (sameRoots.size >= 2) return "CORROBORATED";
  return "CONTESTED";
}

export function independentSourceCount(state: RumorState, claimId: string): number {
  const claim = state.claims[claimId];
  if (!claim?.subject_ref) return 1;
  const peers = Object.values(state.claims).filter((c) => c.subject_ref === claim.subject_ref);
  return new Set(peers.map((c) => c.origin_claim_id)).size;
}

export function rumorLines(
  state: RumorState | undefined | null,
  playerId: string,
  cycle: number,
  handles: Record<string, string | undefined>,
): string[] {
  const snap = ensureRumor(state);
  const ids = snap.holders[playerId] || [];
  const lines: string[] = [];
  for (const id of ids) {
    const claim = snap.claims[id];
    if (!claim) continue;
    const label = epistemicFor(snap, claim, cycle);
    const sender = latestTransmissionTo(snap, id, playerId)?.sender_ref;
    const from = sender ? handles[sender] || sender : "an unknown source";
    if (sender) {
      lines.push(`You heard a report from ${from}.`);
    } else {
      lines.push("You originated a report.");
    }
    if (label === "STALE") lines.push("This report is from an earlier cycle.");
    if (label === "CONTESTED") lines.push("Accounts of this differ.");
    if (label === "CORROBORATED") lines.push("Another independent report agrees.");
  }
  return [...new Set(lines)].slice(0, 6);
}

export function publicRumorPulses(state: RumorState | undefined | null): string[] {
  const snap = ensureRumor(state);
  const pub = Object.values(snap.claims).filter(
    (c) => c.visibility === "PUBLIC" || c.visibility === "INSTITUTIONAL",
  );
  if (!pub.length) return [];
  const pulses = [WATCH_REPORT_PULSE];
  const bySubject = new Map<string, ClaimRecord[]>();
  for (const c of pub) {
    if (!c.subject_ref) continue;
    const list = bySubject.get(c.subject_ref) || [];
    list.push(c);
    bySubject.set(c.subject_ref, list);
  }
  for (const list of bySubject.values()) {
    const roots = new Set(list.map((c) => c.origin_claim_id));
    const texts = new Set(list.map((c) => normalizeClaimText(c.content)));
    if (roots.size >= 2 && texts.size >= 2) {
      pulses.push(WATCH_CONFLICT_PULSE);
      break;
    }
  }
  return pulses;
}

export type ClaimPayload = {
  claim_id: string;
  originator_ref: string;
  subject_ref?: string;
  content: string;
  created_cycle: number;
  derived_from?: string;
  origin_class: ClaimOriginClass;
  visibility: ClaimVisibility;
  origin_claim_id: string;
  parent_transmission_id?: string;
};
