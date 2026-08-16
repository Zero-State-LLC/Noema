/**
 * GC8-S4 cargo extra on existing MOVE.
 * Authority: Noema-Specs docs/GC8-S4-TRANSPORT.md / RFC-0048.
 */

export const TRANSPORT_CATALOG_ID = "economy-catalog/gc8-s4";
export const MOVE_BASE_ENERGY = 1;
export const MOVE_CARGO_EXTRA = 1;
export const CARGO_BELOW_STORAGE = 16;
export const CARGO_LINE = "Carrying lots costs extra to move.";

export function isCarryingLots(storage: number, grant = CARGO_BELOW_STORAGE): boolean {
  return storage < grant;
}

export function moveEnergyCost(
  storage: number,
  grant = CARGO_BELOW_STORAGE,
  waivesCargo = false,
): number {
  if (waivesCargo) return MOVE_BASE_ENERGY;
  return MOVE_BASE_ENERGY + (isCarryingLots(storage, grant) ? MOVE_CARGO_EXTRA : 0);
}

export function cargoLine(
  storage: number,
  grant = CARGO_BELOW_STORAGE,
  waivesCargo = false,
): string | undefined {
  if (waivesCargo) return undefined;
  return isCarryingLots(storage, grant) ? CARGO_LINE : undefined;
}
