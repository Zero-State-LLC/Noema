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

describe("SEMANTIC §3.4 grounding term is live (metrology fix)", () => {
  it("ungrounded edges raise cascading risk above the topology-only floor", async () => {
    const { formanCascadingRisk } = await import("../src/curvature");
    const topologyOnly = formanCascadingRisk([
      { from: "a", to: "b" },
      { from: "b", to: "c" },
    ]);
    const ungrounded = formanCascadingRisk([
      { from: "a", to: "b", grounding: "hearsay" },
      { from: "b", to: "c", grounding: "hearsay" },
    ]);
    const grounded = formanCascadingRisk([
      { from: "a", to: "b", grounding: "observed" },
      { from: "b", to: "c", grounding: "observed" },
    ]);
    // Before the fix every edge was groundless, so all three were identical.
    expect(ungrounded).toBeGreaterThan(topologyOnly);
    expect(grounded).toBe(topologyOnly);
  });

  it("malformed edges are not evidence of risk (parity with economic_health.py)", async () => {
    const { formanCascadingRisk } = await import("../src/curvature");
    expect(formanCascadingRisk([{ from: "", to: "" }, { from: "a", to: "a" }])).toBe(0);
  });
});
