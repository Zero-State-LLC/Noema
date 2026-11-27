/**
 * WATCH Pass 5A Diorama Focus, Controls & Chiaroscuro Craft contract tests.
 * Verifies Focus/All/Clean label hierarchy, clickable 1/2/3 camera presets,
 * turned LatheGeometry hero silhouettes, single select chevron suppression,
 * zero localStorage persistence for view toggles (D3), and zero BRAND_BAN drift.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const stageSrc = readFileSync(join(here, "../src/watch-stage-client.js"), "utf8");
const roomSrc = readFileSync(join(here, "../src/watch-room-stage-client.js"), "utf8");
const viewSrc = readFileSync(join(here, "../src/watch-stage-view.ts"), "utf8");
const watchSrc = readFileSync(join(here, "../src/watch.ts"), "utf8");

const BRAND_BAN = /Orbitron|scanline|glitch|reticle|neon-grid|dashboard|particle/i;

describe("WATCH Pass 5A: Room View label hierarchy, clickable presets, and LatheGeometry craft", () => {
  it("provides Focus/All/Clean label modes and clickable 1/2/3 camera preset controls meeting 44px targets", () => {
    expect(viewSrc).toContain('data-label-mode="focus"');
    expect(viewSrc).toContain('data-label-mode="all"');
    expect(viewSrc).toContain('data-label-mode="clean"');
    expect(viewSrc).toContain('data-cam-preset="1"');
    expect(viewSrc).toContain('data-cam-preset="2"');
    expect(viewSrc).toContain('data-cam-preset="3"');
    expect(viewSrc).toContain(".room-stage-pill{\n  cursor:pointer;min-height:44px;");
    expect(viewSrc).toContain("::picker-icon{display:none}");
    expect(viewSrc).toContain("opacity:0;visibility:hidden;pointer-events:none;");
  });

  it("wires setLabelMode, setCameraPreset, L shortcut, and active workstation tagging without localStorage writes", () => {
    expect(roomSrc).toContain("function setLabelMode(");
    expect(roomSrc).toContain("function setCameraPreset(");
    expect(roomSrc).toContain('ent.tagEl.classList.toggle("is-active", busy)');
    expect(roomSrc).toContain("room3d-portal-dir");
    expect(roomSrc).toContain("room3d-portal-dest");
    expect(roomSrc).not.toContain("localStorage");
    expect(watchSrc).toContain("setRoomLabelMode");
    expect(watchSrc).toContain("setRoomCameraPreset");
    expect(watchSrc).not.toMatch(/localStorage.*roomLabelMode|localStorage.*roomCameraPreset/i);
  });

  it("uses turned LatheGeometry silhouettes and chiaroscuro hearth modulation with zero post-processing or BRAND_BAN drift", () => {
    expect(roomSrc).toContain("brazierBowl: new LatheGeometry");
    expect(roomSrc).toContain("reactorBell: new LatheGeometry");
    expect(roomSrc).toContain("parabolicDish: new LatheGeometry");
    expect(roomSrc).toContain("daisPedestal: new LatheGeometry");
    expect(roomSrc).toContain("innerMotes");
    for (const src of [stageSrc, roomSrc, viewSrc]) {
      expect(src).not.toContain("EffectComposer");
      expect(src).not.toContain("UnrealBloomPass");
      expect(src).not.toContain("postprocessing");
      expect(src).not.toMatch(BRAND_BAN);
    }
  });
});

describe("WATCH Pass 5B: zero-rebuild Overview reconciliation and macro activity cues", () => {
  it("separates topology rebuilds (topoSig) from in-place dynamic site and token reconciliation", () => {
    expect(stageSrc).toContain("topoSig !== lastTopoSig");
    expect(stageSrc).toContain("function syncSiteDynamic(");
    expect(stageSrc).toContain("function syncSiteTokens(");
    expect(stageSrc).toContain("function updateSiteLabel(");
    expect(stageSrc).toContain("let [ox, oy] = clampOffset(base, 0, 0, maxShift);");
  });

  it("extracts macro verb/speech cues newest-first from public recent_events and documents speech pips in STAGE_KEY", () => {
    expect(stageSrc).toContain("function extractMacroActivity(");
    expect(stageSrc).toContain("(Number(b.sequence) || 0) - (Number(a.sequence) || 0)");
    expect(stageSrc).toContain("VERB_RING_COLORS");
    expect(stageSrc).toContain("stage3d-speech-pip");
    expect(viewSrc).toContain(".stage3d-speech-pip");
    expect(viewSrc).toContain('["speech",');
  });
});
