/**
 * Public-web presence polish: one door landing → /watch (TEXT·PIXEL·MAP) → agent CTA.
 * Presentation only. No protocol, Genesis, or Player-verb change.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { landingHtml } from "../src/landing";
import { manifestoHtml } from "../src/manifesto";
import { PRODUCT_CSS } from "../src/shell";
import { TOKEN_CSS } from "../src/theme/tokens";
import { watchHtml } from "../src/watch";
import { MAP_STAGE_CSS } from "../src/watch-map-page";
import { WITHHELD_LEDE, WITHHELD_NONE } from "../src/watch-theater";

const HERE = dirname(fileURLToPath(import.meta.url));
const PAGES = readFileSync(join(HERE, "../../../site/index.html"), "utf8");
const PAGES_CSS = readFileSync(join(HERE, "../../../site/assets/site.css"), "utf8");

const BRAND_BAN = /Orbitron|scanline|glitch|reticle|neon-grid|dashboard|particle/i;

describe("noema-web-presence-p0 — landing door", () => {
  const door = landingHtml();

  it("makes Watch the primary CTA and agent inhabit the second", () => {
    expect(door).toContain('href="/watch">Watch</a>');
    expect(door).toContain('href="/connect">Bring your own agent</a>');
    expect(door).toContain("Watch · TEXT · PIXEL · MAP");
    expect(door.indexOf('href="/watch">Watch</a>')).toBeLessThan(door.indexOf("Bring your own agent"));
    expect(door.indexOf("hero-cta")).toBeLessThan(door.indexOf("hero-gate"));
    expect(door).toContain("/v1/play/login/request");
    expect(door).toContain("Send watch link");
    expect(door).not.toContain("hero-watch");
    expect(door).not.toContain("Open the door");
  });

  it("shares LIVE badge language with /watch without a health chip", () => {
    expect(door).toContain('id="home-live"');
    expect(door).toMatch(/id="home-live"[^>]*hidden/);
    expect(door).toContain('id="home-now"');
    expect(door).toContain('live.className = "tag ok"');
    expect(door).not.toMatch(/id="rt-label"/);
    expect(door).not.toMatch(/id="dot"/);
  });
});

describe("noema-web-presence-p0 — pages pointer", () => {
  it("matches hosted first-read CTAs and Chamber tokens", () => {
    expect(PAGES).toContain("https://noema.guru/watch");
    expect(PAGES).toContain("https://noema.guru/connect");
    expect(PAGES).toContain("Bring your own agent");
    expect(PAGES).toContain("Watch · TEXT · PIXEL · MAP");
    expect(PAGES).toContain('id="home-live"');
    expect(PAGES).not.toContain("Open the door");
    expect(PAGES).not.toMatch(/type="email"/);
    expect(PAGES_CSS).toContain("--void: #0E1114");
    expect(PAGES_CSS).toContain("--ink: #E8E4DC");
    expect(PAGES_CSS).not.toMatch(/--bone:/);
    expect(PAGES).not.toMatch(BRAND_BAN);
  });
});

describe("noema-web-presence-p0 — shared chrome", () => {
  it("exports Chamber type scale and LIVE tag treatment", () => {
    expect(TOKEN_CSS).toContain("--paper:var(--color-surface-panel)");
    expect(TOKEN_CSS).toContain("--text-kicker:");
    expect(TOKEN_CSS).toContain("--text-hero-line:");
    expect(PRODUCT_CSS).toContain(".tag.ok");
    expect(PRODUCT_CSS).toContain(".tag::before");
    expect(PRODUCT_CSS).toContain(".modes-kicker");
    expect(PRODUCT_CSS).not.toMatch(/animation:[^;]*infinite/);
  });

  it("keeps manifesto on the same Watch → agent path", () => {
    const html = manifestoHtml();
    expect(html).toContain('href="/watch">Watch</a>');
    expect(html).toContain('href="/connect">Bring your own agent</a>');
    expect(html).not.toMatch(BRAND_BAN);
  });
});

describe("noema-web-presence-p0 — watch chrome", () => {
  const watch = watchHtml();
  const map = watchHtml({ mode: "map" });
  const text = watchHtml({ mode: "text" });

  it("keeps Gate D five-slot readable and MAP on Chamber tokens", () => {
    expect(watch).toContain('id="watch-state"');
    expect(watch).toContain('id="watch-mode-text"');
    expect(watch).toContain('id="watch-mode-pixel"');
    expect(watch).toContain('id="watch-mode-map"');
    expect(watch).toContain('id="watch-hero-who"');
    expect(watch).toContain('id="watch-hero-where"');
    expect(watch).toContain('id="watch-conseq"');
    expect(watch).toContain('id="watch-feed"');
    expect(watch).toContain('id="watch-withheld"');
    expect(watch).toContain(WITHHELD_LEDE);
    expect(watch).toContain(WITHHELD_NONE);
    expect(watch).toContain("watch-follow-bar");
    expect(watch).toContain("Clear follow");
    expect(MAP_STAGE_CSS).toContain("background:var(--panel)");
    expect(MAP_STAGE_CSS).toContain("background:var(--void-2)");
    expect(MAP_STAGE_CSS).toContain("map-chrome-layers");
    expect(MAP_STAGE_CSS).toContain("flex-direction:column");
    expect(MAP_STAGE_CSS).not.toMatch(/var\(--paper\)/);
    expect(MAP_STAGE_CSS).not.toMatch(/max-width:\s*36rem/);
    expect(watch).toContain("align-items:start");
    expect(map.indexOf('id="watch-hero-who"')).toBeGreaterThan(map.indexOf('id="watch-map-gl"'));
    expect(text).not.toContain('from "three"');
    expect(watch).not.toMatch(BRAND_BAN);
    expect(watch).not.toMatch(/animation:[^;]*infinite/);
  });
});
