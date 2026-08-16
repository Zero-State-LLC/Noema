/**
 * GC8-S1 SOUND/WORN lot grades on existing budget keys.
 * Authority: Noema-Specs docs/GC8-S1-LOT-QUALITY.md / RFC-0045.
 */

import type { Budgets } from "./actions";

export const LOT_CATALOG_ID = "economy-catalog/gc8-s1";
export const LOT_GRADES = ["SOUND", "WORN"] as const;
export type LotGrade = (typeof LOT_GRADES)[number];
export const WORN_BELOW_CONDITION = 50;
export const WORN_CONSTRUCT_STORAGE_EXTRA = 1;

export type LotGrades = Partial<Record<keyof Budgets, LotGrade>>;

export function harvestGrade(condition?: number): LotGrade {
  return (condition ?? 100) < WORN_BELOW_CONDITION ? "WORN" : "SOUND";
}

export function mixGrade(haveAmount: number, have: LotGrade | undefined, addAmount: number, add: LotGrade): LotGrade {
  if (addAmount <= 0) return have || "SOUND";
  if (haveAmount <= 0) return add;
  const existing = have || "SOUND";
  return existing === "WORN" || add === "WORN" ? "WORN" : "SOUND";
}

export function constructStorageCost(baseStorage: number, grade: LotGrade | undefined): number {
  if (baseStorage <= 0) return 0;
  return baseStorage + (grade === "WORN" ? WORN_CONSTRUCT_STORAGE_EXTRA : 0);
}

export function creditLot(
  grades: LotGrades | undefined,
  budgets: Budgets,
  resource: keyof Budgets,
  amount: number,
  incoming: LotGrade,
): LotGrades {
  const next = { ...(grades || {}) };
  const have = (budgets[resource] ?? 0) - amount;
  next[resource] = mixGrade(have, grades?.[resource], amount, incoming);
  return next;
}

export function spendLot(grades: LotGrades | undefined, remaining: number, resource: keyof Budgets): LotGrades {
  const next = { ...(grades || {}) };
  if (remaining <= 0) delete next[resource];
  return next;
}

export function lotLines(grades: LotGrades | undefined): string[] {
  if (!grades) return [];
  return (Object.entries(grades) as Array<[string, LotGrade]>)
    .filter(([, g]) => g === "WORN")
    .map(([res]) => `Your ${res} is worn.`);
}
