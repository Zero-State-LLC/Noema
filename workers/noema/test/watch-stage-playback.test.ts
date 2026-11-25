import { describe, expect, it } from "vitest";
import { STAGE_PLAYBACK, stagePlaybackSchedule } from "../src/watch-stage-model";

describe("stagePlaybackSchedule", () => {
  it("schedules nothing for no items", () => {
    expect(stagePlaybackSchedule([])).toEqual([]);
  });

  it("sorts ascending by sequence and starts the first slot at 0", () => {
    const out = stagePlaybackSchedule([
      { sequence: 9, occurredAt: 5_000 },
      { sequence: 4, occurredAt: 4_000 },
      { sequence: 7, occurredAt: 4_500 },
    ]);
    expect(out.map((row) => row.sequence)).toEqual([4, 7, 9]);
    expect(out[0].atMs).toBe(0);
    expect(out[1].atMs).toBe(500);
    expect(out[2].atMs).toBe(1_000);
  });

  it("clamps a fast gap up to the minimum", () => {
    const out = stagePlaybackSchedule([
      { sequence: 1, occurredAt: 1_000 },
      { sequence: 2, occurredAt: 1_010 },
    ]);
    expect(out[1].atMs).toBe(STAGE_PLAYBACK.MIN_GAP_MS);
  });

  it("clamps a slow gap down to the maximum", () => {
    const out = stagePlaybackSchedule([
      { sequence: 1, occurredAt: 0 },
      { sequence: 2, occurredAt: 600_000 },
    ]);
    expect(out[1].atMs).toBe(STAGE_PLAYBACK.MAX_GAP_MS);
  });

  it("uses the unknown gap when occurred_at is missing, partial, or runs backwards", () => {
    const missing = stagePlaybackSchedule([{ sequence: 1 }, { sequence: 2 }]);
    expect(missing[1].atMs).toBe(STAGE_PLAYBACK.UNKNOWN_GAP_MS);

    const halfKnown = stagePlaybackSchedule([{ sequence: 1, occurredAt: 0 }, { sequence: 2 }]);
    expect(halfKnown[1].atMs).toBe(STAGE_PLAYBACK.UNKNOWN_GAP_MS);

    const backwards = stagePlaybackSchedule([
      { sequence: 1, occurredAt: 9_000 },
      { sequence: 2, occurredAt: 1_000 },
    ]);
    expect(backwards[1].atMs).toBe(STAGE_PLAYBACK.UNKNOWN_GAP_MS);

    const notFinite = stagePlaybackSchedule([
      { sequence: 1, occurredAt: Number.NaN },
      { sequence: 2, occurredAt: 1_000 },
    ]);
    expect(notFinite[1].atMs).toBe(STAGE_PLAYBACK.UNKNOWN_GAP_MS);
  });

  it("dedupes equal sequences into one shared moment", () => {
    const out = stagePlaybackSchedule([
      { sequence: 2, occurredAt: 40_000 },
      { sequence: 2, occurredAt: 40_000 },
      { sequence: 3, occurredAt: 40_500 },
    ]);
    expect(out.map((row) => row.sequence)).toEqual([2, 3]);
    expect(out[0].atMs).toBe(0);
    // The duplicate never consumed a gap of its own.
    expect(out[1].atMs).toBe(500);
  });

  it("scales the whole schedule when the last slot exceeds the total cap", () => {
    const items: Array<{ sequence: number; occurredAt: number }> = [];
    for (let i = 0; i < 10; i++) items.push({ sequence: i + 1, occurredAt: i * 2_500 });
    const out = stagePlaybackSchedule(items);
    expect(out).toHaveLength(10);
    expect(out[0].atMs).toBe(0);
    expect(out[out.length - 1].atMs).toBe(STAGE_PLAYBACK.MAX_TOTAL_MS);
    for (let i = 1; i < out.length; i++) {
      expect(out[i].atMs).toBeGreaterThanOrEqual(out[i - 1].atMs);
      expect(out[i].atMs).toBeLessThanOrEqual(STAGE_PLAYBACK.MAX_TOTAL_MS);
    }
  });

  it("leaves a schedule at or under the cap untouched", () => {
    const out = stagePlaybackSchedule([
      { sequence: 1, occurredAt: 0 },
      { sequence: 2, occurredAt: 2_500 },
    ]);
    expect(out[1].atMs).toBe(2_500);
  });

  it("is pure: repeated calls return equal, independent results", () => {
    const items = [
      { sequence: 1, occurredAt: 0 },
      { sequence: 2, occurredAt: 900 },
    ];
    const first = stagePlaybackSchedule(items);
    const second = stagePlaybackSchedule(items);
    expect(second).toEqual(first);
    expect(items).toEqual([
      { sequence: 1, occurredAt: 0 },
      { sequence: 2, occurredAt: 900 },
    ]);
  });
});
