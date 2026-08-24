import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ORG_RATCHET_CAP,
  orgCreateExtraInfluence,
  pathDependenceIndex,
  ratchetOnAttest,
  ratchetOnOrgCreate,
  type DeepTimeSlice,
  type ScarRecord,
} from "../src/deep-time";

const HERE = new URL(".", import.meta.url).pathname;
const SRC = join(HERE, "../src");

/**
 * Specs RESEARCH-ASSIMILATION-2026-08-24-ENGINEERING Slice A records four
 * OBSERVED claims about the Deep Time tails and asks for fixtures that pin
 * them, so the concordance cannot silently rot. Each test names the claim it
 * pins. If one fails, the runtime moved and the Specs document is now wrong —
 * fix both or neither.
 */

function slice(): DeepTimeSlice {
  return {} as DeepTimeSlice;
}

function scar(strength: number): ScarRecord {
  return {
    scar_id: `scar.econ.${strength}`,
    domain: "economic",
    room_id: "room.hub",
    strength,
    established_cycle: 1,
    visibility: "public",
  } as ScarRecord;
}

describe("Deep Time tails — Specs #285 Slice A concordance", () => {
  it("path_dependence_index is the clamped MAX of scar mean and ratchet mean", () => {
    // Claim: "folded into LOOK path_dependence_index (max of scar-strength
    // mean and ratchet mean)". Max, not sum, not product — a quiet change to
    // the fold changes every LOOK in the world.
    expect(pathDependenceIndex(undefined, undefined)).toBe(0);
    expect(pathDependenceIndex([scar(0.2), scar(0.6)], undefined)).toBeCloseTo(0.4);

    const w = slice();
    for (let i = 0; i < 3; i++) ratchetOnOrgCreate(w, i + 1); // strength 3/5
    const ratchets = (w as { norm_ratchets?: Record<string, never> }).norm_ratchets;
    expect(pathDependenceIndex(undefined, ratchets)).toBeCloseTo(0.6);
    // scar mean 0.4 vs ratchet mean 0.6 → the max wins.
    expect(pathDependenceIndex([scar(0.2), scar(0.6)], ratchets)).toBeCloseTo(0.6);
    // and it is clamped, never above 1 even with a corrupt strength.
    expect(pathDependenceIndex([scar(5)], ratchets)).toBe(1);
  });

  it("reversal_cost is the cost driver; path_dependence_strength drives nothing", () => {
    // Claim: "It is not a cost driver. reversal_cost is."
    const w = slice();
    const r1 = ratchetOnOrgCreate(w, 1);
    expect(orgCreateExtraInfluence(w as never)).toBe(r1.reversal_cost);
    for (let i = 2; i <= 9; i++) ratchetOnOrgCreate(w, i);
    // Cost saturates at the RFC-0123 cap...
    expect(orgCreateExtraInfluence(w as never)).toBe(ORG_RATCHET_CAP);
    // ...while path_dependence_strength saturates independently at 1 —
    // the two travel together only by coincidence of small numbers.
    const org = (w as { norm_ratchets?: { org_create?: { path_dependence_strength: number } } })
      .norm_ratchets?.org_create;
    expect(org?.path_dependence_strength).toBe(1);

    // ATTEST establishes path dependence with reversal_cost pinned to 0:
    // strength without surcharge, the cleanest proof the two fields are
    // different things.
    const wa = slice();
    for (let i = 0; i < 4; i++) ratchetOnAttest(wa, i + 1);
    const attest = (wa as { norm_ratchets?: { attest?: { reversal_cost: number; path_dependence_strength: number } } })
      .norm_ratchets?.attest;
    expect(attest?.reversal_cost).toBe(0);
    expect(attest?.path_dependence_strength).toBeCloseTo(0.5);
  });

  it("the scar domain set is closed and no myth producer exists", () => {
    // Claim: "Myth scars have no domain (economic / social / territorial only)
    // and no producer." The union type enforces the set at compile time; this
    // pins the absence at the token level so a 'myth' domain or producer cannot
    // land without failing here first.
    const read = (dir: string): string =>
      readdirSync(dir, { withFileTypes: true })
        .map((e) => (e.isDirectory() ? read(join(dir, e.name)) : e.name.endsWith(".ts") ? readFileSync(join(dir, e.name), "utf8") : ""))
        .join("\n");
    const src = read(SRC);
    expect(src).toContain('"economic" | "social" | "territorial"');
    expect(src.toLowerCase()).not.toContain("myth");
  });

  it("lore attractors and the index stay off the cost and signaling paths", () => {
    // Claim: attractors "do not change harvest or signaling", and the index is
    // display-only. Neither identifier may appear in the modules that price
    // actions or compute signal quality.
    for (const file of ["actions.ts", "cargo.ts", "resource-production.ts", "signal.ts", "curvature.ts"]) {
      const text = readFileSync(join(SRC, file), "utf8");
      expect(text, `${file} must not consume lore_attractors`).not.toContain("lore_attractors");
      expect(text, `${file} must not consume path_dependence`).not.toContain("path_dependence");
    }
  });
});
