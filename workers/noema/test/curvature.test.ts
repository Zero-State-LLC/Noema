import { describe, expect, it } from "vitest";
import { formanCascadingRisk } from "../src/curvature";

describe("formanCascadingRisk", () => {
  it("one edge is low; a star of 8 unique TRADE edges is high", () => {
    expect(formanCascadingRisk([{ from: "a", to: "b" }])).toBeLessThan(0.2);
    const star = Array.from({ length: 8 }, (_, i) => ({ from: "hub", to: `leaf.${i}` }));
    expect(formanCascadingRisk(star)).toBeGreaterThan(0.5);
  });

  it("eight parallel hearsay edges stay high via density", () => {
    const edges = Array.from({ length: 8 }, () => ({ from: "a", to: "b", grounding: "hearsay" }));
    expect(formanCascadingRisk(edges)).toBeGreaterThan(0.5);
  });
});
