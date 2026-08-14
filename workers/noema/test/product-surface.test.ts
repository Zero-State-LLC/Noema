import { describe, expect, it } from "vitest";
import { connectHtml } from "../src/connect";
import { landingHtml } from "../src/landing";
import { playHtml } from "../src/play";
import { productShell } from "../src/shell";
import { studyHtml } from "../src/study";
import { watchHtml } from "../src/watch";

function navOf(html: string): string {
  const m = html.match(/<nav class="nav"[\s\S]*?<\/nav>/);
  return m ? m[0] : "";
}

const FIRST_READ_BAN = [
  "apparatus",
  "ledger",
  "conformance",
  "capability",
  "evidence boundary",
  "humans & agents",
  "stage 0",
  "NOTICE",
  "TEST",
  "CAPTURE",
  "LEARN",
  "research",
  "experimental",
];

function firstReadHaystack(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
}

describe("product chrome", () => {
  const shell = productShell({ title: "T", active: "home", body: "x" });
  it("nav is Home Play Watch Connect without Study", () => {
    const n = navOf(shell);
    expect(n).toMatch(/>Play</);
    expect(n).toMatch(/>Watch</);
    expect(n).toMatch(/>Connect</);
    expect(n).not.toMatch(/>Study</);
  });
  it("footer does not list STUDY as a plane", () => {
    expect(shell).not.toMatch(/PLAY · WATCH · STUDY/);
  });
});

describe("home door", () => {
  const html = landingHtml();
  const hay = firstReadHaystack(html);

  it("has exactly one Player email form and no admin login request", () => {
    expect(html).toContain("/v1/play/login/request");
    expect(html).toContain("Send play link");
    expect(html).toContain('id="play-continue"');
    expect(html).not.toContain("/v1/admin/login/request");
    expect(html).not.toContain("Send login link");
    expect(html).toContain("/admin/login");
  });

  it("names the world and a place line", () => {
    expect(html).toContain("Perihelion Reach");
    expect(html).toMatch(/frontier station on a worn trade line/i);
    expect(html).toContain("Enter the world");
  });

  it("is not a brochure", () => {
    expect(html).not.toContain('<img src="/assets/hero-noema.jpg"');
    expect(html).not.toContain("The world is the text.");
    expect(html).not.toContain("path-rail");
    expect(html).not.toMatch(/id="home-health"/);
    expect(html).not.toMatch(/Restart STUDY/);
  });

  it("first-read omits research and stage vocabulary", () => {
    for (const word of FIRST_READ_BAN) {
      expect(hay.toLowerCase()).not.toContain(word.toLowerCase());
    }
  });
});

describe("shared chrome first-read", () => {
  const shell = productShell({ title: "T", active: "home", body: "<p>x</p>" });
  const hay = firstReadHaystack(shell);
  it("brand and footer are game-first", () => {
    expect(hay).not.toMatch(/stage 0/i);
    expect(hay).not.toMatch(/humans &amp; agents/i);
    expect(hay).not.toMatch(/humans & agents/i);
    expect(shell).toContain('href="/admin/login"');
  });
  it("home does not paint a health chip", () => {
    expect(shell).not.toMatch(/id="rt-label"/);
    expect(shell).not.toMatch(/id="dot"/);
  });
});

describe("planes", () => {
  it("play has play email and no admin login request", () => {
    expect(playHtml()).toContain("/v1/play/login/request");
    expect(playHtml()).not.toContain("/v1/admin/login/request");
    expect(playHtml()).not.toMatch(/class="play-head"/);
  });
  it("play signed-out has no admin login request", () => {
    const html = playHtml();
    expect(html).toContain("/v1/play/login/request");
    expect(html).not.toContain("/v1/admin/login/request");
    expect(html).toContain("Enter world");
  });
  it("study is an honest stub", () => {
    expect(studyHtml()).toMatch(/not open/i);
    expect(studyHtml()).not.toMatch(/aria-controls="panel-notice"/);
  });
  it("watch still loads the live projection", () => {
    expect(watchHtml()).toContain("/v1/watch/live");
    expect(watchHtml()).not.toMatch(/Watch the world move/);
  });
  it("connect has curl and command path", () => {
    expect(connectHtml()).toContain("NOEMA_BASE");
    expect(connectHtml()).toContain("/v1/command");
  });
});
