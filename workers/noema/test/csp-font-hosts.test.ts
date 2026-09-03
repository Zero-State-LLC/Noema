/**
 * The public chrome asks for fonts its own CSP forbade.
 *
 * HOSTED-FIRST-ENTRY pins the typography -- Syne for display, IBM Plex Sans and
 * Mono for interface and machine text -- and `theme/tokens.ts` requests them
 * from Google Fonts. The CSP allowed neither host, so the browser refused the
 * stylesheet and every public page rendered in system fallback. Observed live
 * on 2026-09-01 against Worker c681fd71: the token stack and a plain system
 * stack produced identical text widths to the hundredth of a pixel.
 *
 * Two hosts are required and they are not interchangeable. fonts.googleapis.com
 * serves the @font-face stylesheet, so it belongs to style-src.
 * fonts.gstatic.com serves the woff2 files that stylesheet references, so it
 * belongs to font-src -- a directive that was absent entirely and therefore
 * inherited `default-src 'self'`. Allowing only the stylesheet host would have
 * left the fonts blocked and the page still in fallback.
 *
 * There was no test on this header before, which is how a policy that
 * contradicted the design system stayed live.
 */
import { describe, expect, it } from "vitest";
import worker from "../src/index";
import type { Env } from "../src/types";

async function cspFor(path: string): Promise<string> {
  const res = await worker.fetch(
    new Request(`https://noema.guru${path}`),
    {} as Env,
  );
  return res.headers.get("content-security-policy") || "";
}

function directive(csp: string, name: string): string {
  const found = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${name} `));
  return found || "";
}

describe("HTML CSP allows exactly the pinned font hosts", () => {
  it("serves a CSP on the public door", async () => {
    expect(await cspFor("/watch")).toContain("default-src 'self'");
  });

  it("style-src admits the Google Fonts stylesheet host", async () => {
    expect(directive(await cspFor("/watch"), "style-src")).toContain("https://fonts.googleapis.com");
  });

  it("font-src exists and admits the host serving the font files", async () => {
    // The bug this guards: font-src absent inherits default-src 'self', so the
    // woff2 files stay blocked even once the stylesheet is allowed.
    const csp = await cspFor("/watch");
    const fontSrc = directive(csp, "font-src");
    expect(fontSrc, "font-src must be declared, not inherited").not.toBe("");
    expect(fontSrc).toContain("https://fonts.gstatic.com");
    expect(fontSrc).toContain("'self'");
  });

  it("the two hosts are not swapped between directives", async () => {
    const csp = await cspFor("/watch");
    // gstatic serves files, not stylesheets; googleapis serves the stylesheet.
    expect(directive(csp, "font-src")).not.toContain("fonts.googleapis.com");
    expect(directive(csp, "style-src")).not.toContain("fonts.gstatic.com");
  });

  it("stays otherwise closed", async () => {
    const csp = await cspFor("/watch");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(directive(csp, "default-src")).toBe("default-src 'self'");
    // Widening for fonts must not become a wildcard in the directives it
    // touched, and must not admit third-party script or image origins.
    // connect-src keeps its pre-existing localhost port wildcards for dev.
    expect(directive(csp, "style-src")).not.toContain("*");
    expect(directive(csp, "font-src")).not.toContain("*");
    expect(directive(csp, "script-src")).not.toContain("https://");
    expect(directive(csp, "img-src")).not.toContain("https://");
  });

  it("applies to every HTML surface, not just /watch", async () => {
    for (const path of ["/watch", "/watch/map"]) {
      const csp = await cspFor(path);
      expect(directive(csp, "style-src"), path).toContain("https://fonts.googleapis.com");
      expect(directive(csp, "font-src"), path).toContain("https://fonts.gstatic.com");
    }
  });
});
