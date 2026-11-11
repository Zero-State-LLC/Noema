/**
 * 2026-11 site design refresh: redundancy reconciliation and surface scoping.
 * The live Now feed repeated "Stocks recovered at Civic Exchange" three times;
 * CONNECT said "Opening this page does not approve" four times.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { connectHtml } from "../src/connect";
import { homeExcerptFromLive, landingHtml } from "../src/landing";
import { manifestoHtml } from "../src/manifesto";
import { SURFACE_CSS } from "../src/shell";
import { studyHtml } from "../src/study";
import { watchHtml } from "../src/watch";

const HERE = dirname(fileURLToPath(import.meta.url));
const PAGES = readFileSync(join(HERE, "../../../site/index.html"), "utf8");

const REPEATED = {
  narrative: {
    now: { line: "A report is circulating." },
    recently: [
      { line: "An institution declared a temporary repair authority." },
      { line: "Stocks recovered at Civic Exchange" },
      { line: "Stocks recovered at Civic Exchange" },
      { line: "Stocks recovered at Civic Exchange" },
      { line: "A report is circulating." },
    ],
  },
};

const EXPECTED = [
  "A report is circulating.",
  "An institution declared a temporary repair authority.",
  "Stocks recovered at Civic Exchange",
];

function staticExcerpt(): (data: unknown) => string[] {
  const start = PAGES.indexOf("function homeExcerptFromLive(data) {");
  const end = PAGES.indexOf("const controller = new AbortController();", start);
  if (start < 0 || end < 0) throw new Error("static homeExcerptFromLive missing");
  return runInNewContext(`(${PAGES.slice(start, end).trim()})`) as (data: unknown) => string[];
}

describe("Now feed shows each public line once", () => {
  it("Worker Home drops repeated recent lines", () => {
    expect(homeExcerptFromLive(REPEATED)).toEqual(EXPECTED);
  });

  it("static Pages door matches the Worker", () => {
    expect(staticExcerpt()(REPEATED)).toEqual(EXPECTED);
  });
});

describe("door keeps one cyan control", () => {
  const door = landingHtml();

  it("Watch is the only primary link in the hero", () => {
    expect(door.match(/<a class="btn primary"/g) || []).toHaveLength(1);
    expect(door).toContain('<a class="btn primary" href="/watch">Watch</a>');
  });

  it("marks the Now card live on arrival so the signal edge runs once", () => {
    expect(door).toContain('card.setAttribute("data-state", "live")');
    expect(door).toMatch(/\.home-now-card\[data-state=live\]\{animation:now-signal [^;}]* 1 both\}/);
  });
});

describe("CONNECT states the approval rule once", () => {
  it.each([
    ["default", connectHtml()],
    ["pending code", connectHtml(false, "AB12CD34")],
  ])("%s render", (_, html) => {
    expect(html.match(/Opening this page does not approve/g) || []).toHaveLength(1);
  });

  it("keeps Approve as the only cyan control on the workbench", () => {
    expect(connectHtml()).toContain('<button class="btn block" type="submit" id="c-send-link">');
  });
});

describe("surface layer scope", () => {
  it("applies to door, letter, workbench and notice pages", () => {
    for (const html of [landingHtml(), manifestoHtml(), connectHtml(), studyHtml()]) {
      expect(html).toContain("@view-transition{navigation:auto}");
    }
  });

  it("leaves WATCH on the product layer only", () => {
    expect(watchHtml()).not.toContain("@view-transition");
    expect(watchHtml()).not.toContain(SURFACE_CSS);
  });

  it("honors reduced motion for route fades and reading progress", () => {
    expect(SURFACE_CSS).toMatch(/prefers-reduced-motion:reduce\)\{\s*::view-transition-group/);
    expect(manifestoHtml()).toMatch(/prefers-reduced-motion:reduce\)\{\.read-progress\{display:none!important\}\}/);
  });

  it("manifesto contents link to every section heading", () => {
    const html = manifestoHtml();
    const ids = [...html.matchAll(/<h2 id="([^"]+)">/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(10);
    for (const id of ids) expect(html).toContain(`<a href="#${id}">`);
  });
});
