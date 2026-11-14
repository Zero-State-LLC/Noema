/**
 * #773 — WATCH site labels sit over 3D room plates, not on the page void.
 * Cyan or ink text straight on a plate face measured 2.6:1 (#733 G3). Each 3D
 * Chamber stage label carries its own --void chip, and the uncertain (partial)
 * state dims text colour rather than the whole element's opacity (opacity would
 * also thin the chip). The MAP overlay these rules first covered is retired
 * (Noema-Specs watch-single-3d-stage.md); the rules now bind the stage labels.
 */
import { describe, expect, it } from "vitest";
import { TOKEN } from "../src/theme/tokens";
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

/** Every declaration block whose whole selector is exactly `selector`, joined (media overrides included). */
function rules(selector: string): string {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...STAGE_VIEW_CSS.matchAll(new RegExp(`(?:^|\\}|\\*/)\\s*${esc}\\s*\\{([^}]*)\\}`, "g"))].map((m) => m[1]).join(";");
}

function voidChip(declarations: string): number | null {
  const m = declarations.match(/background:\s*color-mix\(in srgb,\s*var\(--void\)\s*(\d+)%,\s*transparent\)/);
  return m ? Number(m[1]) / 100 : null;
}

function lin(channel: number): number {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
const rgb = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const luminance = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/**
 * #783 — measured on live /watch (Chrome 157, 2026-11-13) by photographing the
 * canvas behind each overlay: labels held 11.8:1 or better, but the compass "N"
 * and the help line had no chip. Panned over the active plate, the help line fell
 * to 2.95:1 (10th percentile). Every text overlay on the canvas now carries the
 * same --void chip, and the check below holds over any pixel the scene can draw.
 */
describe("#783 stage text over the canvas always sits on a chip", () => {
  const OVERLAYS = [".stage3d-label", ".stage3d-compass", ".stage3d-help"];

  for (const selector of OVERLAYS) {
    it(`${selector} carries a --void chip of at least 85% with padding`, () => {
      const decl = rules(selector);
      expect(voidChip(decl)).not.toBeNull();
      expect(voidChip(decl)!).toBeGreaterThanOrEqual(0.85);
      expect(decl).toMatch(/padding:/);
    });
  }

  it("every overlay text colour keeps 4.5:1 on the thinnest chip, even over a white pixel", () => {
    const alpha = Math.min(...OVERLAYS.map((s) => voidChip(rules(s)) ?? 0));
    const chipOverWhite = rgb(TOKEN.surfaceWorld).map((c) => alpha * c + (1 - alpha) * 255);
    const muted = rgb(TOKEN.textSecondary).map((c, i) => 0.58 * c + 0.42 * rgb(TOKEN.textPrimary)[i]);
    const colours = { ink: rgb(TOKEN.textPrimary), muted, faint: rgb(TOKEN.textSecondary), social: rgb(TOKEN.stateSocial) };
    for (const [name, colour] of Object.entries(colours)) {
      expect(contrast(colour, chipOverWhite), name).toBeGreaterThanOrEqual(4.5);
    }
  });
});
