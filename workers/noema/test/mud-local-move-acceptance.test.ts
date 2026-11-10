import { describe, expect, it } from "vitest";
import { getEventListeners } from "node:events";
import { abortable, assertBudgetDelta } from "../scripts/mud-local-acceptance.mjs";

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

describe("synthetic request abort boundary, not runtime interruption acceptance", () => {
  it("rejects an uncooperative pending transport on SIGTERM reason", async () => {
    const controller = new AbortController();
    const reason = new Error("Interrupted by SIGTERM");
    const pending = abortable(new Promise(() => {}), controller.signal);
    expect(getEventListeners(controller.signal, "abort")).toHaveLength(1);
    controller.abort(reason);
    await expect(pending).rejects.toBe(reason);
    expect(getEventListeners(controller.signal, "abort")).toHaveLength(0);
  });

  it("rejects immediately when already aborted and handles later transport rejection", async () => {
    const controller = new AbortController();
    const reason = new Error("Interrupted by SIGTERM");
    controller.abort(reason);
    let rejectTransport!: (reason: Error) => void;
    const transport = new Promise((_, reject) => { rejectTransport = reject; });
    await expect(abortable(transport, controller.signal)).rejects.toBe(reason);
    rejectTransport(new Error("late transport failure"));
    await Promise.resolve();
    expect(getEventListeners(controller.signal, "abort")).toHaveLength(0);
  });

  it("preserves transport resolution and rejection while removing listeners", async () => {
    const controller = new AbortController();
    await expect(abortable(Promise.resolve("response"), controller.signal)).resolves.toBe("response");
    const failure = new Error("transport failure");
    await expect(abortable(Promise.reject(failure), controller.signal)).rejects.toBe(failure);
    expect(getEventListeners(controller.signal, "abort")).toHaveLength(0);
  });

  it("bounds an uncooperative transport with the combined request deadline", async () => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(10)]);
    await expect(abortable(new Promise(() => {}), signal)).rejects.toMatchObject({ name: "TimeoutError" });
    expect(getEventListeners(signal, "abort")).toHaveLength(0);
  });
});
