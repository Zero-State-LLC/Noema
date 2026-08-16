import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { adminHtml } from "../src/admin";
import { playHtml } from "../src/play";
import { studyHtml } from "../src/study";
import { watchHtml } from "../src/watch";
import { buildWatchLive } from "../src/watch-live";
import {
  PHOSPHOR_ASSET_BUDGET,
  PHOSPHOR_HEIGHT,
  PHOSPHOR_JS_BUDGET,
  PHOSPHOR_WIDTH,
  collectPulses,
  createPhosphorSession,
  drawPhosphorFrame,
  layoutPublicTopology,
  roomCertainty,
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
    font: "",
    imageSmoothingEnabled: true,
    fillRect(x: number, y: number, w: number, h: number) {
      ops.push(`fillRect:${x},${y},${w},${h}`);
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
    stroke() {
      ops.push("stroke");
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
  it("maps unknown / partial / known / active from public fields only", () => {
    expect(roomCertainty({ room_id: "room.x", hidden: true })).toBe("unknown");
    expect(roomCertainty({ room_id: "room.x" })).toBe("partial");
    expect(roomCertainty({ room_id: "room.x", description: "A public floor." })).toBe("known");
    expect(roomCertainty({ room_id: "room.x", players_present: 2 })).toBe("active");
    expect(roomCertainty({ room_id: "room.x" }, [{ room_id: "room.x", sequence: 1 }])).toBe("active");
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
    expect(born.map((p) => p.tier).sort()).toEqual(["MAJOR", "NOTABLE"]);
    expect(collectPulses(12, { sequence: 12, recent_events: born as never[] }, 100, false)).toEqual([]);
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
      recent_events: [{ sequence: 4, tier: "NORMAL", room_id: "room.a" }],
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
    expect(watchHtml()).not.toMatch(/WebGL|WebSocket/i);
  });
});
