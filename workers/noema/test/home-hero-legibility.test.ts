/**
 * #771 — Home hero legibility on the photo.
 * Structural guards for two defects measured in a real browser (#733 G3):
 *  1. at phone widths the wrapped nav grid must sit in normal flow, never over the hero copy;
 *  2. the hero copy must sit on its own dark scrim so worst-case photo pixels keep text >= 4.5:1.
 * The pixel measurement itself lives in the #733 G3 browser pass; these tests pin the CSS that makes it pass.
 */
import { describe, expect, it } from "vitest";
import { landingHtml } from "../src/landing";

const html = landingHtml();
const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");

/** Body of the first `@media(max-width:<px>px){...}` block, brace-balanced. */
function mediaBlock(px: number): string {
  const start = css.indexOf(`@media(max-width:${px}px){`);
  if (start < 0) return "";
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(css.indexOf("{", start) + 1, i);
  }
  return "";
}

/** Declarations of the last rule whose selector list is exactly `selector` within `scope`. */
function rule(scope: string, selector: string): string {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const all = [...scope.matchAll(new RegExp(`(?:^|[}\\s])${esc}\\s*\\{([^}]*)\\}`, "g"))];
  return all.length ? all[all.length - 1][1] : "";
}

describe("#771 Home hero legibility", () => {
  it("at phone widths the hero-bleed header is in normal flow on an opaque background", () => {
    const top = rule(mediaBlock(760), "body.hero-bleed .top");
    expect(top).toMatch(/position:\s*relative/);
    expect(top).toMatch(/background:\s*var\(--void\)/);
  });

  it("the hero copy carries its own dark scrim behind the text, full-bleed", () => {
    const scrim = rule(css, ".hero-copy::before");
    expect(scrim).toMatch(/content:\s*""/);
    expect(scrim).toMatch(/position:\s*absolute/);
    expect(scrim).toMatch(/z-index:\s*-1/);
    const voidMixes = [...scrim.matchAll(/color-mix\(in srgb,\s*var\(--void\)\s*(\d+)%/g)].map((m) => Number(m[1]));
    expect(voidMixes.length).toBeGreaterThan(0);
    // The darkest stop sits behind the text; it must be dense enough for worst-case photo pixels.
    expect(Math.max(...voidMixes)).toBeGreaterThanOrEqual(84);
  });

  it("low-noise mode still removes the art without leaving a stray scrim box", () => {
    expect(css).toMatch(/body\.is-low-noise\.hero-bleed \.hero-copy::before\s*\{[^}]*display:\s*none/);
  });
});
