/**
 * GC8-S1 SOUND/WORN grades, GC8-S2 public origin stamps, GC8-S3 WORN spoilage,
 * and RFC-0139 (economy-catalog/gc8-s5) regional material archetypes & REFINED grade.
 * Authority: Noema-Specs docs/GC8-S1-LOT-QUALITY.md / RFC-0045,
 * docs/GC8-S2-PROVENANCE.md / RFC-0046, docs/GC8-S3-SPOILAGE.md / RFC-0047,
 * rfcs/RFC-0139-regional-lots-and-portable-items.md.
 */

import type { Budgets } from "./actions";

export const LOT_CATALOG_ID = "economy-catalog/gc8-s1";
export const EXTENDED_LOT_CATALOG_ID = "economy-catalog/gc8-s5";
export const LOT_GRADES = ["SOUND", "WORN", "REFINED"] as const;
export type LotGrade = (typeof LOT_GRADES)[number];
export const WORN_BELOW_CONDITION = 50;
export const REFINED_MIN_HARVEST_CONDITION = 85;
export const WORN_CONSTRUCT_STORAGE_EXTRA = 1;
export const REFINED_CONSTRUCT_STORAGE_DISCOUNT = 1;
export const WORN_SPOIL_PER_CYCLE = 1;

export const MATERIAL_ARCHETYPES = [
  "FERROUS_ORE",
  "SILICA_CELL",
  "SALVAGE_COMPOSITE",
] as const;
export type MaterialArchetype = (typeof MATERIAL_ARCHETYPES)[number];

export const MATERIAL_ROOMS: Record<MaterialArchetype, readonly string[]> = {
  FERROUS_ORE: ["room.foundry-corridor", "room.infrastructure-vault"],
  SILICA_CELL: ["room.generator-hall", "room.relay-quarter", "room.archive"],
  SALVAGE_COMPOSITE: [
    "room.outer-works",
    "room.storage-district",
    "room.frontier-gate",
    "room.civic-exchange",
  ],
};

export type MaterialLot = {
  material: MaterialArchetype;
  grade: LotGrade;
  amount: number;
  origin_room_id?: string;
};

export type LotGrades = Partial<Record<keyof Budgets, LotGrade>>;

const GRADE_RANK: Record<LotGrade, number> = { WORN: 0, SOUND: 1, REFINED: 2 };

export function parseMaterialArchetype(raw: unknown): MaterialArchetype | null {
  const norm = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (norm === "FERROUS_ORE" || norm === "FERROUS" || norm === "ORE") return "FERROUS_ORE";
  if (norm === "SILICA_CELL" || norm === "SILICA") return "SILICA_CELL";
  if (norm === "SALVAGE_COMPOSITE" || norm === "SALVAGE" || norm === "COMPOSITE") {
    return "SALVAGE_COMPOSITE";
  }
  return null;
}

export function parseLotGrade(raw: unknown): LotGrade | null {
  const norm = String(raw || "").trim().toUpperCase();
  if (norm === "WORN" || norm === "SOUND" || norm === "REFINED") return norm;
  return null;
}

export function roomMaterialArchetype(roomId?: string): MaterialArchetype {
  const id = String(roomId || "").trim().toLowerCase();
  if (MATERIAL_ROOMS.FERROUS_ORE.includes(id)) return "FERROUS_ORE";
  if (MATERIAL_ROOMS.SILICA_CELL.includes(id)) return "SILICA_CELL";
  return "SALVAGE_COMPOSITE";
}

export function harvestGrade(condition?: number, hasPlasmaCutter = false): LotGrade {
  const cond = condition ?? 100;
  if (cond < WORN_BELOW_CONDITION) return "WORN";
  if (hasPlasmaCutter && cond >= REFINED_MIN_HARVEST_CONDITION) return "REFINED";
  return "SOUND";
}

export function mixGrade(haveAmount: number, have: LotGrade | undefined, addAmount: number, add: LotGrade): LotGrade {
  if (addAmount <= 0) return have || "SOUND";
  if (haveAmount <= 0) return add;
  const existing = have || "SOUND";
  if (existing === "WORN" || add === "WORN") return "WORN";
  if (existing === "REFINED" && add === "REFINED") return "REFINED";
  return "SOUND";
}

export function constructStorageCost(baseStorage: number, grade: LotGrade | undefined): number {
  if (baseStorage <= 0) return 0;
  if (grade === "WORN") return baseStorage + WORN_CONSTRUCT_STORAGE_EXTRA;
  if (grade === "REFINED") return Math.max(1, baseStorage - REFINED_CONSTRUCT_STORAGE_DISCOUNT);
  return baseStorage;
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

export function normalizeMaterialLots(lots: MaterialLot[] | undefined): MaterialLot[] {
  const map = new Map<string, MaterialLot>();
  for (const lot of lots || []) {
    const amount = Math.max(0, Math.floor(Number(lot.amount) || 0));
    if (amount <= 0) continue;
    const key = `${lot.material}:${lot.grade}`;
    const prev = map.get(key);
    if (prev) {
      prev.amount += amount;
      if (prev.origin_room_id && lot.origin_room_id && prev.origin_room_id !== lot.origin_room_id) {
        prev.origin_room_id = undefined;
      }
    } else {
      map.set(key, {
        material: lot.material,
        grade: lot.grade,
        amount,
        ...(lot.origin_room_id ? { origin_room_id: lot.origin_room_id } : {}),
      });
    }
  }
  return [...map.values()].sort((a, b) => {
    if (a.material !== b.material) return a.material.localeCompare(b.material);
    return GRADE_RANK[b.grade] - GRADE_RANK[a.grade];
  });
}

export function totalMaterialLots(lots: MaterialLot[] | undefined): number {
  let sum = 0;
  for (const lot of lots || []) {
    sum += Math.max(0, Math.floor(Number(lot.amount) || 0));
  }
  return sum;
}

export function creditMaterialLot(
  lots: MaterialLot[] | undefined,
  material: MaterialArchetype,
  grade: LotGrade,
  amount: number,
  originRoomId?: string,
): MaterialLot[] {
  const amt = Math.max(0, Math.floor(amount));
  if (amt <= 0) return normalizeMaterialLots(lots);
  return normalizeMaterialLots([
    ...(lots || []),
    { material, grade, amount: amt, ...(originRoomId ? { origin_room_id: originRoomId } : {}) },
  ]);
}

/**
 * Keep material_lots aligned with legacy occupied cargo (untyped legacy cargo
 * defaults to SALVAGE_COMPOSITE at the player's current storage lot grade).
 * Item bulk carried in inventory is excluded from cargo lot count.
 */
export function reconcileMaterialLots(
  lots: MaterialLot[] | undefined,
  occupiedCargoUnits: number,
  legacyGrade: LotGrade = "SOUND",
): MaterialLot[] {
  const target = Math.max(0, Math.floor(occupiedCargoUnits));
  const norm = normalizeMaterialLots(lots);
  const current = totalMaterialLots(norm);
  if (current === target) return norm;
  if (current < target) {
    return creditMaterialLot(norm, "SALVAGE_COMPOSITE", legacyGrade, target - current);
  }
  // Trim excess deterministically (lowest grade first, SALVAGE_COMPOSITE first).
  let excess = current - target;
  const ordered = [...norm].sort((a, b) => {
    if (GRADE_RANK[a.grade] !== GRADE_RANK[b.grade]) return GRADE_RANK[a.grade] - GRADE_RANK[b.grade];
    if (a.material === "SALVAGE_COMPOSITE" && b.material !== "SALVAGE_COMPOSITE") return -1;
    if (b.material === "SALVAGE_COMPOSITE" && a.material !== "SALVAGE_COMPOSITE") return 1;
    return a.material.localeCompare(b.material);
  });
  for (const lot of ordered) {
    if (excess <= 0) break;
    const take = Math.min(lot.amount, excess);
    lot.amount -= take;
    excess -= take;
  }
  return normalizeMaterialLots(ordered);
}

export function materialCount(
  lots: MaterialLot[] | undefined,
  material?: MaterialArchetype,
  minGrade: LotGrade = "WORN",
): number {
  const minRank = GRADE_RANK[minGrade];
  let sum = 0;
  for (const lot of lots || []) {
    if (material && lot.material !== material) continue;
    if (GRADE_RANK[lot.grade] < minRank) continue;
    sum += Math.max(0, Math.floor(lot.amount));
  }
  return sum;
}

export type ConsumeMaterialResult =
  | {
      ok: true;
      lots: MaterialLot[];
      consumed: MaterialLot[];
      totalUnits: number;
      lowestGrade: LotGrade;
      allRefined: boolean;
    }
  | { ok: false; missingMaterial: MaterialArchetype; required: number; available: number };

/**
 * Deterministic lot debit for specialized recipes (CRAFT / REFINE / DELIVER_LOT).
 * Never substitutes SALVAGE_COMPOSITE for missing FERROUS_ORE or SILICA_CELL.
 */
export function consumeMaterialLots(
  lots: MaterialLot[] | undefined,
  requirements: Partial<Record<MaterialArchetype, number>>,
  options?: { minGrade?: LotGrade; preferRefined?: boolean },
): ConsumeMaterialResult {
  const minRank = GRADE_RANK[options?.minGrade || "WORN"];
  const working = normalizeMaterialLots(lots).map((l) => ({ ...l }));
  const consumed: MaterialLot[] = [];
  let totalUnits = 0;
  let lowestRank = 2;
  let allRefined = true;

  for (const mat of MATERIAL_ARCHETYPES) {
    const need = Math.max(0, Math.floor(Number(requirements[mat]) || 0));
    if (need <= 0) continue;
    const matching = working
      .filter((l) => l.material === mat && GRADE_RANK[l.grade] >= minRank && l.amount > 0)
      .sort((a, b) =>
        options?.preferRefined
          ? GRADE_RANK[b.grade] - GRADE_RANK[a.grade]
          : GRADE_RANK[a.grade] - GRADE_RANK[b.grade],
      );
    const avail = matching.reduce((acc, l) => acc + l.amount, 0);
    if (avail < need) {
      return { ok: false, missingMaterial: mat, required: need, available: avail };
    }
    let rem = need;
    for (const lot of matching) {
      if (rem <= 0) break;
      const take = Math.min(lot.amount, rem);
      lot.amount -= take;
      rem -= take;
      totalUnits += take;
      if (GRADE_RANK[lot.grade] < lowestRank) lowestRank = GRADE_RANK[lot.grade];
      if (lot.grade !== "REFINED") allRefined = false;
      consumed.push({
        material: lot.material,
        grade: lot.grade,
        amount: take,
        ...(lot.origin_room_id ? { origin_room_id: lot.origin_room_id } : {}),
      });
    }
  }

  const lowestGrade: LotGrade = lowestRank === 0 ? "WORN" : lowestRank === 1 ? "SOUND" : "REFINED";
  return {
    ok: true,
    lots: normalizeMaterialLots(working),
    consumed: normalizeMaterialLots(consumed),
    totalUnits,
    lowestGrade,
    allRefined: totalUnits > 0 && allRefined,
  };
}

/**
 * Consume generic cargo units (REPAIR / CONSTRUCT / UPGRADE / REMEDIATE) from material_lots.
 * Deterministic preference: SALVAGE_COMPOSITE first, then lowest grade first.
 */
export function consumeGenericCargoLots(
  lots: MaterialLot[] | undefined,
  amount: number,
  options?: { preferRefined?: boolean },
): { lots: MaterialLot[]; consumed: MaterialLot[]; usedRefined: boolean } {
  const need = Math.max(0, Math.floor(amount));
  if (need <= 0) return { lots: normalizeMaterialLots(lots), consumed: [], usedRefined: false };
  const working = normalizeMaterialLots(lots).map((l) => ({ ...l }));
  working.sort((a, b) => {
    if (options?.preferRefined) {
      if (GRADE_RANK[a.grade] !== GRADE_RANK[b.grade]) return GRADE_RANK[b.grade] - GRADE_RANK[a.grade];
    } else {
      if (a.material === "SALVAGE_COMPOSITE" && b.material !== "SALVAGE_COMPOSITE") return -1;
      if (b.material === "SALVAGE_COMPOSITE" && a.material !== "SALVAGE_COMPOSITE") return 1;
      if (GRADE_RANK[a.grade] !== GRADE_RANK[b.grade]) return GRADE_RANK[a.grade] - GRADE_RANK[b.grade];
    }
    return a.material.localeCompare(b.material);
  });
  let rem = need;
  const consumed: MaterialLot[] = [];
  let usedRefined = false;
  for (const lot of working) {
    if (rem <= 0) break;
    const take = Math.min(lot.amount, rem);
    if (take <= 0) continue;
    lot.amount -= take;
    rem -= take;
    if (lot.grade === "REFINED") usedRefined = true;
    consumed.push({ material: lot.material, grade: lot.grade, amount: take });
  }
  return { lots: normalizeMaterialLots(working), consumed: normalizeMaterialLots(consumed), usedRefined };
}

/** Upgrade WORN material lots to SOUND (used by stabilizer_kit). */
export function stabilizeWornLots(
  lots: MaterialLot[] | undefined,
  maxUnits = Number.POSITIVE_INFINITY,
): { lots: MaterialLot[]; upgraded: number } {
  const working = normalizeMaterialLots(lots).map((l) => ({ ...l }));
  let remaining = maxUnits;
  let upgraded = 0;
  const next: MaterialLot[] = [];
  for (const lot of working) {
    if (lot.grade === "WORN" && remaining > 0) {
      const take = Math.min(lot.amount, remaining);
      upgraded += take;
      remaining -= take;
      next.push({ material: lot.material, grade: "SOUND", amount: take, origin_room_id: lot.origin_room_id });
      if (lot.amount > take) {
        next.push({ material: lot.material, grade: "WORN", amount: lot.amount - take, origin_room_id: lot.origin_room_id });
      }
    } else {
      next.push(lot);
    }
  }
  return { lots: normalizeMaterialLots(next), upgraded };
}

/**
 * Spoil 1 unit/cycle of WORN material lots carried in a personal pack.
 * Lots stored inside an operational storage_bay or barter_stall (condition >= 50)
 * experience 0 spoilage per RFC-0139.
 */
export function spoilPersonalMaterialLots(
  lots: MaterialLot[] | undefined,
  budgets: Budgets,
  capacity: number,
  protectedStorage = false,
): { lots: MaterialLot[]; spoiledUnits: number; lines: string[] } {
  const norm = normalizeMaterialLots(lots);
  if (protectedStorage) return { lots: norm, spoiledUnits: 0, lines: [] };
  const worn = norm.find((l) => l.grade === "WORN" && l.amount > 0);
  if (!worn) return { lots: norm, spoiledUnits: 0, lines: [] };
  const loss = Math.min(WORN_SPOIL_PER_CYCLE, worn.amount);
  worn.amount -= loss;
  budgets.storage = Math.min(capacity, Math.max(0, Math.floor(budgets.storage ?? 0)) + loss);
  return {
    lots: normalizeMaterialLots(norm),
    spoiledUnits: loss,
    lines: [`Your worn ${worn.material.toLowerCase().replace(/_/g, " ")} spoiled.`],
  };
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
