import { describe, expect, it } from "vitest";
import { SlidingWindowThrottle } from "../src/rate-limit";

describe("SlidingWindowThrottle", () => {
  it("allows up to the limit then refuses", () => {
    const t = new SlidingWindowThrottle(2, 60_000);
    expect(t.hit("k", 1_000)).toBe(true);
    expect(t.hit("k", 1_001)).toBe(true);
    expect(t.hit("k", 1_002)).toBe(false);
  });

  it("expires hits outside the window", () => {
    const t = new SlidingWindowThrottle(1, 100);
    expect(t.hit("k", 0)).toBe(true);
    expect(t.hit("k", 50)).toBe(false);
    expect(t.hit("k", 101)).toBe(true);
  });
});
