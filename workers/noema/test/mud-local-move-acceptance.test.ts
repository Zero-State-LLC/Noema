import { describe, expect, it } from "vitest";
import { assertBudgetDelta } from "../scripts/mud-local-acceptance.mjs";

// Synthetic assertion tests only. Actual workerd CLI acceptance is required separately.
describe("synthetic MOVE budget assertion mutations, not runtime acceptance", () => {
  const before = { attention: 8, compute: 64, energy: 80, influence: 40, storage: 16 };
  it("accepts empty-cargo MOVE, rejection and independent LOOK exact deltas", () => {
    expect(() => assertBudgetDelta(before, { ...before, energy: 79 }, { energy: -1 })).not.toThrow();
    expect(() => assertBudgetDelta(before, before, {})).not.toThrow();
    expect(() => assertBudgetDelta(before, { ...before, attention: 7 }, { attention: -1 })).not.toThrow();
  });
  for (const key of Object.keys(before)) {
    it(`rejects unexpected ${key} mutation including hidden LOOK debit`, () => {
      const after = { ...before, energy: 79 };
      after[key as keyof typeof after] -= 1;
      expect(() => assertBudgetDelta(before, after, { energy: -1 })).toThrow();
    });
    it(`rejects absent or nonfinite ${key}`, () => {
      expect(() => assertBudgetDelta(before, { ...before, [key]: undefined }, {})).toThrow();
      expect(() => assertBudgetDelta({ ...before, [key]: NaN }, before, {})).toThrow();
    });
  }
});
