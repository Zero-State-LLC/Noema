/**
 * One spectator door: /watch is the 3D Chamber stage beside the Places list
 * (Noema-Specs specify/watch-single-3d-stage.md D1). The TEXT / PIXEL / MAP rail
 * is retired; old links resolve (D3). River is watch-live. Map JSON feeds only
 * the stage's bands and world health.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { transformSync } from "esbuild";
import { describe, expect, it } from "vitest";
import worker from "../src/index";
import { watchHtml } from "../src/watch";
import { mapHealthPairs, mapLayerHideable, mapOccupantCaption, watchMapInlineSource } from "../src/watch-map-page";
import { parseWatchMode, watchModeInlineSource } from "../src/watch-mode";
import type { Env } from "../src/types";

const DOOR = watchHtml();
const TEXT = watchHtml({ mode: "text" });

function mainScript(html: string): string {
  return (
    html
      .split("<script>")
      .map((s) => s.split("</script>")[0])
      .find((s) => s.includes("POLL_MS") && s.includes("paintStageHealth")) || ""
  );
}

describe("parseWatchMode (D3)", () => {
  it("prefers query, then hash, else the stage; only text leaves the stage", () => {
    expect(parseWatchMode("?mode=text", "#map", "")).toBe("text");
    expect(parseWatchMode("?mode=map", "#text", "")).toBe("3d");
    expect(parseWatchMode("", "#text", "")).toBe("text");
    expect(parseWatchMode("", "", null)).toBe("3d");
    expect(parseWatchMode("?foo=1", "", "")).toBe("3d");
    expect(parseWatchMode("?mode=nope", "#pixel", "")).toBe("3d");
  });
});

describe("the stage is the Chamber door", () => {
  it("ships no mode rail and drops the outbound Live map link", () => {
    expect(DOOR).not.toMatch(/id="watch-mode-(text|pixel|map|3d)"/);
    expect(DOOR).not.toContain('aria-label="Projection mode"');
    expect(DOOR).not.toContain('href="/watch/map"');
    expect(DOOR).not.toContain("Live map");
    expect(DOOR).not.toContain('id="watch-map-link"');
  });

  it("keeps only the text view in the URL and still reads a hash", () => {
    const src = mainScript(DOOR);
    expect(src).toContain('searchParams.set("mode", "text")');
    expect(src).toContain('searchParams.delete("mode")');
    // Admin Watch still keeps its TEXT / PIXEL choice in noema.watch.mode; /watch leaves it alone.
    expect(src).not.toContain('localStorage.removeItem("noema.watch.mode")');
    expect(src).toContain("parseWatchMode");
    expect(src).toContain("location.hash");
  });
});

describe("one map at a time", () => {
  it("shows the stage beside Places, with no PIXEL canvas and no MAP stage", () => {
    expect(DOOR).toContain('data-mode="3d"');
    expect(DOOR).toContain('id="watch-stage3d"');
    expect(DOOR).not.toMatch(/id="watch-stage-places"[^>]*hidden/);
    expect(DOOR).not.toContain('id="watch-stage-map"');
    expect(DOOR).not.toContain('id="watch-phosphor"');
    expect(TEXT).toContain('data-mode="text"');
    expect(TEXT).not.toMatch(/id="watch-stage-places"[^>]*hidden/);
    for (const id of ["watch-hero-who", "watch-feed", "watch-withheld", "watch-stage3d-health"]) {
      expect(DOOR).toContain(`id="${id}"`);
    }
  });
});

describe("River is a single watch-live source", () => {
  it("keeps Recently on theater facts; map JSON feeds only stage bands and health", () => {
    expect(DOOR).toContain('id="watch-feed"');
    expect(DOOR).toContain('fetch("/v1/watch/live")');
    expect(DOOR).toContain('fetch("/v1/watch/map")');
    expect(DOOR).not.toContain('id="river"');
    const src = mainScript(DOOR);
    expect(src).toContain("paintStageHealth");
    expect(src).not.toContain("paintMapStage");
    expect(src).not.toContain("event.river");
    expect(src).not.toContain("d.event");
    expect(src).not.toContain("watch-map-board");
    expect(src).not.toMatch(/\$\("watch-feed"\).*mapLast|mapLast.*watch-feed/);
  });

  it("layer hides never cover the shared feed", () => {
    expect(mapLayerHideable("activity")).toBe(true);
    expect(mapLayerHideable("state")).toBe(true);
    expect(mapLayerHideable("health")).toBe(true);
    expect(mapLayerHideable("event")).toBe(false);
    expect(mapLayerHideable("narrative")).toBe(false);
  });
});

describe("GET /watch/map redirects to the Chamber", () => {
  it("302 to /watch?mode=map, which opens the stage, and leaves map JSON in place", async () => {
    const env = { NOEMA_ENV: "production" } as unknown as Env;
    const res = await worker.fetch(new Request("https://noema.guru/watch/map"), env);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://noema.guru/watch?mode=map");
    expect(res.headers.get("cache-control")).toBe("no-store");
    const watch = await worker.fetch(new Request("https://noema.guru/watch?mode=map"), env);
    expect(watch.status).toBe(200);
    const html = await watch.text();
    expect(html).toContain('data-mode="3d"');
    expect(html).toContain('id="watch-stage3d"');
  });
});

describe("inlined stage/mode helpers stay free of bundler __name", () => {
  it("rejects keepNames in helper source and the Chamber IIFE", () => {
    expect(watchModeInlineSource()).not.toContain("__name");
    expect(watchMapInlineSource()).not.toContain("__name");
    expect(DOOR).toContain("/assets/watch-stage.js");
    expect(DOOR).not.toContain("/assets/watch-map-gl.js");
    const src = mainScript(DOOR);
    expect(src).toBeTruthy();
    expect(src).not.toContain("__name");
  });

  it("parseWatchMode stays __name-free under wrangler's keepNames transform", () => {
    // Vitest does not apply keepNames; wrangler does. An inner named function or
    // arrow in parseWatchMode would be wrapped in __name and break /watch at runtime.
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, "../src/watch-mode.ts"), "utf8");
    const out = transformSync(src, { loader: "ts", keepNames: true, format: "esm" }).code;
    const start = out.indexOf("function parseWatchMode(");
    const body = out.slice(start, out.indexOf("\n}\n", start));
    expect(start).toBeGreaterThanOrEqual(0);
    expect(body).not.toContain("__name(");
  });

  it("keeps each helper a leaf so wrangler cannot inject __name", () => {
    const leaves = [parseWatchMode, mapOccupantCaption, mapHealthPairs, mapLayerHideable];
    for (const fn of leaves) {
      const src = fn.toString();
      const body = src.slice(src.indexOf("{") + 1, src.lastIndexOf("}"));
      expect(body, fn.name).not.toMatch(/\bfunction\b/);
    }
  });
});
