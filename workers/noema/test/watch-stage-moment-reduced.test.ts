import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { newStageCaptions, newStagePulses } from "../src/watch-stage-model";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "../src/watch-stage-client.js"), "utf8");

/** The body between a `for (...) {` marker and its matching closing brace. */
function loopBody(text: string, marker: string): string {
  const at = text.indexOf(marker);
  if (at < 0) return "";
  const start = text.indexOf("{", at);
  if (start < 0) return "";
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start + 1, i);
    }
  }
  return "";
}

describe("WATCH stage reduced-motion MAJOR moment (D6)", () => {
  it("no longer starts a moment from the animation-pulse loop", () => {
    const body = loopBody(src, "for (const p of slot.pulses)");
    expect(body.length).toBeGreaterThan(0);
    expect(body).not.toContain("startMoment");
    // The MAJOR pulse still gets its animated ring.
    expect(body).toContain("majorRing");
  });

  it("playSequence starts moments from slot.moments instead", () => {
    expect(src).toContain("for (const roomId of slot.moments || []) startMoment(roomId);");
  });

  it("update() derives MAJOR moments from fresh caption tiers", () => {
    expect(src).toMatch(/tier === "MAJOR"[\s\S]{0,200}\.moments\.push/);
    expect(src).toContain("moments: []");
  });
});

describe("WATCH stage caption model feeds reduced-motion moments (D6)", () => {
  const events = [
    { sequence: 5, room_id: "room.a", tier: "MAJOR", line: "A public major line." },
  ] as unknown as Parameters<typeof newStageCaptions>[0];

  it("newStageCaptions still returns the MAJOR caption for a fresh MAJOR event", () => {
    const captions = newStageCaptions(events, 3, ["room.a"]);
    const major = captions.find((c) => c.tier === "MAJOR");
    expect(major).toBeDefined();
    expect(major!.roomId).toBe("room.a");
    expect(major!.sequence).toBe(5);
  });

  it("newStagePulses with reduce true returns no pulses for the same input", () => {
    const { pulses, lastSequence } = newStagePulses(events, 3, ["room.a"], { reduce: true });
    expect(pulses).toEqual([]);
    expect(lastSequence).toBe(5);
  });
});
