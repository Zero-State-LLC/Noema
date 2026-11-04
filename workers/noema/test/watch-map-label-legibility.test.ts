/**
 * #773 — WATCH map room labels sit on the WebGL room blocks (teal face), not on the page void.
 * Cyan or ink text straight on that face measured 2.6:1 (#733 G3). Each label carries its own
 * --void chip, and the held state dims text colour rather than the whole element's opacity
 * (opacity would also thin the chip). Pixel proof lives in the #733 G3 browser pass.
 */
import { describe, expect, it } from "vitest";
import { MAP_GL_CSS } from "../src/watch-map-gl";

/** Declarations of the last rule whose whole selector is exactly `selector` (anchored at rule start, so
 * `.map-labels.is-held .map-room-label` never matches `.map-room-label`). */
function rule(selector: string): string {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const all = [...MAP_GL_CSS.matchAll(new RegExp(`(?:^|\\})\\s*${esc}\\s*\\{([^}]*)\\}`, "g"))];
  return all.length ? all[all.length - 1][1] : "";
}

describe("#773 map room label legibility", () => {
  it("every room label carries a dense --void chip behind its text", () => {
    const label = rule(".map-room-label");
    const voidMix = [...label.matchAll(/background:\s*color-mix\(in srgb,\s*var\(--void\)\s*(\d+)%/g)].map((m) => Number(m[1]));
    expect(voidMix.length).toBe(1);
    expect(voidMix[0]).toBeGreaterThanOrEqual(85);
    expect(label).toMatch(/padding:/);
  });

  it("the held state dims the text colour, never the chip, via opacity", () => {
    const held = rule(".map-labels.is-held .map-room-label");
    expect(held).not.toMatch(/opacity/);
    expect(held).toMatch(/color:\s*var\(--muted\)/);
  });

  it("the focus label keeps the active colour", () => {
    expect(rule(".map-room-label.is-focus")).toMatch(/color:var\(--color-state-active\)/);
  });
});
