/**
 * Brand Slice 9 — Visual QA.
 * Makes PLAYER-BRAND.md's 14 statements testable against shipped Worker HTML.
 * No Playwright. No world-rule change.
 */
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { adminHtml, adminLoginHtml } from "../src/admin";
import { connectHtml } from "../src/connect";
import { landingHtml } from "../src/landing";
import { manifestoHtml } from "../src/manifesto";

import { label } from "../src/presentation/terms";
import { studyHtml } from "../src/study";
import { TOKEN } from "../src/theme/tokens";
import { watchHtml } from "../src/watch";
import { collectPulses, PHOSPHOR_ASSET_BUDGET, PHOSPHOR_JS_BUDGET } from "../src/watch-phosphor";

const HERE = dirname(fileURLToPath(import.meta.url));
const MATRIX = JSON.parse(readFileSync(join(HERE, "brand-screenshot-matrix.json"), "utf8")) as {
  slice: string;
  kind: string;
  statements: number;
  reduced_motion: boolean;
  required_states: string[];
  viewports: Array<{ id: string; width: number }>;
  screens: Array<{ id: string; route: string; states: string[] }>;
};

const FIRST_READ_BAN = [
  "apparatus",
  "conformance",
  "capability",
  "evidence boundary",
  "humans & agents",
  "stage 0",
  "experimental",
];

function firstRead(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

function lin(channel: number): number {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}

function contrast(a: string, b: string): number {
  const hi = Math.max(luminance(a), luminance(b));
  const lo = Math.min(luminance(a), luminance(b));
  return (hi + 0.05) / (lo + 0.05);
}

describe("brand slice 9 — capture matrix", () => {
  it("covers the five viewports and required visual states", () => {
    expect(MATRIX.slice).toBe("9");
    expect(MATRIX.kind).toBe("visual-qa");
    expect(MATRIX.statements).toBe(14);
    expect(MATRIX.reduced_motion).toBe(true);
    expect(MATRIX.viewports.map((v) => v.width)).toEqual([360, 390, 768, 1280, 1440]);
    const states = new Set(MATRIX.screens.flatMap((s) => s.states));
    expect(states.has("paused")).toBe(true);
    expect(states.has("major")).toBe(true);
    expect(states.has("empty") || states.has("empty-here")).toBe(true);
    expect(MATRIX.screens.every((s) => s.route.startsWith("/"))).toBe(true);
    expect(MATRIX.required_states).toEqual(["empty", "loading", "error", "paused", "major"]);
    const watchScreen = MATRIX.screens.find((s) => s.id === "watch");
    expect(watchScreen?.states).toEqual(
      expect.arrayContaining(["empty", "loading", "error", "paused", "major"]),
    );
  });
});

describe("brand slice 9 — 14 PLAYER-BRAND statements", () => {
  const door = landingHtml();
  const manifesto = manifestoHtml();
  const play = connectHtml();
  const watch = watchHtml();
  const admin = adminHtml();
  const login = adminLoginHtml();
  const study = studyHtml();
  const connect = connectHtml();

  it("1. NOEMA reads immediately as a science-fiction game", () => {
    const hay = firstRead(door);
    expect(hay).toMatch(/Perihelion Reach/);
    expect(hay).toMatch(/Watch the agents play/);
    expect(door).toContain("family=Syne");
    expect(hay).not.toMatch(/Sign in to your account/i);
    expect(hay).not.toMatch(/research apparatus/i);
    expect(hay).not.toMatch(/Get started for free/i);
  });

  it("2. Research terminology does not dominate the player experience", () => {
    for (const html of [door, play]) {
      const hay = firstRead(html).toLowerCase();
      for (const word of FIRST_READ_BAN) {
        expect(hay, word).not.toContain(word);
      }
    }
    expect(firstRead(play)).not.toMatch(/\bLEARN\b/);
    expect(firstRead(play)).not.toMatch(/\bCAPTURE\b/);
  });

  it("3. Interface has meaningful visual density without a blank canvas", () => {
    expect(connect).toContain("connect-work");
    expect(connect).toContain('id="d-code"');
    expect(watch).toContain("/v1/watch/live");
    expect(door).toContain("hero-bleed");
  });

  it("4. Color conveys semantic state and is labeled", () => {
    expect(watch).toContain("--color-state-active");
    expect(watch).toContain("--color-state-warning");
    expect(watch).toContain("--color-state-critical");
    expect(watch).toContain("--color-state-unknown");
    expect(watch).toContain("--color-state-economic");
    expect(watch).toContain("--color-state-social");
    expect(watch).toContain("<summary>Key</summary>");
    expect(watch).toMatch(/aria-label="/);
  });

  it("5. Monospace is restricted to machine/data contexts", () => {
    expect(connect).toContain("font-mono");
    expect(connect).toContain("<code>");
  });

  it("6. Major world changes are visually apparent", () => {
    expect(watch).toMatch(/\.watch-hero\.major\{[\s\S]*animation:threshold-in 240ms/);
    expect(watch).not.toMatch(/animation:[^;]*infinite/);
  });

  it("7. Spectators can determine location and activity", () => {
    expect(watch).toContain("/v1/watch/live");
    expect(connect).toContain("Connect an agent");
  });

  it("8. Aesthetic avoids generic cyberpunk clichés", () => {
    for (const html of [door, manifesto, play, watch, connect, study, login, admin]) {
      expect(html).not.toMatch(/scanline/i);
      expect(html).not.toMatch(/glitch/i);
      expect(html).not.toMatch(/Orbitron/i);
      expect(html).not.toMatch(/reticle/i);
      expect(html).not.toMatch(/neon-grid|neon grid/i);
    }
    expect(watch).not.toMatch(/dashboard/i);
    expect(watch).not.toMatch(/particle/i);
  });

  it("9. Mobile remains usable", () => {
    expect(connect).toContain("connect-work");
    expect(watch).toContain("prefers-reduced-motion");
  });

  it("10. The text-game core remains primary", () => {
    expect(connect).toContain("noema play");
    expect(connect).not.toMatch(/\.innerHTML\s*=/);
    expect(connect).not.toContain("react");
    expect(connect).not.toContain("next/router");
    expect(connect).toContain("ENTER_WORLD");
  });

  it("11. Research and telemetry remain supported underneath", () => {
    expect(study).toContain("STUDY is not open yet");
    expect(study).toContain("Research does not rewrite the ledger");
    expect(admin).toContain('id="genesis"');
    expect(admin).toContain("canonical_head");
    expect(connect).toContain("/v1/command");
  });

  it("12. Agents inhabit; humans watch", () => {
    expect(connect).toContain("/v1/command");
    expect(connect).toContain("Agents inhabit this world. Humans watch.");
    expect(connect).not.toContain("arguments: { line: raw }");
    expect(connect).not.toContain("/v1/human-only");
  });

  it("13. Admin/research surfaces remain operationally precise", () => {
    expect(admin).toContain("OPERATOR");
    expect(admin).toContain("Health");
    expect(admin).toContain("Head present");
    expect(admin).toContain("Genesis ID");
    expect(admin).not.toContain('id="cmd"');
    expect(admin).not.toMatch(/api\("\/v1\/command"/);
    expect(admin).not.toMatch(/fetch\("\/v1\/command"/);
    expect(admin).toContain("ENTER_WORLD");
    expect(login).toMatch(/not a player/i);
    expect(admin).toContain("--operator-accent:var(--color-state-warning)");
  });

  it("14. Design is implementable without inventing brand while coding", () => {
    expect(TOKEN.surfaceWorld).toBe("#0E1114");
    expect(TOKEN.stateActive).toBe("#3DDCFF");
    expect(TOKEN.stateWarning).toBe("#FFB020");
    expect(label("observation", "player")).toBe("signal");
    expect(label("experiment", "player")).toBe("event");
    expect(label("canonical_head", "player")).toBe("the world as it stands");
    for (const html of [door, manifesto, play, watch, connect, study]) {
      expect(html).not.toContain("var(--copper)");
      expect(html).toContain("--color-surface-world");
    }
  });
});

describe("brand slice 9 — contrast, keyboard, performance", () => {
  it("semantic tokens meet WCAG 2.2 AA on world and panel", () => {
    const pairs: Array<[string, string, string]> = [
      ["textPrimary", TOKEN.textPrimary, TOKEN.surfaceWorld],
      ["textSecondary", TOKEN.textSecondary, TOKEN.surfaceWorld],
      ["textMachine", TOKEN.textMachine, TOKEN.surfaceWorld],
      ["active", TOKEN.stateActive, TOKEN.surfaceWorld],
      ["warning", TOKEN.stateWarning, TOKEN.surfaceWorld],
      ["critical", TOKEN.stateCritical, TOKEN.surfaceWorld],
      ["unknown", TOKEN.stateUnknown, TOKEN.surfaceWorld],
      ["economic", TOKEN.stateEconomic, TOKEN.surfaceWorld],
      ["social", TOKEN.stateSocial, TOKEN.surfaceWorld],
      ["textPrimary/panel", TOKEN.textPrimary, TOKEN.surfacePanel],
      ["inverse/warning", TOKEN.textInverse, TOKEN.stateWarning],
      ["inverse/active", TOKEN.textInverse, TOKEN.stateActive],
    ];
    for (const [name, fg, bg] of pairs) {
      expect(contrast(fg, bg), name).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keyboard and reduced-motion hooks remain on player and admin", () => {
    const play = connectHtml();
    const watch = watchHtml();
    const admin = adminHtml();
    const door = landingHtml();
    expect(door).toContain('href="#main"');
    expect(play).toContain('href="#main"');
    expect(play).toContain(":focus-visible");
    expect(watch).toContain("prefers-reduced-motion");
    expect(watch).toContain('id="watch-pause"');
    expect(watch).toContain('id="watch-refresh"');
    expect(admin).toContain('href="#admin-main"');
    expect(admin).toContain("prefers-reduced-motion");
    expect(admin).toContain(":focus-visible");
  });

  it("gzip ceilings still hold", () => {
    const gz = (html: string) => gzipSync(Buffer.from(html, "utf8")).length;
    expect(gz(connectHtml())).toBeLessThan(180 * 1024);
    expect(gz(watchHtml())).toBeLessThan(180 * 1024);
    expect(gz(landingHtml())).toBeLessThan(180 * 1024);
    expect(PHOSPHOR_JS_BUDGET).toBe(100 * 1024);
    expect(PHOSPHOR_ASSET_BUDGET).toBe(200 * 1024);
  });

  it("WATCH visual map pins inventory, tokens, tiered phosphor, reduced-motion, viewports, budgets", () => {
    const map = readFileSync(join(HERE, "../../../docs/WATCH-VISUAL-MAP.md"), "utf8");
    expect(map).toMatch(/Inventory/);
    expect(map).toMatch(/Tokens/);
    expect(map).toMatch(/Tiered phosphor — one MAJOR, ≤3 non-MAJOR/);
    expect(map).toMatch(/newest win across polls/);
    expect(map).toMatch(/no decorative field wash/);
    expect(map).toMatch(/layout itself never lights an edge/);
    expect(map).toMatch(/Feed tier marks/);
    expect(map).toMatch(/exit_active/);
    expect(map).toMatch(/Reduced-motion/);
    expect(map).toMatch(/360 \/ 390 \/ 768 \/ 1280 \/ 1440/);
    expect(map).toMatch(/180 \/ 100 \/ 200/);
    expect(map).toMatch(/## Inventory/);
    expect(map).toMatch(/## Token mapping/);
    expect(map).toMatch(/## Phosphor trigger rules/);
    expect(map).toMatch(/## States and viewports/);
    expect(map).toMatch(/## Budgets/);
    expect(map).toMatch(/Motion is \*\*event-born, all tiers\*\*/);
    expect(map).toMatch(/No ambient loop/);
    expect(map).toMatch(/≤ 180 KiB/);
    expect(map).toMatch(/≤ 100 KiB/);
    expect(map).toMatch(/≤ 200 KiB/);
    expect(map).toMatch(/14 PLAYER-BRAND/);
    expect(map).toMatch(/`--color-state-warning`/);
    expect(map).not.toMatch(/Genesis reseed/);
    expect(map).toMatch(/No new Player verbs/);
    expect(map).toMatch(/No Genesis change/);
    expect(map).toMatch(/scanlines?, glitch, Orbitron, reticle, dashboard, continuous particles/);
    const watch = watchHtml();
    expect(watch).toContain('id="watch-map"');
    expect(watch).toContain('id="watch-feed"');
    expect(watch).toContain('el("span", "mark", markFor(ev.tier))');
    expect(watch).toContain('id="watch-phosphor"');
    expect(watch).toContain("prefers-reduced-motion");
    expect(watch).toContain("--color-state-warning");
    expect(watch).not.toMatch(/\.watch-hero\.major\{[^}]*--ember/);
    expect(watch).not.toMatch(/scanline/i);
    expect(watch).not.toMatch(/glitch/i);
    expect(watch).not.toMatch(/Orbitron/i);
    expect(watch).not.toMatch(/reticle/i);
    expect(watch).not.toMatch(/dashboard/i);
    expect(watch).not.toMatch(/particle/i);
    const pulses = collectPulses(
      0,
      {
        sequence: 3,
        recent_events: [
          { sequence: 1, tier: "NORMAL", room_id: "room.a" },
          { sequence: 2, tier: "NOTABLE", room_id: "room.a" },
          { sequence: 3, tier: "MAJOR", room_id: "room.a" },
        ],
      },
      1,
      false,
    );
    // Living Chamber (Specs §18.6): tiered event pulses, 1 MAJOR + ≤3 non-MAJOR, newest first.
    expect(pulses.map((p) => p.tier)).toEqual(["MAJOR", "NOTABLE", "NORMAL"]);
    expect(pulses.filter((p) => p.tier === "MAJOR")).toHaveLength(1);
    expect(collectPulses(0, { recent_events: [{ sequence: 1, tier: "MAJOR", room_id: "room.a" }] }, 1, true)).toEqual(
      [],
    );
  });
});
