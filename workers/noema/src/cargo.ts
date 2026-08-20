import { STORAGE_CAPACITY } from "./construction";

export function occupiedHold(storage: number, cap = STORAGE_CAPACITY): number {
  return Math.max(0, cap - Math.max(0, Math.floor(storage)));
}

export function canConsumeCargo(
  storage: number,
  cargo: number,
  reserved = 0,
  cap = STORAGE_CAPACITY,
): boolean {
  const need = Math.max(0, Math.floor(cargo));
  if (need <= 0) return true;
  return occupiedHold(storage, cap) - Math.max(0, reserved) >= need;
}

/** Pack occupancy reserved on OPEN personal offers. Treasury vault reservations are not cargo. */
export function reservedCargoFromTrades(
  trades: Iterable<{
    status?: string;
    proposer_id?: string;
    acting_for?: string;
    reserved?: Record<string, number>;
  }>,
  selfId: string,
): number {
  let reserved = 0;
  for (const trade of trades) {
    if (trade.status && trade.status !== "OPEN") continue;
    if (trade.proposer_id !== selfId || trade.acting_for) continue;
    reserved += Math.max(0, Math.floor(Number(trade.reserved?.storage) || 0));
  }
  return reserved;
}

export function consumeCargo(budgets: { storage?: number }, cargo: number, cap = STORAGE_CAPACITY): void {
  const need = Math.max(0, Math.floor(cargo));
  if (need <= 0) return;
  budgets.storage = Math.min(cap, Math.max(0, Math.floor(budgets.storage ?? 0)) + need);
}

export function applyTradeStorage(
  giver: { storage?: number },
  receiver: { storage?: number },
  n: number,
  cap = STORAGE_CAPACITY,
): { ok: true } | { ok: false; code: "GIVER_NOT_CARRYING" | "RECEIVER_FULL" } {
  const amt = Math.max(0, Math.floor(n));
  if (amt <= 0) return { ok: true };
  const gs = Math.max(0, Math.floor(giver.storage ?? 0));
  const rs = Math.max(0, Math.floor(receiver.storage ?? 0));
  if (!canConsumeCargo(gs, amt, 0, cap)) return { ok: false, code: "GIVER_NOT_CARRYING" };
  if (rs < amt) return { ok: false, code: "RECEIVER_FULL" };
  giver.storage = Math.min(cap, gs + amt);
  receiver.storage = rs - amt;
  return { ok: true };
}
