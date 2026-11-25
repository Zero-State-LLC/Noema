/**
 * D6 MAJOR moment and tier director (specify/watch-single-3d-stage.md).
 * Additive: no existing test is changed.
 */
import { test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  STAGE_DIRECTOR,
  STAGE_MAJOR_MOMENT_MS,
  stageDirectorPick,
  type StageShot,
} from "../src/watch-stage-model";
import { PULSE_TTL } from "../src/watch-phosphor";
import { STAGE_KEY } from "../src/watch-stage-view";

const notable = (roomId: string, sequence: number) => ({ roomId, tier: "NOTABLE", sequence });
const major = (roomId: string, sequence: number) => ({ roomId, tier: "MAJOR", sequence });
const shot = (roomId: string, tier: "NOTABLE" | "MAJOR", sequence: number, at: number): StageShot => ({
  roomId,
  tier,
  sequence,
  at,
});

test("stageDirectorPick ignores NORMAL, unknown tiers and empty room ids", () => {
  assert.equal(stageDirectorPick(null, [{ roomId: "a", tier: "NORMAL", sequence: 9 }], 1000), null);
  assert.equal(stageDirectorPick(null, [{ roomId: "b", tier: "loud", sequence: 9 }], 1000), null);
  assert.equal(stageDirectorPick(null, [{ roomId: "", tier: "MAJOR", sequence: 9 }], 1000), null);
  assert.equal(stageDirectorPick(null, [], 1000), null);
});

test("stageDirectorPick cuts to the best candidate when no shot is held", () => {
  assert.deepEqual(stageDirectorPick(null, [notable("a", 3)], 1000), shot("a", "NOTABLE", 3, 1000));
});

test("stageDirectorPick never re-cuts to the room it already holds", () => {
  assert.equal(stageDirectorPick(shot("a", "NOTABLE", 3, 0), [notable("a", 8)], 10_000), null);
});

test("stageDirectorPick holds a shot for the dwell", () => {
  const held = shot("a", "NOTABLE", 1, 0);
  assert.equal(stageDirectorPick(held, [notable("b", 2)], STAGE_DIRECTOR.DWELL_MS - 1), null);
  assert.deepEqual(
    stageDirectorPick(held, [notable("b", 2)], STAGE_DIRECTOR.DWELL_MS),
    shot("b", "NOTABLE", 2, STAGE_DIRECTOR.DWELL_MS),
  );
});

test("stageDirectorPick lets a MAJOR preempt a non-MAJOR shot after the preempt window", () => {
  const held = shot("a", "NOTABLE", 1, 0);
  assert.equal(stageDirectorPick(held, [major("b", 2)], STAGE_DIRECTOR.MAJOR_PREEMPT_MS - 1), null);
  assert.deepEqual(
    stageDirectorPick(held, [major("b", 2)], STAGE_DIRECTOR.MAJOR_PREEMPT_MS),
    shot("b", "MAJOR", 2, STAGE_DIRECTOR.MAJOR_PREEMPT_MS),
  );
});

test("stageDirectorPick does not let a MAJOR preempt a MAJOR before the dwell", () => {
  const held = shot("a", "MAJOR", 1, 0);
  assert.equal(stageDirectorPick(held, [major("b", 2)], STAGE_DIRECTOR.MAJOR_PREEMPT_MS), null);
  assert.equal(stageDirectorPick(held, [major("b", 2)], STAGE_DIRECTOR.DWELL_MS - 1), null);
  assert.deepEqual(
    stageDirectorPick(held, [major("b", 2)], STAGE_DIRECTOR.DWELL_MS),
    shot("b", "MAJOR", 2, STAGE_DIRECTOR.DWELL_MS),
  );
});

test("stageDirectorPick prefers the higher tier over the newer sequence", () => {
  assert.deepEqual(stageDirectorPick(null, [notable("a", 99), major("b", 1)], 500), shot("b", "MAJOR", 1, 500));
});

test("stageDirectorPick breaks equal tiers on the newer sequence", () => {
  assert.deepEqual(stageDirectorPick(null, [notable("a", 5), notable("b", 7)], 500), shot("b", "NOTABLE", 7, 500));
  assert.deepEqual(stageDirectorPick(null, [major("a", 4), major("b", 6)], 500), shot("b", "MAJOR", 6, 500));
});

test("the MAJOR moment lasts two to four seconds and outlives the §18.6 pulse", () => {
  assert.ok(STAGE_MAJOR_MOMENT_MS >= 2000, "at least 2 s");
  assert.ok(STAGE_MAJOR_MOMENT_MS <= 4000, "at most 4 s");
  assert.ok(STAGE_MAJOR_MOMENT_MS > PULSE_TTL.MAJOR, "longer than the MAJOR pulse");
  assert.ok(STAGE_DIRECTOR.DWELL_MS >= 4000, "dwells at least 4 s");
  assert.ok(STAGE_DIRECTOR.MAJOR_PREEMPT_MS >= 1500, "preempts after 1.5 s");
});

const clientSource = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/watch-stage-client.js"), "utf8");

test("the stage client runs the director, guards Follow, and stops on camera movement", () => {
  assert.match(clientSource, /stageDirectorPick/);
  assert.match(clientSource, /!ctx\.followRoomId/);
  assert.match(clientSource, /addEventListener\("start", \(\) => \{[^}]*shot = null/);
  assert.match(clientSource, /const moments = \[\]/);
  assert.match(clientSource, /startMoment\(/);
  assert.match(clientSource, /is-moment/);
});

test("the map key explains the MAJOR moment", () => {
  const row = STAGE_KEY.find(([k]) => k === "moment");
  assert.ok(row, "a moment row in the map key");
  if (row) assert.match(row[1], /MAJOR/);
});
