/**
 * "Real website" checklist for the hosted product (owner request 2026-11-08):
 * branded 404, per-page title/description, 1200x630 social card, favicon set,
 * robots/sitemap, alt text, pending states, privacy page, analytics CSP.
 * Presentation and policy only. No protocol, Player-verb, or WATCH change.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { adminCallbackHtml, adminHtml, adminLoginHtml } from "../src/admin";
import { connectHtml, enrollHtml } from "../src/connect";
import worker from "../src/index";
import { landingHtml, notFoundHtml } from "../src/landing";
import { manifestoHtml } from "../src/manifesto";
import { playCallbackHtml, playEmailGateMarkup } from "../src/play-login-html";
import { PARENT_PRIVACY_URL, PRIVACY_EFFECTIVE_DATE, privacyHtml } from "../src/privacy";
import { ICON_LINKS, OG_IMAGE, robotsTxt, sitemapXml } from "../src/seo";
import { studyHtml } from "../src/study";
import type { Env } from "../src/types";
import { watchHtml } from "../src/watch";

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(HERE, "../public");
const SRC = join(HERE, "../src");
const env = { NOEMA_ENV: "production" } as unknown as Env;

const PAGES: Array<[string, string]> = [
  ["/", landingHtml()],
  ["/manifesto", manifestoHtml()],
  ["/watch", watchHtml()],
  ["/connect", connectHtml(true)],
  ["/connect?code=…", connectHtml(true, "ab12cd34")],
  ["/connect/enroll", enrollHtml()],
  ["/study", studyHtml()],
  ["/privacy", privacyHtml()],
  ["/play/callback", playCallbackHtml()],
  ["404", notFoundHtml()],
];

function meta(html: string, attr: "name" | "property", key: string): string {
  const m = html.match(new RegExp(`<meta ${attr}="${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}" content="([^"]*)"`));
  return m ? m[1] : "";
}

function titleOf(html: string): string {
  return html.match(/<title>([^<]*)<\/title>/)?.[1] || "";
}

/** Width/height from a baseline or progressive JPEG SOF marker. */
function jpegSize(buf: Buffer): { width: number; height: number } {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) throw new Error("bad JPEG marker");
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  throw new Error("no SOF marker");
}

function pngSize(buf: Buffer): { width: number; height: number } {
  expect(buf.subarray(1, 4).toString("latin1")).toBe("PNG");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** ASSETS stand-in that serves the real public/ directory. */
function assetsEnv(): Env {
  return {
    NOEMA_ENV: "production",
    ASSETS: {
      fetch: async (req: Request) => {
        const p = new URL(req.url).pathname;
        const file = join(PUBLIC, p);
        if (!file.startsWith(PUBLIC) || !existsSync(file) || p.endsWith("/")) return new Response("missing", { status: 404 });
        return new Response(readFileSync(file), { status: 200 });
      },
    },
  } as unknown as Env;
}

describe("titles and descriptions", () => {
  it("every public HTML page has a unique title and description", () => {
    const titles = PAGES.map(([, html]) => titleOf(html));
    const descriptions = PAGES.map(([, html]) => meta(html, "name", "description"));
    for (const [i, [path]] of PAGES.entries()) {
      expect(titles[i], path).toMatch(/\S+ · NOEMA$/);
      expect(descriptions[i].length, path).toBeGreaterThan(15);
    }
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });
});

describe("social card", () => {
  it("is a 1200x630 crop on disk", () => {
    const file = join(PUBLIC, new URL(OG_IMAGE.url).pathname);
    expect(jpegSize(readFileSync(file))).toEqual({ width: 1200, height: 630 });
    expect(OG_IMAGE.url.startsWith("https://noema.guru/")).toBe(true);
  });

  it("every public page carries the full Open Graph and Twitter set", () => {
    for (const [path, html] of PAGES) {
      expect(meta(html, "property", "og:image"), path).toBe(OG_IMAGE.url);
      expect(meta(html, "property", "og:image:width"), path).toBe("1200");
      expect(meta(html, "property", "og:image:height"), path).toBe("630");
      expect(meta(html, "property", "og:image:alt").length, path).toBeGreaterThan(20);
      expect(meta(html, "property", "og:title"), path).toBe(titleOf(html));
      expect(meta(html, "property", "og:description"), path).toBe(meta(html, "name", "description"));
      expect(meta(html, "property", "og:url"), path).toMatch(/^https:\/\/noema\.guru\//);
      expect(meta(html, "property", "og:type"), path).toBe("website");
      expect(meta(html, "name", "twitter:card"), path).toBe("summary_large_image");
      expect(meta(html, "name", "twitter:image"), path).toBe(OG_IMAGE.url);
    }
  });
});

describe("favicon set", () => {
  it("is linked from every product and operator page", () => {
    for (const [path, html] of [...PAGES, ["/admin/login", adminLoginHtml()], ["/admin/callback", adminCallbackHtml()], ["/admin", adminHtml()]]) {
      expect(html, path).toContain(ICON_LINKS);
    }
    expect(ICON_LINKS).toContain('rel="icon" href="/favicon.ico"');
    expect(ICON_LINKS).toContain('href="/assets/icon.svg" type="image/svg+xml"');
    expect(ICON_LINKS).toContain('rel="apple-touch-icon" href="/apple-touch-icon.png"');
    expect(ICON_LINKS).toContain('rel="manifest" href="/site.webmanifest"');
  });

  it("files exist at the sizes the links and manifest promise", () => {
    expect(pngSize(readFileSync(join(PUBLIC, "apple-touch-icon.png")))).toEqual({ width: 180, height: 180 });
    const ico = readFileSync(join(PUBLIC, "favicon.ico"));
    expect(ico.readUInt16BE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBeGreaterThanOrEqual(2);
    expect(readFileSync(join(PUBLIC, "assets/icon.svg"), "utf8")).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);

    const manifest = JSON.parse(readFileSync(join(PUBLIC, "site.webmanifest"), "utf8")) as {
      theme_color: string;
      background_color: string;
      icons: Array<{ src: string; sizes: string; type: string }>;
    };
    expect(manifest.theme_color).toBe("#0E1114");
    expect(manifest.background_color).toBe("#0E1114");
    for (const size of [192, 512]) {
      const icon = manifest.icons.find((i) => i.sizes === `${size}x${size}`);
      expect(icon, String(size)).toBeTruthy();
      expect(icon!.type).toBe("image/png");
      expect(pngSize(readFileSync(join(PUBLIC, icon!.src)))).toEqual({ width: size, height: size });
    }
  });

  it("the Worker serves every icon file through its static fallthrough", async () => {
    const e = assetsEnv();
    for (const path of ["/favicon.ico", "/apple-touch-icon.png", "/site.webmanifest", "/assets/icon.svg", "/assets/icon-192.png", "/assets/icon-512.png", "/assets/og-table.jpg"]) {
      const res = await worker.fetch(new Request(`https://noema.guru${path}`), e);
      expect(res.status, path).toBe(200);
      await res.arrayBuffer();
    }
  });
});

describe("404", () => {
  it("unknown pages get the branded HTML 404 with a link home", async () => {
    const res = await worker.fetch(new Request("https://noema.guru/nope", { headers: { accept: "text/html" } }), assetsEnv());
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    const html = await res.text();
    expect(html).toContain("Not on the map");
    expect(html).toContain('<a class="btn" href="/">Home</a>');
  });

  it("unknown API paths keep JSON errors unless a browser asks for HTML", async () => {
    for (const path of ["/v1/nope", "/protocol/v1/nope"]) {
      const res = await worker.fetch(new Request(`https://noema.guru${path}`), env);
      expect(res.status, path).toBe(404);
      expect(res.headers.get("content-type"), path).toMatch(/application\/json/);
      const body = (await res.json()) as { error?: { code?: string } };
      expect(body.error?.code).toBe("NOT_FOUND");
    }
    const browser = await worker.fetch(new Request("https://noema.guru/v1/nope", { headers: { accept: "text/html" } }), env);
    expect(browser.status).toBe(404);
    expect(await browser.text()).toContain("Not on the map");
  });
});

describe("robots and sitemap", () => {
  it("robots hides operator, protocol and API session paths", () => {
    const txt = robotsTxt();
    for (const line of ["Disallow: /admin", "Disallow: /v1/operator/", "Disallow: /v1/me", "Disallow: /protocol/", "Disallow: /play/callback"]) {
      expect(txt).toContain(line);
    }
    expect(txt).not.toContain("Disallow: /privacy");
    expect(sitemapXml()).toContain("<loc>https://noema.guru/</loc>");
  });
});

describe("alt text", () => {
  it("every <img> on a public page has alt, and empty alt only inside aria-hidden art", () => {
    for (const [path, html] of PAGES) {
      for (const tag of html.match(/<img\b[^>]*>/g) || []) {
        expect(tag, path).toMatch(/\balt="[^"]*"/);
        if (/\balt=""/.test(tag)) {
          const before = html.slice(0, html.indexOf(tag));
          expect(before.slice(before.lastIndexOf("<figure")), path).toMatch(/^<figure[^>]*aria-hidden="true"/);
        }
      }
    }
  });
});

describe("pending states", () => {
  function scriptWith(html: string, needle: string): string {
    const body = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes(needle));
    if (!body) throw new Error(`script with ${needle} missing`);
    return body;
  }

  it("Home marks the Now card busy until /v1/watch/live settles", async () => {
    const attrs = new Map<string, string>();
    const card = {
      setAttribute: (k: string, v: string) => attrs.set(k, v),
      removeAttribute: (k: string) => attrs.delete(k),
    };
    let settle: (v: unknown) => void = () => {};
    runInNewContext(scriptWith(landingHtml(), "/v1/watch/live"), {
      fetch: () => new Promise((resolve) => { settle = resolve; }),
      document: { getElementById: (id: string) => (id === "home-now-card" ? card : null) },
      AbortController,
      setTimeout,
      clearTimeout,
    });
    expect(attrs.get("aria-busy")).toBe("true");
    settle({ ok: false });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(attrs.has("aria-busy")).toBe(false);
  });

  it("the watch-link form cannot be double-submitted while pending", async () => {
    const button = { disabled: false };
    const attrs = new Map<string, string>();
    let onSubmit: (e: { preventDefault(): void }) => Promise<void> = async () => {};
    const form = {
      querySelector: () => button,
      addEventListener: (_: string, fn: typeof onSubmit) => { onSubmit = fn; },
      setAttribute: (k: string, v: string) => attrs.set(k, v),
      removeAttribute: (k: string) => attrs.delete(k),
    };
    const notice = { className: "", textContent: "" };
    let calls = 0;
    let settle: (v: unknown) => void = () => {};
    runInNewContext(scriptWith(playEmailGateMarkup(), "/v1/play/login/request"), {
      fetch: () => { calls += 1; return new Promise((resolve) => { settle = resolve; }); },
      document: {
        getElementById: (id: string) => (id === "play-login-form" ? form : id === "play-login-notice" ? notice : id === "email" ? { value: "a@example.com" } : null),
      },
      location: { search: "" },
      URLSearchParams,
      JSON,
    });
    const first = onSubmit({ preventDefault() {} });
    expect(button.disabled).toBe(true);
    expect(attrs.get("aria-busy")).toBe("true");
    expect(notice.textContent).toBe("Requesting watch link…");
    await onSubmit({ preventDefault() {} });
    expect(calls).toBe(1);
    settle({ ok: true, json: () => Promise.resolve({ message: "If that mailbox can play, a link is on the way." }) });
    await first;
    expect(button.disabled).toBe(false);
    expect(attrs.has("aria-busy")).toBe(false);
    expect(notice.className).toBe("notice ok");
  });

  it("CONNECT approve/deny and its watch-link form lock while a request is in flight", () => {
    const html = connectHtml(true);
    expect(html).toContain("if (deciding) return;");
    expect(html).toMatch(/finally \{\s*deciding = false;/);
    expect(html).toMatch(/if \(sendLink && sendLink\.disabled\) return;/);
  });
});

describe("privacy page", () => {
  it("is served at /privacy in the product chrome", async () => {
    const res = await worker.fetch(new Request("https://noema.guru/privacy"), env);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    const html = await res.text();
    expect(html).toContain('<link rel="canonical" href="https://noema.guru/privacy"/>');
    expect(html).toContain(`Effective date: ${PRIVACY_EFFECTIVE_DATE}`);
    expect(PRIVACY_EFFECTIVE_DATE).toBe("2026-11-08");
    expect(html).toContain(`href="${PARENT_PRIVACY_URL}"`);
    expect(PARENT_PRIVACY_URL).toBe("https://zer0state.com/privacy.html");
    expect(html).toContain("Zero State LLC");
    expect(html).toContain("mailto:zer0state@zer0state.com");
    expect(html).toContain("static.cloudflareinsights.com");
    expect(html).toContain("Workers Logs");
    expect(html).toContain("Supabase");
    expect(html).toContain("24 hours");
  });

  it("is linked from every page footer", () => {
    for (const [path, html] of PAGES) {
      const foot = html.match(/<footer class="foot">[\s\S]*?<\/footer>/)?.[0] || "";
      expect(foot, path).toContain('<a href="/privacy">Privacy</a>');
    }
  });

  it("lists every browser storage key the product writes", () => {
    const keys = new Set<string>();
    for (const file of readdirSync(SRC).filter((f) => f.endsWith(".ts"))) {
      const src = readFileSync(join(SRC, file), "utf8");
      for (const m of src.matchAll(/(?:sessionStorage|localStorage)\.setItem\("(noema\.[a-z_.]+)"/g)) keys.add(m[1]);
      for (const m of src.matchAll(/(?:LOW_NOISE_KEY|MODE_KEY) = "(noema\.[a-z_.]+)"/g)) keys.add(m[1]);
    }
    expect(keys.size).toBeGreaterThan(5);
    const page = privacyHtml();
    for (const key of keys) {
      if (key.startsWith("noema.admin.")) expect(page).toContain("noema.admin.*");
      else expect(page, key).toContain(`<code>${key}</code>`);
    }
  });
});

describe("analytics", () => {
  it("the CSP lets the zone-injected Cloudflare beacon load and report", async () => {
    for (const path of ["/", "/watch", "/privacy"]) {
      const res = await worker.fetch(new Request(`https://noema.guru${path}`), env);
      const csp = res.headers.get("content-security-policy") || "";
      const script = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("script-src ")) || "";
      const connect = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("connect-src ")) || "";
      expect(script, path).toContain("https://static.cloudflareinsights.com");
      // Automatic setup reports to this origin's /cdn-cgi/rum.
      expect(connect, path).toContain("'self'");
      await res.text();
    }
  });
});
