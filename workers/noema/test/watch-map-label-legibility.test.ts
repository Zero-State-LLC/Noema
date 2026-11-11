/**
 * #773 — WATCH site labels sit over 3D room plates, not on the page void.
 * Cyan or ink text straight on a plate face measured 2.6:1 (#733 G3). Each 3D
 * Chamber stage label carries its own --void chip, and the uncertain (partial)
 * state dims text colour rather than the whole element's opacity (opacity would
 * also thin the chip). The MAP overlay these rules first covered is retired
 * (Noema-Specs watch-single-3d-stage.md); the rules now bind the stage labels.
 */
import { describe, expect, it } from "vitest";
import { STAGE_VIEW_CSS } from "../src/watch-stage-view";

/** Declarations of the last rule whose whole selector is exactly `selector`. */
function rule(selector: string): string {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const all = [...STAGE_VIEW_CSS.matchAll(new RegExp(`(?:^|\\})\\s*${esc}\\s*\\{([^}]*)\\}`, "g"))];
  return all.length ? all[all.length - 1][1] : "";
}

describe("#773 stage site label legibility", () => {
  it("every site label carries a dense --void chip behind its text", () => {
    const label = rule(".stage3d-label");
    const voidMix = [...label.matchAll(/background:\s*color-mix\(in srgb,\s*var\(--void\)\s*(\d+)%/g)].map((m) => Number(m[1]));
    expect(voidMix.length).toBe(1);
    expect(voidMix[0]).toBeGreaterThanOrEqual(85);
    expect(label).toMatch(/padding:/);
  });

  it("the uncertain state dims the text colour, never the chip, via opacity", () => {
    const partial = rule('.stage3d-label[data-state~="partial"]');
    expect(partial).not.toMatch(/opacity/);
    expect(partial).toMatch(/color:\s*var\(--muted\)/);
  });

  it("the followed label keeps the active colour edge", () => {
    expect(rule('.stage3d-label[data-state~="followed"]')).toMatch(/border-color:var\(--color-state-active\)/);
  });
});
