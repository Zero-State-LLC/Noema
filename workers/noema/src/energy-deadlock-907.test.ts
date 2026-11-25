import { describe, expect, it } from "vitest";
import { applyLockoutRest, LOCKOUT_REST_ENERGY, LOCKOUT_REST_STORAGE } from "./resource-production";

describe("applyLockoutRest (#907 energy deadlock)", () => {
  it("recovers +2 energy when energy is 0 and hold is empty, preserving free storage", () => {
    const budgets = { energy: 0, storage: 16, cargo: {} };
    expect(applyLockoutRest(budgets)).toBe(true);
    expect(budgets.energy).toBe(LOCKOUT_REST_ENERGY);
    expect(budgets.storage).toBe(16);
  });

  it("recovers +2 energy and +1 storage when energy is 0 and hold is full (RFC-0117)", () => {
    const budgets = { energy: 0, storage: 0, cargo: { ore: 16 } };
    expect(applyLockoutRest(budgets)).toBe(true);
    expect(budgets.energy).toBe(LOCKOUT_REST_ENERGY);
    expect(budgets.storage).toBe(LOCKOUT_REST_STORAGE);
  });

  it("defers to cargo fuel when energy is 0 with non-empty hold and free storage", () => {
    const budgets = { energy: 0, storage: 12, cargo: { ore: 4 } };
    expect(applyLockoutRest(budgets)).toBe(false);
    expect(budgets.energy).toBe(0);
    expect(budgets.storage).toBe(12);
  });

  it("does not trigger when energy is greater than 0", () => {
    const budgets = { energy: 1, storage: 16, cargo: {} };
    expect(applyLockoutRest(budgets)).toBe(false);
    expect(budgets.energy).toBe(1);
  });
});
