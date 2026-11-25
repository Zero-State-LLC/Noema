/**
 * RESOURCE-ECONOMY cycle production tick.
 * Authority: Noema-Specs docs/RESOURCE-ECONOMY.md.
 * Does not invent stock_resource. Empty authorized nodes recover; leftover trade-board stock is unchanged.
 */

import { PREFERRED_NODE_ID } from "./pressure";

export const NODE_STOCK_CAPACITY = 24;
export const NODE_REGEN_PER_CYCLE = 1;

export function isAuthorizedHarvestNode(entityId: string | undefined): boolean {
  return (
    entityId === PREFERRED_NODE_ID ||
    entityId === "entity.salvage-cache" ||
    entityId === "entity.production-node-ewm"
  );
}

export function productionModifier(
  entities: Array<{ infra_type?: string; condition?: number }>,
): number {
  const production = (entities || []).filter(
    (e) => e.infra_type === "generator" || e.infra_type === "production_node",
  );
  if (!production.length) return 1;
  const minC = Math.min(
    ...production.map((e) => (typeof e.condition === "number" ? e.condition : 100)),
  );
  if (minC < 25) return 0;
  return 1 + Math.floor(minC / 50);
}

export function previewStockRegen(
  before: number,
  mod = 1,
  regen = NODE_REGEN_PER_CYCLE,
  cap = NODE_STOCK_CAPACITY,
): number {
  const stock = Math.max(0, Number.isFinite(before) ? before : 0);
  if (mod <= 0) return stock;
  return Math.min(cap, stock + regen * mod);
}

import { occupiedHold } from "./cargo";

/** RFC-0117 + #907: zero-energy with full hold OR empty hold is not a permanent lock.
 *  Empty hold also rests below LOCKOUT_REST_ENERGY: every MOVE lands at 1, which no WAIT could lift (#907 follow-up). */
export const LOCKOUT_REST_ENERGY = 2;
export const LOCKOUT_REST_STORAGE = 1;

export function applyLockoutRest<T extends { energy?: number; storage?: number }>(budgets: T): boolean {
  const energy = budgets.energy ?? 0;
  if (energy >= LOCKOUT_REST_ENERGY) return false;
  const freeStorage = budgets.storage ?? 0;
  const fullHold = freeStorage === 0;
  const emptyHold = occupiedHold(freeStorage) === 0;
  if (energy !== 0 && !emptyHold) return false;
  if (!fullHold && !emptyHold) return false;
  budgets.energy = LOCKOUT_REST_ENERGY;
  if (fullHold) {
    budgets.storage = LOCKOUT_REST_STORAGE;
  }
  return true;
}
