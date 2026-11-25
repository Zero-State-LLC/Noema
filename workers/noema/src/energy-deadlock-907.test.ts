import { describe, expect, it } from "vitest";
import { applyLockoutRest, LOCKOUT_REST_ENERGY, LOCKOUT_REST_STORAGE } from "./resource-production";

describe("applyLockoutRest (#907 energy deadlock)", () => {
  it("recovers +2 energy when energy is 0 and hold is empty (storage === 16), preserving free storage", () => {
    const budgets = { energy: 0, storage: 16 };
    expect(applyLockoutRest(budgets)).toBe(true);
    expect(budgets.energy).toBe(LOCKOUT_REST_ENERGY);
    expect(budgets.storage).toBe(16);
  });

  it("recovers +2 energy and +1 storage when energy is 0 and hold is full (storage === 0, RFC-0117)", () => {
    const budgets = { energy: 0, storage: 0 };
    expect(applyLockoutRest(budgets)).toBe(true);
    expect(budgets.energy).toBe(LOCKOUT_REST_ENERGY);
    expect(budgets.storage).toBe(LOCKOUT_REST_STORAGE);
  });

  it("defers to cargo fuel when energy is 0 with partial hold (0 < storage < 16)", () => {
    const budgets = { energy: 0, storage: 12 };
    expect(applyLockoutRest(budgets)).toBe(false);
    expect(budgets.energy).toBe(0);
    expect(budgets.storage).toBe(12);
  });

  it("does not trigger when energy is greater than 0", () => {
    const budgets = { energy: 1, storage: 8 };
    expect(applyLockoutRest(budgets)).toBe(false);
    expect(budgets.energy).toBe(1);
  });

  it("rests to 2 at energy 1 with an empty hold (every MOVE lands at 1; HARVEST needs 2)", () => {
    const budgets = { energy: 1, storage: 16 };
    expect(applyLockoutRest(budgets)).toBe(true);
    expect(budgets.energy).toBe(LOCKOUT_REST_ENERGY);
    expect(budgets.storage).toBe(16);
  });

  it("never rests at or above 2", () => {
    const budgets = { energy: 2, storage: 16 };
    expect(applyLockoutRest(budgets)).toBe(false);
    expect(budgets.energy).toBe(2);
  });

  it("energy 1 with a full hold defers to cargo fuel", () => {
    const budgets = { energy: 1, storage: 0 };
    expect(applyLockoutRest(budgets)).toBe(false);
  });
});
