import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  GLYPH_IDS,
  glyphForCommandVerb,
  glyphForEntity,
  glyphForExit,
  glyphForLine,
  glyphForPlayer,
  glyphForProjection,
  glyphForRoom,
  glyphMeta,
  legendHtml,
} from "../../src/presentation/glyphs";
import { adminHtml } from "../../src/admin";
import { playHtml } from "../../src/play";
import { watchHtml } from "../../src/watch";

describe("glyph catalog", () => {
  it("has fourteen unique labels and text fallbacks", () => {
    expect(GLYPH_IDS).toHaveLength(14);
    const labels = GLYPH_IDS.map((id) => glyphMeta(id).label);
    const fallbacks = GLYPH_IDS.map((id) => glyphMeta(id).fallback);
    expect(new Set(labels).size).toBe(14);
    expect(fallbacks.every((f) => f.length > 0)).toBe(true);
    expect(GLYPH_IDS.every((id) => glyphMeta(id).d.length > 0)).toBe(true);
    const paths = GLYPH_IDS.map((id) => glyphMeta(id).d);
    expect(new Set(paths).size).toBe(14);
  });

  it("maps rooms, players, exits, entities, and projections to the catalog", () => {
    expect(glyphForRoom()).toBe("loc");
    expect(glyphForPlayer()).toBe("player");
    expect(glyphForExit()).toBe("threshold");
    expect(glyphForEntity("INFRASTRUCTURE", "relay-7", 83)).toBe("infra");
    expect(glyphForEntity("INFRASTRUCTURE", "scarred-conduit", 20)).toBe("distress");
    expect(glyphForEntity("RESOURCE", "cache")).toBe("resource");
    expect(glyphForEntity("PROP", "Trade stall")).toBe("trade");
    expect(glyphForLine("Unconfirmed — The vault is empty.")).toBe("rumor");
    expect(glyphForLine("Board — Need fuel")).toBe("comms");
    expect(glyphForLine("INFRASTRUCTURE CONTROL · OPEN")).toBe("danger");
    expect(glyphForLine("Vesper-7 entered Chamber Market")).toBe("player");
    expect(glyphForProjection("agent_move")).toBe("player");
    expect(glyphForProjection("trade")).toBe("trade");
    expect(glyphForProjection("infrastructure")).toBe("infra");
    expect(glyphForProjection("harvest")).toBe("resource");
    expect(glyphForCommandVerb("LOOK")).toBe("loc");
    expect(glyphForCommandVerb("MOVE north")).toBe("player");
    expect(glyphForCommandVerb("MESSAGE")).toBe("comms");
  });

  it("legend is a keyboard details key with aria labels", () => {
    const html = legendHtml();
    expect(html).toContain('id="world-key"');
    expect(html).toContain("<summary>Key</summary>");
    expect(html).toContain('aria-label="Location"');
    expect(html).toContain('aria-label="Rumor"');
    expect(html).toContain("<span class=\"sr\">");
    expect(html).not.toContain("legend.png");
    expect(html).not.toContain("glyphs-players.png");
  });

  it("PLAY, WATCH, and Admin Watch agents ship the key and skip raster sheets", () => {
    expect(playHtml()).toContain('id="world-key"');
    expect(playHtml()).toContain('aria-label="Location"');
    expect(playHtml()).not.toContain("legend.png");
    expect(watchHtml()).toContain('id="world-key"');
    expect(watchHtml()).not.toContain("glyphs-entities.png");
    expect(watchHtml()).not.toContain("legend.png");
    expect(watchHtml()).not.toContain("legend-mini.png");
    expect(adminHtml()).toContain('id="agent-watch"');
    expect(adminHtml()).toContain('id="world-key"');
    expect(adminHtml()).toContain('aria-label="Location"');
    expect(adminHtml()).not.toContain("legend.png");
    expect(adminHtml()).not.toContain("glyphs-players.png");
  });

  it("does not ship retired copper raster keys", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const assets = join(here, "../../public/assets");
    for (const name of ["legend.png", "legend-mini.png", "glyphs-players.png", "glyphs-entities.png"]) {
      expect(existsSync(join(assets, name))).toBe(false);
    }
    const builder = readFileSync(join(here, "../../scripts/build-phosphor-assets.py"), "utf8");
    expect(builder).not.toMatch(/legend\.png|glyphs-players\.png/);
    expect(builder).not.toMatch(/196,\s*122,\s*58/);
  });
});
