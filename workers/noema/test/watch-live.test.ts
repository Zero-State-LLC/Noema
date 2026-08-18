import { describe, expect, it } from "vitest";
import {
  WATCH_LIVE_PIN,
  buildWatchLive,
  capVisibleEvents,
  holdHeadline,
  phraseWatchEvent,
  projectionIdForEvent,
  selectNotableEvent,
  watchEventTier,
  type WatchEvent,
  type WatchSourceEvent,
} from "../src/watch-live";
import { playHtml } from "../src/play";
import { studyHtml } from "../src/study";
import { adminHtml } from "../src/admin";
import { watchHtml } from "../src/watch";

const NOW = 1_700_000_000_000;

function rooms() {
  return {
    "room.market": {
      room_id: "room.market",
      name: "Chamber Market",
      description: "Open stalls under a cracked canopy.",
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

function livePlayer(
  id: string,
  handle: string,
  room_id: string,
  extra: Record<string, unknown> = {},
) {
  return {
    player_id: id,
    handle,
    room_id,
    entered: true,
    last_seen_ms: NOW,
    actor_kind: "live" as const,
    ...extra,
  };
}

function src(partial: Partial<WatchSourceEvent> & Pick<WatchSourceEvent, "event_type" | "sequence">): WatchSourceEvent {
  return {
    cycle: 4,
    handle: "Vesper-7",
    player_id: "player.aaaaaaaaaaaa",
    actor_kind: "live",
    at: NOW,
    payload: {},
    ...partial,
  };
}

describe("watch-live/1.0 projection contract", () => {
  it("pins watch-live/1.0 and keeps existing public fields", () => {
    const snap = buildWatchLive({
      world_id: "world.perihelion-reach",
      cycle: 4,
      sequence: 20,
      rooms: rooms(),
      players: [livePlayer("player.aaaaaaaaaaaa", "Vesper-7", "room.market")],
      events: [],
      public_pulses: ["A report is circulating."],
      now: NOW,
    });
    expect(snap.watch_live).toBe(WATCH_LIVE_PIN);
    expect(snap.projection).toBe("public");
    expect(snap.world_id).toBe("world.perihelion-reach");
    expect(snap.cycle).toBe(4);
    expect(snap.sequence).toBe(20);
    expect(snap.players_present).toBe(1);
    expect(snap.freshness).toBe("live");
    expect(snap.public_pulses).toEqual(["A report is circulating."]);
    expect(String(snap.note)).toMatch(/never world truth/i);
    expect(snap).not.toHaveProperty("payload");
  });

  it("counts present Players including agents, without leaking system handles", () => {
    const snap = buildWatchLive({
      world_id: "w",
      cycle: 1,
      sequence: 3,
      rooms: rooms(),
      players: [
        livePlayer("player.aaaaaaaaaaaa", "Vesper-7", "room.market"),
        {
          player_id: "player.sysbot",
          handle: "SYS",
          room_id: "room.market",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "system",
        },
        livePlayer("player.bbbbbbbbbbbb", "Marrow", "room.vault"),
        {
          player_id: "player.cccccccccccc",
          handle: "Ghost",
          room_id: "room.relay",
          entered: false,
          last_seen_ms: NOW,
          actor_kind: "live",
        },
      ],
      events: [
        src({
          event_type: "MOVE",
          sequence: 3,
          payload: { to: "room.vault", to_room_name: "Sealed Vault", from: "room.market" },
        }),
      ],
      now: NOW,
    });
    const ids = (snap.rooms as Array<{ room_id: string }>).map((r) => r.room_id);
    expect(ids).toEqual(["room.market", "room.relay"]);
    expect(JSON.stringify(snap)).not.toContain("Sealed Vault");
    expect(JSON.stringify(snap)).not.toContain("room.vault");
    expect(JSON.stringify(snap)).not.toContain("Hidden cache");
    expect(JSON.stringify(snap)).not.toContain("SYS");
    expect(JSON.stringify(snap)).not.toContain("Ghost");
    expect(JSON.stringify(snap)).not.toMatch(/player\./);
    const market = (snap.rooms as Array<Record<string, unknown>>).find((r) => r.room_id === "room.market")!;
    expect(market.players_present).toBe(2);
    expect(market.public_player_labels).toEqual(["Vesper-7"]);
    expect(market.glyph).toBe("loc");
    expect(market.player_glyph).toBe("player");
    expect(market.active).toBe(true);
    const exits = market.exits as Array<{ to_room_id: string; glyph?: string }>;
    expect(exits.map((x) => x.to_room_id)).toEqual(["room.relay"]);
    expect(exits[0].glyph).toBe("threshold");
    const ents = market.entities as Array<{ label: string; glyph?: string }>;
    expect(ents.map((e) => e.label)).toEqual(["Trade stall"]);
    expect(ents[0].glyph).toBe("trade");
  });

  it("does not invent edges to missing rooms", () => {
    const snap = buildWatchLive({
      world_id: "w",
      cycle: 0,
      sequence: 0,
      rooms: {
        "room.a": {
          room_id: "room.a",
          name: "A",
          description: "A",
          exits: [
            { direction: "east", to_room_id: "room.missing" },
            { direction: "west", to_room_id: "room.b" },
          ],
          entities: [],
        },
        "room.b": {
          room_id: "room.b",
          name: "B",
          description: "B",
          exits: [],
          entities: [],
        },
      },
      players: [],
      events: [],
      now: NOW,
    });
    const a = (snap.rooms as Array<{ room_id: string; exits: Array<{ to_room_id: string }> }>).find(
      (r) => r.room_id === "room.a",
    )!;
    expect(a.exits.map((x) => x.to_room_id)).toEqual(["room.b"]);
    expect(JSON.stringify(snap)).not.toContain("room.missing");
  });

  it("omits player labels when the handle is not public", () => {
    const snap = buildWatchLive({
      world_id: "w",
      cycle: 0,
      sequence: 1,
      rooms: rooms(),
      players: [livePlayer("player.aaaaaaaaaaaa", "player.aaaaaaaaaaaa", "room.relay")],
      events: [],
      now: NOW,
    });
    const relay = (snap.rooms as Array<Record<string, unknown>>).find((r) => r.room_id === "room.relay")!;
    expect(relay.players_present).toBe(1);
    expect(relay).not.toHaveProperty("public_player_labels");
  });
});

describe("watch event tiers and phrasing", () => {
  const table: Array<[string, "NORMAL" | "NOTABLE" | "MAJOR"]> = [
    ["agent_move", "NORMAL"],
    ["harvest", "NORMAL"],
    ["message_notice", "NORMAL"],
    ["production", "NORMAL"],
    ["resource_change", "NORMAL"],
    ["trade", "NOTABLE"],
    ["organization", "NOTABLE"],
    ["organization_response", "NOTABLE"],
    ["market_shift", "NOTABLE"],
    ["agreement_formed", "NOTABLE"],
    ["agreement_broken", "NOTABLE"],
    ["contest_declared", "NOTABLE"],
    ["infrastructure", "NOTABLE"],
    ["communication_disrupted", "NOTABLE"],
    ["conflicting_reports", "NOTABLE"],
    ["discovery", "MAJOR"],
    ["contest_resolved", "MAJOR"],
    ["infrastructure_disrupted", "MAJOR"],
    ["shortage", "MAJOR"],
    ["world_pressure", "MAJOR"],
    ["frontier_pressure", "MAJOR"],
    ["crime_detected", "MAJOR"],
    ["access_changed", "MAJOR"],
    ["unlisted_thing", "NORMAL"],
  ];

  it("maps the canonical projection table", () => {
    for (const [id, tier] of table) {
      expect(watchEventTier(id)).toBe(tier);
    }
  });

  it("maps runtime event types onto spectator projection ids", () => {
    expect(projectionIdForEvent("MOVE")).toBe("agent_move");
    expect(projectionIdForEvent("AGENT_ENTERED_WORLD")).toBe("agent_move");
    expect(projectionIdForEvent("TRADE_PROPOSED")).toBe("trade");
    expect(projectionIdForEvent("TRADE_REJECTED")).toBe("trade");
    expect(projectionIdForEvent("CONTEST_DECLARED")).toBe("contest_declared");
    expect(projectionIdForEvent("CONTEST_RESOLVED")).toBe("contest_resolved");
    expect(projectionIdForEvent("RESOURCE_TRANSFER", { kind: "harvest" })).toBe("harvest");
    expect(projectionIdForEvent("LOOK")).toBeNull();
    expect(projectionIdForEvent("INSPECT")).toBeNull();
    expect(projectionIdForEvent("MESSAGE")).toBeNull();
  });

  it("phrases public lines without intent, ids, or amounts", () => {
    expect(
      phraseWatchEvent(
        src({
          event_type: "MOVE",
          sequence: 4,
          payload: { to: "room.market", to_room_name: "Chamber Market" },
        }),
        { "room.market": { name: "Chamber Market" } },
      ),
    ).toBe("Vesper-7 entered Chamber Market");
    expect(
      phraseWatchEvent(
        src({
          handle: "SYS",
          player_id: "player.sysbot",
          actor_kind: "system",
          event_type: "MOVE",
          sequence: 4,
          payload: { to: "room.market", to_room_name: "Chamber Market" },
        }),
        { "room.market": { name: "Chamber Market" } },
      ),
    ).toBe("A player entered Chamber Market");
    expect(
      phraseWatchEvent(src({ event_type: "TRADE_PROPOSED", sequence: 5, payload: { offered: { energy: 9 } } }), {}),
    ).toBe("Vesper-7 offered a trade");
    expect(phraseWatchEvent(src({ event_type: "TRADE_REJECTED", sequence: 6 }), {})).toBe(
      "Vesper-7 refused a trade",
    );
    const line = phraseWatchEvent(
      src({ event_type: "TRADE_ACCEPTED", sequence: 7, payload: { offered: { energy: 40 } } }),
      {},
    );
    expect(line).not.toMatch(/40|energy|player\./);
  });
});

describe("notable headline and visible feed", () => {
  function ev(partial: Partial<WatchEvent> & Pick<WatchEvent, "sequence" | "tier" | "projection_id" | "line">): WatchEvent {
    return { cycle: 1, ...partial };
  }

  it("selects incident as MAJOR even over recent NORMAL activity", () => {
    const picked = selectNotableEvent({
      freshness: "incident",
      players_present: 2,
      candidates: [ev({ sequence: 9, tier: "NORMAL", projection_id: "agent_move", line: "A player entered Relay Quarter" })],
    });
    expect(picked?.tier).toBe("MAJOR");
    expect(picked?.projection_id).toBe("world_status");
    expect(picked?.line).toBe("World incident — projection is stale.");
  });

  it("selects maintenance as NOTABLE when no MAJOR candidate exists", () => {
    const picked = selectNotableEvent({
      freshness: "maintenance",
      players_present: 0,
      candidates: [ev({ sequence: 3, tier: "NORMAL", projection_id: "agent_move", line: "moved" })],
    });
    expect(picked?.tier).toBe("NOTABLE");
    expect(picked?.line).toBe("World is in maintenance.");
  });

  it("ranks MAJOR over newer NOTABLE over newer NORMAL", () => {
    const picked = selectNotableEvent({
      freshness: "live",
      players_present: 1,
      candidates: [
        ev({ sequence: 12, tier: "NORMAL", projection_id: "agent_move", line: "move" }),
        ev({ sequence: 11, tier: "NOTABLE", projection_id: "trade", line: "trade" }),
        ev({ sequence: 10, tier: "MAJOR", projection_id: "discovery", line: "discovery" }),
      ],
    });
    expect(picked?.line).toBe("discovery");
  });

  it("holds a NOTABLE headline against newer NORMAL events until 8 newer sequences", () => {
    const held = ev({ sequence: 10, tier: "NOTABLE", projection_id: "trade", line: "trade" });
    const window = [
      ev({ sequence: 17, tier: "NORMAL", projection_id: "agent_move", line: "m7" }),
      ev({ sequence: 10, tier: "NOTABLE", projection_id: "trade", line: "trade" }),
    ];
    expect(holdHeadline(held, window, 17)?.line).toBe("trade");
    expect(holdHeadline(held, window, 19)?.line).toBe("m7");
  });

  it("releases the hold when a higher tier arrives or the item leaves the window", () => {
    const held = ev({ sequence: 10, tier: "NOTABLE", projection_id: "trade", line: "trade" });
    const withMajor = [
      ev({ sequence: 12, tier: "MAJOR", projection_id: "discovery", line: "found" }),
      held,
    ];
    expect(holdHeadline(held, withMajor, 12)?.line).toBe("found");
    expect(holdHeadline(held, [ev({ sequence: 20, tier: "NORMAL", projection_id: "agent_move", line: "gone" })], 20)?.line).toBe(
      "gone",
    );
  });

  it("falls back to The Chamber is quiet and may mention a public count", () => {
    const empty = selectNotableEvent({ freshness: "live", players_present: 0, candidates: [] });
    expect(empty?.line).toBe("The Chamber is quiet.");
    const withPeople = selectNotableEvent({ freshness: "live", players_present: 2, candidates: [] });
    expect(withPeople?.line).toBe("The Chamber is quiet.");
    expect(withPeople?.detail).toMatch(/2 players/);
  });

  it("keeps 5–8 visible events and at most two agent_move rows", () => {
    const many: WatchEvent[] = [];
    for (let i = 20; i >= 1; i--) {
      const kind = i === 18 ? "trade" : i % 3 === 0 ? "harvest" : "agent_move";
      many.push(
        ev({
          sequence: i,
          tier: kind === "trade" ? "NOTABLE" : "NORMAL",
          projection_id: kind,
          line: kind === "trade" ? "trade" : `${kind} ${i}`,
        }),
      );
    }
    const visible = capVisibleEvents(many);
    expect(visible.length).toBeGreaterThanOrEqual(5);
    expect(visible.length).toBeLessThanOrEqual(8);
    expect(visible.filter((e) => e.projection_id === "agent_move")).toHaveLength(2);
    expect(visible[0].sequence).toBeGreaterThan(visible[visible.length - 1].sequence);
    expect(visible.some((e) => e.projection_id === "trade")).toBe(true);
  });

  it("does not pad the feed with extra movement to hit five rows", () => {
    const onlyMoves: WatchEvent[] = [];
    for (let i = 10; i >= 1; i--) {
      onlyMoves.push(ev({ sequence: i, tier: "NORMAL", projection_id: "agent_move", line: `move ${i}` }));
    }
    const visible = capVisibleEvents(onlyMoves);
    expect(visible).toHaveLength(2);
    expect(visible.map((e) => e.sequence)).toEqual([10, 9]);
  });

  it("maps pulses into recent_events without inventing actors", () => {
    const snap = buildWatchLive({
      world_id: "w",
      cycle: 2,
      sequence: 8,
      rooms: rooms(),
      players: [],
      events: [],
      public_pulses: ["A report is circulating.", "Conflicting accounts are circulating."],
      now: NOW,
    });
    const lines = (snap.recent_events as WatchEvent[]).map((e) => e.line);
    expect(lines).toContain("A report is circulating.");
    expect(lines).toContain("Conflicting accounts are circulating.");
    expect((snap.recent_events as WatchEvent[]).every((e) => e.tier === "NOTABLE" || e.projection_id)).toBe(true);
    expect(JSON.stringify(snap.recent_events)).not.toMatch(/player\./);
  });
});

describe("watch HTML surface", () => {
  const html = watchHtml();

  it("polls the live pin on an 8–12s cadence and respects pause/hidden", () => {
    expect(html).toContain("/v1/watch/live");
    expect(html).toMatch(/10000|8000|9000|11000|12000/);
    expect(html).not.toMatch(/setInterval\([^)]*,\s*4000\)/);
    expect(html).toContain("document.hidden");
    expect(html).toMatch(/state\.paused/);
    expect(html).toContain("prefers-reduced-motion");
    expect(html).toMatch(/\.watch-hero\.major\{[\s\S]*animation:threshold-in 240ms[^;]* 1 both/);
    expect(html).not.toMatch(/animation:[^;]*infinite/);
    expect(html).toMatch(
      /@media\(prefers-reduced-motion:reduce\)[\s\S]*\.watch-hero\.major[\s\S]*animation:none!important/,
    );
  });

  it("is text-first theater: headline, semantic graph, details, bounded feed", () => {
    expect(html).toContain('id="watch-headline"');
    expect(html).toMatch(/aria-live="polite"/);
    expect(html).toContain("<nav");
    expect(html).toContain('createElement("details")');
    expect(html).toContain('createElement("summary")');
    expect(html).toContain('id="watch-feed"');
    expect(html).not.toMatch(/id="watch-feed"[^>]*aria-live/);
    expect(html).toContain("The Chamber is quiet.");
    expect(html).toContain("No public sites exposed yet.");
    expect(html).toContain("Nothing public yet.");
    expect(html).toContain("Projection unavailable.");
    expect(html).not.toContain("Public projection");
    expect(html).not.toMatch(/\bledger\b/i);
    expect(html).toContain(" → ");
    expect(html).toContain("var(--font-mono)");
  });

  it("never assigns innerHTML and does not grow a KPI dashboard", () => {
    expect(html).not.toMatch(/\.innerHTML\s*=/);
    expect(html).not.toContain("Watch the world move");
    expect(html).not.toMatch(/sparkline|WebGL/i);
    expect(html).toContain("/v1/watch/stream");
    expect(html).toContain('id="watch-phosphor"');
    expect(html).toContain("/assets/legend-mini.png");
  });
});

describe("WATCH upgrade does not change other planes", () => {
  it("keeps PLAY, STUDY, and Admin Live fingerprints", () => {
    expect(playHtml()).toContain("/v1/play/login/request");
    expect(playHtml()).toContain("Enter world");
    expect(playHtml()).not.toMatch(/\.innerHTML\s*=/);
    expect(playHtml()).not.toContain("watch-phosphor");
    expect(studyHtml()).toMatch(/not open/i);
    expect(studyHtml()).not.toContain("watch-phosphor");
    expect(adminHtml()).toContain("Keep the world legible.");
    expect(adminHtml()).toContain("ADMIN / operations");
    expect(watchHtml()).not.toContain("system_actors");
    expect(watchHtml()).not.toContain("ADMIN / operations");
  });
});
