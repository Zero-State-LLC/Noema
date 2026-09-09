/**
 * WATCH live regions — permitted where the spec allows, absent where it forbids,
 * and guarded so a repaint is not an announcement.
 *
 * WATCH-LIGHTWEIGHT-SPECTATOR §8:
 *   "Do not make the entire feed `aria-live`. At most the **headline** MAY be
 *    `aria-live="polite"`. Feed insertions are silent. Status tag changes
 *    (`live` / `paused` / `stale` / `incident` / `unavailable`) MAY be polite."
 * §9: "Periodic updates MUST NOT flood AT. No live region on the feed."
 *
 * /watch is the only Chamber. MAP is a center stage, not a second page.
 * The guard is the substantive half. Assigning textContent replaces the text
 * node even when the string is unchanged, and a mutation on an aria-live node
 * is an announcement opportunity. /watch repaints every 10s, so an unguarded
 * write is a flood, which §9 forbids.
 */
import { describe, expect, it } from "vitest";
import { watchHtml } from "../src/watch";

const THEATER = watchHtml();
const MAP = watchHtml({ mode: "map" });

/** The attributes on one element, given its id. */
function tagFor(html: string, id: string): string {
  const m = html.match(new RegExp(`<[^>]*id="${id}"[^>]*>`));
  return m ? m[0] : "";
}

describe("WATCH live regions (§8, §9)", () => {
  it("/watch announces the headline and status tag", () => {
    expect(tagFor(THEATER, "watch-headline")).toContain('aria-live="polite"');
    expect(tagFor(THEATER, "watch-state")).toContain('aria-live="polite"');
    expect(tagFor(MAP, "watch-headline")).toContain('aria-live="polite"');
    expect(tagFor(MAP, "watch-state")).toContain('aria-live="polite"');
  });

  it("neither stage puts a live region on the feed or MAP board — §9 forbids it", () => {
    for (const [name, html] of [["pixel", THEATER], ["map", MAP]] as const) {
      for (const id of ["watch-feed", "watch-map", "watch-map-board", "watch-map-health"]) {
        expect(tagFor(html, id), `${name}/${id}`).not.toContain("aria-live");
      }
    }
    expect(THEATER).not.toContain('aria-live="assertive"');
    expect(MAP).not.toContain('aria-live="assertive"');
  });

  it("every live write is guarded, so a repaint is not an announcement", () => {
    expect(THEATER).toContain("function setLiveText(");
    expect(THEATER).not.toMatch(/\$\("watch-headline"\)\.textContent\s*=/);
    expect(THEATER).toContain("if (tag.textContent !== text)");
    expect(MAP).toContain("function setLiveText(");
    expect(MAP).not.toMatch(/\$\("watch-headline"\)\.textContent\s*=/);
  });
});
