/**
 * GC2-S0 BUILD CONSTRUCT / DISMANTLE on existing infrastructure classes.
 * Authority: Noema-Specs docs/GC2-FIRST-SLICE.md / RFC-0006.
 * Events stay event-catalog/0.1. No STRUCTURE_*. Chamber help does not advertise BUILD.
 */

export const CONSTRUCTION_CATALOG_ID = "construction-catalog/gc2-s15";

export const CONSTRUCTIBLE_CLASSES = [
  "relay",
  "generator",
  "storage_bay",
  "production_node",
  "route_link",
  "workshop",
  "defensive_work",
  "archive_annex",
] as const;

export type ConstructibleClass = (typeof CONSTRUCTIBLE_CLASSES)[number];

export type ConstructionCost = {
  energy?: number;
  compute?: number;
  storage?: number;
  influence?: number;
};

export const DISMANTLE_COST: ConstructionCost = { energy: 4, compute: 2 };

/** Same cap as DEFAULT_BUDGETS.storage. Overflow salvage is dropped (no new loss event). */
export const STORAGE_CAPACITY = 16;

export const CONSTRUCT_COSTS: Record<ConstructibleClass, ConstructionCost> = {
  relay: { energy: 8, compute: 4, storage: 4, influence: 2 },
  generator: { energy: 8, compute: 3, storage: 5, influence: 0 },
  storage_bay: { energy: 5, compute: 2, storage: 6, influence: 0 },
  production_node: { energy: 7, compute: 3, storage: 4, influence: 0 },
  route_link: { energy: 8, compute: 4, storage: 4, influence: 2 },
  workshop: { energy: 6, compute: 3, storage: 5, influence: 0 },
  defensive_work: { energy: 7, compute: 3, storage: 4, influence: 3 },
  archive_annex: { energy: 6, compute: 4, storage: 4, influence: 2 },
};

export const SALVAGE_STORAGE: Record<ConstructibleClass, number> = {
  relay: 2,
  generator: 2,
  storage_bay: 3,
  production_node: 2,
  route_link: 2,
  workshop: 2,
  defensive_work: 2,
  archive_annex: 2,
};

const CLASS_SET = new Set<string>(CONSTRUCTIBLE_CLASSES);

export function isConstructibleClass(raw: string | undefined | null): raw is ConstructibleClass {
  return Boolean(raw && CLASS_SET.has(raw));
}

/** Human / structured class tokens. Rejects unknown nouns. */
export function parseConstructibleClass(raw: string): ConstructibleClass | null {
  const t = String(raw || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (t === "relay") return "relay";
  if (t === "generator") return "generator";
  if (t === "storage bay" || t === "storage") return "storage_bay";
  if (t === "production node" || t === "production") return "production_node";
  if (t === "route link" || t === "routelink") return "route_link";
  if (t === "workshop") return "workshop";
  if (t === "defensive work" || t === "defensive") return "defensive_work";
  if (t === "archive annex" || t === "annex") return "archive_annex";
  return null;
}

export type InfraLike = {
  entity_id: string;
  label: string;
  entity_type?: string;
  infra_type?: string;
  upgrade_tier?: number;
  in_progress?: boolean;
};

/** Live INFRASTRUCTURE only. Explicit infra_type wins; else id/label tokens. */
export function infraClassOf(e: InfraLike): ConstructibleClass | null {
  if ((e.entity_type || "").toUpperCase() !== "INFRASTRUCTURE") return null;
  if (isConstructibleClass(e.infra_type)) return e.infra_type;
  const blob = `${e.entity_id} ${e.label}`.toLowerCase().replace(/[_-]+/g, " ");
  if (blob.includes("relay")) return "relay";
  if (blob.includes("generator")) return "generator";
  if (blob.includes("production node") || /\bproduction\b/.test(blob)) return "production_node";
  if (blob.includes("storage bay") || /\bstorage\b/.test(blob)) return "storage_bay";
  if (blob.includes("route link") || blob.includes("routelink")) return "route_link";
  if (blob.includes("workshop")) return "workshop";
  if (blob.includes("defensive work") || blob.includes("defensivework")) return "defensive_work";
  if (blob.includes("archive annex") || blob.includes("archiveannex")) return "archive_annex";
  return null;
}

export function liveClassInRoom(entities: InfraLike[], classId: ConstructibleClass): boolean {
  return entities.some((e) => infraClassOf(e) === classId);
}

export const WORKSHOP_STORAGE_DISCOUNT = 1;
export const WORKSHOP_UPGRADE_DISCOUNT = 2;
export const UPGRADE_COST: ConstructionCost = { energy: 4, compute: 2, storage: 2, influence: 1 };
/** GC2-S6 closed table: workshop → storage_bay. Same entity_id. */
export const REPURPOSE_COST: ConstructionCost = { energy: 4, compute: 2, storage: 2, influence: 1 };
export const REPURPOSE_FROM_CLASS = "workshop" as const;
export const REPURPOSE_TO_CLASS = "storage_bay" as const;
export const ABANDON_AFTER_CYCLES = 12;
export const RESTORE_CONDITION_CAP = 50;
export const MULTI_CYCLE_CLASS: ConstructibleClass = "relay";
/** S9 relay plus S13 workshop. Other classes stay instant. */
export const MULTI_CYCLE_CLASSES: readonly ConstructibleClass[] = ["relay", "workshop", "generator", "storage_bay"];

export function isMultiCycleClass(classId: ConstructibleClass | null | undefined): boolean {
  return Boolean(classId && (MULTI_CYCLE_CLASSES as readonly string[]).includes(classId));
}
/** GC2-S10. Personal owner vests to an occupied OPERATE_NAMED_ASSET office. */
export const VEST_COST: ConstructionCost = { compute: 1 };
/** GC2-S11. Sole personal owner names one co-owner. */
export const SHARE_COST: ConstructionCost = { compute: 1 };
/** GC2-S12. Steward pins a public two-way dest on a route_link. */
export const CONNECT_COST: ConstructionCost = { compute: 1 };

export function isInProgress(entity: { in_progress?: boolean } | null | undefined): boolean {
  return entity?.in_progress === true;
}

export function shouldAbandon(
  entity: InfraLike & { unclaimed?: boolean; scar?: boolean; last_steward_cycle?: number },
  nowCycle: number,
): boolean {
  if (entity.unclaimed || entity.scar || entity.in_progress) return false;
  if (!infraClassOf(entity)) return false;
  if (entity.last_steward_cycle == null) return false;
  return nowCycle - entity.last_steward_cycle >= ABANDON_AFTER_CYCLES;
}

export function workshopStorageDiscount(entities: InfraLike[]): number {
  const shops = entities.filter((e) => infraClassOf(e) === "workshop" && !e.in_progress);
  if (!shops.length) return 0;
  return shops.some((e) => (e.upgrade_tier || 0) >= 1) ? WORKSHOP_UPGRADE_DISCOUNT : WORKSHOP_STORAGE_DISCOUNT;
}

export function withWorkshopStorage<T extends { storage?: number }>(cost: T, workshop: boolean | number): T {
  const discount = typeof workshop === "number" ? workshop : workshop ? WORKSHOP_STORAGE_DISCOUNT : 0;
  if (!discount || !cost.storage) return cost;
  const storage = Math.max(0, cost.storage - discount);
  return { ...cost, storage: storage || undefined };
}

export const ANNEX_ATTENTION_DISCOUNT = 1;

export function withAnnexAttention<T extends { attention?: number }>(cost: T, hasAnnex: boolean): T {
  if (!hasAnnex || !cost.attention) return cost;
  const attention = Math.max(0, cost.attention - ANNEX_ATTENTION_DISCOUNT);
  return { ...cost, attention: attention || undefined };
}

export function isHiddenRoom(room: { hidden?: boolean; tags?: string[] } | null | undefined): boolean {
  if (!room) return false;
  if (room.hidden === true) return true;
  return (room.tags || []).some((t) => String(t).toLowerCase() === "hidden");
}

export function isHiddenEntity(entity: { hidden?: boolean; tags?: string[] } | null | undefined): boolean {
  if (!entity) return false;
  if (entity.hidden === true) return true;
  return (entity.tags || []).some((t) => String(t).toLowerCase() === "hidden");
}

export function allocateInfraId(classId: ConstructibleClass): string {
  const hex = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `entity.${classId.replace(/_/g, "-")}.${hex}`;
}

export function scarFromDismantle(classId: ConstructibleClass): {
  entity_id: string;
  label: string;
  entity_type: "RUIN";
  condition: number;
  scar: true;
} {
  const hex = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return {
    entity_id: `entity.scar.${hex}`,
    label: `scarred-${classId.replace(/_/g, "-")}`,
    entity_type: "RUIN",
    condition: 0,
    scar: true,
  };
}

/** Labels keep the class token so GC5 relay matching and crowding stay honest. */
export function constructLabel(classId: ConstructibleClass): string {
  return classId.replace(/_/g, "-");
}

export function clampSalvage(
  currentStorage: number,
  salvage: number,
  capacity = STORAGE_CAPACITY,
): { added: number; overflow: number; next: number } {
  const room = Math.max(0, capacity - currentStorage);
  const added = Math.max(0, Math.min(salvage, room));
  return { added, overflow: Math.max(0, salvage - added), next: currentStorage + added };
}
