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
import { playHtml } from "../src/play";
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
  });
});

describe("brand slice 9 — 14 PLAYER-BRAND statements", () => {
  const door = landingHtml();
  const play = playHtml();
  const watch = watchHtml();
  const admin = adminHtml();
  const login = adminLoginHtml();
  const study = studyHtml();
  const connect = connectHtml();

  it("1. NOEMA reads immediately as a science-fiction game", () => {
    const hay = firstRead(door);
    expect(hay).toMatch(/Perihelion Reach/);
    expect(hay).toMatch(/Enter the world/);
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
    expect(play).toContain("ch-mast");
    expect(play).toContain('id="world-strip"');
    expect(play).toContain('id="room-name"');
    expect(play).toContain('id="action-rail"');
    expect(play).toContain('id="cmd"');
    expect(play).toContain("ch-rail");
    expect(play).not.toMatch(/Nothing visible until you enter/);
  });

  it("4. Color conveys semantic state and is labeled", () => {
    expect(play).toContain("--color-state-active");
    expect(play).toContain("--color-state-warning");
    expect(play).toContain("--color-state-critical");
    expect(play).toContain("--color-state-unknown");
    expect(play).toContain("--color-state-economic");
    expect(play).toContain("--color-state-social");
    expect(play).toContain("<summary>Key</summary>");
    expect(play).toMatch(/aria-label="/);
    expect(play).toContain("glyph-threshold");
    expect(play).toContain("glyph-danger");
  });

  it("5. Monospace is restricted to machine/data contexts", () => {
    expect(play).toMatch(/#room-name\{[^}]*var\(--font-display\)/);
    expect(play).toMatch(/#room-desc\{/);
    expect(play).not.toMatch(/#room-desc\{[^}]*var\(--font-machine\)/);
    expect(play).toMatch(/\.cmdform input\{[^}]*font-family:var\(--font-machine\)/);
    expect(play).toContain('id="meta-seq"');
    expect(play).toContain('id="err-advanced"');
  });

  it("6. Major world changes are visually apparent", () => {
    expect(play).toMatch(/animation:threshold-in 240ms[^;]* 1 both/);
    expect(play).toContain("pulseThreshold");
    expect(watch).toMatch(/\.watch-hero\.major\{[\s\S]*animation:threshold-in 240ms/);
    expect(play).not.toMatch(/animation:[^;]*infinite/);
    expect(watch).not.toMatch(/animation:[^;]*infinite/);
  });

  it("7. Players can determine location, state, threats, and actions", () => {
    expect(play).toContain('id="room-name"');
    expect(play).toContain('id="room-desc"');
    expect(play).toContain('id="world-strip"');
    expect(play).toContain('id="signal-feed"');
    expect(play).toContain('id="just-happened"');
    expect(play).toContain("AVAILABLE HERE");
    expect(play).toContain('id="action-rail"');
    expect(play).toContain('id="cmd"');
    expect(play).toContain('id="play-health"');
  });

  it("8. Aesthetic avoids generic cyberpunk clichés", () => {
    for (const html of [door, play, watch, connect, study, login, admin]) {
      expect(html).not.toMatch(/scanline/i);
      expect(html).not.toMatch(/glitch/i);
      expect(html).not.toMatch(/Orbitron/i);
      expect(html).not.toMatch(/military reticle/i);
      expect(html).not.toMatch(/neon-grid|neon grid/i);
    }
  });

  it("9. Mobile remains usable", () => {
    expect(play).toMatch(/@media\(max-width:640px\)/);
    expect(play).toMatch(/min-height:44px/);
    expect(play).toMatch(/\.cmdform input[^}]*font-size:16px/);
    expect(play).toMatch(/\.ch-cmd\{[^}]*position:sticky/);
    expect(play).toMatch(/overflow-x:clip/);
  });

  it("10. The text-game core remains primary", () => {
    expect(play).toContain('id="room-desc"');
    expect(play).toContain("/v1/command");
    expect(play).not.toMatch(/\.innerHTML\s*=/);
    expect(play).not.toContain("react");
    expect(play).not.toContain("next/router");
    expect(play).toContain("LOOK");
  });

  it("11. Research and telemetry remain supported underneath", () => {
    expect(study).toContain("STUDY is not open yet");
    expect(study).toContain("Research does not rewrite the ledger");
    expect(admin).toContain('id="genesis"');
    expect(admin).toContain("canonical_head");
    expect(connect).toContain("/v1/command");
  });

  it("12. Human and agent players share world mechanics", () => {
    expect(play).toContain('command: "LOOK"');
    expect(play).toContain("arguments: { line: raw }");
    expect(play).toContain("/v1/command");
    expect(connect).toContain("/v1/command");
    expect(play).not.toContain("/v1/human-only");
  });

  it("13. Admin/research surfaces remain operationally precise", () => {
    expect(admin).toContain("OPERATOR");
    expect(admin).toContain("Health");
    expect(admin).toContain("Head present");
    expect(admin).toContain("Genesis ID");
    expect(admin).not.toContain('id="cmd"');
    expect(admin).not.toContain("/v1/command");
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
    for (const html of [door, play, watch, connect, study]) {
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
    const play = playHtml();
    const watch = watchHtml();
    const admin = adminHtml();
    const door = landingHtml();
    expect(door).toContain('href="#main"');
    expect(play).toContain('href="#main"');
    expect(play).toContain(":focus-visible");
    expect(play).toContain('for="cmd"');
    expect(play).toContain('id="trail" aria-live="polite"');
    expect(play).toContain('id="leave"');
    expect(watch).toContain("prefers-reduced-motion");
    expect(watch).toContain('id="watch-pause"');
    expect(watch).toContain('id="watch-refresh"');
    expect(admin).toContain('href="#admin-main"');
    expect(admin).toContain("prefers-reduced-motion");
    expect(admin).toContain(":focus-visible");
  });

  it("gzip ceilings still hold", () => {
    const gz = (html: string) => gzipSync(Buffer.from(html, "utf8")).length;
    expect(gz(playHtml())).toBeLessThan(180 * 1024);
    expect(gz(watchHtml())).toBeLessThan(180 * 1024);
    expect(gz(landingHtml())).toBeLessThan(180 * 1024);
    expect(PHOSPHOR_JS_BUDGET).toBe(100 * 1024);
    expect(PHOSPHOR_ASSET_BUDGET).toBe(200 * 1024);
  });

  it("WATCH visual map pins inventory, MAJOR-only phosphor, reduced-motion, viewports, budgets", () => {
    const map = readFileSync(join(HERE, "../../../docs/WATCH-VISUAL-MAP.md"), "utf8");
    expect(map).toMatch(/## Inventory/);
    expect(map).toMatch(/## Token mapping/);
    expect(map).toMatch(/## Phosphor trigger rules/);
    expect(map).toMatch(/## States and viewports/);
    expect(map).toMatch(/## Budgets/);
    expect(map).toMatch(/Motion is \*\*MAJOR only\*\*/);
    expect(map).toMatch(/360 \/ 390 \/ 768 \/ 1280 \/ 1440/);
    expect(map).toMatch(/≤ 180 KiB/);
    expect(map).toMatch(/≤ 100 KiB/);
    expect(map).toMatch(/≤ 200 KiB/);
    expect(map).not.toMatch(/Genesis reseed/);
    expect(map).toMatch(/No new Player verbs/);
    const watch = watchHtml();
    expect(watch).toContain('id="watch-map"');
    expect(watch).toContain('id="watch-feed"');
    expect(watch).toContain('id="watch-phosphor"');
    expect(watch).toContain("prefers-reduced-motion");
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
    expect(pulses.map((p) => p.tier)).toEqual(["MAJOR"]);
    expect(collectPulses(0, { recent_events: [{ sequence: 1, tier: "MAJOR", room_id: "room.a" }] }, 1, true)).toEqual(
      [],
    );
  });
});
