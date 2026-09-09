import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { watchHtml } from "../src/watch";
import {
  MAP_CAM_EASE_MS,
  MAP_GL_SRC,
  MAP_PARITY_LINE,
  mapActionCameraRoom,
  mapCameraEaseMs,
  mapCameraTarget,
  mapFollowMoveRoom,
  mapFollowedRoomId,
  mapGlUsable,
  mapPublicExitTarget,
  mapHeadsDisagree,
  mapNodeClassName,
  mapPublicRoomId,
  mapStageNodes,
  watchMapGlInlineSource,
} from "../src/watch-map-gl";
import { WITHHELD_LEDE, WITHHELD_NONE } from "../src/watch-theater";

const HERE = dirname(fileURLToPath(import.meta.url));
const rooms = [
  { room_id: "room.hub", name: "Hub", public_player_labels: ["reach-maint3"], x: 0, y: 0 },
  { room_id: "room.east", name: "East", public_player_labels: [], x: 1, y: 0 },
];

describe("mapPublicRoomId", () => {
  it("returns only ids already on the public snapshot", () => {
    expect(mapPublicRoomId(rooms, "room.hub")).toBe("room.hub");
    expect(mapPublicRoomId(rooms, "room.secret")).toBe("");
    expect(mapPublicRoomId(rooms, "")).toBe("");
    expect(mapPublicRoomId(null, "room.hub")).toBe("");
  });
});

describe("Direct-Camera", () => {
  it("aims at NOTABLE/MAJOR public room_id and stays when the site is withheld", () => {
    expect(mapActionCameraRoom({ tier: "NOTABLE", room_id: "room.east" }, rooms)).toBe("room.east");
    expect(mapActionCameraRoom({ tier: "MAJOR", room_id: "room.hub" }, rooms)).toBe("room.hub");
    expect(mapActionCameraRoom({ tier: "NOTABLE" }, rooms)).toBe("");
    expect(mapActionCameraRoom({ tier: "NOTABLE", room_id: "room.hidden" }, rooms)).toBe("");
    expect(mapActionCameraRoom({ tier: "NORMAL", room_id: "room.hub" }, rooms)).toBe("");
  });

  it("uses Phosphor NOTABLE time and hard-cuts when motion is reduced", () => {
    expect(MAP_CAM_EASE_MS).toBe(560);
    expect(mapCameraEaseMs(false)).toBe(560);
    expect(mapCameraEaseMs(true)).toBe(0);
  });
});

describe("Follow that teaches", () => {
  it("auto-focuses a followed agent's public MOVE and never invents a site", () => {
    const follow = { kind: "agent", id: "reach-maint3" };
    const events = [
      { projection_id: "agent_move", actor_label: "reach-maint3", room_id: "room.east" },
      { projection_id: "production", actor_label: "reach-maint3", room_id: "room.hub" },
    ];
    expect(mapFollowMoveRoom(follow, events, rooms)).toBe("room.east");
    expect(mapFollowMoveRoom(follow, [{ projection_id: "agent_move", actor_label: "reach-maint3" }], rooms)).toBe("");
    expect(mapFollowedRoomId(follow, rooms)).toBe("room.hub");
    expect(mapFollowedRoomId({ kind: "site", id: "room.east" }, rooms)).toBe("room.east");
  });

  it("lets action magnet win over follow MOVE", () => {
    expect(
      mapCameraTarget({
        head: { tier: "MAJOR", room_id: "room.hub" },
        rooms,
        follow: { kind: "agent", id: "reach-maint3" },
        events: [{ projection_id: "agent_move", actor_label: "reach-maint3", room_id: "room.east" }],
      }),
    ).toBe("room.hub");
    expect(
      mapCameraTarget({
        head: { tier: "NORMAL", room_id: "room.hub" },
        rooms,
        follow: { kind: "agent", id: "reach-maint3" },
        events: [{ projection_id: "agent_move", actor_label: "reach-maint3", room_id: "room.east" }],
      }),
    ).toBe("room.east");
  });
});

describe("parity and fallback", () => {
  it("flags map JSON heads that disagree with live and keeps live as SoT", () => {
    const live = { world_id: "world.a", cycle: 4, sequence: 9, freshness: "live" };
    expect(mapHeadsDisagree(live, { ...live })).toBe(false);
    expect(mapHeadsDisagree(live, { ...live, sequence: 8 })).toBe(true);
    expect(mapHeadsDisagree(live, { ...live, freshness: "stale" })).toBe(true);
    expect(mapHeadsDisagree(live, null)).toBe(false);
    expect(MAP_PARITY_LINE).toBe("Map overlay is behind the live window.");
  });

  it("refuses GL without a WebGL context", () => {
    expect(mapGlUsable(null)).toBe(false);
    expect(mapGlUsable({})).toBe(false);
    expect(mapGlUsable({ getContext: () => null })).toBe(false);
    expect(mapGlUsable({ getContext: (id: string) => (id === "webgl" ? {} : null) })).toBe(true);
  });
});

describe("stage nodes stay public-only", () => {
  it("never adds a map-only room and keeps live exits", () => {
    const live = [
      {
        room_id: "room.hub",
        name: "Hub",
        exits: [{ to_room_id: "room.east" }, { to_room_id: "room.secret" }],
        players_present: 1,
      },
    ];
    const map = [
      { room_id: "room.hub", x: 2, y: 1 },
      { room_id: "room.secret", x: 9, y: 9 },
    ];
    const nodes = mapStageNodes(live, map);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].room_id).toBe("room.hub");
    expect(nodes[0].x).toBe(2);
    expect(JSON.stringify(nodes)).not.toContain("room.secret");
  });

  it("marks camera and follow on the DOM fallback node", () => {
    expect(mapNodeClassName({ room_id: "room.hub", active: true }, "room.hub", "room.hub")).toBe(
      "map-node is-active is-cam is-follow",
    );
    expect(mapNodeClassName({ room_id: "room.east" }, "room.hub", "")).toBe("map-node");
  });
});

describe("MAP chrome keeps Gate D five-slot and lazy GL", () => {
  const map = watchHtml({ mode: "map" });
  const text = watchHtml({ mode: "text" });

  it("shares NOW Recently Prior/Unknown chrome and does not bury it under the canvas", () => {
    expect(map).toContain('id="watch-hero-who"');
    expect(map).toContain('id="watch-hero-where"');
    expect(map).toContain('id="watch-conseq"');
    expect(map).toContain('id="watch-now-actors"');
    expect(map).toContain('id="watch-feed"');
    expect(map).toContain('id="watch-withheld"');
    expect(map).toContain(WITHHELD_LEDE);
    expect(map).toContain(WITHHELD_NONE);
    expect(map.indexOf('id="watch-hero-who"')).toBeGreaterThan(map.indexOf('id="watch-map-gl"'));
    expect(map).toContain('id="watch-map-board"');
    expect(map).toContain('id="watch-map-parity"');
    expect(map).toMatch(/id="watch-map-gl"[^>]*aria-hidden="true"/);
    expect(map).toContain('id="watch-headline" aria-live="polite"');
    expect(map).not.toMatch(/id="watch-map-gl"[^>]*aria-live/);
  });

  it("does not put Three.js on the TEXT path and only lazy-loads the MAP chunk", () => {
    expect(map).toContain(MAP_GL_SRC);
    expect(map).toContain("tryMapGl");
    expect(map).toContain("fallbackMapDom");
    expect(map).toContain("mapCameraTarget");
    expect(text).not.toContain("from \"three\"");
    expect(map).not.toContain("from \"three\"");
    expect(map).not.toMatch(/Orbitron/i);
    expect(map).not.toMatch(/scanline/i);
    expect(map).not.toMatch(/particle/i);
    expect(map).not.toMatch(/requestAnimationFrame\(\s*loop/i);
  });

  it("keeps inlined camera helpers free of bundler __name", () => {
    const src = watchMapGlInlineSource();
    expect(src).not.toContain("__name");
    const leaves = [
      mapPublicRoomId,
      mapPublicExitTarget,
      mapActionCameraRoom,
      mapFollowMoveRoom,
      mapFollowedRoomId,
      mapCameraTarget,
      mapCameraEaseMs,
      mapHeadsDisagree,
      mapGlUsable,
      mapNodeClassName,
      mapStageNodes,
    ];
    for (const fn of leaves) {
      const body = fn.toString().slice(fn.toString().indexOf("{") + 1, fn.toString().lastIndexOf("}"));
      expect(body, fn.name).not.toMatch(/\bfunction\b/);
    }
  });
});

describe("built MAP chunk", () => {
  it("exists, is MAP-only, and our stage source omits banned brand marks", () => {
    const chunk = readFileSync(join(HERE, "../public/assets/watch-map-gl.js"), "utf8");
    const stage = readFileSync(join(HERE, "../src/watch-map-gl-stage.ts"), "utf8");
    expect(chunk.length).toBeGreaterThan(1000);
    expect(chunk).toContain("NoemaWatchMapGl");
    expect(chunk).not.toMatch(/Orbitron/i);
    expect(chunk).not.toMatch(/scanline/i);
    expect(stage).not.toMatch(/Orbitron/i);
    expect(stage).not.toMatch(/ParticleSystem|FogExp2/);
    expect(stage).toMatch(/Event-born redraw only/);
  });
});
