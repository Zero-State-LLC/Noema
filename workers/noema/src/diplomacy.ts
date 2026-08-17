/**
 * Diplomacy S0–S2. Five agreement types, terminate, live effects, help.
 * Authority: Noema-Specs docs/DIPLOMACY-S2.md / RFC-0100.
 */

export const DIPLOMACY_CATALOG_ID = "diplomacy-catalog/s2";
export const AGREEMENT_FORM_COST = { compute: 2, influence: 1 } as const;
export const AGREEMENT_TERMINATE_COST = { compute: 1 } as const;
export const DEFAULT_DEFENSE_MILLIPOINTS = 50;
export const DEFAULT_COMMITMENT_AMOUNT = 1;
export const DEFAULT_COMMITMENT_CYCLES = 5;
export const AGREEMENT_TYPES = [
  "TRADE",
  "NON_AGGRESSION",
  "ACCESS",
  "RESOURCE_COMMITMENT",
  "MUTUAL_DEFENSE",
] as const;
export const NA_FORBIDDEN_FORMS = [
  "RESOURCE_SEIZURE",
  "INFRASTRUCTURE_DISRUPTION",
  "ACCESS_CONTEST",
  "PRESENCE_PRESSURE",
] as const;
export const AGREEMENT_REASONS = ["VIOLATION", "MUTUAL", "EXPIRED", "SUPERSEDED", "FORCE_MAJEURE"] as const;
export type AgreementType = (typeof AGREEMENT_TYPES)[number];
export type AgreementReason = (typeof AGREEMENT_REASONS)[number];
export type AgreementStatus = "OFFERED" | "ACTIVE" | "BROKEN";

export type AgreementTerms = {
  machine: {
    preferential_trade?: boolean;
    forbidden_contest_forms?: string[];
    access_exit_ids?: string[];
    access_room_ids?: string[];
    resource_commitments?: Array<{
      from_id: string;
      to_id: string;
      resource: string;
      amount: number;
      by_cycle: number;
    }>;
    defense_support_millipoints?: number;
  };
};

export type FormalAgreement = {
  agreement_id: string;
  agreement_type: AgreementType;
  party_ids: string[];
  status: AgreementStatus;
  offered_by: string;
  cost_payer_id: string;
  formed_cycle?: number;
  visibility: "PUBLIC";
  terms?: AgreementTerms;
};

export function parseAgreementType(raw: string): AgreementType | null {
  const t = String(raw || "")
    .toUpperCase()
    .replace(/[-\s]+/g, "_")
    .trim();
  if (t === "TRADE") return "TRADE";
  if (t === "NON_AGGRESSION" || t === "NA") return "NON_AGGRESSION";
  if (t === "ACCESS") return "ACCESS";
  if (t === "RESOURCE_COMMITMENT" || t === "COMMITMENT") return "RESOURCE_COMMITMENT";
  if (t === "MUTUAL_DEFENSE" || t === "DEFENSE") return "MUTUAL_DEFENSE";
  return null;
}

export function pairKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

export function samePair(partyIds: string[] | undefined, a: string, b: string): boolean {
  const ids = [...(partyIds || [])].sort();
  const want = [a, b].sort();
  return ids.length === 2 && ids[0] === want[0] && ids[1] === want[1];
}

export function allocateAgreementId(): string {
  return `agreement.${Math.random().toString(16).slice(2, 10)}`;
}

export function allocateBreachId(): string {
  return `breach.${Math.random().toString(16).slice(2, 10)}`;
}

export function parseAgreementReason(raw: string): AgreementReason | null {
  const t = String(raw || "")
    .toUpperCase()
    .replace(/[-\s]+/g, "_")
    .replace(/^["']|["']$/g, "")
    .trim();
  return (AGREEMENT_REASONS as readonly string[]).includes(t) ? (t as AgreementReason) : null;
}

export function defaultTerms(
  type: AgreementType,
  ctx: { offerer_id: string; other_id: string; room_id: string; cycle: number },
): AgreementTerms {
  if (type === "TRADE") return { machine: { preferential_trade: true } };
  if (type === "NON_AGGRESSION") {
    return { machine: { forbidden_contest_forms: [...NA_FORBIDDEN_FORMS] } };
  }
  if (type === "ACCESS") return { machine: { access_room_ids: [ctx.room_id] } };
  if (type === "RESOURCE_COMMITMENT") {
    return {
      machine: {
        resource_commitments: [
          {
            from_id: ctx.offerer_id,
            to_id: ctx.other_id,
            resource: "energy",
            amount: DEFAULT_COMMITMENT_AMOUNT,
            by_cycle: ctx.cycle + DEFAULT_COMMITMENT_CYCLES,
          },
        ],
      },
    };
  }
  return { machine: { defense_support_millipoints: DEFAULT_DEFENSE_MILLIPOINTS } };
}

export function activePublic(agreements: FormalAgreement[] | undefined): FormalAgreement[] {
  return (agreements || []).filter((a) => a.status === "ACTIVE" && a.visibility === "PUBLIC");
}

export function accessException(
  agreements: Record<string, FormalAgreement> | undefined,
  playerId: string,
  roomId: string,
  exitId?: string,
): boolean {
  for (const a of Object.values(agreements || {})) {
    if (a.status !== "ACTIVE" || a.agreement_type !== "ACCESS") continue;
    if (!a.party_ids.includes(playerId)) continue;
    const m = a.terms?.machine || {};
    if ((m.access_room_ids || []).includes(roomId)) return true;
    if (exitId && (m.access_exit_ids || []).includes(exitId)) return true;
  }
  return false;
}

export function forbiddenByNonAggression(
  agreements: Record<string, FormalAgreement> | undefined,
  playerId: string,
  form: string,
): FormalAgreement[] {
  return Object.values(agreements || {}).filter((a) => {
    if (a.status !== "ACTIVE" || a.agreement_type !== "NON_AGGRESSION") return false;
    if (!a.party_ids.includes(playerId)) return false;
    return (a.terms?.machine.forbidden_contest_forms || []).includes(form);
  });
}

export function defenseSupportFor(
  agreements: Record<string, FormalAgreement> | undefined,
  defenderId: string | undefined,
): number {
  if (!defenderId) return 0;
  let total = 0;
  for (const a of Object.values(agreements || {})) {
    if (a.status !== "ACTIVE" || a.agreement_type !== "MUTUAL_DEFENSE") continue;
    if (!a.party_ids.includes(defenderId)) continue;
    total += Math.max(0, a.terms?.machine.defense_support_millipoints || 0);
  }
  return total;
}

export function missedCommitments(
  agreements: Record<string, FormalAgreement> | undefined,
  cycle: number,
): FormalAgreement[] {
  return Object.values(agreements || {}).filter((a) => {
    if (a.status !== "ACTIVE" || a.agreement_type !== "RESOURCE_COMMITMENT") return false;
    return (a.terms?.machine.resource_commitments || []).some((c) => cycle > c.by_cycle);
  });
}
