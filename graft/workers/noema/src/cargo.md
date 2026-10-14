# workers/noema/src/cargo.ts

- occupiedHold · function · L8-L10 — function occupiedHold(storage: number, cap = STORAGE_CAPACITY): number
- canConsumeCargo · function · L12-L21 — function canConsumeCargo( storage: number, cargo: number, reserved = 0, cap = STORAGE_CAPACITY, ): boolean
- reservedCargoFromTrades · function · L24-L40 — function reservedCargoFromTrades( trades: Iterable<{ status?: string; proposer_id?: string; acting_for?: string; reserved?: Record<string, number>; }>, selfId: string, ): number
- consumeCargo · function · L42-L46 — function consumeCargo(budgets: { storage?: number }, cargo: number, cap = STORAGE_CAPACITY): void
- applyCargoFuel · function · L49-L61 — function applyCargoFuel<T extends { energy?: number; storage?: number }>( budgets: T, cap = STORAGE_CAPACITY, grant = ENERGY_GRANT, ): boolean
- applyTradeStorage · function · L63-L78 — function applyTradeStorage( giver: { storage?: number }, receiver: { storage?: number }, n: number, cap = STORAGE_CAPACITY, ): { ok: true } | { ok: false; code: "GIVER_NOT_CARRYING" | "RECEIVER_FULL" }
