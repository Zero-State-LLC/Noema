/**
 * WATCH Pass 4 Visual Craft contract tests (Noema-Specs specify/watch-single-3d-stage.md D8).
 * Verifies Pass 4A (procedural IBL, Sobel normal/roughness PBR, 5 district materials, Fresnel rim,
 * shadow dirty-flagging & diff updates), Pass 4B (curved/instanced geometry, volumetric light shafts,
 * 6 role-matched articulated automatons, stocked workstations), and Pass 4C (dive-in transition,
 * SVG leader stems, camera presets, zero BRAND_BAN or post-processing drift).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const craftSrc = readFileSync(join(here, "../src/watch-stage-craft.js"), "utf8");
const stageSrc = readFileSync(join(here, "../src/watch-stage-client.js"), "utf8");
const roomSrc = readFileSync(join(here, "../src/watch-room-stage-client.js"), "utf8");
const viewSrc = readFileSync(join(here, "../src/watch-stage-view.ts"), "utf8");

const BRAND_BAN = /Orbitron|scanline|glitch|reticle|neon-grid|dashboard|particle/i;

describe("WATCH Pass 4A: IBL, PBR normal/roughness maps, Fresnel rim, and performance", () => {
  it("provides procedural PMREM nocturnal IBL, Sobel normal maps, Fresnel rim, and 5 district PBR sets", () => {
    expect(craftSrc).toContain("PMREMGenerator");
    expect(craftSrc).toContain("buildNocturnalEnvMap");
    expect(craftSrc).toContain("heightCanvasToNormalTexture");
    expect(craftSrc).toContain("applyRimGlow");
    for (const style of ['"flagstone"', '"hexgrate"', '"diamond"', '"apron"', '"basalt"']) {
      expect(craftSrc).toContain(style);
    }
  });

  it("mounts procedural environment lighting, dirty-flagged shadows, and throttled declutter on both stages", () => {
    for (const src of [stageSrc, roomSrc]) {
      expect(src).toContain("buildNocturnalEnvMap(renderer)");
      expect(src).toContain("scene.environment = envRig.envMap");
      expect(src).toContain("renderer.shadowMap.autoUpdate = false");
      expect(src).toContain("declutterDirty");
    }
    expect(stageSrc).toContain("worldSig !== lastWorldSig");
  });
});

describe("WATCH Pass 4B: sculpted curved/instanced geometry and 6 role-matched automaton rigs", () => {
  it("uses instanced geometry, draped TubeGeometry cables, volumetric light shafts, and exterior basalt context", () => {
    expect(stageSrc).toContain("InstancedMesh");
    expect(roomSrc).toContain("InstancedMesh");
    expect(roomSrc).toContain("TubeGeometry");
    expect(roomSrc).toContain("CatmullRomCurve3");
    expect(roomSrc).toContain("addLightShaft");
    expect(roomSrc).toContain("buildExteriorContext");
  });

  it("maps resident roles deterministically across 6 articulated automaton archetypes and overview pawns", () => {
    expect(stageSrc).toContain("overviewRoleKind");
    expect(roomSrc).toContain("roleArchetype");
    expect(roomSrc).toContain("armGroup");
    for (const role of ["archivist", "custodian", "surveyor", "founder", "quartermaster"]) {
      expect(roomSrc).toContain(role);
    }
  });
});

describe("WATCH Pass 4C: dive-in continuity, SVG leader stems, camera presets, and brand discipline", () => {
  it("wires Overview diveTo(), Room View SVG leader stems, and 1/2/3 camera presets", () => {
    expect(stageSrc).toContain("function diveTo(");
    expect(roomSrc).toContain("room3d-leaders");
    expect(roomSrc).toContain("presetView");
    expect(viewSrc).toContain(".room3d-leaders");
  });

  it("keeps zero post-processing passes (D6 §8) and zero BRAND_BAN vocabulary", () => {
    for (const src of [craftSrc, stageSrc, roomSrc, viewSrc]) {
      expect(src).not.toContain("EffectComposer");
      expect(src).not.toContain("UnrealBloomPass");
      expect(src).not.toContain("postprocessing");
      expect(src).not.toMatch(BRAND_BAN);
    }
  });
});

describe("WATCH Pass 4D: shaft feathering, edge-clamped labels, and compact Room bar", () => {
  it("tapers volumetric shaft alpha to 0 at both top and bottom ends", () => {
    const shaftFn = roomSrc.slice(
      roomSrc.indexOf("function makeShaftTexture"),
      roomSrc.indexOf("function addLightShaft"),
    );
    expect(shaftFn).toContain('addColorStop(0, "rgba(255,255,255,0)")');
    expect(shaftFn).toContain('addColorStop(1, "rgba(255,255,255,0)")');
  });

  it("clamps non-overlapping room labels inside the stage frame and keeps Room bar compact down to 560px", () => {
    expect(roomSrc).toContain("let [ox, oy] = clamp(base, 0, 0, maxShift);");
    expect(viewSrc).toContain("@media(max-width:560px)");
    expect(viewSrc).toContain(".room-place-select{min-height:36px;height:36px;");
  });
});
