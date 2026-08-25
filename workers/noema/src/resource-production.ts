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
  const stock = Math.max(0, Math.floor(before));
  if (mod <= 0) return stock;
  return Math.min(cap, stock + regen * mod);
}

/** RFC-0117: cargo-full + zero-energy is not a permanent lock. */
export const LOCKOUT_REST_ENERGY = 2;
export const LOCKOUT_REST_STORAGE = 1;

export function applyLockoutRest<T extends { energy?: number; storage?: number }>(budgets: T): boolean {
  if ((budgets.energy ?? 0) !== 0 || (budgets.storage ?? 0) !== 0) return false;
  budgets.energy = LOCKOUT_REST_ENERGY;
  budgets.storage = LOCKOUT_REST_STORAGE;
  return true;
}
