/**
 * Pins the successor-cutover boundary record. The runbook does not
 * authorize a cutover; it names the frozen first world as out of scope.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNBOOK = readFileSync(join(HERE, "../../../docs/SUCCESSOR-CUTOVER-RUNBOOK.md"), "utf8");
const COMPAT = JSON.parse(readFileSync(join(HERE, "../../../spec-compat.json"), "utf8")) as {
  frozen_release?: { genesis_id?: string; do_name?: string; world_id?: string; seal?: string };
  hosted_live?: { world_id?: string; genesis_id?: string; do_name?: string };
};

const FROZEN_GENESIS = "genesis.ef578f4ffceeccd0";
const FROZEN_DO = "world-01";
const LIVE_WORLD = "world.perihelion-reach-3";
const LIVE_GENESIS = "genesis.94d0961984b2b4f8";

describe("successor cutover runbook", () => {
  it("exists as a boundary record and does not authorize a cutover", () => {
    expect(RUNBOOK).toMatch(/does \*\*not\*\* authorize a successor cutover/i);
    expect(RUNBOOK).toMatch(/Out of scope — frozen first world/);
    expect(RUNBOOK).toContain("Do not PLAY `world-01`");
    expect(RUNBOOK).toContain("Do not reseed `genesis.ef578f4ffceeccd0`");
    expect(RUNBOOK).toContain("Do not `force:true`");
    expect(RUNBOOK).not.toMatch(/run this cutover now/i);
  });

  it("names the frozen first world out of scope with live PLAY distinct", () => {
    expect(RUNBOOK).toContain(FROZEN_DO);
    expect(RUNBOOK).toContain(FROZEN_GENESIS);
    expect(RUNBOOK).toContain("world.perihelion-reach");
    expect(RUNBOOK).toContain(LIVE_WORLD);
    expect(RUNBOOK).toContain(LIVE_GENESIS);
    expect(COMPAT.frozen_release?.do_name).toBe(FROZEN_DO);
    expect(COMPAT.frozen_release?.genesis_id).toBe(FROZEN_GENESIS);
    expect(COMPAT.hosted_live?.world_id).toBe(LIVE_WORLD);
    expect(COMPAT.hosted_live?.genesis_id).toBe(LIVE_GENESIS);
    expect(COMPAT.hosted_live?.do_name).not.toBe(FROZEN_DO);
  });

  it("keeps prior reach-2 PLAY from reseeding and keeps Recover off the PLAY path", () => {
    expect(RUNBOOK).toContain("world.perihelion-reach-2");
    expect(RUNBOOK).toContain("not reseeding");
    expect(RUNBOOK).toContain("PLAY never follows that allowlist");
    expect(RUNBOOK).toContain("DEFAULT_WORLD_ID");
  });
});
