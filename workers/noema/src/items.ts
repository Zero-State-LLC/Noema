/**
 * RFC-0139: Portable Items, Tools, Rigs, Battery Cores, and Strategic Contest Weapons.
 * Authority: Noema-Specs rfcs/RFC-0139-regional-lots-and-portable-items.md
 * Machine contract: items-catalog.0.1.json (event-catalog/0.2 compatible).
 */

import catalogJson from "./items-catalog.0.1.json";
import type { Budgets, EntityRuntime } from "./actions";
import { STORAGE_CAPACITY, readyClassInRoom, type ConstructibleClass } from "./construction";
import type { ContestForm } from "./contest";
import { deterministicId } from "./ids";
import type { LotGrade, MaterialArchetype } from "./lots";

export const ITEMS_CATALOG_ID = catalogJson.catalog_id as "items-catalog/0.1";
export const EQUIP_SLOTS = ["TOOL_SLOT", "WEAPON_SLOT", "RIG_SLOT"] as const;
export type EquipSlot = (typeof EQUIP_SLOTS)[number];
export type ItemCategory = "TOOL" | "WEAPON" | "RIG" | "CONSUMABLE";
export type ItemQuality = "WORN" | "STANDARD" | "TEMPERED";

export const EQUIP_PREP_MAX_SWAPS_PER_CYCLE = catalogJson.equip_prep_max_swaps_per_cycle;
export const ITEM_REPAIR_WORKSHOP = catalogJson.item_repair_workshop;
export const ITEM_SCRAP = catalogJson.item_scrap;
export const REFINE_INPUT_SOUND = catalogJson.lot_grades.REFINED.refine_input_sound;
export const REFINE_OUTPUT = catalogJson.lot_grades.REFINED.refine_output;
export const REFINE_COST: Partial<Budgets> = { ...catalogJson.lot_grades.REFINED.refine_cost };
export const CARGO_RIG_CAPACITY_BONUS = 6;
export const FAILED_CONTEST_DOUBLE_WEAR_SCORE = -150;

export type ItemArchetypeId =
  | "arc_welder"
  | "plasma_cutter"
  | "chrono_lens"
  | "signal_transceiver"
  | "breach_charge"
  | "grapnel_array"
  | "arc_lance"
  | "cipher_spike"
  | "cargo_rig"
  | "aegis_baffle"
  | "power_cell"
  | "stabilizer_kit"
  | "depleted_cell";

export type CraftableArchetypeId = Exclude<ItemArchetypeId, "depleted_cell">;

export type ItemCatalogEntry = {
  archetype: CraftableArchetypeId;
  label: string;
  category: ItemCategory;
  equip_slot?: EquipSlot;
  bulk: number;
  equipped_bulk: number;
  requires_infra?: ConstructibleClass[];
  requires_any_infra?: ConstructibleClass[];
  craft_lots: Partial<Record<MaterialArchetype, number>>;
  craft_budgets: Partial<Budgets>;
  effects?: Record<string, number | boolean | string>;
  contest_effects?: {
    declarer_forms?: ContestForm[];
    declarer_millipoints?: number;
    defender_forms?: ContestForm[];
    defender_millipoints?: number;
    defender_all_forms_millipoints?: number;
    passive_defense_millipoints?: number;
    disruption_condition_bonus?: number;
    restriction_duration_bonus_cycles?: number;
    max_seizure_amount_override?: number;
    unequipped_item_seizure_margin_mp?: number;
    sanction_influence_discount?: number;
    seal_duration_bonus_cycles?: number;
    halve_seizure_loss?: boolean;
    block_item_seizure?: boolean;
    crime_detection_signature_mp?: number;
  };
  wear_per_use: number;
};

export const ITEM_CATALOG: readonly ItemCatalogEntry[] = catalogJson.items as unknown as ItemCatalogEntry[];

const BY_ARCHETYPE = new Map<string, ItemCatalogEntry>(ITEM_CATALOG.map((e) => [e.archetype, e]));

export const DEPLETED_CELL_SPEC = {
  archetype: "depleted_cell" as const,
  label: "Depleted Power Cell",
  category: "CONSUMABLE" as const,
  bulk: 1,
  equipped_bulk: 1,
  generator_recharge_wear: 3,
  recharge_cost: { compute: 1 } as Partial<Budgets>,
};

export type ItemLocation =
  | { kind: "CONTAINER"; container_entity_id: string }
  | { kind: "ROOM"; room_id: string };

export type PortableItem = {
  item_id: string;
  archetype: ItemArchetypeId;
  label: string;
  category: ItemCategory;
  equip_slot?: EquipSlot;
  equipped_slot?: EquipSlot;
  quality: ItemQuality;
  condition: number;
  max_condition: number;
  bulk: number;
  equipped_bulk: number;
  location: ItemLocation;
  owner_id: string | null;
  creator_id: string;
  steward_id?: string | null;
  steward_office_id?: string | null;
  origin_room_id?: string;
  forged_cycle: number;
  contest_veterancy?: number;
  notable_history?: string[];
  makeshift?: boolean;
};

export function itemSpec(archetype: string): ItemCatalogEntry | undefined {
  return BY_ARCHETYPE.get(String(archetype || "").trim().toLowerCase());
}

export function parseItemArchetype(raw: unknown): CraftableArchetypeId | null {
  const norm = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (BY_ARCHETYPE.has(norm)) return norm as CraftableArchetypeId;
  for (const entry of ITEM_CATALOG) {
    const labelNorm = entry.label.toLowerCase().replace(/[\s-]+/g, "_");
    if (labelNorm === norm) return entry.archetype;
  }
  return null;
}

export function itemBulk(item: Pick<PortableItem, "bulk" | "equipped_bulk" | "equipped_slot">): number {
  return item.equipped_slot ? item.equipped_bulk : item.bulk;
}

export function isItemOperational(item: Pick<PortableItem, "condition"> | undefined | null): boolean {
  return Boolean(item && item.condition > 0);
}

export function playerCarriedItems(
  items: Record<string, PortableItem> | undefined,
  playerId: string,
): PortableItem[] {
  if (!items) return [];
  return Object.values(items)
    .filter(
      (it) =>
        it.location.kind === "CONTAINER" && it.location.container_entity_id === playerId,
    )
    .sort((a, b) => a.item_id.localeCompare(b.item_id));
}

export function roomDroppedItems(
  items: Record<string, PortableItem> | undefined,
  roomId: string,
): PortableItem[] {
  if (!items) return [];
  return Object.values(items)
    .filter((it) => it.location.kind === "ROOM" && it.location.room_id === roomId)
    .sort((a, b) => a.item_id.localeCompare(b.item_id));
}

export function carriedItemBulk(
  items: Record<string, PortableItem> | undefined,
  playerId: string,
): number {
  let sum = 0;
  for (const it of playerCarriedItems(items, playerId)) {
    sum += itemBulk(it);
  }
  return sum;
}

export function equippedItemsMap(
  items: Record<string, PortableItem> | undefined,
  playerId: string,
): Partial<Record<EquipSlot, PortableItem>> {
  const out: Partial<Record<EquipSlot, PortableItem>> = {};
  for (const it of playerCarriedItems(items, playerId)) {
    if (it.equipped_slot) out[it.equipped_slot] = it;
  }
  return out;
}

export function equippedOperationalItem(
  items: Record<string, PortableItem> | undefined,
  playerId: string,
  archetype: ItemArchetypeId,
): PortableItem | undefined {
  for (const it of playerCarriedItems(items, playerId)) {
    if (it.equipped_slot && it.archetype === archetype && isItemOperational(it)) {
      return it;
    }
  }
  return undefined;
}

export function effectiveStorageCapacity(
  items: Record<string, PortableItem> | undefined,
  playerId: string,
): number {
  const rig = equippedOperationalItem(items, playerId, "cargo_rig");
  return STORAGE_CAPACITY + (rig ? CARGO_RIG_CAPACITY_BONUS : 0);
}

export function occupiedCargoExcludingItems(
  storageFree: number,
  items: Record<string, PortableItem> | undefined,
  playerId: string,
): number {
  const cap = effectiveStorageCapacity(items, playerId);
  const totalOccupied = Math.max(0, cap - Math.max(0, Math.floor(storageFree)));
  return Math.max(0, totalOccupied - carriedItemBulk(items, playerId));
}

export function hasRequiredCraftInfra(
  spec: ItemCatalogEntry,
  roomEntities: EntityRuntime[],
): { ok: true } | { ok: false; missing: string } {
  if (spec.requires_infra?.length) {
    for (const cls of spec.requires_infra) {
      if (!readyClassInRoom(roomEntities, cls)) {
        return { ok: false, missing: cls };
      }
    }
  }
  if (spec.requires_any_infra?.length) {
    const anyReady = spec.requires_any_infra.some((cls) => readyClassInRoom(roomEntities, cls));
    if (!anyReady) {
      return { ok: false, missing: spec.requires_any_infra.join(" or ") };
    }
  }
  return { ok: true };
}

export function createCraftedItem(input: {
  archetype: CraftableArchetypeId;
  owner_id: string;
  creator_id: string;
  origin_room_id?: string;
  forged_cycle: number;
  sequence: number;
  lowestLotGrade: LotGrade;
  allRefined: boolean;
  artificerMastery?: boolean;
  makeshift?: boolean;
}): PortableItem {
  const spec = itemSpec(input.archetype);
  if (!spec) throw new Error(`Unknown item archetype: ${input.archetype}`);
  let quality: ItemQuality = "STANDARD";
  let condition = catalogJson.lot_grades.SOUND.crafted_initial_condition;
  let maxCondition = 100;
  if (input.makeshift) {
    quality = "WORN";
    condition = 50;
    maxCondition = 70;
  } else if (input.allRefined) {
    quality = "TEMPERED";
    condition = catalogJson.lot_grades.REFINED.crafted_initial_condition;
    maxCondition = 120;
  } else if (input.lowestLotGrade === "WORN") {
    quality = "WORN";
    condition = catalogJson.lot_grades.WORN.crafted_initial_condition;
    maxCondition = 100;
  }
  if (!input.makeshift && input.artificerMastery) {
    maxCondition = Math.min(120, maxCondition + 10);
    condition = Math.min(maxCondition, condition + 10);
  }
  const item_id = deterministicId(
    `item.${input.archetype.replace(/_/g, "-")}`,
    input.creator_id,
    input.forged_cycle,
    input.sequence,
  );
  return {
    item_id,
    archetype: spec.archetype,
    label: input.makeshift ? `Makeshift ${spec.label}` : spec.label,
    category: spec.category,
    equip_slot: spec.equip_slot,
    quality,
    condition,
    max_condition: maxCondition,
    bulk: spec.bulk,
    equipped_bulk: spec.equipped_bulk,
    location: { kind: "CONTAINER", container_entity_id: input.owner_id },
    owner_id: input.owner_id,
    creator_id: input.creator_id,
    steward_id: input.owner_id,
    origin_room_id: input.origin_room_id,
    forged_cycle: input.forged_cycle,
    contest_veterancy: 0,
    notable_history: [],
    ...(input.makeshift ? { makeshift: true } : {}),
  };
}

/**
 * Auto-equip newly acquired item if it has an equip_slot, condition > 0, and
 * the player's slot is currently empty. Adjusts free storage delta when
 * equipped_bulk < bulk (e.g., bulk 2 -> equipped_bulk 1 frees 1 storage).
 */
export function autoEquipIfSlotEmpty(
  items: Record<string, PortableItem>,
  playerId: string,
  item: PortableItem,
  budgets: Budgets,
): { equipped: boolean; capacityDelta: number } {
  if (!item.equip_slot || !isItemOperational(item)) return { equipped: false, capacityDelta: 0 };
  const current = equippedItemsMap(items, playerId);
  if (current[item.equip_slot]) return { equipped: false, capacityDelta: 0 };
  const bulkBefore = itemBulk(item);
  item.equipped_slot = item.equip_slot;
  const bulkAfter = itemBulk(item);
  const freedBulk = bulkBefore - bulkAfter;
  const capBonus = item.archetype === "cargo_rig" ? CARGO_RIG_CAPACITY_BONUS : 0;
  const nextCap = effectiveStorageCapacity(items, playerId);
  budgets.storage = Math.min(nextCap, Math.max(0, Math.floor(budgets.storage ?? 0)) + freedBulk + capBonus);
  return { equipped: true, capacityDelta: capBonus };
}

/** Apply wear to a portable item; breaks at 0 and auto-unequips if broken. */
export function applyItemWear(
  items: Record<string, PortableItem>,
  item: PortableItem,
  wear: number,
  budgets?: Budgets,
): { before: number; after: number; broken: boolean } {
  const before = item.condition;
  const delta = Math.max(0, Math.floor(wear));
  const after = Math.max(0, before - delta);
  item.condition = after;
  const broken = before > 0 && after === 0;
  if (broken && item.equipped_slot) {
    const wasRig = item.archetype === "cargo_rig";
    const bulkDiff = item.bulk - item.equipped_bulk;
    item.equipped_slot = undefined;
    if (budgets) {
      const capAfter = item.location.kind === "CONTAINER"
        ? effectiveStorageCapacity(items, item.location.container_entity_id)
        : STORAGE_CAPACITY;
      const loss = bulkDiff + (wasRig ? CARGO_RIG_CAPACITY_BONUS : 0);
      budgets.storage = Math.max(0, Math.min(capAfter, Math.floor(budgets.storage ?? 0) - loss));
    }
  }
  return { before, after, broken };
}

/** Strict event-catalog/0.2 ENTITY_CREATE payload for a portable item. */
export function itemEntityCreatePayload(item: PortableItem): Record<string, unknown> {
  return {
    entity_id: item.item_id,
    entity_type: "OBJECT",
    location: item.location,
    owner_id: item.owner_id,
    inventory: [],
    properties: {
      archetype: item.archetype,
      label: item.label,
      category: item.category,
      equip_slot: item.equip_slot ?? null,
      quality: item.quality,
      bulk: item.bulk,
      equipped_bulk: item.equipped_bulk,
      creator_id: item.creator_id,
      origin_room_id: item.origin_room_id ?? null,
      forged_cycle: item.forged_cycle,
      ...(item.makeshift ? { makeshift: true } : {}),
    },
    state: {
      condition: item.condition,
      max_condition: item.max_condition,
      equipped_slot: item.equipped_slot ?? null,
      steward_id: item.steward_id ?? null,
      steward_office_id: item.steward_office_id ?? null,
    },
  };
}

/** Strict event-catalog/0.2 ENTITY_UPDATE payload for item state mutations. */
export function itemEntityUpdatePayload(
  itemId: string,
  set: Record<string, unknown>,
  unset: string[] = [],
): Record<string, unknown> {
  return {
    entity_id: itemId,
    set,
    unset,
  };
}

export type ContestEquipmentEffects = {
  attackerBonusMp: number;
  defenderBonusMp: number;
  attackerWeapon?: PortableItem;
  defenderWeapon?: PortableItem;
  defenderRig?: PortableItem;
  disruptionConditionBonus: number;
  restrictionDurationBonus: number;
  sealDurationBonus: number;
  maxSeizureOverride?: number;
  halveSeizureLoss: boolean;
  blockItemSeizure: boolean;
  unequippedItemSeizureMarginMp?: number;
  crimeDetectionSignatureMp: number;
};

export function computeContestEquipment(input: {
  items: Record<string, PortableItem> | undefined;
  form: ContestForm;
  declarerId: string;
  defenderId?: string;
  defenderActivelyDefended: boolean;
}): ContestEquipmentEffects {
  let attackerBonusMp = 0;
  let defenderBonusMp = 0;
  let disruptionConditionBonus = 0;
  let restrictionDurationBonus = 0;
  let sealDurationBonus = 0;
  let maxSeizureOverride: number | undefined;
  let halveSeizureLoss = false;
  let blockItemSeizure = false;
  let unequippedItemSeizureMarginMp: number | undefined;
  let crimeDetectionSignatureMp = 0;

  const attEq = equippedItemsMap(input.items, input.declarerId);
  const attackerWeapon =
    attEq.WEAPON_SLOT && isItemOperational(attEq.WEAPON_SLOT) ? attEq.WEAPON_SLOT : undefined;
  if (attackerWeapon) {
    const spec = itemSpec(attackerWeapon.archetype);
    const ce = spec?.contest_effects;
    if (ce) {
      if (ce.declarer_forms?.includes(input.form)) {
        attackerBonusMp += ce.declarer_millipoints || 0;
        if (input.form === "INFRASTRUCTURE_DISRUPTION" && ce.disruption_condition_bonus) {
          disruptionConditionBonus += ce.disruption_condition_bonus;
        }
        if (input.form === "ACCESS_CONTEST" && ce.restriction_duration_bonus_cycles) {
          restrictionDurationBonus += ce.restriction_duration_bonus_cycles;
        }
        if (input.form === "INFORMATION_CONTEST" && ce.seal_duration_bonus_cycles) {
          sealDurationBonus += ce.seal_duration_bonus_cycles;
        }
        if (input.form === "RESOURCE_SEIZURE" && ce.max_seizure_amount_override) {
          maxSeizureOverride = ce.max_seizure_amount_override;
        }
        if (input.form === "RESOURCE_SEIZURE" && ce.unequipped_item_seizure_margin_mp != null) {
          unequippedItemSeizureMarginMp = ce.unequipped_item_seizure_margin_mp;
        }
        crimeDetectionSignatureMp += ce.crime_detection_signature_mp || 0;
      }
    }
  }

  let defenderWeapon: PortableItem | undefined;
  let defenderRig: PortableItem | undefined;
  if (input.defenderId) {
    const defEq = equippedItemsMap(input.items, input.defenderId);
    const w = defEq.WEAPON_SLOT && isItemOperational(defEq.WEAPON_SLOT) ? defEq.WEAPON_SLOT : undefined;
    const r = defEq.RIG_SLOT && isItemOperational(defEq.RIG_SLOT) ? defEq.RIG_SLOT : undefined;
    if (w && input.defenderActivelyDefended) {
      const ce = itemSpec(w.archetype)?.contest_effects;
      if (ce) {
        if (ce.defender_all_forms_millipoints) {
          defenderBonusMp += ce.defender_all_forms_millipoints;
          defenderWeapon = w;
        } else if (ce.defender_forms?.includes(input.form) && ce.defender_millipoints) {
          defenderBonusMp += ce.defender_millipoints;
          defenderWeapon = w;
        }
      }
    }
    if (r) {
      const ce = itemSpec(r.archetype)?.contest_effects;
      if (ce) {
        if (ce.passive_defense_millipoints) {
          defenderBonusMp += ce.passive_defense_millipoints;
          defenderRig = r;
        }
        if (ce.halve_seizure_loss) halveSeizureLoss = true;
        if (ce.block_item_seizure) blockItemSeizure = true;
      }
    }
  }

  return {
    attackerBonusMp,
    defenderBonusMp,
    attackerWeapon,
    defenderWeapon,
    defenderRig,
    disruptionConditionBonus,
    restrictionDurationBonus,
    sealDurationBonus,
    maxSeizureOverride,
    halveSeizureLoss,
    blockItemSeizure,
    unequippedItemSeizureMarginMp,
    crimeDetectionSignatureMp,
  };
}

/**
 * Deterministic selection of one unequipped carried item for grapnel_array
 * high-margin seizure (never strips equipped TOOL_SLOT/WEAPON_SLOT/RIG_SLOT).
 */
export function selectSeizableUnequippedItem(
  items: Record<string, PortableItem> | undefined,
  holderId: string,
): PortableItem | undefined {
  const candidates = playerCarriedItems(items, holderId).filter((it) => !it.equipped_slot);
  if (!candidates.length) return undefined;
  candidates.sort((a, b) => {
    if (a.condition !== b.condition) return a.condition - b.condition;
    return a.item_id.localeCompare(b.item_id);
  });
  return candidates[0];
}

export function resolveCarriedItem(
  items: Record<string, PortableItem> | undefined,
  playerId: string,
  raw: string,
): { ok: true; item: PortableItem } | { ok: false; code: "NOT_FOUND" | "AMBIGUOUS_TARGET"; message: string; choices?: string[] } {
  const carried = playerCarriedItems(items, playerId);
  const needle = String(raw || "").trim();
  if (!needle) return { ok: false, code: "NOT_FOUND", message: "Specify an item." };
  const exact = carried.find((it) => it.item_id === needle);
  if (exact) return { ok: true, item: exact };
  const norm = needle.toLowerCase().replace(/[\s_-]+/g, " ").trim();
  const matches = carried.filter((it) => {
    const l = it.label.toLowerCase().replace(/[\s_-]+/g, " ").trim();
    const a = it.archetype.toLowerCase().replace(/[\s_-]+/g, " ").trim();
    return l === norm || a === norm || l.includes(norm);
  });
  if (matches.length === 1) return { ok: true, item: matches[0] };
  if (matches.length > 1) {
    return {
      ok: false,
      code: "AMBIGUOUS_TARGET",
      message: `${needle} matches more than one carried item.`,
      choices: matches.map((m) => m.item_id),
    };
  }
  return { ok: false, code: "NOT_FOUND", message: "You are not carrying that item." };
}

export function projectInventory(
  items: Record<string, PortableItem> | undefined,
  playerId: string,
): Array<{
  item_id: string;
  archetype_id: ItemArchetypeId;
  label: string;
  category: ItemCategory;
  equip_slot?: EquipSlot;
  equipped_slot?: EquipSlot;
  quality: ItemQuality;
  condition: number;
  max_condition: number;
  bulk: number;
  equipped_bulk: number;
  forged_cycle: number;
}> {
  return playerCarriedItems(items, playerId).map((it) => ({
    item_id: it.item_id,
    archetype_id: it.archetype,
    label: it.label,
    category: it.category,
    ...(it.equip_slot ? { equip_slot: it.equip_slot } : {}),
    ...(it.equipped_slot ? { equipped_slot: it.equipped_slot } : {}),
    quality: it.quality,
    condition: it.condition,
    max_condition: it.max_condition,
    bulk: it.bulk,
    equipped_bulk: it.equipped_bulk,
    forged_cycle: it.forged_cycle,
  }));
}

export function projectEquipment(
  items: Record<string, PortableItem> | undefined,
  playerId: string,
): Partial<
  Record<
    EquipSlot,
    {
      item_id: string;
      archetype_id: ItemArchetypeId;
      label: string;
      condition: number;
      max_condition: number;
      quality: ItemQuality;
    }
  >
> {
  const eq = equippedItemsMap(items, playerId);
  const out: Partial<
    Record<
      EquipSlot,
      {
        item_id: string;
        archetype_id: ItemArchetypeId;
        label: string;
        condition: number;
        max_condition: number;
        quality: ItemQuality;
      }
    >
  > = {};
  for (const slot of EQUIP_SLOTS) {
    const it = eq[slot];
    if (it) {
      out[slot] = {
        item_id: it.item_id,
        archetype_id: it.archetype,
        label: it.label,
        condition: it.condition,
        max_condition: it.max_condition,
        quality: it.quality,
      };
    }
  }
  return out;
}

/** Band-redacted categories for public WATCH 3D pawn silhouettes (RFC-0144 §5). */
export function equippedCategoriesForWatch(
  items: Record<string, PortableItem> | undefined,
  playerId: string,
): Array<"tool" | "weapon" | "rig"> {
  const eq = equippedItemsMap(items, playerId);
  const cats: Array<"tool" | "weapon" | "rig"> = [];
  if (eq.TOOL_SLOT && isItemOperational(eq.TOOL_SLOT)) cats.push("tool");
  if (eq.WEAPON_SLOT && isItemOperational(eq.WEAPON_SLOT)) cats.push("weapon");
  if (eq.RIG_SLOT && isItemOperational(eq.RIG_SLOT)) cats.push("rig");
  return cats;
}
