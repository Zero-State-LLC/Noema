# workers/noema/src/resource-production.ts

- isAuthorizedHarvestNode · function · L12-L18 — function isAuthorizedHarvestNode(entityId: string | undefined): boolean
- productionModifier · function · L20-L32 — function productionModifier( entities: Array<{ infra_type?: string; condition?: number }>, ): number
- previewStockRegen · function · L34-L43 — function previewStockRegen( before: number, mod = 1, regen = NODE_REGEN_PER_CYCLE, cap = NODE_STOCK_CAPACITY, ): number
- applyLockoutRest · function · L49-L54 — function applyLockoutRest<T extends { energy?: number; storage?: number }>(budgets: T): boolean
