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
 * /watch already carried both regions. /watch/map, added later, carried none —
 * a spectator using a screen reader got the page once and silence after.
 *
 * The guard is the substantive half. Assigning textContent replaces the text
 * node even when the string is unchanged, and a mutation on an aria-live node
 * is an announcement opportunity. /watch/map repaints every 8s and /watch every
 * 10s, so an unguarded write is a flood, which §9 forbids. Verified in a
 * browser before writing this: three identical unguarded writes produce three
 * MutationRecords, the guarded form produces zero.
 */
import { describe, expect, it } from "vitest";
import { watchMapHtml } from "../src/watch-map-page";
import { watchHtml } from "../src/watch";

const MAP = watchMapHtml();
const THEATER = watchHtml();

/** The attributes on one element, given its id. */
function tagFor(html: string, id: string): string {
  const m = html.match(new RegExp(`<[^>]*id="${id}"[^>]*>`));
  return m ? m[0] : "";
}

describe("WATCH live regions (§8, §9)", () => {
  it("/watch/map announces the headline", () => {
    const el = tagFor(MAP, "highlight");
    expect(el).toContain('aria-live="polite"');
    // The headline is one replaced line, so announce it whole.
    expect(el).toContain('aria-atomic="true"');
  });

  it("/watch/map announces the status tag", () => {
    expect(tagFor(MAP, "map-state")).toContain('aria-live="polite"');
  });

  it("/watch keeps the regions it already had", () => {
    expect(tagFor(THEATER, "watch-headline")).toContain('aria-live="polite"');
    expect(tagFor(THEATER, "watch-state")).toContain('aria-live="polite"');
  });

  it("neither page puts a live region on the feed — §9 forbids it", () => {
    for (const [name, html] of [["map", MAP], ["theater", THEATER]] as const) {
      for (const id of ["river", "watch-feed", "board", "watch-map"]) {
        expect(tagFor(html, id), `${name}/${id}`).not.toContain("aria-live");
      }
    }
    // Nothing may carry the assertive level; every permitted region is polite.
    expect(MAP).not.toContain('aria-live="assertive"');
    expect(THEATER).not.toContain('aria-live="assertive"');
  });

  it("every live write is guarded, so a repaint is not an announcement", () => {
    // A bare `x.textContent = …` on a live node re-announces on every poll.
    expect(MAP).toContain("function setLive(");
    expect(MAP).not.toMatch(/\$\("map-state"\)\.textContent\s*=/);
    expect(MAP).not.toMatch(/box\.textContent\s*=/);

    expect(THEATER).toContain("function setLiveText(");
    expect(THEATER).not.toMatch(/\$\("watch-headline"\)\.textContent\s*=/);
    // The status tag was already guarded by setTag().
    expect(THEATER).toContain("if (tag.textContent !== text)");
  });

  it("the headline is populated before it is revealed", () => {
    // An aria-live node that is `hidden` sits outside the accessibility tree,
    // so text must land before the reveal for the change to be announceable.
    const setThenShow = /setLive\(box, String\(hi\.line\)\);\s*box\.hidden = false;/;
    expect(MAP).toMatch(setThenShow);
  });
});
