/**
 * One spectator door: /watch TEXT | PIXEL | MAP.
 * /watch/map redirects. River is watch-live. MAP JSON paints board + Health only.
 */
import { describe, expect, it } from "vitest";
import worker from "../src/index";
import { watchHtml } from "../src/watch";
import { mapHealthPairs, mapLayerHideable, mapOccupantCaption, watchMapInlineSource } from "../src/watch-map-page";
import { parseWatchMode, watchModeInlineSource } from "../src/watch-mode";
import type { Env } from "../src/types";

const THEATER = watchHtml();
const MAP = watchHtml({ mode: "map" });
const TEXT = watchHtml({ mode: "text" });

function mainScript(html: string): string {
  return (
    html
      .split("<script>")
      .map((s) => s.split("</script>")[0])
      .find((s) => s.includes("POLL_MS") && s.includes("paintMapStage")) || ""
  );
}

describe("parseWatchMode", () => {
  it("prefers query, then hash, then stored, else PIXEL", () => {
    expect(parseWatchMode("?mode=map", "#pixel", "text")).toBe("map");
    expect(parseWatchMode("", "#map", "text")).toBe("map");
    expect(parseWatchMode("", "", "text")).toBe("text");
    expect(parseWatchMode("", "", null)).toBe("pixel");
    expect(parseWatchMode("?foo=1", "", "")).toBe("pixel");
    expect(parseWatchMode("?mode=nope", "#pixel", "")).toBe("pixel");
  });
});

describe("mode rail is the Chamber door", () => {
  it("ships TEXT PIXEL MAP and drops the outbound Live map link", () => {
    expect(THEATER).toContain('id="watch-mode-text"');
    expect(THEATER).toContain('id="watch-mode-pixel"');
    expect(THEATER).toContain('id="watch-mode-map"');
    expect(THEATER).toContain('aria-label="Projection mode"');
    expect(THEATER).not.toContain('href="/watch/map"');
    expect(THEATER).not.toContain("Live map");
    expect(THEATER).not.toContain('id="watch-map-link"');
  });

  it("persists mode on the query and still reads a hash", () => {
    const src = mainScript(THEATER);
    expect(src).toContain('searchParams.set("mode"');
    expect(src).toContain("parseWatchMode");
    expect(src).toContain("location.hash");
    expect(src).toContain("watch-mode-map");
  });
});

describe("one center stage at a time", () => {
  it("hides MAP when TEXT or PIXEL, hides Places when MAP", () => {
    expect(THEATER).toContain('data-mode="pixel"');
    expect(THEATER).toMatch(/id="watch-stage-map"[^>]*hidden/);
    expect(THEATER).not.toMatch(/id="watch-stage-places"[^>]*hidden/);
    expect(TEXT).toContain('data-mode="text"');
    expect(TEXT).toMatch(/id="watch-stage-map"[^>]*hidden/);
    expect(MAP).toContain('data-mode="map"');
    expect(MAP).toMatch(/id="watch-stage-places"[^>]*hidden/);
    expect(MAP).not.toMatch(/id="watch-stage-map"[^>]*hidden/);
    expect(MAP).toContain('id="watch-map-board"');
    expect(MAP).toContain('id="watch-map-health"');
  });
});

describe("River is a single watch-live source", () => {
  it("keeps Recently on theater facts and does not paint map river", () => {
    expect(THEATER).toContain('id="watch-feed"');
    expect(THEATER).toContain('fetch("/v1/watch/live")');
    expect(THEATER).toContain('fetch("/v1/watch/map")');
    expect(THEATER).not.toContain('id="river"');
    const src = mainScript(THEATER);
    expect(src).toContain("paintMapStage");
    expect(src).not.toContain("event.river");
    expect(src).not.toContain("d.event");
    expect(src).not.toContain("map-hide-event");
    expect(src).toContain("watch-map-board");
    expect(src).toContain("watch-map-health");
    expect(src).not.toMatch(/\$\("watch-feed"\).*mapLast|mapLast.*watch-feed/);
  });

  it("layer hides stay on the MAP stage", () => {
    expect(mapLayerHideable("activity")).toBe(true);
    expect(mapLayerHideable("state")).toBe(true);
    expect(mapLayerHideable("health")).toBe(true);
    expect(mapLayerHideable("event")).toBe(false);
    expect(mapLayerHideable("narrative")).toBe(false);
  });
});

describe("GET /watch/map redirects to the Chamber", () => {
  it("302 to /watch?mode=map and leaves map JSON in place", async () => {
    const env = { NOEMA_ENV: "production" } as unknown as Env;
    const res = await worker.fetch(new Request("https://noema.guru/watch/map"), env);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://noema.guru/watch?mode=map");
    expect(res.headers.get("cache-control")).toBe("no-store");
    const watch = await worker.fetch(new Request("https://noema.guru/watch?mode=map"), env);
    expect(watch.status).toBe(200);
    const html = await watch.text();
    expect(html).toContain('data-mode="map"');
    expect(html).toContain('id="watch-mode-map"');
  });
});

describe("inlined MAP/mode helpers stay free of bundler __name", () => {
  it("rejects keepNames in helper source and the Chamber IIFE", () => {
    expect(watchModeInlineSource()).not.toContain("__name");
    expect(watchMapInlineSource()).not.toContain("__name");
    const src = mainScript(THEATER);
    expect(src).toBeTruthy();
    expect(src).not.toContain("__name");
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
