import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { layoutPublicTopology, asciiCartogram, CARTOGRAM_COLS, CARTOGRAM_ROWS } from "../src/watch-phosphor";
import { disposeSceneMeshes } from "../src/watch-fluid-map.js";

const here = dirname(fileURLToPath(import.meta.url));

function publicSnapshot(sequence, rooms) {
  return { projection: "public", world_id: "world.test", cycle: 1, sequence, rooms, recent_events: [] };
}

function stageHarness() {
  const nodes = new Map();
  for (const id of ["watch-fluid-flat", "watch-fluid-gl", "watch-fluid-text", "watch-fluid-help", "watch-fluid-note"]) {
    nodes.set(id, { hidden: false, className: "", textContent: "", clientWidth: 0, clientHeight: 0,
      getContext: () => id === "watch-fluid-flat" ? {} : null });
  }
  const root = { dataset: {}, hidden: true,
    querySelector: (selector) => nodes.get(selector.slice(1)) };
  const mounted = [];
  const source = readFileSync(join(here, "../src/watch-fluid.js"), "utf8")
    .replace(/^import \{.*\} from "\.\/watch-phosphor";\s*/m,
      "const { layoutPublicTopology, asciiCartogram, CARTOGRAM_COLS, CARTOGRAM_ROWS } = layout;")
    .replace('import("/assets/watch-fluid-map.js")', "Promise.resolve({ mountStage: __testMountStage })")
    .replace("export function mountFluidStage", "function mountFluidStage")
    .replace("export { mountFluidStage };", "");
  const stage = runInNewContext(`${source}\nmountFluidStage`, {
    layout: { layoutPublicTopology, asciiCartogram, CARTOGRAM_COLS, CARTOGRAM_ROWS },
    __testMountStage: () => {
      const map = { update: vi.fn(), dispose: vi.fn(), morphTo: vi.fn(async () => true),
        focus: vi.fn(), resize: vi.fn(), setReducedMotion: vi.fn() };
      mounted.push(map);
      return map;
    },
    matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
    ResizeObserver: class { observe() {} disconnect() {} },
    document: { fonts: { ready: Promise.resolve(), load: async () => [] } },
    window: { dispatchEvent() {} }, Event: class { constructor(type) { this.type = type; } }, console,
    setTimeout, performance: { now: () => 0 }, devicePixelRatio: 1,
  });
  return { controller: stage(root), root, mounted };
}

describe("public WATCH 3D stage lifecycle", () => {
  it("remounts the selected map after public rooms disappear and return", async () => {
    const h = stageHarness();
    const room = { room_id: "room.market", name: "Market", active: true, exits: [], entities: [], players_present: 1 };
    expect(layoutPublicTopology([room], [], "").nodes.map((node) => node.room_id)).toContain("room.market");
    try {
      h.controller.update(publicSnapshot(1, [room]));
      await h.controller.setMode("map");
      expect(h.mounted).toHaveLength(1);
      expect(h.root.dataset.renderer).toBe("map");
      h.controller.update(publicSnapshot(2, []));
      expect(h.mounted[0].dispose).toHaveBeenCalledOnce();
      expect(h.root.dataset.renderer).toBe("flat");
      h.controller.update(publicSnapshot(3, [room]));
      await vi.waitFor(() => expect(h.mounted).toHaveLength(2));
      expect(h.mounted[1].update).toHaveBeenCalled();
      expect(h.root.dataset.renderer).toBe("map");
    } finally { h.controller.dispose(); }
  });

  it("releases instance resources but retains shared geometry until stage teardown", () => {
    const scene = new THREE.Scene();
    const shared = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial();
    const first = new THREE.InstancedMesh(shared, material, 1);
    const second = new THREE.InstancedMesh(shared, material, 1);
    const glyphGeometry = new THREE.PlaneGeometry();
    const glyph = new THREE.Mesh(glyphGeometry, material);
    for (const mesh of [first, second, glyph]) scene.add(mesh);
    const firstDispose = vi.spyOn(first, "dispose");
    const secondDispose = vi.spyOn(second, "dispose");
    const sharedDispose = vi.spyOn(shared, "dispose");
    const glyphDispose = vi.spyOn(glyphGeometry, "dispose");
    disposeSceneMeshes(scene, [first, second, glyph], shared);
    expect(firstDispose).toHaveBeenCalledOnce();
    expect(secondDispose).toHaveBeenCalledOnce();
    expect(glyphDispose).toHaveBeenCalledOnce();
    expect(sharedDispose).not.toHaveBeenCalled();
    expect(scene.children).toHaveLength(0);
    shared.dispose(); material.dispose();
  });
});
