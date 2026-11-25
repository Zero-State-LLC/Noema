import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { STAGE_PLAYBACK, stagePlaybackOffset, stagePlaybackSchedule } from "../src/watch-stage-model";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "../src/watch-stage-client.js"), "utf8");

describe("WATCH stage D6 paced playback order (client source)", () => {
  it("offsets a new snapshot behind the moments still pending", () => {
    expect(source).toContain("queueEnd");
    expect(source).toContain("stagePlaybackOffset");
    expect(source).toContain("STAGE_PLAYBACK.MAX_TOTAL_MS");
  });

  it("plays a lower sequence before a higher one when a timer fires", () => {
    const start = source.indexOf("function firePlayback(");
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, source.indexOf("\n  }", start));
    expect(body).toMatch(/sequence\s*</);
    expect(body).toMatch(/clearTimeout/);
  });
});

describe("stagePlaybackOffset", () => {
  it("is 0 when nothing is pending later than now", () => {
    expect(stagePlaybackOffset([], 1000)).toEqual({ flush: false, offsetMs: 0 });
    expect(stagePlaybackOffset([400, 1000, -5], 1000)).toEqual({ flush: false, offsetMs: 0 });
  });

  it("waits for the last pending moment plus MIN_GAP_MS", () => {
    expect(stagePlaybackOffset([1500], 1000)).toEqual({
      flush: false,
      offsetMs: 500 + STAGE_PLAYBACK.MIN_GAP_MS,
    });
    expect(stagePlaybackOffset([1100, 1500, 1200], 1000).offsetMs).toBe(
      500 + STAGE_PLAYBACK.MIN_GAP_MS,
    );
  });

  it("keeps 1 → 2 → 3 when a third snapshot lands mid-queue", () => {
    const first = stagePlaybackSchedule([
      { sequence: 1, occurredAt: 0 },
      { sequence: 2, occurredAt: 2500 },
    ]);
    expect(first).toEqual([
      { sequence: 1, atMs: 0 },
      { sequence: 2, atMs: 2500 },
    ]);
    // Snapshot 2 arrives at t=2000 while sequence 2 is still pending at t=2500.
    const now = 2000;
    const queueEnd = 2500;
    const third = stagePlaybackSchedule([{ sequence: 3, occurredAt: 0 }]);
    const pacing = stagePlaybackOffset([queueEnd], now);
    const delay = pacing.offsetMs + third[0].atMs;
    expect(pacing.flush).toBe(false);
    expect(now + delay).toBeGreaterThan(queueEnd);
    expect(delay).toBeGreaterThanOrEqual(500 + STAGE_PLAYBACK.MIN_GAP_MS);
  });

  it("flushes a queue that has drifted past MAX_TOTAL_MS", () => {
    const now = 1000;
    expect(
      stagePlaybackOffset([now + STAGE_PLAYBACK.MAX_TOTAL_MS + 1], now),
    ).toEqual({ flush: true, offsetMs: 0 });
    expect(stagePlaybackOffset([now + STAGE_PLAYBACK.MAX_TOTAL_MS], now)).toEqual({
      flush: false,
      offsetMs: STAGE_PLAYBACK.MAX_TOTAL_MS + STAGE_PLAYBACK.MIN_GAP_MS,
    });
  });

  it("ignores values that are not finite numbers", () => {
    expect(stagePlaybackOffset([Number.NaN, Number.POSITIVE_INFINITY], 1000)).toEqual({
      flush: false,
      offsetMs: 0,
    });
  });
});
