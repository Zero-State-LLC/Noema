/**
 * Diplomacy S0–S1. TRADE form and terminate.
 * Authority: Noema-Specs docs/DIPLOMACY-S1.md / RFC-0098.
 */

export const DIPLOMACY_CATALOG_ID = "diplomacy-catalog/s1";
export const AGREEMENT_FORM_COST = { compute: 2, influence: 1 } as const;
export const AGREEMENT_TERMINATE_COST = { compute: 1 } as const;
export const S0_AGREEMENT_TYPES = ["TRADE"] as const;
export const AGREEMENT_REASONS = ["VIOLATION", "MUTUAL", "EXPIRED", "SUPERSEDED", "FORCE_MAJEURE"] as const;
export type AgreementTypeS0 = (typeof S0_AGREEMENT_TYPES)[number];
export type AgreementReason = (typeof AGREEMENT_REASONS)[number];
export type AgreementStatus = "OFFERED" | "ACTIVE" | "BROKEN";

export type FormalAgreement = {
  agreement_id: string;
  agreement_type: AgreementTypeS0;
  party_ids: string[];
  status: AgreementStatus;
  offered_by: string;
  cost_payer_id: string;
  formed_cycle?: number;
  visibility: "PUBLIC";
};

export function parseAgreementType(raw: string): AgreementTypeS0 | null {
  const t = String(raw || "")
    .toUpperCase()
    .replace(/[-\s]+/g, "_")
    .trim();
  if (t === "TRADE") return "TRADE";
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
