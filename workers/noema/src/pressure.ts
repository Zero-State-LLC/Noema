/**
 * GC10-S1 additional world pressure. Reuses ENTITY_UPDATE / ACCESS_RESTRICTED.
 * Authority: Noema-Specs docs/GC10-S1-PRESSURE.md / RFC-0027.
 * GC10-S0 infrastructure_failure remains valid.
 * PLAY must not name WED or research classes. Admin must not spawn.
 */

import { isRelayEntity, type RelayLike } from "./communication";

export const PRESSURE_CATALOG_ID = "pressure-catalog/gc10-s1";
export const PRESSURE_CATALOG_S0 = "pressure-catalog/gc10-s0";
export const PRESSURE_CLASS = "infrastructure_failure";
export const FIRST_CYCLE = 4;
export const LAST_WINDOW_CYCLE = 20;
export const CONDITION_DELTA = 15;
export const MIN_CONDITION_AFTER = 25;
export const MAX_ACTIVATIONS_1_20 = 1;
export const PREFERRED_RELAY_ID = "entity.relay-7";

export const RESOURCE_CLASS = "resource_scarcity";
export const RESOURCE_FIRST_CYCLE = 8;
export const STOCK_DELTA = 4;
export const MIN_STOCK_BEFORE = 4;
export const PREFERRED_NODE_ID = "entity.storage-cell-cache";

export const ACCESS_CLASS = "access_restriction";
export const ACCESS_FIRST_CYCLE = 12;
export const ACCESS_DURATION_CYCLES = 4;
export const PREFERRED_ROOM_ID = "room.relay-quarter";
export const PREFERRED_EXIT = "east";

export const WATCH_INFRA_PULSE = "A relay in the hub has degraded.";
export const WATCH_RESOURCE_PULSE = "Extraction at a storage cache has fallen.";
export const WATCH_ACCESS_PULSE = "Traffic through a public corridor has slowed.";

export type PressureClassId =
  | "infrastructure_failure"
  | "resource_scarcity"
  | "access_restriction";

export type PressurePulse = { text: string; until_cycle: number };

export type PressureState = {
  catalog_id: typeof PRESSURE_CATALOG_ID | typeof PRESSURE_CATALOG_S0;
  schedule_activations: number;
  last_cycle?: number;
  class_activations?: Partial<Record<PressureClassId, number>>;
  last_by_class?: Partial<Record<PressureClassId, number>>;
  public_pulses?: PressurePulse[];
};

const EMPTY_CLASSES: Record<PressureClassId, number> = {
  infrastructure_failure: 0,
  resource_scarcity: 0,
  access_restriction: 0,
};

export function emptyPressure(): PressureState {
  return {
    catalog_id: PRESSURE_CATALOG_ID,
    schedule_activations: 0,
    class_activations: { ...EMPTY_CLASSES },
    last_by_class: {},
    public_pulses: [],
  };
}

export function ensurePressure(raw: PressureState | undefined | null): PressureState {
  if (!raw) return emptyPressure();
  const infra =
    raw.class_activations?.infrastructure_failure ??
    Math.max(0, Math.floor(raw.schedule_activations || 0));
  const resource = Math.max(0, Math.floor(raw.class_activations?.resource_scarcity || 0));
  const access = Math.max(0, Math.floor(raw.class_activations?.access_restriction || 0));
  const lastBy = { ...(raw.last_by_class || {}) };
  if (!lastBy.infrastructure_failure && raw.last_cycle && infra > 0) {
    lastBy.infrastructure_failure = raw.last_cycle;
  }
  return {
    catalog_id: PRESSURE_CATALOG_ID,
    schedule_activations: infra,
    last_cycle: raw.last_cycle,
    class_activations: {
      infrastructure_failure: infra,
      resource_scarcity: resource,
      access_restriction: access,
    },
    last_by_class: lastBy,
    public_pulses: Array.isArray(raw.public_pulses) ? raw.public_pulses.slice() : [],
  };
}

export function previewAfter(before: number, delta = CONDITION_DELTA): number {
  return Math.floor(before) - delta;
}

export function previewStockAfter(before: number, delta = STOCK_DELTA): number {
  return Math.floor(before) - delta;
}

export function isMild(after: number, min = MIN_CONDITION_AFTER): boolean {
  return after >= min;
}

export function scheduleDue(cycle: number, activations: number): boolean {
  return classDue(cycle, "infrastructure_failure", activations);
}

export function classDue(cycle: number, cls: PressureClassId, activations: number): boolean {
  const first =
    cls === "infrastructure_failure"
      ? FIRST_CYCLE
      : cls === "resource_scarcity"
        ? RESOURCE_FIRST_CYCLE
        : ACCESS_FIRST_CYCLE;
  if (cycle < first || cycle > LAST_WINDOW_CYCLE) return false;
  return activations < MAX_ACTIVATIONS_1_20;
}

export type PressureTarget = RelayLike & { room_id: string };

export function collectLiveRelaysWithRoom(
  rooms: Record<string, { room_id?: string; entities?: RelayLike[] }>,
): PressureTarget[] {
  const out: PressureTarget[] = [];
  for (const room of Object.values(rooms || {})) {
    for (const e of room.entities || []) {
      if (!isRelayEntity(e)) continue;
      out.push({
        entity_id: e.entity_id,
        label: e.label,
        entity_type: e.entity_type,
        condition: e.condition,
        room_id: room.room_id || "",
      });
    }
  }
  return out;
}

/** Prefer the Chamber seed relay when a −15 drop stays ≥ 25. */
export function selectScheduleRelay(targets: PressureTarget[]): PressureTarget | null {
  const mild = targets.filter((e) => isMild(previewAfter(e.condition ?? 0)));
  if (!mild.length) return null;
  const preferred = mild.find((e) => e.entity_id === PREFERRED_RELAY_ID);
  if (preferred) return preferred;
  return [...mild].sort((a, b) => (b.condition ?? 0) - (a.condition ?? 0))[0] || null;
}

export type HarvestTarget = {
  entity_id: string;
  label: string;
  room_id: string;
  stock_amount: number;
  stock_resource?: string;
};

export function collectHarvestNodes(
  rooms: Record<
    string,
    {
      room_id?: string;
      entities?: Array<{
        entity_id: string;
        label: string;
        stock_resource?: string;
        stock_amount?: number;
      }>;
    }
  >,
): HarvestTarget[] {
  const out: HarvestTarget[] = [];
  for (const room of Object.values(rooms || {})) {
    for (const e of room.entities || []) {
      if (!e.stock_resource) continue;
      const stock = Math.floor(e.stock_amount ?? 0);
      if (stock < MIN_STOCK_BEFORE) continue;
      out.push({
        entity_id: e.entity_id,
        label: e.label,
        room_id: room.room_id || "",
        stock_amount: stock,
        stock_resource: e.stock_resource,
      });
    }
  }
  return out;
}

export function selectScheduleNode(targets: HarvestTarget[]): HarvestTarget | null {
  const eligible = targets.filter((e) => e.stock_amount >= MIN_STOCK_BEFORE);
  if (!eligible.length) return null;
  const preferred = eligible.find((e) => e.entity_id === PREFERRED_NODE_ID);
  if (preferred) return preferred;
  return (
    [...eligible].sort((a, b) => b.stock_amount - a.stock_amount || a.entity_id.localeCompare(b.entity_id))[0] ||
    null
  );
}

export type AccessTarget = { room_id: string; exit_id: string; to_room_id: string };

export function collectPublicExits(
  rooms: Record<string, { room_id?: string; hidden?: boolean; exits?: Array<{ direction: string; to_room_id: string }> }>,
): AccessTarget[] {
  const out: AccessTarget[] = [];
  for (const room of Object.values(rooms || {})) {
    if (room.hidden) continue;
    for (const x of room.exits || []) {
      if (!x.direction || !x.to_room_id) continue;
      out.push({
        room_id: room.room_id || "",
        exit_id: x.direction,
        to_room_id: x.to_room_id,
      });
    }
  }
  return out;
}

export function selectScheduleExit(targets: AccessTarget[]): AccessTarget | null {
  if (!targets.length) return null;
  const preferred = targets.find(
    (t) => t.room_id === PREFERRED_ROOM_ID && t.exit_id === PREFERRED_EXIT,
  );
  if (preferred) return preferred;
  return [...targets].sort(
    (a, b) => a.room_id.localeCompare(b.room_id) || a.exit_id.localeCompare(b.exit_id),
  )[0] || null;
}

export function notePulse(state: PressureState, text: string, until_cycle: number): void {
  const pulses = state.public_pulses || [];
  const next = pulses.filter((p) => p.text !== text);
  next.push({ text, until_cycle });
  state.public_pulses = next;
}

export function publicPressurePulses(
  state: PressureState | undefined | null,
  cycle: number,
): string[] {
  const snap = ensurePressure(state);
  return (snap.public_pulses || [])
    .filter((p) => cycle <= p.until_cycle)
    .map((p) => p.text);
}

export function adminPressureView(state: PressureState | undefined | null): Record<string, unknown> {
  const snap = ensurePressure(state);
  return {
    catalog_id: snap.catalog_id,
    rule_version: "gc10-s1",
    cause_class: "EXOGENOUS_SCHEDULE",
    classes: {
      infrastructure_failure: {
        activations: snap.class_activations?.infrastructure_failure || 0,
        last_cycle: snap.last_by_class?.infrastructure_failure || null,
      },
      resource_scarcity: {
        activations: snap.class_activations?.resource_scarcity || 0,
        last_cycle: snap.last_by_class?.resource_scarcity || null,
      },
      access_restriction: {
        activations: snap.class_activations?.access_restriction || 0,
        last_cycle: snap.last_by_class?.access_restriction || null,
      },
    },
  };
}
