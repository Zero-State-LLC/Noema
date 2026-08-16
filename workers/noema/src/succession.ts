/**
 * GC4-S4 designated institutional succession.
 * Authority: Noema-Specs docs/GC4-S4-SUCCESSION.md / RFC-0031.
 * No implicit jump. No identity / ownership / controller transfer.
 */

import type { EmergencyScope } from "./emergency";
import type { OfficeRecord } from "./offices";

export const MAX_SUCCESSORS = 2;
export const WATCH_SUCCESSION_PULSE = "A designated successor has taken an institution office.";

export const RULE_MEMBER_ORDER = "MEMBER_ORDER" as const;
export const RULE_INHERITED = "INHERITED_BY_ORGANIZATION" as const;
export type SuccessionRuleId = typeof RULE_MEMBER_ORDER | typeof RULE_INHERITED;

export type SuccessionRule = {
  successors?: string[];
  rule_id?: SuccessionRuleId;
  designated_by: string;
  designated_cycle: number;
};

type OrgLike = {
  status?: string;
  members?: Array<{ agent_id: string }>;
};

export function parseSuccessorList(raw: unknown, fallback?: string): string[] {
  const out: string[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const id = String(item || "").trim();
      if (id && !out.includes(id)) out.push(id);
    }
  }
  const extra = String(fallback || "").trim();
  if (extra && !out.includes(extra)) out.push(extra);
  return out.slice(0, MAX_SUCCESSORS);
}

export function eligibleSuccessor(
  successors: string[] | undefined,
  org: OrgLike,
  players: Record<string, unknown> | undefined,
  departedId: string,
  extra?: (id: string) => boolean,
): string | null {
  if (org.status !== "ACTIVE") return null;
  for (const id of successors || []) {
    if (!id || id === departedId) continue;
    if (!players?.[id]) continue;
    if (!(org.members || []).some((m) => m.agent_id === id)) continue;
    if (extra && !extra(id)) continue;
    return id;
  }
  return null;
}

export function parseSuccessionRuleId(raw: unknown): SuccessionRuleId | null {
  const t = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[-\s]+/g, "_");
  if (t === RULE_MEMBER_ORDER) return RULE_MEMBER_ORDER;
  if (t === RULE_INHERITED || t === "INHERITED" || t === "INHERIT") return RULE_INHERITED;
  return null;
}

export function eligibleMemberOrder(
  org: OrgLike,
  players: Record<string, unknown> | undefined,
  departedId: string,
  extra?: (id: string) => boolean,
): string | null {
  if (org.status !== "ACTIVE") return null;
  for (const m of org.members || []) {
    const id = m.agent_id;
    if (!id || id === departedId) continue;
    if (!players?.[id]) continue;
    if (extra && !extra(id)) continue;
    return id;
  }
  return null;
}

export function activateOfficeSuccession(
  office: OfficeRecord,
  org: OrgLike,
  players: Record<string, unknown> | undefined,
  departedId: string,
  cycle: number,
  extra?: (id: string) => boolean,
): { holder_player_id: string } | null {
  if (office.status !== "VACANT") return null;
  if (office.succession?.rule_id === RULE_INHERITED) return null;
  const designated = office.succession?.successors || [];
  const id = designated.length
    ? eligibleSuccessor(designated, org, players, departedId, extra)
    : office.succession?.rule_id === RULE_MEMBER_ORDER
      ? eligibleMemberOrder(org, players, departedId, extra)
      : null;
  if (!id) return null;
  office.holder_player_id = id;
  office.status = "OCCUPIED";
  office.history.push({ cycle, holder_player_id: id, kind: "ASSIGNED" });
  return { holder_player_id: id };
}

export type OfficeConsent = { member_id: string; candidate_id: string };

export function consensusThreshold(memberCount: number): number {
  if (memberCount <= 0) return 1;
  return Math.ceil(memberCount / 2);
}

export function recordConsent(
  consents: OfficeConsent[] | undefined,
  memberId: string,
  candidateId: string,
): OfficeConsent[] {
  const rest = (consents || []).filter((c) => c.member_id !== memberId);
  return [...rest, { member_id: memberId, candidate_id: candidateId }];
}

export function consentWinner(
  consents: OfficeConsent[] | undefined,
  memberIds: string[],
): string | null {
  const live = new Set(memberIds);
  const counts: Record<string, number> = {};
  for (const c of consents || []) {
    if (!live.has(c.member_id) || !live.has(c.candidate_id)) continue;
    counts[c.candidate_id] = (counts[c.candidate_id] || 0) + 1;
  }
  const need = consensusThreshold(memberIds.length);
  const winners = Object.keys(counts).filter((id) => (counts[id] || 0) >= need);
  if (winners.length !== 1) return null;
  return winners[0];
}

export function activateEmergencySuccession(
  scope: EmergencyScope,
  org: OrgLike,
  players: Record<string, unknown> | undefined,
  departedId: string,
  cycle: number,
): { holder_player_id: string } | null {
  if (scope.status !== "ACTIVE" || scope.holder_player_id !== departedId) return null;
  if (cycle >= scope.end_cycle) return null;
  const id = eligibleSuccessor(scope.succession?.successors, org, players, departedId);
  if (!id) return null;
  scope.holder_player_id = id;
  return { holder_player_id: id };
}
