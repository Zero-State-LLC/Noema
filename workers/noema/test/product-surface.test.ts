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
  it("has play + admin login requests", () => {
    expect(html).toContain("/v1/play/login/request");
    expect(html).toContain("/v1/admin/login/request");
    expect(html).toContain("Send play link");
    expect(html).toContain("Send login link");
  });
  it("is not a brochure", () => {
    expect(html).not.toContain('<img src="/assets/hero-noema.jpg"');
    expect(html).not.toContain("The world is the text.");
    expect(html).not.toContain("path-rail");
    expect(html).not.toMatch(/id="home-health"/);
    expect(html).not.toMatch(/Restart STUDY/);
  });
});

describe("planes", () => {
  it("play has play email and no admin login request", () => {
    expect(playHtml()).toContain("/v1/play/login/request");
    expect(playHtml()).not.toContain("/v1/admin/login/request");
    expect(playHtml()).not.toMatch(/class="play-head"/);
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
