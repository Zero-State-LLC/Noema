/** ADR-008: the reducer must produce the same world_state for the same inputs.
 *  Ids that persist into world state may not come from implicit random streams. */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { deterministicId, deterministicSuffix } from "../src/ids";
import { allocateAgreementId, allocateBreachId } from "../src/diplomacy";
import { allocateReconstructionId } from "../src/reconstruction";
import { allocateOfficeId } from "../src/offices";
import { pushEvidenceFragment } from "../src/deep-time";

const SRC = join(new URL(".", import.meta.url).pathname, "../src");

describe("ADR-008 — no implicit random streams in persisted world state", () => {
  it("no world-state module mints ids with Math.random()", () => {
    for (const f of ["deep-time.ts", "diplomacy.ts", "offices.ts", "reconstruction.ts", "world-actions.ts"]) {
      const src = readFileSync(join(SRC, f), "utf8");
      expect(src, `${f} must not use Math.random() for world state`).not.toMatch(/Math\.random\(\)/);
    }
  });

  it("same world facts reproduce the same ids; different facts diverge", () => {
    expect(allocateAgreementId(40, 7, "player.a+player.b")).toBe(allocateAgreementId(40, 7, "player.a+player.b"));
    expect(allocateAgreementId(41, 7, "player.a+player.b")).not.toBe(allocateAgreementId(40, 7, "player.a+player.b"));
    expect(allocateBreachId(9, 2, "agreement.x")).toBe(allocateBreachId(9, 2, "agreement.x"));
    expect(allocateReconstructionId(5, 1, "player.a")).toBe(allocateReconstructionId(5, 1, "player.a"));
    expect(allocateOfficeId("org.compact", "Warden", 12, 3)).toBe(allocateOfficeId("org.compact", "Warden", 12, 3));
    // the collision salt still yields a distinct, deterministic id
    expect(allocateOfficeId("org.compact", "Warden#1", 12, 3)).not.toBe(allocateOfficeId("org.compact", "Warden", 12, 3));
  });

  it("replaying an identical evidence-fragment write reproduces the fragment id", () => {
    const frag = {
      subject_ref: "entity.relay-trunk",
      kind: "ATTEST" as const,
      cycle: 4,
      player_id: "player.a",
      grounding: "observed",
      claim: "the relay holds",
    };
    const a = { world_id: "w", cycle: 4, rooms: {}, players: {} } as never;
    const b = { world_id: "w", cycle: 4, rooms: {}, players: {} } as never;
    expect(pushEvidenceFragment(a, frag).fragment_id).toBe(pushEvidenceFragment(b, frag).fragment_id);
  });

  it("the suffix is stable, 8 hex chars, and spreads across inputs", () => {
    expect(deterministicSuffix("x", 1)).toMatch(/^[0-9a-f]{8}$/);
    expect(deterministicId("thing", "a")).toBe("thing." + deterministicSuffix("a"));
    const seen = new Set(Array.from({ length: 500 }, (_, i) => deterministicSuffix("agreement", i, 7)));
    expect(seen.size).toBe(500);
  });
});
