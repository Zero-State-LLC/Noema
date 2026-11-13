/**
 * #783 measured accessibility on live /watch (axe-core 4.14.0 in Chrome 157,
 * 1440×900 and 375×812, 2026-11-13). jsdom cannot measure contrast or layout,
 * so the live audit found three defects the shell tests could not:
 * - `[hidden]` follow buttons rendered as empty 24×32 buttons (`.btn` display won);
 * - older Recently rows faded by opacity to 4.1:1 (facts) and 3.3:1 (meta);
 * - the brand link's name "NOEMA home" omitted its visible "Perihelion Reach";
 * - the World state plate carried aria-label on a role-less div, which AT ignores.
 */
import { describe, expect, it } from "vitest";
import { PRODUCT_CSS } from "../src/shell";
import { TOKEN } from "../src/theme/tokens";
import { watchHtml } from "../src/watch";

function lin(channel: number): number {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function rgb(hex: string): number[] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: number[]): number {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: number[], b: number[]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** `--muted` is color-mix(in srgb, text-secondary 58%, text-primary). */
const MUTED = rgb(TOKEN.textSecondary).map((c, i) => 0.58 * c + 0.42 * rgb(TOKEN.textPrimary)[i]);
const FAINT = rgb(TOKEN.textSecondary);
const WORLD = rgb(TOKEN.surfaceWorld);

describe("#783 measured /watch accessibility", () => {
  it("the hidden attribute always hides, whatever a component's display rule", () => {
    expect(PRODUCT_CSS).toContain("[hidden]{display:none!important}");
    const html = watchHtml();
    expect(html).toMatch(/<button[^>]*id="watch-follow-actor"[^>]*hidden/);
    expect(html).toMatch(/<button[^>]*id="watch-follow-site"[^>]*hidden/);
  });

  it("older Recently rows dim by text colour, never opacity, and keep 4.5:1 on the world surface", () => {
    const css = watchHtml();
    const quiet = [...css.matchAll(/\.watch-feed li\.quiet[^{]*\{([^}]*)\}/g)].map((m) => m[0]);
    expect(quiet.length).toBeGreaterThan(0);
    for (const rule of quiet) expect(rule).not.toMatch(/opacity/);
    expect(css).toContain(".watch-feed li.quiet .line{color:var(--muted)}");
    expect(css).toContain(".watch-feed li.quiet .facts{color:var(--faint)}");
    expect(css).toContain(".watch-feed .meta{display:block;margin-top:.12rem;color:var(--faint)");
    expect(contrast(MUTED, WORLD)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(FAINT, WORLD)).toBeGreaterThanOrEqual(4.5);
  });

  it("the brand link's accessible name contains its visible text (label in name)", () => {
    const brand = watchHtml().match(/<a class="brand"[^>]*aria-label="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    expect(brand).not.toBeNull();
    const [, label, inner] = brand!;
    const visible = inner.replace(/<span class="brand-glyph"[\s\S]*?<\/span>/, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    expect(visible).toBe("NOEMA Perihelion Reach");
    expect(label.toLowerCase()).toContain(visible.toLowerCase());
    expect(label.toLowerCase().startsWith("noema")).toBe(true);
  });

  it("the World state plate is a labelled group, so its aria-label is not prohibited", () => {
    expect(watchHtml()).toContain('<div class="watch-state-plate" role="group" aria-label="World">');
  });
});
