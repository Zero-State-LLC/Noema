/**
 * GC8-S1 SOUND/WORN grades, GC8-S2 public origin stamps, GC8-S3 WORN spoilage.
 * Authority: Noema-Specs docs/GC8-S1-LOT-QUALITY.md / RFC-0045,
 * docs/GC8-S2-PROVENANCE.md / RFC-0046, docs/GC8-S3-SPOILAGE.md / RFC-0047.
 */

import type { Budgets } from "./actions";

export const LOT_CATALOG_ID = "economy-catalog/gc8-s1";
export const LOT_GRADES = ["SOUND", "WORN"] as const;
export type LotGrade = (typeof LOT_GRADES)[number];
export const WORN_BELOW_CONDITION = 50;
export const WORN_CONSTRUCT_STORAGE_EXTRA = 1;
export const WORN_SPOIL_PER_CYCLE = 1;

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

export function lotLines(grades: LotGrades | undefined, origins?: LotOrigins, spoils?: string[]): string[] {
  const out: string[] = [];
  if (grades) {
    for (const [res, g] of Object.entries(grades) as Array<[string, LotGrade]>) {
      if (g === "WORN") out.push(`Your ${res} is worn.`);
    }
  }
  if (origins) {
    for (const [res, origin] of Object.entries(origins) as Array<[string, LotOrigin]>) {
      if (origin?.room_name) out.push(`Your ${res} is from ${origin.room_name}.`);
    }
  }
  if (spoils) {
    for (const line of spoils) {
      if (line) out.push(line);
    }
  }
  return out;
}

export function spoilWornLots(
  grades: LotGrades | undefined,
  budgets: Budgets,
  origins?: LotOrigins,
): { grades: LotGrades; origins: LotOrigins; losses: Array<{ resource: keyof Budgets; amount: number }>; lines: string[] } {
  const nextGrades: LotGrades = { ...(grades || {}) };
  const nextOrigins: LotOrigins = { ...(origins || {}) };
  const losses: Array<{ resource: keyof Budgets; amount: number }> = [];
  const lines: string[] = [];
  for (const key of Object.keys(nextGrades) as Array<keyof Budgets>) {
    if (nextGrades[key] !== "WORN") continue;
    const have = budgets[key] ?? 0;
    if (have <= 0) {
      delete nextGrades[key];
      delete nextOrigins[key];
      continue;
    }
    const loss = Math.min(WORN_SPOIL_PER_CYCLE, have);
    budgets[key] = have - loss;
    losses.push({ resource: key, amount: loss });
    lines.push(`Your worn ${key} spoiled.`);
    if ((budgets[key] ?? 0) <= 0) {
      delete nextGrades[key];
      delete nextOrigins[key];
    }
  }
  return { grades: nextGrades, origins: nextOrigins, losses, lines };
}

export type LotOrigin = { room_id: string; room_name: string; producer_id: string };
export type LotOrigins = Partial<Record<keyof Budgets, LotOrigin>>;

export function publicHarvestOrigin(
  room: { room_id: string; name: string; hidden?: boolean; tags?: string[] } | undefined,
  producerId: string,
): LotOrigin | undefined {
  if (!room || !producerId || !room.room_id || !room.name) return undefined;
  if (room.hidden === true) return undefined;
  if ((room.tags || []).some((t) => String(t).toLowerCase() === "hidden")) return undefined;
  return { room_id: room.room_id, room_name: room.name, producer_id: producerId };
}

export function mixOrigin(
  haveAmount: number,
  have: LotOrigin | undefined,
  addAmount: number,
  add: LotOrigin | undefined,
): LotOrigin | undefined {
  if (addAmount <= 0) return have;
  if (haveAmount <= 0 || !have) return add;
  if (have.room_id && add?.room_id && have.room_id === add.room_id) return have;
  return undefined;
}

export function creditOrigin(
  origins: LotOrigins | undefined,
  budgets: Budgets,
  resource: keyof Budgets,
  amount: number,
  incoming: LotOrigin | undefined,
): LotOrigins {
  const next = { ...(origins || {}) };
  const have = (budgets[resource] ?? 0) - amount;
  const mixed = mixOrigin(have, origins?.[resource], amount, incoming);
  if (mixed) next[resource] = mixed;
  else delete next[resource];
  return next;
}

export function spendOrigin(
  origins: LotOrigins | undefined,
  remaining: number,
  resource: keyof Budgets,
): LotOrigins {
  const next = { ...(origins || {}) };
  if (remaining <= 0) delete next[resource];
  return next;
}
