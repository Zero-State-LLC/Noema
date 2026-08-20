/**
 * RESOURCE-ECONOMY cycle production tick.
 * Authority: Noema-Specs docs/RESOURCE-ECONOMY.md.
 * Does not invent stock_resource. Empty authorized nodes recover; live stock is unchanged.
 */

export const NODE_STOCK_CAPACITY = 24;
export const NODE_REGEN_PER_CYCLE = 1;

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
