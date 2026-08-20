import { describe, expect, it } from "vitest";
import { STORAGE_CAPACITY } from "../src/construction";
import {
  applyTradeStorage,
  canConsumeCargo,
  consumeCargo,
  occupiedHold,
  reservedCargoFromTrades,
} from "../src/cargo";

describe("GC8-S6 cargo helpers", () => {
  it("occupied hold is capacity minus free storage", () => {
    expect(occupiedHold(16)).toBe(0);
    expect(occupiedHold(15)).toBe(1);
    expect(occupiedHold(0)).toBe(STORAGE_CAPACITY);
  });

  it("empty hold cannot consume cargo; full hold can", () => {
    expect(canConsumeCargo(16, 1)).toBe(false);
    expect(canConsumeCargo(15, 1)).toBe(true);
    expect(canConsumeCargo(0, 1)).toBe(true);
    expect(canConsumeCargo(15, 1, 1)).toBe(false);
  });

  it("consumeCargo frees storage and clamps at capacity", () => {
    const b = { storage: 0 };
    consumeCargo(b, 1);
    expect(b.storage).toBe(1);
    const fullFree = { storage: 16 };
    consumeCargo(fullFree, 1);
    expect(fullFree.storage).toBe(16);
  });

  it("TRADE cargo giver 15→16 receiver 16→15", () => {
    const g = { storage: 15 };
    const r = { storage: 16 };
    expect(applyTradeStorage(g, r, 1)).toEqual({ ok: true });
    expect(g.storage).toBe(16);
    expect(r.storage).toBe(15);
  });

  it("TRADE rejects empty giver and full receiver", () => {
    expect(applyTradeStorage({ storage: 16 }, { storage: 16 }, 1)).toEqual({
      ok: false,
      code: "GIVER_NOT_CARRYING",
    });
    expect(applyTradeStorage({ storage: 15 }, { storage: 0 }, 1)).toEqual({
      ok: false,
      code: "RECEIVER_FULL",
    });
  });

  it("reserved cargo sums OPEN proposer storage and skips treasury offers", () => {
    expect(
      reservedCargoFromTrades(
        [
          { status: "OPEN", proposer_id: "player.self", reserved: { storage: 1 } },
          { status: "OPEN", proposer_id: "player.self", reserved: { storage: 2 } },
          { status: "SETTLED", proposer_id: "player.self", reserved: { storage: 9 } },
          { status: "OPEN", proposer_id: "player.other", reserved: { storage: 4 } },
          {
            status: "OPEN",
            proposer_id: "player.self",
            acting_for: "org.line",
            reserved: { storage: 8 },
          },
        ],
        "player.self",
      ),
    ).toBe(3);
  });
});
