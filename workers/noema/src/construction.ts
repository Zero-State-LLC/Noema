/**
 * GC2-S0 BUILD CONSTRUCT / DISMANTLE on existing infrastructure classes.
 * Authority: Noema-Specs docs/GC2-FIRST-SLICE.md / RFC-0006.
 * Events stay event-catalog/0.1. No STRUCTURE_*. Chamber help does not advertise BUILD.
 */

export const CONSTRUCTION_CATALOG_ID = "construction-catalog/gc2-s0";

export const CONSTRUCTIBLE_CLASSES = [
  "relay",
  "generator",
  "storage_bay",
  "production_node",
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
};

export const SALVAGE_STORAGE: Record<ConstructibleClass, number> = {
  relay: 2,
  generator: 2,
  storage_bay: 3,
  production_node: 2,
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
  return null;
}

export type InfraLike = {
  entity_id: string;
  label: string;
  entity_type?: string;
  infra_type?: string;
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
  return null;
}

export function liveClassInRoom(entities: InfraLike[], classId: ConstructibleClass): boolean {
  return entities.some((e) => infraClassOf(e) === classId);
}

export function isHiddenRoom(room: { hidden?: boolean; tags?: string[] } | null | undefined): boolean {
  if (!room) return false;
  if (room.hidden === true) return true;
  return (room.tags || []).some((t) => String(t).toLowerCase() === "hidden");
}

export function allocateInfraId(classId: ConstructibleClass): string {
  const hex = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `entity.${classId.replace(/_/g, "-")}.${hex}`;
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
