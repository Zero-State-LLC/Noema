import { describe, expect, it } from "vitest";
import { connectHtml, enrollHtml } from "../src/connect";
import worker from "../src/index";
import { landingHtml } from "../src/landing";
import { playCallbackHtml } from "../src/play-login-html";
import { productShell } from "../src/shell";
import { studyHtml } from "../src/study";
import type { Env } from "../src/types";
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
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

describe("product chrome", () => {
  const shell = productShell({ title: "T", active: "home", body: "x" });
  it("home nav is Home · Manifesto · Watch · Connect · Study", () => {
    const n = navOf(shell);
    expect(n).toMatch(/>Home</);
    expect(n).toMatch(/>Manifesto</);
    expect(n).toMatch(/>Watch</);
    expect(n).toMatch(/>Connect</);
    expect(n).toMatch(/>Study</);
    expect(n).not.toMatch(/>Play</);
    const connect = navOf(productShell({ title: "T", active: "connect", body: "x" }));
    expect(connect).toMatch(/>Connect</);
    expect(connect).toMatch(/>Watch</);
    expect(connect).not.toMatch(/>Play</);
    const watch = navOf(productShell({ title: "T", active: "watch", body: "x" }));
    expect(watch).toMatch(/>Watch</);
    expect(watch).toMatch(/>Connect</);
    expect(navOf(productShell({ title: "T", active: "manifesto", body: "x" }))).toMatch(/>Watch</);
  });

  it("social preview uses the table still, not the legacy OG crop", () => {
    expect(shell).toContain('property="og:image" content="https://noema.guru/assets/hero-table.jpg"');
    expect(shell).toContain('name="twitter:card" content="summary_large_image"');
    expect(shell).toContain('name="twitter:image" content="https://noema.guru/assets/hero-table.jpg"');
    expect(shell).toContain('property="og:type" content="website"');
    expect(shell).not.toContain("/assets/og-social.jpg");
    expect(landingHtml()).toContain('property="og:image" content="https://noema.guru/assets/hero-table.jpg"');
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
    expect(html).toContain("Send watch link");
    expect(html).toContain('id="play-continue"');
    expect(html).not.toContain("/v1/admin/login/request");
    expect(html).not.toContain("Send login link");
    expect(html).toContain("/admin/login");
  });

  it("names the world and a place line", () => {
    expect(html).toContain("Perihelion Reach");
    expect(html).toMatch(/frontier station on a worn trade line/i);
    expect(html).toContain("Watch the agents play");
  });

  it("is not a brochure", () => {
    expect(html).not.toContain('<img src="/assets/hero-noema.jpg"');
    expect(html).toMatch(/<figure class="hero-art"[^>]*aria-hidden="true"/);
    expect(html).toMatch(/<img src="\/assets\/hero-table\.jpg"[^>]*alt=""/);
    expect(html).toContain("/assets/hero-table.jpg");
    expect(html).toContain("hero-bleed");
    expect(html).toMatch(/body\.hero-bleed \.top\{[^}]*position:absolute/);
    expect(html).toContain("MUDS for Agents");
    expect(html).toContain("A bound world");
    expect(html).toContain("Agents inhabit");
    expect(html).not.toContain("Infinite Worlds");
    expect(html).not.toContain("PLAY NOW");
    expect(html).not.toContain("EXPLORE WORLDS");
    expect(html).not.toMatch(/>ABOUT</);
    expect(html).not.toMatch(/>DOCS</);
    expect(html).not.toMatch(/>MANIFESTO</);
    expect(html).not.toMatch(/>DISCORD</);
    expect(html).not.toContain("topology-bg.jpg");
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

describe("hosted /index.html", () => {
  const bareEnv = { NOEMA_ENV: "production" } as unknown as Env;

  it("serves the world door, not the research splash", async () => {
    for (const path of ["/", "/index.html", "/memo", "/memo.html"]) {
      const res = await worker.fetch(new Request(`https://noema.guru${path}`), bareEnv);
      const html = await res.text();
      expect(res.status).toBe(200);
      expect(res.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
      expect(res.headers.get("content-security-policy")).toContain("connect-src 'self' wss:");
      expect(res.headers.get("content-security-policy")).not.toMatch(/connect-src[^;]* https:/);
      expect(html).toContain("Perihelion Reach");
      expect(html).toContain("/v1/play/login/request");
      expect(html).not.toContain("/assets/site.js");
      expect(html).not.toContain("path-rail");
      expect(html).not.toContain('<img src="/assets/hero-noema.jpg"');
    }
  });

  it("does not leak thrown Error messages on INTERNAL", async () => {
    const envThrowing = {
      NOEMA_ENV: "production",
      WORLD_DO: {
        idFromName: () => "id",
        get: () => ({
          fetch: async () => {
            throw new Error("secret table xyz");
          },
        }),
      },
    } as unknown as Env;
    const res = await worker.fetch(new Request("https://noema.guru/v1/watch/live"), envThrowing);
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).not.toContain("secret table");
    const body = JSON.parse(text) as { error?: { code?: string; message?: string } };
    expect(body.error?.code).toBe("INTERNAL");
    expect(body.error?.message).toBe("internal error");
  });

  it("missing routes serve a game-first 404, not the splash", async () => {
    const res = await worker.fetch(new Request("https://noema.guru/no-such-page"), bareEnv);
    const html = await res.text();
    expect(res.status).toBe(404);
    expect(html).toContain("Perihelion Reach");
    expect(html).toContain("Watch");
    expect(html).toContain('href="/watch"');
    expect(html).not.toContain("Splash");
    expect(html).not.toContain("/assets/site.css");
    expect(html).not.toContain("site-header");
    expect(html).not.toContain("/assets/site.js");
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
  it("home and connect request play email, not admin login", () => {
    expect(landingHtml()).toContain("/v1/play/login/request");
    expect(landingHtml()).not.toContain("/v1/admin/login/request");
    expect(connectHtml()).toContain("/v1/play/login/request");
    expect(connectHtml()).not.toContain("/v1/admin/login/request");
  });
  it("study is observational and does not inhabit", () => {
    expect(studyHtml()).not.toMatch(/not open/i);
    expect(studyHtml()).toContain("Agents inhabit");
    expect(studyHtml()).toContain('href="/connect"');
    expect(studyHtml()).toContain('href="/watch"');
    expect(studyHtml()).toContain("/v1/watch/live");
    expect(studyHtml()).not.toMatch(/The world is PLAY/);
    expect(studyHtml()).not.toMatch(/aria-controls="panel-notice"/);
    expect(studyHtml()).not.toContain('href="/play"');
  });
  it("GET and HEAD /play redirect to /connect", async () => {
    const env = { NOEMA_ENV: "production" } as unknown as Env;
    for (const method of ["GET", "HEAD"] as const) {
      const res = await worker.fetch(new Request("https://noema.guru/play?code=AB12-CD34", { method }), env);
      expect(res.status).toBe(308);
      expect(res.headers.get("location")).toBe("https://noema.guru/connect?code=AB12-CD34");
    }
  });
  it("watch still loads the live projection", () => {
    expect(watchHtml()).toContain("/v1/watch/live");
    expect(watchHtml()).not.toMatch(/Watch the world move/);
  });
  it("connect and watch do not assign via innerHTML", () => {
    expect(connectHtml()).not.toMatch(/\.innerHTML\s*=/);
    expect(watchHtml()).not.toMatch(/\.innerHTML\s*=/);
  });
  it("Home CONNECT and WATCH inline scripts parse as JavaScript", () => {
    for (const html of [landingHtml(), connectHtml(), watchHtml(), studyHtml()]) {
      const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(
        (m) => m[1],
      );
      expect(scripts.length).toBeGreaterThan(0);
      for (const src of scripts) {
        expect(() => new Function(src)).not.toThrow();
      }
    }
  });
  it("connect first paint is onboard plus inhabit", () => {
    const html = connectHtml();
    expect(html).toContain("Enter the code");
    expect(html).toContain("Sign up");
    expect(html).toContain("Use a token");
    expect(html).toContain("scrimshawlife-ctrl/noema-client");
    expect(html).toContain("pipx install noema-client");
    expect(html).toContain("pipx upgrade noema-client");
    expect(html.indexOf("pipx install noema-client")).toBeLessThan(html.indexOf("pipx upgrade noema-client"));
    expect(html).toContain("noema connect");
    expect(html).toContain("noema play");
    expect(html).toContain("noema doctor");
    expect(html).toContain("pypi.org/project/noema-client");
    expect(html).toContain("Recommended");
    expect(html).toContain("id=\"copy-install\"");
    expect(html).toContain("class=\"connect-flow\"");
    expect(html).toContain("Advanced: use a token");
    expect(html).toContain("Advanced: install from git");
    expect(html.indexOf("pipx install noema-client")).toBeLessThan(html.indexOf("Advanced: install from git"));
    expect(html).not.toContain("Enter world");
    expect(html).not.toContain('id="play-chamber"');
    expect(html).toContain("connect-work");
    expect(html).not.toContain('id="play-door"');
    expect(html).not.toContain("show-inhabit");
    expect(html).toContain("c-mint-wrap");
    expect(html).not.toContain('value="hermes"');
    expect(html).not.toContain("door-approve");
    expect(html).not.toContain("showDoor");
    expect(html).not.toMatch(/<ol class="steps"/);
    expect(html).toMatch(/<ol class="connect-flow"/);
    expect(html).not.toMatch(/export NOEMA_BASE=https:\/\/noema\.guru/);
    expect(html).not.toContain("POST /v1/auth/device/token");
    expect(html).toContain("ENTER_WORLD");
    expect(html).toContain("request_id");
    expect(html).toContain("x-noema-seal");
    expect(html).toContain('new URLSearchParams(location.search).get("code")');
    expect(html).toContain("Agent approved. Return to the agent terminal.");
    expect(html).toContain('id="d-code"');
    expect(html).toContain('placeholder="AB12-CD34"');
    expect(html).not.toMatch(/id="d-form" hidden/);
    expect(html).toContain('id="c-email"');
    expect(html).toContain("Send watch link");
    expect(html.indexOf("Sign up")).toBeLessThan(html.indexOf("pipx install noema-client"));
    expect(html.indexOf("pipx install noema-client")).toBeLessThan(html.indexOf("Enter the code"));
    expect(html).not.toMatch(/id="d-approve" hidden/);
  });
  it("production CONNECT omits public mint from markup", async () => {
    const html = connectHtml(true);
    expect(html).not.toContain('id="c-mint-wrap"');
    expect(html).not.toContain('id="c-mint"');
    expect(html).toContain("c-prod-wrap");
    expect(html).not.toMatch(/id="c-prod-wrap" hidden/);
    expect(html).not.toContain("Enter world");
    expect(html).not.toContain('id="play-chamber"');
    const env = { NOEMA_ENV: "production" } as unknown as Env;
    const res = await worker.fetch(new Request("https://noema.guru/connect"), env);
    const served = await res.text();
    expect(res.status).toBe(200);
    expect(served).not.toContain('id="c-mint-wrap"');
    expect(served).not.toContain('id="play-chamber"');
  });
  it("connect can approve a device code with the PLAY token", () => {
    const html = connectHtml();
    expect(html).toContain("/v1/auth/device/preview");
    expect(html).toContain("/v1/auth/device/approve");
    expect(html).toContain("noema.play.token");
    expect(html).toMatch(/Sign up above first/i);
    expect(html).toContain('id="c-email"');
    expect(html).toContain('next: "connect"');
    expect(html).not.toMatch(/\.innerHTML\s*=/);
    expect(html).toMatch(/catch\(e\)[\s\S]{0,200}hideDecide\(\)/);
    expect(html).toContain("function sessionToken()");
    expect(html).toContain('sessionStorage.getItem("noema.play.token")');
  });
  it("enrollment review page does not auto-approve", () => {
    const html = enrollHtml();
    expect(html).toContain("Review agent enrollment");
    expect(html).toContain("did not approve");
    expect(html).toContain("/v1/admin/agent/enroll/decide");
    expect(html).toContain("/admin#agent-watch");
    expect(html).not.toMatch(/\.innerHTML\s*=/);
  });
});

describe("callback", () => {
  it("is Player consume, not ADMIN", () => {
    const html = playCallbackHtml();
    expect(html).toContain("/v1/play/login/consume");
    expect(html).toContain("Opening the door");
      expect(html).toContain('raw === "/connect"');
      expect(html).toContain('noema.connect.code');
      expect(html).toContain('"/watch"');
    expect(html).toContain("location.href = next");
    expect(html).toContain('location.href = "/connect?error=1"');
    expect(html).not.toMatch(/location\.href = "\/play"/);
    expect(html).not.toMatch(/location\.href = "\/play\?error=1"/);
    expect(html).not.toContain("/v1/admin/login");
    const hay = firstReadHaystack(html).toLowerCase();
    expect(hay).not.toContain("research");
    expect(hay).not.toContain("admin");
    expect(hay).not.toContain("operator plane");
  });
});
