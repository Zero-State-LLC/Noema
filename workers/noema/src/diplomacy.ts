/**
 * Diplomacy S0. TRADE agreement form only.
 * Authority: Noema-Specs docs/DIPLOMACY-S0.md / RFC-0097.
 */

export const DIPLOMACY_CATALOG_ID = "diplomacy-catalog/s0";
export const AGREEMENT_FORM_COST = { compute: 2, influence: 1 } as const;
export const S0_AGREEMENT_TYPES = ["TRADE"] as const;
export type AgreementTypeS0 = (typeof S0_AGREEMENT_TYPES)[number];
export type AgreementStatus = "OFFERED" | "ACTIVE";

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
