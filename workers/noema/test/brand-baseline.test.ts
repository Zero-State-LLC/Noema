/**
 * Brand Slice 0 — baseline capture. No visual change.
 * Locks hosted HTML contracts, routes, a11y hooks, and size ceilings
 * so later brand slices cannot silently break gameplay chrome.
 */
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { adminHtml, adminLoginHtml } from "../src/admin";
import { connectHtml } from "../src/connect";
import worker from "../src/index";
import { landingHtml } from "../src/landing";

import { PRODUCT_CSS, productShell } from "../src/shell";
import { studyHtml } from "../src/study";
import type { Env } from "../src/types";
import { watchHtml } from "../src/watch";
import { PHOSPHOR_ASSET_BUDGET, PHOSPHOR_JS_BUDGET } from "../src/watch-phosphor";

const HERE = dirname(fileURLToPath(import.meta.url));
const MATRIX = JSON.parse(
  readFileSync(join(HERE, "brand-screenshot-matrix.json"), "utf8"),
) as {
  slice?: string;
  viewports: Array<{ id: string; width: number }>;
  screens: Array<{ id: string; route: string }>;
  reduced_motion: boolean;
};

const PLAY_GZIP_CEILING = 180 * 1024;
const WATCH_GZIP_CEILING = 180 * 1024;

function gzipBytes(html: string): number {
  return gzipSync(Buffer.from(html, "utf8")).length;
}

const bareEnv = { NOEMA_ENV: "production" } as unknown as Env;

describe("brand slice 0 — screenshot matrix stub", () => {
  it("lists required viewports and screens", () => {
    expect(MATRIX.slice === "0" || MATRIX.slice === "9").toBe(true);
    expect(MATRIX.reduced_motion).toBe(true);
    expect(MATRIX.viewports.map((v) => v.id)).toEqual([
      "mobile-narrow",
      "mobile-wide",
      "tablet",
      "laptop",
      "desktop",
    ]);
    expect(MATRIX.screens.map((s) => s.id)).toEqual([
      "door",
      "play-signed-out",
      "play-chamber",
      "watch",
      "connect",
      "study-stub",
      "admin-login",
      "admin",
    ]);
    expect(MATRIX.screens.every((s) => s.route.startsWith("/"))).toBe(true);
  });
});

describe("brand slice 0 — hosted HTML routes", () => {
  it("serves the product surfaces", async () => {
    const paths: Array<[string, number, string]> = [
      ["/", 200, "Perihelion Reach"],
      ["/manifesto", 200, "A World for Minds"],
      ["/play/callback", 200, "/v1/play/login/consume"],
      ["/watch", 200, "/v1/watch/live"],
      ["/connect", 200, 'id="d-code"'],
      ["/study", 200, "does not rewrite the ledger"],
      ["/admin/login", 200, "/v1/admin/login"],
    ];
    for (const [path, status, needle] of paths) {
      const res = await worker.fetch(new Request(`https://noema.guru${path}`), bareEnv);
      const html = await res.text();
      expect(res.status, path).toBe(status);
      expect(html.toLowerCase(), path).toContain(needle.toLowerCase());
    }
    const play = await worker.fetch(new Request("https://noema.guru/play"), bareEnv);
    expect(play.status).toBe(308);
    expect(play.headers.get("location")).toBe("https://noema.guru/connect");
  });

  it("puts STUDY on primary nav without PLAY", () => {
    const nav = productShell({ title: "T", active: "home", body: "x" }).match(
      /<nav class="nav"[\s\S]*?<\/nav>/,
    )?.[0];
    expect(nav).toBeTruthy();
    expect(nav).toMatch(/>Home</);
    expect(nav).toMatch(/>Manifesto</);
    expect(nav).toMatch(/>Watch</);
    expect(nav).toMatch(/>Connect</);
    expect(nav).toMatch(/>Study</);
    expect(nav).not.toMatch(/>Play</);
  });

  it("product tabs use the hero type treatment", () => {
    expect(PRODUCT_CSS).toMatch(/\.nav a\{[^}]*text-transform:uppercase/);
    expect(PRODUCT_CSS).toMatch(/\.nav a\{[^}]*letter-spacing:\.14em/);
    expect(landingHtml()).toContain("--color-state-active:#3DDCFF");
  });
});

describe("brand slice 0 — player / admin boundary", () => {
  it("door has Player email only", () => {
    const html = landingHtml();
    expect(html).toContain("/v1/play/login/request");
    expect(html).not.toContain("/v1/admin/login/request");
    expect(html).toContain("/admin/login");
  });

  it("CONNECT does not request admin login", () => {
    expect(connectHtml()).toContain("/v1/play/login/request");
    expect(connectHtml()).not.toContain("/v1/admin/login/request");
  });

  it("admin login does not use the PLAY consume path", () => {
    const html = adminLoginHtml();
    expect(html).toContain("/v1/admin/login");
    expect(html).not.toContain("/v1/play/login/consume");
    expect(html).not.toContain('id="play-chamber"');
  });

  it("admin console is not a PLAY client", () => {
    const html = adminHtml();
    expect(html).not.toContain('id="cmd"');
    expect(html).not.toMatch(/api\("\/v1\/command"/);
    expect(html).not.toMatch(/fetch\("\/v1\/command"/);
    expect(html).toMatch(/operator|admin/i);
    expect(html).toContain("ENTER_WORLD");
    expect(html).toContain("humans watch — this token cannot command");
  });
});

describe("brand slice 0 — gameplay command surface", () => {
  it("CONNECT does not post inhabit lines from the browser", () => {
    const html = connectHtml();
    expect(html).not.toContain('id="cmd"');
    expect(html).not.toContain('id="send"');
    expect(html).not.toMatch(/arguments:\s*\{\s*line:/);
  });
});

describe("brand slice 0 — accessibility hooks", () => {
  it("product shell has skip, focus, and reduced motion", () => {
    const shell = productShell({ title: "T", active: "home", body: "<p>x</p>" });
    expect(shell).toContain('href="#main"');
    expect(shell).toContain("Skip to content");
    expect(shell).toContain(":focus-visible");
    expect(shell).toContain("prefers-reduced-motion");
    expect(shell).toContain('<main id="main"');
  });

  it("CONNECT announces device-code status", () => {
    const html = connectHtml();
    expect(html).toContain('id="d-notice" role="status"');
    expect(html).toMatch(/id="d-code"[^>]*aria-describedby="d-notice"/);
  });

  it("WATCH honors live status and reduced motion", () => {
    const html = watchHtml();
    expect(html).toMatch(/aria-live="polite"/);
    expect(html).toContain("prefers-reduced-motion");
  });
});

describe("brand slice 1 — player tokens", () => {
  it("player HTML has semantic tokens and no copper/Fraunces", () => {
    for (const html of [landingHtml(), watchHtml(), connectHtml(), studyHtml()]) {
      expect(html).toContain("--color-surface-world");
      expect(html).toContain("IBM+Plex+Sans");
      expect(html).toContain("family=Syne");
      expect(html).not.toContain("var(--copper)");
      expect(html).not.toContain("Fraunces");
      expect(html).not.toContain("Source Sans 3");
    }
  });

});

describe("brand slice 0 — performance ceilings", () => {
  it("PLAY and WATCH stay under the gzip budget", () => {
    const connect = gzipBytes(connectHtml());
    const watch = gzipBytes(watchHtml());
    const door = gzipBytes(landingHtml());
    expect(connect).toBeLessThan(PLAY_GZIP_CEILING);
    expect(watch).toBeLessThan(WATCH_GZIP_CEILING);
    expect(door).toBeLessThan(PLAY_GZIP_CEILING);
    expect(PHOSPHOR_JS_BUDGET).toBe(100 * 1024);
    expect(PHOSPHOR_ASSET_BUDGET).toBe(200 * 1024);
  });

  it("connect and study stubs stay small", () => {
    expect(gzipBytes(connectHtml())).toBeLessThan(PLAY_GZIP_CEILING);
    expect(gzipBytes(studyHtml())).toBeLessThan(40 * 1024);
  });
});
