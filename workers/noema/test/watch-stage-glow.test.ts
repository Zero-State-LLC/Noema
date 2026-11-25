import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { STAGE_GLOW, stageGlowLevel } from "../src/watch-stage-model";

const quiet = { active: false, players: 0, major: false, followed: false };

describe("stageGlowLevel", () => {
  it("is 0 for a quiet site", () => {
    expect(stageGlowLevel(quiet)).toBe(0);
  });

  it("increases with players and caps at six", () => {
    const a = stageGlowLevel({ ...quiet, active: true, players: 0 });
    const b = stageGlowLevel({ ...quiet, active: true, players: 3 });
    const c = stageGlowLevel({ ...quiet, active: true, players: 6 });
    const d = stageGlowLevel({ ...quiet, active: true, players: 100 });
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
    expect(d).toBe(c);
  });

  it("caps the MAJOR boost at MAX_OPACITY", () => {
    const level = stageGlowLevel({ ...quiet, major: true, players: 100 });
    expect(level).toBeLessThanOrEqual(STAGE_GLOW.MAX_OPACITY);
    expect(level).toBe(STAGE_GLOW.MAX_OPACITY);
  });

  it("gives a followed site at least MIN_OPACITY + 0.1", () => {
    const level = stageGlowLevel({ ...quiet, followed: true });
    expect(level).toBeGreaterThanOrEqual(STAGE_GLOW.MIN_OPACITY + 0.1);
  });

  it("always stays within [0, MAX_OPACITY]", () => {
    for (const active of [false, true]) {
      for (const major of [false, true]) {
        for (const followed of [false, true]) {
          for (const players of [0, 1, 6, 20]) {
            const level = stageGlowLevel({ active, major, followed, players });
            expect(level).toBeGreaterThanOrEqual(0);
            expect(level).toBeLessThanOrEqual(STAGE_GLOW.MAX_OPACITY);
          }
        }
      }
    }
  });
});

const here = dirname(fileURLToPath(import.meta.url));
const clientSrc = readFileSync(join(here, "../src/watch-stage-client.js"), "utf8");
const viewSrc = readFileSync(join(here, "../src/watch-stage-view.ts"), "utf8");

describe("watch-stage-client static glow", () => {
  it("draws the halo with additive blending and the model's glow level", () => {
    expect(clientSrc).toContain("AdditiveBlending");
    expect(clientSrc).toContain("stageGlowLevel");
    expect(clientSrc).toContain("CanvasTexture");
  });

  it("carries no post-processing passes", () => {
    expect(clientSrc).not.toContain("EffectComposer");
    expect(clientSrc).not.toContain("UnrealBloomPass");
    expect(clientSrc).not.toContain("postprocessing");
  });

  it("documents the glow in the map key", () => {
    expect(viewSrc).toContain('"glow"');
  });
});
