import { describe, expect, it } from "vitest";
import {
  GLYPH_IDS,
  glyphForEntity,
  glyphForLine,
  glyphMeta,
  legendHtml,
} from "../../src/presentation/glyphs";
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
  });

  it("maps entities and lines without color-only meaning", () => {
    expect(glyphForEntity("INFRASTRUCTURE", "relay-7", 83)).toBe("infra");
    expect(glyphForEntity("INFRASTRUCTURE", "scarred-conduit", 20)).toBe("distress");
    expect(glyphForEntity("RESOURCE", "cache")).toBe("resource");
    expect(glyphForLine("Unconfirmed — The vault is empty.")).toBe("rumor");
    expect(glyphForLine("Board — Need fuel")).toBe("comms");
    expect(glyphForLine("INFRASTRUCTURE CONTROL · OPEN")).toBe("danger");
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

  it("PLAY and WATCH ship the key and skip raster sheets", () => {
    expect(playHtml()).toContain('id="world-key"');
    expect(playHtml()).toContain('aria-label="Location"');
    expect(playHtml()).not.toContain("legend.png");
    expect(watchHtml()).toContain('id="world-key"');
    expect(watchHtml()).not.toContain("glyphs-entities.png");
  });
});
