import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { adminHtml } from "../src/admin";
import { playHtml } from "../src/play";
import { studyHtml } from "../src/study";
import { watchHtml } from "../src/watch";
import { buildWatchLive } from "../src/watch-live";
import { GLYPH_IDS, glyphMeta } from "../src/presentation/glyphs";
import {
  PHOSPHOR_ASSET_BUDGET,
  PHOSPHOR_CATALOG_PATHS,
  PHOSPHOR_GLYPH_IDS,
  PHOSPHOR_HEIGHT,
  PHOSPHOR_JS_BUDGET,
  PHOSPHOR_WIDTH,
  collectPulses,
  collectSiteMarks,
  createPhosphorSession,
  canvasPointFromEvent,
  drawCatalogMark,
  drawExit,
  drawGlyph,
  drawPhosphorFrame,
  hitPhosphorNode,
  layoutPublicTopology,
  phosphorCatalogMark,
  playerGlyphId,
  pulseGlyphId,
  roomCertainty,
  roomGlyphId,
  safePhosphorLabel,
  type PhosphorRoom,
} from "../src/watch-phosphor";

const NOW = 1_700_000_000_000;
const here = dirname(fileURLToPath(import.meta.url));

function roomsIn(): Record<string, PhosphorRoom & { room_id: string; name: string; description: string; exits: never[]; entities: never[] }> {
  return {};
}

function worldRooms() {
  return {
    "room.market": {
      room_id: "room.market",
      name: "Chamber Market",
      description: "Open stalls.",
      exits: [
        { direction: "north", to_room_id: "room.relay" },
        { direction: "down", to_room_id: "room.vault" },
      ],
      entities: [
        { entity_id: "entity.stall", label: "Trade stall", entity_type: "PROP" },
        { entity_id: "entity.secret", label: "Hidden cache", entity_type: "PROP", hidden: true },
      ],
    },
    "room.relay": {
      room_id: "room.relay",
      name: "Relay Quarter",
      description: "A worn switching floor.",
      exits: [{ direction: "south", to_room_id: "room.market" }],
      entities: [],
    },
    "room.vault": {
      room_id: "room.vault",
      name: "Sealed Vault",
      description: "Not for spectators.",
      hidden: true,
      tags: ["hidden"],
      exits: [{ direction: "up", to_room_id: "room.market" }],
      entities: [{ entity_id: "entity.core", label: "Core", entity_type: "INFRASTRUCTURE" }],
    },
  };
}

function mockCtx() {
  const ops: string[] = [];
  return {
    ops,
    fillStyle: "",
    strokeStyle: "",
    globalAlpha: 1,
    lineWidth: 1,
    lineCap: "butt",
    font: "",
    imageSmoothingEnabled: true,
    fillRect(x: number, y: number, w: number, h: number) {
      ops.push(`fillRect:${x},${y},${w},${h}`);
    },
    strokeRect(x: number, y: number, w: number, h: number) {
      ops.push(`strokeRect:${x},${y},${w},${h}`);
    },
    beginPath() {
      ops.push("beginPath");
    },
    moveTo(x: number, y: number) {
      ops.push(`moveTo:${x},${y}`);
    },
    lineTo(x: number, y: number) {
      ops.push(`lineTo:${x},${y}`);
    },
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
      ops.push(`quadraticCurveTo:${cpx},${cpy},${x},${y}`);
    },
    setLineDash(segments: number[]) {
      ops.push(`setLineDash:${segments.join(",")}`);
    },
    closePath() {
      ops.push("closePath");
    },
    stroke() {
      ops.push("stroke");
    },
    fill() {
      ops.push("fill");
    },
    fillText(text: string, x: number, y: number) {
      ops.push(`fillText:${text}@${x},${y}`);
    },
  };
}

describe("slice 1 — deterministic public topology", () => {
  it("never includes hidden rooms or hidden exits", () => {
    const snap = buildWatchLive({
      world_id: "world.test",
      cycle: 1,
      sequence: 10,
      rooms: worldRooms(),
      players: [
        {
          player_id: "player.aaaaaaaaaaaa",
          handle: "Vesper-7",
          room_id: "room.market",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "live",
        },
        {
          player_id: "player.hidden",
          handle: "Ghost",
          room_id: "room.vault",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "live",
        },
      ],
      events: [],
      now: NOW,
    });
    const layout = layoutPublicTopology(snap.rooms as PhosphorRoom[]);
    const ids = layout.nodes.map((n) => n.room_id);
    expect(ids).toContain("room.market");
    expect(ids).toContain("room.relay");
    expect(ids).not.toContain("room.vault");
    expect(JSON.stringify(layout)).not.toMatch(/vault|Sealed|Ghost|Hidden cache/i);
    expect(layout.edges.every((e) => e.from !== "room.vault" && e.to !== "room.vault")).toBe(true);
    void roomsIn;
  });

  it("is deterministic for an identical public snapshot", () => {
    const rooms: PhosphorRoom[] = [
      {
        room_id: "room.b",
        name: "Beta",
        description: "B",
        exits: [{ direction: "west", to_room_id: "room.a" }],
      },
      {
        room_id: "room.a",
        name: "Alpha",
        description: "A",
        exits: [{ direction: "east", to_room_id: "room.b" }],
      },
    ];
    expect(layoutPublicTopology(rooms)).toEqual(layoutPublicTopology(rooms.slice().reverse()));
  });

  it("hits the nearest public PIXEL node and misses empty space", () => {
    const layout = layoutPublicTopology([
      { room_id: "room.a", name: "Alpha", description: "A", exits: [{ direction: "east", to_room_id: "room.b" }] },
      { room_id: "room.b", name: "Beta", description: "B", exits: [{ direction: "west", to_room_id: "room.a" }] },
      { room_id: "room.vault", name: "Vault", hidden: true },
    ]);
    const a = layout.nodes.find((n) => n.room_id === "room.a");
    expect(a).toBeTruthy();
    expect(hitPhosphorNode(layout, a!.x, a!.y)?.room_id).toBe("room.a");
    expect(hitPhosphorNode(layout, a!.x + 2, a!.y - 2)?.room_id).toBe("room.a");
    expect(hitPhosphorNode(layout, 1000, 1000)).toBeNull();
    expect(JSON.stringify(hitPhosphorNode(layout, a!.x, a!.y))).not.toMatch(/vault/i);
    const pt = canvasPointFromEvent(
      { getBoundingClientRect: () => ({ left: 10, top: 20, width: 640, height: 360 }) },
      { clientX: 10 + 320, clientY: 20 + 180 },
    );
    expect(pt.x).toBeCloseTo(PHOSPHOR_WIDTH / 2, 5);
    expect(pt.y).toBeCloseTo(PHOSPHOR_HEIGHT / 2, 5);
  });

  it("lays out the example four-site public fragment without hidden rooms", () => {
    const layout = layoutPublicTopology(
      [
        {
          room_id: "room.a",
          name: "Site A",
          description: "A",
          players_present: 3,
          active: true,
          exits: [
            { direction: "south", to_room_id: "room.b" },
            { direction: "east", to_room_id: "room.c" },
          ],
        },
        {
          room_id: "room.b",
          name: "Site B",
          description: "B",
          exits: [
            { direction: "north", to_room_id: "room.a" },
            { direction: "south", to_room_id: "room.d" },
          ],
        },
        {
          room_id: "room.c",
          name: "Site C",
          description: "C",
          players_present: 1,
          active: true,
          exits: [{ direction: "west", to_room_id: "room.a" }],
        },
        { room_id: "room.d", name: "Site D", exits: [{ direction: "north", to_room_id: "room.b" }] },
        { room_id: "room.vault", name: "Hidden", hidden: true, exits: [] },
      ],
      [{ sequence: 2, room_id: "room.a", tier: "NORMAL" }],
    );
    expect(layout.nodes.map((n) => n.room_id).sort()).toEqual(["room.a", "room.b", "room.c", "room.d"]);
    expect(roomGlyphId(layout.nodes.find((n) => n.room_id === "room.a")!.certainty)).toBe("room_active");
    expect(playerGlyphId(layout.nodes.find((n) => n.room_id === "room.a")!.players)).toBe("player_multi");
    expect(playerGlyphId(layout.nodes.find((n) => n.room_id === "room.c")!.players)).toBe("player_single");
    expect(roomGlyphId(layout.nodes.find((n) => n.room_id === "room.d")!.certainty)).toBe("room_empty");
    expect(layout.edges.some((e) => e.active)).toBe(true);
    expect(JSON.stringify(layout)).not.toMatch(/vault|Hidden/i);
  });

  it("fits the 320×180 logical frame", () => {
    const layout = layoutPublicTopology([
      { room_id: "room.a", name: "A", exits: [{ direction: "east", to_room_id: "room.b" }] },
      { room_id: "room.b", name: "B", exits: [{ direction: "west", to_room_id: "room.a" }] },
    ]);
    for (const n of layout.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.x).toBeLessThanOrEqual(PHOSPHOR_WIDTH);
      expect(n.y).toBeLessThanOrEqual(PHOSPHOR_HEIGHT);
    }
  });
});

describe("slice 2 — certainty and glyphs", () => {
  it("defines the v0.1 8×8 glyph atlas", () => {
    const ids = [
      "room_empty",
      "room_known",
      "room_active",
      "room_partial",
      "player_single",
      "player_multi",
      "player_cluster",
      "exit",
      "exit_active",
      "pulse_normal",
      "pulse_notable",
      "pulse_major",
    ] as const;
    expect(PHOSPHOR_GLYPH_IDS).toEqual([...ids]);
    expect(roomGlyphId("active")).toBe("room_active");
    expect(roomGlyphId("known")).toBe("room_known");
    expect(roomGlyphId("partial")).toBe("room_partial");
    expect(playerGlyphId(0)).toBeNull();
    expect(playerGlyphId(1)).toBe("player_single");
    expect(playerGlyphId(4)).toBe("player_multi");
    expect(playerGlyphId(12)).toBe("player_cluster");
    expect(pulseGlyphId("MAJOR")).toBe("pulse_major");
    expect(Object.keys(PHOSPHOR_CATALOG_PATHS).sort()).toEqual([...GLYPH_IDS].sort());
    for (const id of GLYPH_IDS) {
      expect(PHOSPHOR_CATALOG_PATHS[id]).toBe(glyphMeta(id).d);
    }
    expect(phosphorCatalogMark("room_empty")).toBe("loc");
    expect(phosphorCatalogMark("room_known")).toBe("loc");
    expect(phosphorCatalogMark("room_active")).toBe("loc");
    expect(phosphorCatalogMark("room_partial")).toBe("unknown");
    expect(phosphorCatalogMark("player_single")).toBe("player");
    expect(phosphorCatalogMark("exit_active")).toBe("threshold");
    expect(phosphorCatalogMark("pulse_major")).toBeNull();
    const empty = mockCtx();
    drawGlyph(empty, "room_empty", 0, 0);
    expect(empty.ops.some((o) => o.startsWith("strokeRect"))).toBe(false);
    expect(empty.ops).toContain("moveTo:1.6,1.6");
    expect(empty.ops).toContain("closePath");
    const known = mockCtx();
    drawGlyph(known, "room_known", 0, 0);
    expect(known.ops.filter((o) => o === "fill").length).toBe(1);
    const partial = mockCtx();
    drawGlyph(partial, "room_partial", 0, 0);
    expect(partial.ops).toContain("moveTo:2.6,1.6");
    expect(partial.ops.join(" ")).not.toMatch(/moveTo:1,7/);
    expect(partial.ops.some((o) => o.startsWith("fillRect"))).toBe(false);
    const multi = mockCtx();
    drawGlyph(multi, "player_multi", 0, 0);
    expect(multi.ops.filter((o) => o === "fill").length).toBe(2);
    const cluster = mockCtx();
    drawGlyph(cluster, "player_cluster", 0, 0);
    expect(cluster.ops.filter((o) => o === "fill").length).toBe(3);
    const door = mockCtx();
    drawGlyph(door, "exit", 0, 0);
    expect(door.ops).toContain("moveTo:2.1,6.5");
    const edge = mockCtx();
    drawExit(edge, 0, 0, 20, 0, false);
    expect(edge.ops).toContain("setLineDash:");
    expect(edge.ops).toContain("moveTo:0,0");
    expect(edge.ops).toContain("quadraticCurveTo:10,4,20,0");
    expect(edge.ops).not.toContain("lineTo:20,0");
    expect(edge.ops).toContain("moveTo:18.1,2.5");
    const dashed = mockCtx();
    drawExit(dashed, 0, 0, 20, 0, false, true);
    expect(dashed.ops).toContain("setLineDash:3,3");
    expect(dashed.ops).toContain("quadraticCurveTo:10,4,20,0");
    expect(dashed.ops.join(" ")).not.toMatch(/moveTo:18\.1,2\.5/);
    const comms = mockCtx();
    drawCatalogMark(comms, "comms", 0, 0);
    expect(comms.ops.some((o) => o.startsWith("quadraticCurveTo:"))).toBe(true);
    expect(comms.ops.filter((o) => o === "stroke").length).toBe(1);
  });

  it("maps every public key mark onto the live field", () => {
    const layout = layoutPublicTopology(
      [
        {
          room_id: "room.a",
          name: "Site A",
          description: "Open floor.",
          tags: [],
          entities: [
            { glyph: "infra", entity_type: "INFRASTRUCTURE", label: "Relay" },
            { glyph: "resource", entity_type: "RESOURCE", label: "Stock" },
            { glyph: "org", entity_type: "ORG", label: "Desk" },
            { glyph: "trade", entity_type: "TRADE", label: "Stall" },
            { glyph: "loc", entity_type: "PROP", label: "Ignored room mark" },
            { hidden: true, glyph: "danger", entity_type: "PROP", label: "Hidden" },
          ],
          exits: [{ direction: "east", to_room_id: "room.b" }],
        },
        {
          room_id: "room.b",
          name: "Site B",
          tags: ["partial"],
          exits: [{ direction: "west", to_room_id: "room.a" }],
        },
      ],
      [
        { sequence: 2, room_id: "room.a", glyph: "economy", line: "Index shifts." },
        { sequence: 3, room_id: "room.a", glyph: "danger", line: "Contested." },
        { sequence: 4, room_id: "room.a", glyph: "player", line: "Someone entered." },
      ],
    );
    const a = layout.nodes.find((n) => n.room_id === "room.a")!;
    const b = layout.nodes.find((n) => n.room_id === "room.b")!;
    expect(a.marks).toEqual(["danger", "economy", "infra", "org"]);
    expect(b.certainty).toBe("partial");
    expect(b.marks).toEqual([]);
    expect(layout.edges.every((e) => e.dashed === true)).toBe(true);
    expect(JSON.stringify(layout)).not.toMatch(/Hidden|Ignored room mark/i);
    expect(collectSiteMarks({
      room_id: "room.a",
      entities: [
        { glyph: "distress" },
        { glyph: "comms" },
        { glyph: "rumor" },
        { glyph: "event" },
        { glyph: "economy" },
      ],
    })).toEqual(["comms", "distress", "economy", "event"]);
    const painted = mockCtx();
    drawPhosphorFrame(painted, layout, [], 0);
    expect(painted.ops.some((o) => o.startsWith("fillText:SITE A@"))).toBe(true);
    expect(painted.ops.join(" ")).not.toMatch(/\[X1\]|\[Y1\]/i);
  });

  it("marks a public exit active only from a public recent event", () => {
    const layout = layoutPublicTopology(
      [
        { room_id: "room.a", name: "A", description: "A", exits: [{ direction: "east", to_room_id: "room.b" }] },
        { room_id: "room.b", name: "B", description: "B", exits: [{ direction: "west", to_room_id: "room.a" }] },
        { room_id: "room.vault", name: "Vault", hidden: true, exits: [{ direction: "up", to_room_id: "room.a" }] },
      ],
      [{ sequence: 4, room_id: "room.b", tier: "NORMAL" }],
    );
    expect(layout.nodes.map((n) => n.room_id).sort()).toEqual(["room.a", "room.b"]);
    expect(layout.edges.some((e) => e.active)).toBe(true);
    expect(JSON.stringify(layout)).not.toMatch(/vault/i);
  });

  it("maps unknown / partial / known / active from public fields only", () => {
    expect(roomCertainty({ room_id: "room.x", hidden: true })).toBe("unknown");
    expect(roomCertainty({ room_id: "room.x" })).toBe("empty");
    expect(roomCertainty({ room_id: "room.x", tags: ["partial"] })).toBe("partial");
    expect(roomCertainty({ room_id: "room.x", description: "A public floor." })).toBe("known");
    expect(roomCertainty({ room_id: "room.x", players_present: 2 })).toBe("active");
    expect(roomCertainty({ room_id: "room.x" }, [{ room_id: "room.x", sequence: 1 }])).toBe("active");
    expect(roomCertainty({ room_id: "room.b", players_present: 1 }, undefined, "room.b")).toBe("active");
    expect(roomCertainty({ room_id: "room.a", players_present: 1 }, [{ room_id: "room.a" }], "room.b")).toBe("known");
  });

  it("strips markup from public labels before any render", () => {
    expect(safePhosphorLabel('<img src=x onerror=alert(1)>Vesper')).not.toMatch(/[<>]/);
    expect(safePhosphorLabel('<script>alert(1)</script>')).not.toContain("<");
    expect(safePhosphorLabel('<script>alert(1)</script>')).not.toContain(">");
    const layout = layoutPublicTopology([
      {
        room_id: "room.a",
        name: '<script>alert(1)</script>',
        public_player_labels: ['<img onerror="x">Nacre'],
        players_present: 1,
      },
    ]);
    expect(layout.nodes[0].name).not.toMatch(/[<>]/);
    expect(layout.nodes[0].labels.join("")).not.toMatch(/[<>]/);
  });
});

describe("slice 3 — event-driven pulses", () => {
  it("emits pulses only for new sequences with a public room", () => {
    const born = collectPulses(
      10,
      {
        sequence: 12,
        recent_events: [
          { sequence: 10, tier: "NORMAL", room_id: "room.a" },
          { sequence: 11, tier: "NOTABLE", room_id: "room.a" },
          { sequence: 12, tier: "MAJOR", room_id: "room.hidden" },
        ],
      },
      100,
      false,
    );
    expect(born.map((p) => p.tier)).toEqual(["MAJOR"]);
    expect(collectPulses(12, { sequence: 12, recent_events: born as never[] }, 100, false)).toEqual([]);
    const twoMajor = collectPulses(
      0,
      {
        sequence: 4,
        recent_events: [
          { sequence: 3, tier: "MAJOR", room_id: "room.a" },
          { sequence: 4, tier: "MAJOR", room_id: "room.b" },
        ],
      },
      1,
      false,
    );
    expect(twoMajor.filter((p) => p.tier === "MAJOR")).toHaveLength(1);
  });

  it("reduced-motion produces no pulses and no rAF", () => {
    let raf = 0;
    const ctx = mockCtx();
    const session = createPhosphorSession({
      canvas: { width: 0, height: 0, getContext: () => ctx },
      reducedMotion: true,
      now: () => 1000,
      raf: () => {
        raf += 1;
        return raf;
      },
      caf: () => undefined,
    });
    session.update({
      sequence: 5,
      rooms: [{ room_id: "room.a", name: "A", players_present: 1 }],
      recent_events: [{ sequence: 5, tier: "MAJOR", room_id: "room.a" }],
    });
    expect(session.reducedMotion).toBe(true);
    expect(session.idle).toBe(true);
    expect(session.rafStarts).toBe(0);
    expect(collectPulses(0, { sequence: 1, recent_events: [{ sequence: 1, room_id: "room.a" }] }, 1, true)).toEqual([]);
  });
});

describe("slice 4 — TEXT / canvas failure leave HTML authority", () => {
  const html = watchHtml();

  it("keeps the semantic graph and TEXT/PIXEL toggle", () => {
    expect(html).toContain('id="watch-map"');
    expect(html).toContain('id="watch-headline"');
    expect(html).toContain('id="watch-players"');
    expect(html).toContain('createElement("details")');
    expect(html).toContain('id="watch-mode-text"');
    expect(html).toContain('id="watch-mode-pixel"');
    expect(html).toContain('id="watch-phosphor"');
    expect(html).toContain("image-rendering:pixelated");
    expect(html).toContain('width="320"');
    expect(html).toContain('height="180"');
    expect(html).toContain("createPhosphorSession");
    expect(html).toContain("NoemaPhosphor.update");
    expect(html).toContain("NoemaPhosphorPick");
    expect(html).toContain("hitPhosphorNode");
    expect(html).toContain("const __name = function(fn) { return fn; }");
  });

  it("boots the inlined client without esbuild __name", () => {
    const src = watchHtml().split("<script>")[2].split("</script>")[0];
    expect(src).toContain("__name");
    const canvas = {
      width: 0,
      height: 0,
      getContext() {
        return {
          fillStyle: "",
          strokeStyle: "",
          globalAlpha: 1,
          lineWidth: 1,
          lineCap: "square",
          font: "",
          imageSmoothingEnabled: true,
          fillRect() {},
          strokeRect() {},
          beginPath() {},
          moveTo() {},
          lineTo() {},
          quadraticCurveTo() {},
          setLineDash() {},
          closePath() {},
          stroke() {},
          fill() {},
          fillText() {},
        };
      },
    };
    const wrap = { hidden: true };
    const g = globalThis as unknown as {
      document: {
        hidden: boolean;
        getElementById(id: string): unknown;
        addEventListener(): void;
      };
      window: unknown;
      NoemaPhosphor?: { mode: string; update(s: object): void };
    };
    const prevDoc = g.document;
    const prevWin = g.window;
    g.document = {
      hidden: false,
      getElementById(id: string) {
        if (id === "watch-phosphor") return canvas;
        if (id === "watch-phos-wrap") return wrap;
        if (id === "watch-mode-text" || id === "watch-mode-pixel") {
          return { setAttribute() {}, addEventListener() {} };
        }
        return null;
      },
      addEventListener() {},
    };
    g.window = g;
    try {
      (0, eval)(src);
      expect(g.NoemaPhosphor?.mode).toBe("text");
      expect(wrap.hidden).toBe(true);
      g.NoemaPhosphor?.update({
        sequence: 1,
        rooms: [{ room_id: "room.a", name: "Alpha", description: "A" }],
      });
    } finally {
      g.document = prevDoc;
      g.window = prevWin;
      delete g.NoemaPhosphor;
    }
  });

  it("TEXT mode and failed canvas do not draw and do not schedule rAF", () => {
    const ctx = mockCtx();
    const failed = createPhosphorSession({
      canvas: { width: 0, height: 0, getContext: () => null },
      raf: () => {
        throw new Error("raf");
      },
    });
    failed.update({ rooms: [{ room_id: "room.a", name: "A" }], sequence: 1 });
    expect(failed.mode).toBe("text");
    expect(failed.idle).toBe(true);

    const session = createPhosphorSession({
      canvas: { width: 0, height: 0, getContext: () => ctx },
      now: () => 50,
    });
    session.setMode("text");
    session.update({
      sequence: 3,
      rooms: [{ room_id: "room.a", name: "A" }],
      recent_events: [{ sequence: 3, tier: "MAJOR", room_id: "room.a" }],
    });
    expect(session.mode).toBe("text");
    expect(session.idle).toBe(true);
  });
});

describe("slice 5 — budgets, idle, regressions", () => {
  it("keeps the cartography module under the JS/asset budgets", () => {
    const src = join(here, "../src/watch-phosphor.ts");
    const bytes = statSync(src).size;
    expect(bytes).toBeLessThan(PHOSPHOR_JS_BUDGET);
    expect(bytes).toBeLessThan(PHOSPHOR_ASSET_BUDGET);
    expect(readFileSync(src, "utf8")).not.toMatch(/WebGL|requestAnimationFrame\(\s*function\s*loop/);
  });

  it("stops the frame loop when pulses expire", () => {
    let now = 0;
    let pending: ((t: number) => void) | null = null;
    const ctx = mockCtx();
    const session = createPhosphorSession({
      canvas: { width: 0, height: 0, getContext: () => ctx },
      mode: "pixel",
      now: () => now,
      raf: (cb) => {
        pending = cb;
        return 1;
      },
      caf: () => {
        pending = null;
      },
    });
    session.update({
      sequence: 4,
      rooms: [{ room_id: "room.a", name: "A", players_present: 1 }],
      recent_events: [{ sequence: 4, tier: "MAJOR", room_id: "room.a" }],
    });
    expect(session.rafStarts).toBe(1);
    now = 10_000;
    session.tick(now);
    expect(session.idle).toBe(true);
    expect(pending).toBeNull();
  });

  it("does not invent scenery or score interest", () => {
    const src = readFileSync(join(here, "../src/watch-phosphor.ts"), "utf8");
    expect(src).not.toMatch(/interest|score|WebGL|spritesheet|cinema/i);
    const ctx = mockCtx();
    drawPhosphorFrame(ctx, { nodes: [], edges: [] }, [], 0);
    expect(ctx.ops[0]).toBe("fillRect:0,0,320,180");
  });

  it("leaves PLAY, STUDY, and Admin Live unchanged", () => {
    expect(playHtml()).toContain("/v1/play/login/request");
    expect(playHtml()).toContain("Enter world");
    expect(studyHtml()).toMatch(/not open/i);
    expect(adminHtml()).toContain("ADMIN / operations");
    expect(watchHtml()).not.toContain("ADMIN / operations");
    expect(watchHtml()).not.toMatch(/WebGL/i);
    expect(playHtml()).not.toMatch(/WebSocket/i);
    expect(studyHtml()).not.toMatch(/WebSocket/i);
  });
});
