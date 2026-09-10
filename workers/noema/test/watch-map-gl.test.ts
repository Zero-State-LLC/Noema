import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { watchHtml } from "../src/watch";
import { MAP_STAGE_CSS } from "../src/watch-map-page";
import {
  MAP_CAM_EASE_MS,
  MAP_GL_CSS,
  MAP_GL_SRC,
  MAP_PARITY_LINE,
  MAP_ROOM_GAP,
  mapActionCameraRoom,
  mapCameraEaseMs,
  mapCameraPose,
  mapCameraTarget,
  mapFollowMoveRoom,
  mapFollowedRoomId,
  mapGlUsable,
  mapGraphBounds,
  mapLabelScreenItems,
  mapProjectPoint,
  mapPublicExitTarget,
  mapHeadsDisagree,
  mapNodeClassName,
  mapPublicRoomId,
  mapRoomLabelText,
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

describe("mapCameraPose frames the graph", () => {
  const plus = [
    { room_id: "room.nw", x: 0, y: 0 },
    { room_id: "room.ne", x: 2, y: 0 },
    { room_id: "room.hub", x: 1, y: 1 },
    { room_id: "room.sw", x: 0, y: 2 },
    { room_id: "room.se", x: 2, y: 2 },
  ];

  it("looks at the centroid, not the first corner, with a shallow enough pitch", () => {
    const b = mapGraphBounds(plus);
    expect(b.cx).toBe(MAP_ROOM_GAP);
    expect(b.cz).toBe(MAP_ROOM_GAP);
    const pose = mapCameraPose({ rooms: plus, aspect: 16 / 9 });
    expect(pose.lookX).toBeCloseTo(b.cx, 5);
    expect(pose.lookZ).toBeCloseTo(b.cz, 5);
    expect(pose.lookY).toBeGreaterThan(0.4);
    const horiz = Math.hypot(pose.eyeX - pose.lookX, pose.eyeZ - pose.lookZ);
    expect(pose.eyeY - pose.lookY).toBeLessThan(horiz);
    expect(Math.hypot(pose.eyeX - pose.lookX, pose.eyeY - pose.lookY, pose.eyeZ - pose.lookZ)).toBeGreaterThan(6);
  });

  it("aims at a public focus room without inventing a site", () => {
    const pose = mapCameraPose({ rooms: plus, focusId: "room.se", aspect: 16 / 9 });
    expect(pose.lookX).toBeCloseTo(2 * MAP_ROOM_GAP, 5);
    expect(pose.lookZ).toBeCloseTo(2 * MAP_ROOM_GAP, 5);
    expect(mapCameraPose({ rooms: plus, focusId: "room.secret" }).lookX).toBeCloseTo(MAP_ROOM_GAP, 5);
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

  it("lets the GL canvas fill the map column and keeps Gate D on the rail", () => {
    expect(MAP_GL_CSS).toMatch(/width:\s*100%/);
    expect(MAP_GL_CSS).toMatch(/max-width:\s*none/);
    expect(MAP_GL_CSS).toMatch(/aspect-ratio:\s*16\/9/);
    expect(MAP_GL_CSS).not.toMatch(/max-width:\s*36rem/);
    expect(MAP_STAGE_CSS).not.toMatch(/max-width:\s*36rem/);
    expect(MAP_STAGE_CSS).toContain("map-chrome");
    expect(MAP_STAGE_CSS).toContain("map-chrome-layers");
    expect(MAP_STAGE_CSS).toContain("map-chrome-health");
    expect(MAP_STAGE_CSS).toContain("flex-direction:column");
    expect(MAP_STAGE_CSS).not.toMatch(/\.map-chrome\{[^}]*display:flex;flex-wrap:wrap/);
    expect(MAP_STAGE_CSS).toContain("is-map-gl");
    expect(map).toContain("map-stage");
    expect(map).toContain("map-chrome-layers");
    expect(map).toContain('aria-label="Map layer toggles"');
    expect(map).toContain('aria-label="World health metrics"');
    expect(map).toContain("World health");
    expect(map).toContain("map-chrome");
    expect(map).toContain('id="watch-map-board"');
    expect(map.indexOf('id="watch-map-gl"')).toBeLessThan(map.indexOf('id="watch-map-toggles"'));
    expect(map.indexOf('id="watch-map-gl"')).toBeLessThan(map.indexOf('id="watch-map-board"'));
    expect(map).toContain(".watch-stage[data-mode=\"map\"]");
    expect(map).toContain("is-map-gl");
    expect(map).toContain("showMapGl");
    expect(map).toContain('id="watch-hero-who"');
    expect(map).toContain('id="watch-withheld"');
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
      mapRoomLabelText,
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
    expect(stage).toContain("ResizeObserver");
    expect(stage).toContain("updateProjectionMatrix");
    expect(stage).toContain("mapCameraPose");
    expect(stage).toContain("mapLabelScreenItems");
    expect(stage).toContain("map-room-label");
    expect(stage).not.toContain("target.x + 3.4");
  });
});

describe("public room labels", () => {
  it("keeps real site names and fails closed on ids or empty", () => {
    expect(mapRoomLabelText("Civic Exchange")).toBe("Civic Exchange");
    expect(mapRoomLabelText("  Infrastructure Vault  ")).toBe("Infrastructure Vault");
    expect(mapRoomLabelText("room.civic-exchange")).toBe("");
    expect(mapRoomLabelText("")).toBe("");
    expect(mapRoomLabelText(null)).toBe("");
    expect(mapRoomLabelText("<img src=x>Civic")).not.toMatch(/[<>]/);
    expect(mapRoomLabelText("<img src=x>Civic")).toContain("Civic");
  });

  it("projects only named public rooms through the Direct-Camera pose", () => {
    const named = [
      { room_id: "room.hub", name: "Civic Exchange", x: 1, y: 1 },
      { room_id: "room.east", name: "room.east", x: 2, y: 0 },
      { room_id: "room.ghost", name: "", x: 0, y: 2 },
    ];
    const pose = mapCameraPose({ rooms: named, focusId: "room.hub", aspect: 16 / 9 });
    const items = mapLabelScreenItems({
      rooms: named,
      pose,
      aspect: 16 / 9,
      width: 640,
      height: 360,
      focusId: "room.hub",
    });
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Civic Exchange");
    expect(items[0].focus).toBe(true);
    expect(items[0].x).toBeGreaterThan(40);
    expect(items[0].x).toBeLessThan(600);
    expect(items[0].y).toBeGreaterThan(20);
    expect(items[0].y).toBeLessThan(340);
    expect(JSON.stringify(items)).not.toContain("PRESSURE");
    expect(JSON.stringify(items)).not.toContain("room.east");

    const look = mapProjectPoint({
      x: pose.lookX,
      y: pose.lookY,
      z: pose.lookZ,
      pose,
      aspect: 16 / 9,
      width: 640,
      height: 360,
    });
    expect(look.visible).toBe(true);
    expect(look.x).toBeGreaterThan(240);
    expect(look.x).toBeLessThan(400);
    expect(look.y).toBeGreaterThan(120);
    expect(look.y).toBeLessThan(240);
    expect(mapLabelScreenItems({ rooms: named, pose: null, width: 640, height: 360 })).toEqual([]);
    expect(mapProjectPoint({ x: 0, y: 0, z: 0, pose: null, width: 640, height: 360 }).visible).toBe(false);
  });

  it("ships the MAP overlay without inventing KPI rooms", () => {
    const map = watchHtml({ mode: "map" });
    expect(map).toContain('id="watch-map-labels"');
    expect(map).toContain("map-room-label");
    expect(map).toContain("mapRoomLabelText");
    expect(map).toContain('labels: $("watch-map-labels")');
    expect(map).not.toMatch(/WORLD-STATE STRIP|PRESSURE\/RELAY|POPULATION KPI/i);
    expect(MAP_GL_CSS).toContain("map-labels");
    expect(MAP_GL_CSS).toContain("map-room-label");
    expect(MAP_STAGE_CSS).not.toMatch(/Orbitron|scanline/i);
  });

  it("uses a map public title when the live row has only a room id", () => {
    const nodes = mapStageNodes(
      [{ room_id: "room.civic-exchange" }],
      [{ room_id: "room.civic-exchange", name: "Civic Exchange", x: 1, y: 1 }],
    );
    expect(nodes[0].name).toBe("Civic Exchange");
    const pose = mapCameraPose({ rooms: nodes, focusId: "room.civic-exchange", aspect: 16 / 9 });
    const items = mapLabelScreenItems({
      rooms: nodes,
      pose,
      aspect: 16 / 9,
      width: 640,
      height: 360,
      focusId: "room.civic-exchange",
    });
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Civic Exchange");
    expect(items[0].focus).toBe(true);
  });

  it("merges live public titles onto map coords and keeps room.* off the sketch", () => {
    const live = [
      { room_id: "room.civic-exchange", name: "Civic Exchange", active: true },
      { room_id: "room.archive", name: "Archive" },
      { room_id: "room.ghost", name: "room.ghost" },
    ];
    const map = [
      { room_id: "room.civic-exchange", name: "Civic Exchange", x: 1, y: 1 },
      { room_id: "room.archive", name: "Archive", x: 0, y: 0 },
      { room_id: "room.ghost", name: "room.ghost", x: 2, y: 0 },
    ];
    const nodes = mapStageNodes(live, map);
    expect(nodes).toHaveLength(3);
    expect(nodes[0].name).toBe("Civic Exchange");
    expect(nodes[0].x).toBe(1);
    expect(nodes[0].y).toBe(1);
    const pose = mapCameraPose({ rooms: nodes, focusId: "room.civic-exchange", aspect: 16 / 9 });
    const items = mapLabelScreenItems({
      rooms: nodes,
      pose,
      aspect: 16 / 9,
      width: 640,
      height: 360,
      focusId: "room.civic-exchange",
    });
    expect(items.map((it) => it.name).sort()).toEqual(["Archive", "Civic Exchange"]);
    expect(items.some((it) => it.name === "Civic Exchange" && it.focus)).toBe(true);
    expect(items.some((it) => it.name === "room.ghost" || it.id === "room.ghost")).toBe(false);
    expect(items.map((it) => it.name).join(" ")).not.toMatch(/room\./);
    expect(JSON.stringify(items)).not.toContain("PRESSURE");
  });

  it("stacks the site-name overlay above the WebGL canvas", () => {
    expect(MAP_GL_CSS).toMatch(/\.map-gl-frame\{[^}]*isolation:isolate/);
    expect(MAP_GL_CSS).toMatch(/\.map-gl\{[^}]*z-index:0/);
    expect(MAP_GL_CSS).toMatch(/\.map-labels\{[^}]*z-index:1/);
    const html = watchHtml({ mode: "map" });
    const stage = readFileSync(join(HERE, "../src/watch-map-gl-stage.ts"), "utf8");
    expect(html).toMatch(/\.map-labels\{[^}]*z-index:1/);
    expect(stage).toMatch(/overlay\.hidden\s*=\s*false/);
  });
});
