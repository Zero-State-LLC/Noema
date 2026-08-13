/**
 * GC10-S0 seeded mild relay pressure. Reuses ENTITY_UPDATE.
 * Authority: Noema-Specs docs/GC10-FIRST-SLICE.md / RFC-0014.
 * PLAY must not name WED or the research class. Admin must not spawn.
 */

import { isRelayEntity, type RelayLike } from "./communication";

export const PRESSURE_CATALOG_ID = "pressure-catalog/gc10-s0";
export const PRESSURE_CLASS = "infrastructure_failure";
export const FIRST_CYCLE = 4;
export const LAST_WINDOW_CYCLE = 20;
export const CONDITION_DELTA = 15;
export const MIN_CONDITION_AFTER = 25;
export const MAX_ACTIVATIONS_1_20 = 1;
export const PREFERRED_RELAY_ID = "entity.relay-7";

export type PressureState = {
  catalog_id: typeof PRESSURE_CATALOG_ID;
  schedule_activations: number;
  last_cycle?: number;
};

export function emptyPressure(): PressureState {
  return { catalog_id: PRESSURE_CATALOG_ID, schedule_activations: 0 };
}

export function ensurePressure(raw: PressureState | undefined | null): PressureState {
  if (!raw || raw.catalog_id !== PRESSURE_CATALOG_ID) return emptyPressure();
  return {
    catalog_id: PRESSURE_CATALOG_ID,
    schedule_activations: Math.max(0, Math.floor(raw.schedule_activations || 0)),
    last_cycle: raw.last_cycle,
  };
}

export function previewAfter(before: number, delta = CONDITION_DELTA): number {
  return Math.floor(before) - delta;
}

export function isMild(after: number, min = MIN_CONDITION_AFTER): boolean {
  return after >= min;
}

export function scheduleDue(cycle: number, activations: number): boolean {
  if (cycle < FIRST_CYCLE || cycle > LAST_WINDOW_CYCLE) return false;
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
