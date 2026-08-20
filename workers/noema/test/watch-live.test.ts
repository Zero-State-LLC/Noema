import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  WATCH_LIVE_PIN,
  buildWatchLive,
  buildWatchNarrative,
  explicitWatchCause,
  capVisibleEvents,
  heldFromSnapshot,
  holdHeadline,
  phraseWatchEvent,
  projectionIdForEvent,
  selectNotableEvent,
  watchEventTier,
  type WatchEvent,
  type WatchSourceEvent,
} from "../src/watch-live";

import { connectHtml } from "../src/connect";
import { studyHtml } from "../src/study";
import { adminHtml } from "../src/admin";
import { watchHtml } from "../src/watch";
import { HOME_EXCERPT_FALLBACK, homeExcerptFromLive, landingHtml } from "../src/landing";

const NOW = 1_700_000_000_000;
const HERE = dirname(fileURLToPath(import.meta.url));

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

  it("counts present Players including agents, without leaking operator or smoke handles", () => {
    const snap = buildWatchLive({
      world_id: "w",
      cycle: 1,
      sequence: 3,
      rooms: rooms(),
      players: [
        livePlayer("player.aaaaaaaaaaaa", "Vesper-7", "room.market"),
        {
          player_id: "player.hermes",
          handle: "hermes",
          room_id: "room.market",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "system",
        },
        {
          player_id: "player.smoke-agent",
          handle: "smoke-agent",
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
    expect(JSON.stringify(snap)).not.toContain("smoke-agent");
    expect(JSON.stringify(snap)).not.toContain("Ghost");
    expect(JSON.stringify(snap)).not.toMatch(/player\./);
    const market = (snap.rooms as Array<Record<string, unknown>>).find((r) => r.room_id === "room.market")!;
    expect(market.players_present).toBe(3);
    expect(market.public_player_labels).toEqual(["Vesper-7", "hermes"]);
    expect(market.glyph).toBe("loc");
    expect(market.player_glyph).toBe("player");
    expect(market.active).toBe(true);
    const exits = market.exits as Array<{ to_room_id: string; glyph?: string }>;
    expect(exits.map((x) => x.to_room_id)).toEqual(["room.relay"]);
    expect(exits[0].glyph).toBe("threshold");
    const ents = market.entities as Array<{ label: string; glyph?: string }>;
    expect(ents.map((e) => e.label)).toEqual(["Trade stall"]);
    expect(ents[0].glyph).toBe("event");
  });

  it("names public agents on the feed and keeps smoke anonymous", () => {
    const snap = buildWatchLive({
      world_id: "w",
      cycle: 1,
      sequence: 4,
      rooms: rooms(),
      players: [
        {
          player_id: "player.hermes",
          handle: "hermes",
          room_id: "room.relay",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "system",
        },
        {
          player_id: "player.smoke-agent",
          handle: "smoke-agent",
          room_id: "room.relay",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "system",
        },
      ],
      events: [
        src({
          handle: "hermes",
          player_id: "player.hermes",
          actor_kind: "system",
          event_type: "MOVE",
          sequence: 4,
          payload: { to: "room.relay", to_room_name: "Relay Quarter" },
        }),
        src({
          handle: "smoke-agent",
          player_id: "player.smoke-agent",
          actor_kind: "system",
          event_type: "MOVE",
          sequence: 3,
          payload: { to: "room.relay", to_room_name: "Relay Quarter" },
        }),
      ],
      now: NOW,
    });
    const lines = (snap.recent_events as Array<{ line: string }>).map((e) => e.line);
    expect(lines).toContain("hermes entered Relay Quarter");
    expect(lines).toContain("A player entered Relay Quarter");
    expect(JSON.stringify(snap)).not.toContain("smoke-agent");
    expect(snap.players_present).toBe(2);
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

  it("gates CRIME_DETECTED behind PUBLIC visibility or PUBLIC_HISTORY (§7, §4E)", () => {
    expect(projectionIdForEvent("CRIME_DETECTED")).toBeNull();
    expect(projectionIdForEvent("CRIME_DETECTED", {})).toBeNull();
    expect(projectionIdForEvent("CRIME_DETECTED", { visibility: "WITNESSED" })).toBeNull();
    expect(projectionIdForEvent("CRIME_DETECTED", { flags: ["SEALED"] })).toBeNull();
    expect(projectionIdForEvent("CRIME_DETECTED", { visibility: "PUBLIC" })).toBe("crime_detected");
    expect(projectionIdForEvent("CRIME_DETECTED", { flags: ["PUBLIC_HISTORY"] })).toBe("crime_detected");
  });

  it("never surfaces a non-public CRIME_DETECTED in recent_events or notable_event", () => {
    const base = { world_id: "w", cycle: 1, rooms: rooms(), players: [], now: NOW };
    const hiddenCrime = buildWatchLive({
      ...base,
      sequence: 30,
      events: [
        src({
          event_type: "CRIME_DETECTED",
          sequence: 30,
          payload: { category: "THEFT", room_id: "room.market", visibility: "WITNESSED", detection_id: "det.1" },
        }),
      ],
    });
    expect(JSON.stringify(hiddenCrime.recent_events)).not.toMatch(/crime/i);
    expect((hiddenCrime.notable_event as WatchEvent).projection_id).not.toBe("crime_detected");
    const publicCrime = buildWatchLive({
      ...base,
      sequence: 31,
      events: [
        src({
          event_type: "CRIME_DETECTED",
          sequence: 31,
          payload: { category: "THEFT", room_id: "room.market", visibility: "PUBLIC", detection_id: "det.2" },
        }),
      ],
    });
    const evs = publicCrime.recent_events as WatchEvent[];
    expect(evs.some((e) => e.projection_id === "crime_detected" && e.tier === "MAJOR")).toBe(true);
    const notable = publicCrime.notable_event as WatchEvent;
    expect(notable.projection_id).toBe("crime_detected");
    expect(notable.tier).toBe("MAJOR");
  });

  it("narrates only real harvests as harvests (§5); trade legs and seizures stay neutral", () => {
    expect(
      projectionIdForEvent("RESOURCE_TRANSFER", { from_id: "entity.node-3", to_id: "player.x", resource: "materials" }),
    ).toBe("harvest");
    expect(
      projectionIdForEvent("RESOURCE_TRANSFER", { trade_id: "trade.1", from_id: "player.a", to_id: "player.b", leg: "offered" }),
    ).toBe("resource_change");
    expect(
      projectionIdForEvent("RESOURCE_TRANSFER", { from_id: "player.a", to_id: "player.b", contest_id: "contest.1" }),
    ).toBe("resource_change");
    const tradeLeg = phraseWatchEvent(
      src({ event_type: "RESOURCE_TRANSFER", sequence: 8, payload: { trade_id: "trade.1", from_id: "player.a", to_id: "player.b", leg: "offered" } }),
      {},
    );
    expect(tradeLeg).not.toMatch(/harvest/i);
    const seizure = phraseWatchEvent(
      src({ event_type: "RESOURCE_TRANSFER", sequence: 9, payload: { from_id: "player.a", to_id: "player.b", contest_id: "contest.1" } }),
      {},
    );
    expect(seizure).not.toMatch(/harvest/i);
    expect(
      phraseWatchEvent(
        src({ event_type: "RESOURCE_TRANSFER", sequence: 10, payload: { kind: "harvest", from_id: "entity.node-3", room_id: "room.market" } }),
        { "room.market": { name: "Chamber Market" } },
      ),
    ).toBe("Harvest at Chamber Market");
    expect(
      phraseWatchEvent(src({ event_type: "RESOURCE_TRANSFER", sequence: 11, payload: { from_id: "entity.node-3" } }), {}),
    ).toBe("A harvest was recorded");
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
          handle: "hermes",
          player_id: "player.hermes",
          actor_kind: "system",
          event_type: "MOVE",
          sequence: 4,
          payload: { to: "room.market", to_room_name: "Chamber Market" },
        }),
        { "room.market": { name: "Chamber Market" } },
      ),
    ).toBe("hermes entered Chamber Market");
    expect(
      phraseWatchEvent(
        src({
          handle: "smoke-agent",
          player_id: "player.smoke-agent",
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

  it("holds a NOTABLE headline until more than 8 newer PUBLIC candidates accumulate", () => {
    const held = ev({ sequence: 10, tier: "NOTABLE", projection_id: "trade", line: "trade" });
    const few = [
      ev({ sequence: 17, tier: "NORMAL", projection_id: "agent_move", line: "m7" }),
      ev({ sequence: 10, tier: "NOTABLE", projection_id: "trade", line: "trade" }),
    ];
    expect(holdHeadline(held, few)?.line).toBe("trade");
    const many = [ev({ sequence: 10, tier: "NOTABLE", projection_id: "trade", line: "trade" })];
    for (let i = 11; i <= 19; i++) {
      many.push(ev({ sequence: i, tier: "NORMAL", projection_id: "agent_move", line: `m${i}` }));
    }
    expect(many.filter((e) => e.sequence > 10)).toHaveLength(9);
    expect(holdHeadline(held, many)?.line).toBe("m19");
  });

  it("ages the hold by public candidates, never by raw ledger-sequence gaps", () => {
    // The ledger head can leap on private LOOK/MESSAGE/INSPECT traffic; the
    // hold must survive a huge sequence gap with only one newer public event.
    const held = ev({ sequence: 10, tier: "NOTABLE", projection_id: "trade", line: "trade" });
    const window = [
      ev({ sequence: 900, tier: "NORMAL", projection_id: "agent_move", line: "far" }),
      ev({ sequence: 10, tier: "NOTABLE", projection_id: "trade", line: "trade" }),
    ];
    expect(holdHeadline(held, window)?.line).toBe("trade");
    const picked = selectNotableEvent({ freshness: "live", players_present: 1, candidates: window, held });
    expect(picked?.line).toBe("trade");
  });

  it("releases the hold when a higher tier arrives or the item leaves the window", () => {
    const held = ev({ sequence: 10, tier: "NOTABLE", projection_id: "trade", line: "trade" });
    const withMajor = [
      ev({ sequence: 12, tier: "MAJOR", projection_id: "discovery", line: "found" }),
      held,
    ];
    expect(holdHeadline(held, withMajor)?.line).toBe("found");
    expect(holdHeadline(held, [ev({ sequence: 20, tier: "NORMAL", projection_id: "agent_move", line: "gone" })])?.line).toBe(
      "gone",
    );
  });

  it("wires the server hold: heldFromSnapshot carries the headline between polls", () => {
    const base = {
      world_id: "w",
      cycle: 3,
      sequence: 12,
      rooms: rooms(),
      players: [],
      now: NOW,
    };
    const first = buildWatchLive({
      ...base,
      events: [
        src({ event_type: "TRADE_PROPOSED", sequence: 10 }),
        src({ event_type: "TRADE_REJECTED", sequence: 12 }),
      ],
    });
    const held = heldFromSnapshot(first);
    expect(held?.projection_id).toBe("trade");
    expect(held?.sequence).toBe(12);
    const nextEvents = [
      src({ event_type: "TRADE_PROPOSED", sequence: 10 }),
      src({ event_type: "TRADE_REJECTED", sequence: 12 }),
      src({ event_type: "TRADE_PROPOSED", sequence: 13 }),
    ];
    const heldSecond = buildWatchLive({ ...base, sequence: 13, events: nextEvents, held });
    expect((heldSecond.notable_event as WatchEvent).sequence).toBe(12);
    const unheldSecond = buildWatchLive({ ...base, sequence: 13, events: nextEvents });
    expect((unheldSecond.notable_event as WatchEvent).sequence).toBe(13);
    // Synthetic world-status and quiet fallbacks are never held.
    expect(heldFromSnapshot(buildWatchLive({ ...base, events: [] }))).toBeNull();
    expect(heldFromSnapshot(buildWatchLive({ ...base, events: [], freshness: "incident" }))).toBeNull();
  });

  it("world-do passes the previous headline into buildWatchLive on every snapshot", () => {
    const src2 = readFileSync(join(HERE, "../src/world-do.ts"), "utf8");
    expect(src2).toMatch(/held:\s*this\.watchHeld/);
    expect(src2).toMatch(/this\.watchHeld\s*=\s*heldFromSnapshot\(/);
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

  it("exposes NOW/RECENTLY/WORLD without inferring cause from sequence", () => {
    const snap = buildWatchLive({
      world_id: "w",
      cycle: 9,
      sequence: 12,
      rooms: rooms(),
      players: [],
      events: [
        src({ event_type: "MOVE", sequence: 12, payload: { to: "room.market" } }),
        src({ event_type: "TRADE", sequence: 11, payload: {} }),
      ],
      world_status: "ACTIVE",
      now: NOW,
    });
    const nar = snap.narrative as {
      now: WatchEvent;
      recently: WatchEvent[];
      world: { cycle: number; status: string | null };
    };
    expect(nar.now.line).toBeTruthy();
    expect(nar.recently.every((e) => e.sequence !== nar.now.sequence)).toBe(true);
    expect(nar.world.cycle).toBe(9);
    expect(nar.world.status).toBe("ACTIVE");
    expect(explicitWatchCause({ to: "room.market" })).toBeNull();
    expect(explicitWatchCause({ caused_by: "event.9" })).toBe("event.9");
  });
});

describe("home live excerpt", () => {
  it("reads WATCH-safe live projection with a quiet fallback", () => {
    const html = landingHtml();
    expect(html).toContain('id="home-now"');
    expect(html).toContain("/v1/watch/live");
    expect(html).toContain("Watch the agents play.");
    expect(html).toContain(HOME_EXCERPT_FALLBACK);
    expect(html).not.toContain("/v1/command");
    expect(html).not.toMatch(/id="home-now"[^>]*hidden/);
    expect(html).not.toMatch(/\.innerHTML\s*=/);
    expect(html).toContain('credentials: "omit"');
    expect(html).toContain("textContent");
  });

  it("builds bounded public lines without IDs or invented facts", () => {
    expect(homeExcerptFromLive(null)).toEqual([HOME_EXCERPT_FALLBACK]);
    expect(homeExcerptFromLive({})).toEqual([HOME_EXCERPT_FALLBACK]);
    expect(
      homeExcerptFromLive({
        narrative: { now: { line: "The Chamber is quiet." }, recently: [], world: { players_present: 0 } },
      }),
    ).toEqual([HOME_EXCERPT_FALLBACK]);

    const lines = homeExcerptFromLive({
      players_present: 3,
      rooms: [{ room_id: "room.dock", name: "Dock Ring", players_present: 3 }],
      narrative: {
        now: { line: "The Dock Ring lost relay power.", room_id: "room.dock", sequence: 12 },
        recently: [
          { line: "Rhea repaired the east crane.", sequence: 11 },
          { line: "Orin entered the Exchange.", sequence: 10 },
          { line: "player.secret-id hid a cache.", sequence: 9 },
        ],
        world: { players_present: 3, cycle: 4, status: "ACTIVE" },
      },
    });
    expect(lines[0]).toBe("The Dock Ring lost relay power.");
    expect(lines).toContain("3 Players are there.");
    expect(lines).toContain("Rhea repaired the east crane.");
    expect(lines).toContain("Orin entered the Exchange.");
    expect(lines.join("\n")).not.toMatch(/player\./);
    expect(lines.join("\n")).not.toMatch(/room\./);
    expect(lines.length).toBeLessThanOrEqual(5);
  });
});

describe("pages door live excerpt", () => {
  const html = readFileSync(join(HERE, "../../../site/index.html"), "utf8");

  it("matches hosted Feature H without an email form", () => {
    expect(html).toContain('id="home-now"');
    expect(html).toContain(HOME_EXCERPT_FALLBACK);
    expect(html).toContain("https://noema.guru/v1/watch/live");
    expect(html).toContain("Watch the agents play.");
    expect(html).not.toContain("/v1/command");
    expect(html).not.toMatch(/type="email"/);
    expect(html).not.toMatch(/\.innerHTML\s*=/);
    expect(html).toContain('credentials: "omit"');
    expect(html).toContain("textContent");
    expect(html).not.toMatch(/id="home-now"[^>]*hidden/);
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
    expect(html).toContain(">Now</p>");
    expect(html).toContain(">Recently</h2>");
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

  it("marks feed tiers with a text prefix, never color-only (§9)", () => {
    expect(html).toContain('el("span", "mark", markFor(ev.tier))');
    expect(html).toMatch(/\.watch-feed li\{[^}]*grid-template-columns:\.9rem 1\.1rem 1fr/);
    expect(html).toContain(".watch-feed li.major .mark{color:var(--color-state-warning)");
    expect(html).toContain(".watch-feed li.major .line{color:var(--ink);font-weight:650}");
    // NOTABLE/MAJOR rows never fade into the i>=2 quiet treatment
    expect(html).toContain('i >= 2 && !tierClass ? " quiet" : ""');
  });

  it("keeps periodic updates off assistive tech: no live low-noise block, no transient refreshing", () => {
    expect(html).not.toMatch(/id="watch-low-noise"[^>]*aria-live/);
    expect(html).not.toContain('"refreshing"');
    // status tag writes only on change
    expect(html).toContain("if (tag.textContent !== text) tag.textContent = text;");
    expect(html).toMatch(/id="watch-headline" aria-live="polite"/);
  });

  it("reserves graph and feed heights and wraps long feed lines on mobile (§8, §10)", () => {
    expect(html).toMatch(/\.watch-graph\{[^}]*min-height/);
    expect(html).toMatch(/\.watch-feed\{[^}]*min-height/);
    expect(html).toMatch(/@media\(max-width:860px\)\{\.watch-stage\{grid-template-columns:1fr/);
    expect(html).toContain(".watch-feed .line{overflow-wrap:anywhere}");
  });

  it("feed settle stays inside one poll interval and is gated on reduced motion (§13)", () => {
    const m = html.match(/feed-settle (\d+)ms/);
    expect(m).toBeTruthy();
    expect(Number(m![1])).toBeLessThan(8000);
    expect(html).toContain("const fresh = !state.reduce");
  });

  it("ages the client hold by public candidates and closes details on Escape", () => {
    expect(html).not.toContain("Math.max(data.sequence");
    expect(html).toContain("window.filter(e => (e.sequence || 0) > state.held.sequence).length > 8");
    expect(html).toContain('ev.key !== "Escape"');
    expect(html).toContain("openRooms[r.room_id]");
    expect(html).toMatch(/const t = Number\(ms\);\s*\n\s*if \(!Number\.isFinite\(t\) \|\| t <= 0\) return ""/);
  });

  it("never assigns innerHTML and does not grow a KPI dashboard", () => {
    expect(html).not.toMatch(/\.innerHTML\s*=/);
    expect(html).not.toContain("Watch the world move");
    expect(html).not.toMatch(/sparkline|WebGL/i);
    expect(html).toContain("/v1/watch/stream");
    expect(html).toContain('id="watch-phosphor"');
    expect(html).toContain("NoemaPhosphorPick");
    expect(html).toContain("watch-phos-caption");
    expect(html).toContain('id="world-key"');
    expect(html).toContain('present === 1 ? "an agent"');
    expect(html).toContain("none visible");
    expect(html).not.toContain("/assets/legend-mini.png");
    expect(html).not.toContain("/assets/legend.png");
  });
});

/* ------------------------------------------------------------------ *
 * Driven client: a minimal DOM double boots the inlined watch script  *
 * so §11/§13 behavior (stale, offline, banner clear, marks, details)  *
 * is exercised against the real render path, not string regexes.      *
 * ------------------------------------------------------------------ */

type FakeNode = {
  tagName: string;
  children: FakeNode[];
  attrs: Record<string, string>;
  handlers: Record<string, Array<(ev: unknown) => void>>;
  className: string;
  textContent: string;
  hidden: boolean;
  open: boolean;
  style: Record<string, string>;
  classList: {
    add(c: string): void;
    remove(c: string): void;
    toggle(c: string, on?: boolean): boolean;
    contains(c: string): boolean;
  };
  setAttribute(k: string, v: string): void;
  getAttribute(k: string): string | null;
  addEventListener(type: string, fn: (ev: unknown) => void): void;
  append(...kids: Array<FakeNode | string>): void;
  replaceChildren(...kids: FakeNode[]): void;
  querySelector(sel: string): FakeNode | null;
  querySelectorAll(sel: string): FakeNode[];
  focus(): void;
  scrollIntoView(): void;
  fire(type: string, ev?: unknown): void;
};

function makeWatchDom() {
  let focused: FakeNode | null = null;
  function findAll(root: FakeNode, sel: string): FakeNode[] {
    const out: FakeNode[] = [];
    const walk = (m: FakeNode) => {
      for (const c of m.children || []) {
        if (c.tagName === sel) out.push(c);
        walk(c);
      }
    };
    walk(root);
    return out;
  }
  function node(tag: string): FakeNode {
    const n: FakeNode = {
      tagName: String(tag).toLowerCase(),
      children: [],
      attrs: {},
      handlers: {},
      className: "",
      textContent: "",
      hidden: false,
      open: false,
      style: {},
      classList: {
        add(c) {
          const s = new Set(String(n.className).split(/\s+/).filter(Boolean));
          s.add(c);
          n.className = [...s].join(" ");
        },
        remove(c) {
          const s = new Set(String(n.className).split(/\s+/).filter(Boolean));
          s.delete(c);
          n.className = [...s].join(" ");
        },
        toggle(c, on) {
          const has = n.classList.contains(c);
          const want = on === undefined ? !has : Boolean(on);
          if (want) n.classList.add(c);
          else n.classList.remove(c);
          return want;
        },
        contains(c) {
          return String(n.className).split(/\s+/).includes(c);
        },
      },
      setAttribute(k, v) {
        n.attrs[k] = String(v);
      },
      getAttribute(k) {
        return k in n.attrs ? n.attrs[k] : null;
      },
      addEventListener(type, fn) {
        (n.handlers[type] = n.handlers[type] || []).push(fn);
      },
      append(...kids) {
        for (const k of kids) n.children.push(typeof k === "string" ? text(k) : k);
      },
      replaceChildren(...kids) {
        n.children = kids.slice();
      },
      querySelector(sel) {
        return findAll(n, sel)[0] || null;
      },
      querySelectorAll(sel) {
        return findAll(n, sel);
      },
      focus() {
        focused = n;
      },
      scrollIntoView() {},
      fire(type, ev) {
        for (const fn of n.handlers[type] || []) fn(ev);
      },
    };
    return n;
  }
  function text(s: string): FakeNode {
    const t = node("#text");
    t.textContent = s;
    return t;
  }
  const byId = new Map<string, FakeNode>();
  const body = node("body");
  const doc = {
    hidden: false,
    body,
    get activeElement() {
      return focused;
    },
    getElementById(id: string) {
      if (!byId.has(id)) {
        const n = node("div");
        n.attrs.id = id;
        byId.set(id, n);
      }
      return byId.get(id);
    },
    createElement(tag: string) {
      return node(tag);
    },
    createElementNS(_ns: string, tag: string) {
      return node(tag);
    },
    createTextNode(s: string) {
      return text(String(s));
    },
    querySelector() {
      return null;
    },
    addEventListener() {},
  };
  return {
    doc,
    byId,
    get focused() {
      return focused;
    },
  };
}

function textOf(n: FakeNode | null | undefined): string {
  if (!n) return "";
  let s = n.textContent || "";
  for (const c of n.children || []) s += textOf(c);
  return s;
}

async function bootWatchClient(initial: () => unknown) {
  const dom = makeWatchDom();
  const chunks = watchHtml().split("<script>").map((s) => s.split("</script>")[0]);
  const main = chunks.find((s) => s.includes("POLL_MS"));
  expect(main).toBeTruthy();
  const g = globalThis as Record<string, unknown>;
  const saved = {
    document: g.document,
    window: g.window,
    location: g.location,
    localStorage: g.localStorage,
    fetch: g.fetch,
    setInterval: g.setInterval,
    CSS: g.CSS,
  };
  let fetcher = initial;
  const store = new Map<string, string>();
  g.document = dom.doc;
  g.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
  };
  g.location = { search: "", protocol: "https:", host: "noema.test" };
  g.window = { matchMedia: () => ({ matches: false }) }; // no WebSocket → HTTP path
  g.fetch = async () => fetcher();
  g.setInterval = () => 0;
  g.CSS = { escape: (s: string) => s };
  const flush = () => new Promise((r) => setTimeout(r, 0));
  const restore = () => {
    g.document = saved.document;
    g.window = saved.window;
    g.location = saved.location;
    g.localStorage = saved.localStorage;
    g.fetch = saved.fetch;
    g.setInterval = saved.setInterval;
    g.CSS = saved.CSS;
  };
  try {
    (0, eval)(main as string);
    await flush();
  } catch (e) {
    restore();
    throw e;
  }
  return {
    dom,
    $: (id: string) => dom.byId.get(id)!,
    setFetch(fn: () => unknown) {
      fetcher = fn;
    },
    async refresh() {
      dom.byId.get("watch-refresh")!.fire("click");
      await flush();
    },
    restore,
  };
}

function okResponse(data: unknown) {
  return { ok: true, statusText: "", json: async () => data };
}

function snapshot(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    watch_live: WATCH_LIVE_PIN,
    projection: "public",
    world_id: "world.test",
    cycle: 4,
    sequence: 20,
    players_present: 1,
    world_status: "ACTIVE",
    freshness: "live",
    rooms: [
      {
        room_id: "room.market",
        name: "Chamber Market",
        description: "Open stalls.",
        players_present: 1,
        active: true,
        exits: [],
        entities: [],
      },
    ],
    recent_events: [
      { sequence: 20, cycle: 4, tier: "NORMAL", projection_id: "agent_move", line: "A player entered Chamber Market", room_id: "room.market" },
    ],
    notable_event: { sequence: 20, cycle: 4, tier: "NORMAL", projection_id: "agent_move", line: "A player entered Chamber Market", room_id: "room.market" },
    ...over,
  };
}

describe("driven watch client (§11/§13)", () => {
  it("keeps the last snapshot under freshness=stale, then fails closed offline", async () => {
    const client = await bootWatchClient(() => okResponse(snapshot({ freshness: "stale" })));
    try {
      expect(client.$("watch-state").textContent).toBe("stale");
      expect(client.$("watch-state").className).toBe("tag warn");
      const siteRows = client.$("watch-map").children;
      expect(siteRows.length).toBe(1);
      expect(textOf(siteRows[0])).toContain("Chamber Market");
      expect(client.$("watch-feed").children.length).toBe(1);
      expect(textOf(client.$("watch-feed").children[0])).toContain("entered Chamber Market");

      client.setFetch(() => {
        throw new Error("net down");
      });
      await client.refresh();
      expect(client.$("watch-headline").textContent).toBe("Projection unavailable.");
      expect(client.$("watch-state").textContent).toBe("unavailable");
      const map = client.$("watch-map").children;
      expect(map.length).toBe(1);
      expect(textOf(map[0])).toBe("Projection unavailable.");
      const feed = client.$("watch-feed").children;
      expect(feed.length).toBe(1);
      expect(textOf(feed[0])).toBe("Projection unavailable.");
      expect(JSON.stringify(client.$("watch-map").children.map((c) => textOf(c)))).not.toMatch(/Chamber Market/);
    } finally {
      client.restore();
    }
  });

  it("clears the MAJOR banner within 2 intervals and resets on a newer MAJOR", async () => {
    const major = snapshot({
      sequence: 30,
      recent_events: [{ sequence: 30, tier: "MAJOR", projection_id: "discovery", line: "RELAY SIGNAL DETECTED", room_id: "room.market" }],
      notable_event: { sequence: 30, tier: "MAJOR", projection_id: "discovery", line: "RELAY SIGNAL DETECTED", room_id: "room.market" },
    });
    const calm = (seq: number) =>
      snapshot({
        sequence: seq,
        recent_events: [{ sequence: seq, tier: "NOTABLE", projection_id: "trade", line: "A player offered a trade", room_id: "room.market" }],
        notable_event: { sequence: seq, tier: "NOTABLE", projection_id: "trade", line: "A player offered a trade", room_id: "room.market" },
      });
    const client = await bootWatchClient(() => okResponse(major));
    try {
      const banner = client.$("watch-banner");
      expect(banner.hidden).toBe(false);
      expect(banner.textContent).toBe("RELAY SIGNAL DETECTED");
      client.setFetch(() => okResponse(calm(31)));
      await client.refresh();
      expect(banner.hidden).toBe(false);
      client.setFetch(() => okResponse(calm(32)));
      await client.refresh();
      expect(banner.hidden).toBe(true);
      expect(banner.textContent).toBe("");
      // a newer MAJOR restarts the countdown
      client.setFetch(() =>
        okResponse(
          snapshot({
            sequence: 40,
            recent_events: [{ sequence: 40, tier: "MAJOR", projection_id: "shortage", line: "SHORTAGE DECLARED", room_id: "room.market" }],
            notable_event: { sequence: 40, tier: "MAJOR", projection_id: "shortage", line: "SHORTAGE DECLARED", room_id: "room.market" },
          }),
        ),
      );
      await client.refresh();
      expect(banner.hidden).toBe(false);
      expect(banner.textContent).toBe("SHORTAGE DECLARED");
    } finally {
      client.restore();
    }
  });

  it("renders tier marks on every feed row and never fades MAJOR rows quiet", async () => {
    const events = [
      { sequence: 24, tier: "NORMAL", projection_id: "agent_move", line: "move a", room_id: "room.market" },
      { sequence: 23, tier: "NORMAL", projection_id: "harvest", line: "Harvest at Chamber Market", room_id: "room.market" },
      { sequence: 22, tier: "MAJOR", projection_id: "discovery", line: "found", room_id: "room.market" },
      { sequence: 21, tier: "NOTABLE", projection_id: "trade", line: "trade", room_id: "room.market" },
      { sequence: 20, tier: "NORMAL", projection_id: "production", line: "made", room_id: "room.market" },
    ];
    const client = await bootWatchClient(() =>
      okResponse(snapshot({ sequence: 24, recent_events: events, notable_event: events[2] })),
    );
    try {
      const rows = client.$("watch-feed").children;
      expect(rows.length).toBe(5);
      for (const row of rows) {
        expect(row.children[0].className).toBe("mark");
      }
      expect(rows[0].children[0].textContent).toBe("·");
      expect(rows[2].children[0].textContent).toBe("!");
      expect(rows[2].classList.contains("major")).toBe(true);
      expect(rows[2].classList.contains("quiet")).toBe(false);
      expect(rows[3].children[0].textContent).toBe(">");
      expect(rows[3].classList.contains("quiet")).toBe(false);
      expect(rows[4].classList.contains("quiet")).toBe(true);
    } finally {
      client.restore();
    }
  });

  it("keeps an open room detail open, refocuses its summary, and closes on Escape", async () => {
    let seq = 20;
    const client = await bootWatchClient(() => okResponse(snapshot()));
    try {
      const firstLi = client.$("watch-map").children[0];
      expect(firstLi.getAttribute("data-room")).toBe("room.market");
      const det = firstLi.querySelector("details")!;
      const sum = det.querySelector("summary")!;
      det.open = true;
      sum.focus();
      seq += 1;
      client.setFetch(() => okResponse(snapshot({ sequence: seq })));
      await client.refresh();
      const rebuiltLi = client.$("watch-map").children[0];
      const rebuiltDet = rebuiltLi.querySelector("details")!;
      expect(rebuiltDet).not.toBe(det);
      expect(rebuiltDet.open).toBe(true);
      const rebuiltSum = rebuiltDet.querySelector("summary")!;
      expect(client.dom.focused).toBe(rebuiltSum);
      expect(rebuiltSum.getAttribute("data-room")).toBe("room.market");
      // Esc closes the detail and returns focus to its summary (§4F)
      client.$("watch-map").fire("keydown", {
        key: "Escape",
        target: { closest: () => rebuiltDet },
        preventDefault() {},
      });
      expect(rebuiltDet.open).toBe(false);
      expect(client.dom.focused).toBe(rebuiltSum);
    } finally {
      client.restore();
    }
  });

  it("holds the headline when only the ledger head advances", async () => {
    const trade = { sequence: 10, tier: "NOTABLE", projection_id: "trade", line: "A player offered a trade", room_id: "room.market" };
    const client = await bootWatchClient(() =>
      okResponse(snapshot({ sequence: 10, recent_events: [trade], notable_event: trade })),
    );
    try {
      expect(client.$("watch-headline").textContent).toBe("A player offered a trade");
      // ledger head leaps to 999 on private traffic; only one newer public event
      const move = { sequence: 12, tier: "NORMAL", projection_id: "agent_move", line: "A player entered Chamber Market", room_id: "room.market" };
      client.setFetch(() =>
        okResponse(snapshot({ sequence: 999, recent_events: [move, trade], notable_event: move })),
      );
      await client.refresh();
      expect(client.$("watch-headline").textContent).toBe("A player offered a trade");
    } finally {
      client.restore();
    }
  });

  it("keeps the server-side stale envelope intact (rooms and feed still present)", () => {
    const snap = buildWatchLive({
      world_id: "w",
      cycle: 2,
      sequence: 9,
      rooms: rooms(),
      players: [livePlayer("player.aaaaaaaaaaaa", "Vesper-7", "room.market")],
      events: [src({ event_type: "MOVE", sequence: 9, payload: { to: "room.market" } })],
      freshness: "stale",
      now: NOW,
    });
    expect(snap.freshness).toBe("stale");
    expect((snap.rooms as unknown[]).length).toBeGreaterThan(0);
    expect((snap.recent_events as unknown[]).length).toBeGreaterThan(0);
  });
});

describe("WATCH upgrade does not change other planes", () => {
  it("keeps CONNECT, STUDY, and Admin Live fingerprints", () => {
    expect(connectHtml()).toContain("/v1/play/login/request");
    expect(connectHtml()).not.toContain("Enter world");
    expect(connectHtml()).not.toMatch(/\.innerHTML\s*=/);
    expect(connectHtml()).not.toContain("watch-phosphor");
    expect(studyHtml()).toMatch(/not open/i);
    expect(studyHtml()).not.toContain("watch-phosphor");
    expect(adminHtml()).toContain("Keep the world legible.");
    expect(adminHtml()).toContain("ADMIN / operations");
    expect(watchHtml()).not.toContain("system_actors");
    expect(watchHtml()).not.toContain("ADMIN / operations");
  });
});
