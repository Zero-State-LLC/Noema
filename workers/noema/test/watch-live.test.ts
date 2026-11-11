import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  WATCH_LIVE_PIN,
  buildWatchLive,
  buildWatchNarrative,
  consequenceForEvent,
  consequenceForPublicBand,
  distinctFromHeadline,
  publicWatchRoomId,
  explicitWatchCause,
  capVisibleEvents,
  heldFromSnapshot,
  holdHeadline,
  isRoomNameOccupantLabel,
  phraseWatchEvent,
  projectionIdForEvent,
  publicOccupantLabel,
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

  it("labels Civic Exchange occupants as system actor handles, never the room name", () => {
    const civic = {
      room_id: "room.civic-exchange",
      name: "Civic Exchange",
      description: "Central meeting and trade hub.",
      exits: [],
      entities: [],
    };
    const roomsIn = { "room.civic-exchange": civic };
    const snap = buildWatchLive({
      world_id: "world.perihelion-reach-3",
      cycle: 1,
      sequence: 8,
      rooms: roomsIn,
      players: [
        {
          player_id: "player.tester",
          handle: "tester",
          room_id: "room.civic-exchange",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "system",
          controller_type: "agent",
        },
        {
          player_id: "player.reach-maint3",
          handle: "reach-maint3",
          room_id: "room.civic-exchange",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "system",
          controller_type: "agent",
        },
      ],
      events: [
        src({
          handle: "tester",
          player_id: "player.tester",
          actor_kind: "system",
          event_type: "MOVE",
          sequence: 8,
          payload: { to: "room.civic-exchange", to_room_name: "Civic Exchange" },
        }),
      ],
      now: NOW,
    });
    const site = (snap.rooms as Array<Record<string, unknown>>).find((r) => r.room_id === "room.civic-exchange")!;
    expect(site.name).toBe("Civic Exchange");
    expect(site.players_present).toBe(2);
    expect(site.public_player_labels).toEqual(["tester", "reach-maint3"]);
    expect(site.public_player_labels).not.toContain("Civic Exchange");
    expect(site.public_player_labels).not.toContain("civic-exchange");
    const lines = (snap.recent_events as Array<{ line: string; actor_label?: string }>).map((e) => e.line);
    expect(lines).toContain("tester entered Civic Exchange");
    expect(lines.join("\n")).not.toMatch(/^Civic Exchange entered/m);
    expect((snap.recent_events as Array<{ actor_label?: string }>)[0]?.actor_label).toBe("tester");
    expect(JSON.stringify(site.public_player_labels)).not.toMatch(/Civic Exchange/i);
  });

  it("keeps occupancy when a handle collides with the room title", () => {
    const roomsIn = {
      "room.civic-exchange": {
        room_id: "room.civic-exchange",
        name: "Civic Exchange",
        description: "Hub.",
        exits: [],
        entities: [],
      },
    };
    const snap = buildWatchLive({
      world_id: "w",
      cycle: 1,
      sequence: 2,
      rooms: roomsIn,
      players: [
        {
          player_id: "player.ghost-room",
          handle: "Civic Exchange",
          room_id: "room.civic-exchange",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "system",
        },
        {
          player_id: "player.tester",
          handle: "tester",
          room_id: "room.civic-exchange",
          entered: true,
          last_seen_ms: NOW,
          actor_kind: "system",
        },
      ],
      events: [],
      now: NOW,
    });
    const site = (snap.rooms as Array<Record<string, unknown>>).find((r) => r.room_id === "room.civic-exchange")!;
    expect(site.players_present).toBe(2);
    expect(site.public_player_labels).toEqual(["tester"]);
    expect(site.public_player_labels).not.toContain("Civic Exchange");
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

describe("Gate D C5 public-band consequence (asset / notice / office)", () => {
  function bareLine(line?: string): string {
    return String(line || "").trim().replace(/\.+$/, "");
  }

  function liveOf(over: Partial<Parameters<typeof buildWatchLive>[0]> = {}) {
    return buildWatchLive({
      world_id: "w",
      cycle: 17779,
      sequence: 41816,
      rooms: rooms(),
      players: [],
      events: [],
      now: NOW,
      ...over,
    });
  }

  function recent(snap: Record<string, unknown>): WatchEvent[] {
    return (snap.recent_events as WatchEvent[]) || [];
  }

  it("derives Stocks recovered from a public PRODUCTION payload and keeps quantities off the wire", () => {
    const ev = src({
      event_type: "ENTITY_UPDATE",
      sequence: 41816,
      handle: "reach-maint3",
      payload: { entity_id: "entity.stall", operation: "PRODUCTION", field: "stock_amount", from: 2, to: 9 },
    });
    expect(consequenceForEvent(ev, rooms())).toBe("Stocks recovered");
    const snap = liveOf({ events: [ev] });
    const hit = recent(snap).find((e) => e.projection_id === "production");
    expect(hit?.line).toBe("Stocks recovered at Chamber Market");
    expect(hit?.consequence).toBe("Stocks recovered");
    expect(hit?.actor_label).toBe("reach-maint3");
    const wire = JSON.stringify(snap);
    expect(wire).not.toContain('"from"');
    expect(wire).not.toContain('"stock_amount"');
    expect(wire).not.toContain('"to":9');
  });

  it("projects notice and office from already-public pulses and omits lines that do not name them", () => {
    const snap = liveOf({
      public_pulses: [
        "A report is circulating.",
        "An institution declared a temporary repair authority.",
        "A designated successor has taken an institution office.",
        "A maintenance custom has become widely observed.",
      ],
    });
    const byLine = Object.fromEntries(recent(snap).map((e) => [e.line, e]));
    expect(byLine["A report is circulating."]?.projection_id).toBe("message_notice");
    expect(byLine["A report is circulating."]?.consequence).toBe("A report is circulating");
    expect(byLine["An institution declared a temporary repair authority."]?.projection_id).toBe("organization");
    expect(byLine["An institution declared a temporary repair authority."]?.room_id).toBeUndefined();
    expect(byLine["An institution declared a temporary repair authority."]?.consequence).toBe(
      "Temporary repair authority is in force",
    );
    expect(byLine["An institution declared a temporary repair authority."]?.consequence).not.toBe(
      bareLine("An institution declared a temporary repair authority."),
    );
    expect(byLine["A designated successor has taken an institution office."]?.consequence).toBe(
      "An institution office has a new holder",
    );
    expect(byLine["A designated successor has taken an institution office."]?.consequence).not.toBe(
      bareLine("A designated successor has taken an institution office."),
    );
    expect(byLine["A maintenance custom has become widely observed."]?.projection_id).toBe("organization");
    expect(byLine["A maintenance custom has become widely observed."]).not.toHaveProperty("consequence");
    expect((snap.notable_event as WatchEvent).consequence).toBe("A report is circulating");
  });

  it("leaves same-band repairs and other bands honest-empty", () => {
    expect(
      consequenceForEvent(
        src({
          event_type: "ENTITY_UPDATE",
          sequence: 11,
          payload: { entity_id: "entity.core", operation: "PRODUCTION", field: "stock_amount", from: 1, to: 4 },
        }),
        rooms(),
      ),
    ).toBeUndefined();
    expect(consequenceForPublicBand("production", "Nacre repaired Relay Trunk")).toBeUndefined();
    expect(consequenceForPublicBand("message_notice", "")).toBeUndefined();
    expect(consequenceForPublicBand("harvest", "Harvest at Chamber Market")).toBeUndefined();
    expect(consequenceForPublicBand("conflicting_reports", "Conflicting accounts are circulating.")).toBeUndefined();
  });

  it("projects a distinct institution Consequence and never copies the headline", () => {
    const headline = "An institution declared a temporary repair authority.";
    const consequence = consequenceForPublicBand("organization", headline);
    expect(consequence).toBe("Temporary repair authority is in force");
    expect(distinctFromHeadline(headline, consequence)).toBe(consequence);
    expect(distinctFromHeadline(headline, headline)).toBeUndefined();
    expect(distinctFromHeadline(headline, bareLine(headline))).toBeUndefined();
  });

  it("projects Where on an institution pulse when the act already has a public room", () => {
    const snap = liveOf({
      public_pulses: [
        {
          text: "An institution declared a temporary repair authority.",
          room_id: "room.market",
        },
      ],
    });
    const hit = recent(snap).find((e) => e.line === "An institution declared a temporary repair authority.");
    expect(hit?.projection_id).toBe("organization");
    expect(hit?.room_id).toBe("room.market");
    expect(hit?.consequence).toBe("Temporary repair authority is in force");
    expect(hit?.consequence).not.toBe("An institution declared a temporary repair authority.");
    expect(snap.public_pulses).toEqual(["An institution declared a temporary repair authority."]);
  });

  it("withholds a hidden or unknown pulse room and does not relocate the act", () => {
    const hidden = liveOf({
      public_pulses: [
        { text: "An institution declared a temporary repair authority.", room_id: "room.vault" },
      ],
      players: [livePlayer("player.aaaaaaaaaaaa", "device48f89b55e0fe", "room.market")],
    });
    const hiddenHit = recent(hidden).find((e) => e.line === "An institution declared a temporary repair authority.");
    expect(hiddenHit?.room_id).toBeUndefined();
    expect(JSON.stringify(hidden)).not.toContain("Sealed Vault");

    const unknown = liveOf({
      public_pulses: [
        { text: "A designated successor has taken an institution office.", room_id: "room.does-not-exist" },
      ],
    });
    expect(recent(unknown).find((e) => e.projection_id === "organization")?.room_id).toBeUndefined();
  });

  it("keeps a public room when the same institution pulse arrives as both a string and a located copy", () => {
    const snap = liveOf({
      public_pulses: [
        "An institution declared a temporary repair authority.",
        { text: "An institution declared a temporary repair authority.", room_id: "room.market" },
      ],
    });
    expect(snap.public_pulses).toEqual(["An institution declared a temporary repair authority."]);
    const hits = recent(snap).filter((e) => e.line === "An institution declared a temporary repair authority.");
    expect(hits).toHaveLength(1);
    expect(hits[0]?.room_id).toBe("room.market");
  });

  it("projects Where and a distinct Consequence for a public organization act", () => {
    expect(consequenceForEvent(src({ event_type: "ORG_CREATE", sequence: 10, payload: { room_id: "room.market" } }), rooms())).toBe(
      "An organization formed",
    );
    expect(consequenceForPublicBand("organization", "An organization acted at Chamber Market")).toBe(
      "An organization took a public action",
    );
    expect(consequenceForPublicBand("organization", "An organization acted")).toBe("An organization took a public action");
    const digestShaped = src({
      event_type: "ORG_CREATE",
      sequence: 12,
      handle: "device48f89b55e0fe",
      payload: { room_name: "Chamber Market" },
    });
    expect(publicWatchRoomId(digestShaped, rooms())).toBe("room.market");
    const org = liveOf({
      events: [digestShaped],
      players: [livePlayer("player.aaaaaaaaaaaa", "device48f89b55e0fe", "room.market")],
    });
    const acted = recent(org).find((e) => e.projection_id === "organization");
    expect(acted?.line).toBe("An organization acted at Chamber Market");
    expect(acted?.room_id).toBe("room.market");
    expect(acted?.actor_label).toBe("device48f89b55e0fe");
    expect(acted?.consequence).toBe("An organization formed");
    expect(acted?.consequence).not.toBe(acted?.line);
    expect(acted?.consequence).not.toBe(bareLine(acted?.line));
  });

  it("uses the actor's public site when an organization act carries no location", () => {
    const ev = src({
      event_type: "ORG_MEMBER_ADD",
      sequence: 13,
      handle: "device48f89b55e0fe",
      payload: {},
    });
    const org = liveOf({
      events: [ev],
      players: [livePlayer("player.aaaaaaaaaaaa", "device48f89b55e0fe", "room.market")],
    });
    const acted = recent(org).find((e) => e.projection_id === "organization");
    expect(acted?.line).toBe("An organization acted at Chamber Market");
    expect(acted?.room_id).toBe("room.market");
    expect(acted?.consequence).toBe("A membership changed");
    expect(acted?.consequence).not.toBe(acted?.line);
  });

  it("withholds a non-public room_name on an organization act and does not relocate it", () => {
    const ev = src({
      event_type: "ORG_CREATE",
      sequence: 14,
      handle: "device48f89b55e0fe",
      payload: { room_name: "Sealed Vault" },
    });
    expect(publicWatchRoomId(ev, rooms(), [livePlayer("player.aaaaaaaaaaaa", "device48f89b55e0fe", "room.market")])).toBeUndefined();
    const org = liveOf({
      events: [ev],
      players: [livePlayer("player.aaaaaaaaaaaa", "device48f89b55e0fe", "room.market")],
    });
    const acted = recent(org).find((e) => e.projection_id === "organization");
    expect(acted?.line).toBe("An organization acted");
    expect(acted?.room_id).toBeUndefined();
    expect(acted?.consequence).toBe("An organization formed");
    expect(JSON.stringify(org)).not.toContain("Sealed Vault");
  });

  it("derives a public notice from MESSAGE_DELIVERED without leaking message text", () => {
    const ev = src({
      event_type: "MESSAGE_DELIVERED",
      sequence: 40,
      payload: { message_id: "msg.1", recipient_id: "player.hidden", text: "secret private body", room_id: "room.market" },
    });
    expect(consequenceForEvent(ev, rooms())).toBe("A notice reached Chamber Market");
    const snap = liveOf({ events: [ev] });
    const hit = recent(snap).find((e) => e.projection_id === "message_notice");
    expect(hit?.line).toBe("A notice reached Chamber Market");
    expect(hit?.consequence).toBe("A notice reached Chamber Market");
    expect(JSON.stringify(snap)).not.toContain("secret private body");
    expect(JSON.stringify(snap)).not.toContain("player.hidden");
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

describe("Feature D WATCH traces", () => {
  it("projects public scar and repair plates onto rooms after the originator is gone", () => {
    const snap = buildWatchLive({
      world_id: "w",
      cycle: 4,
      sequence: 20,
      rooms: {
        "room.hub": {
          room_id: "room.hub",
          name: "Grid Anchor",
          description: "A frontier anchor.",
          exits: [],
          entities: [
            {
              entity_id: "entity.relay-7",
              label: "scarred-conduit",
              entity_type: "INFRASTRUCTURE",
              last_repair_cycle: 4,
              last_repair_handle: "Sable",
            },
            {
              entity_id: "entity.scar.1",
              label: "old-weld",
              entity_type: "INFRASTRUCTURE",
              scar: true,
            },
          ],
        },
      },
      players: [],
      events: [],
      now: NOW,
    });
    const hub = (snap.rooms as Array<{ name?: string; traces?: Array<{ kind: string; text: string }> }>).find(
      (r) => r.name === "Grid Anchor",
    );
    expect(hub?.traces?.map((t) => t.text)).toEqual([
      "A scar remains (old-weld).",
      "A maintenance plate names Sable as the last repairer.",
    ]);
    expect(JSON.stringify(hub?.traces)).not.toMatch(/entity\.|player\.|source_state_ref/);
  });

  it("omits hidden rooms, hidden entities, and board notices from WATCH traces", () => {
    const snap = buildWatchLive({
      world_id: "w",
      cycle: 1,
      sequence: 3,
      rooms: {
        "room.hub": {
          room_id: "room.hub",
          name: "Grid Anchor",
          description: "Public.",
          exits: [],
          entities: [
            {
              entity_id: "entity.secret-scar",
              label: "hidden-scar",
              entity_type: "INFRASTRUCTURE",
              scar: true,
              hidden: true,
            },
          ],
        },
        "room.vault": {
          room_id: "room.vault",
          name: "Sealed Vault",
          description: "Not for spectators.",
          hidden: true,
          exits: [],
          entities: [
            {
              entity_id: "entity.core",
              label: "Core",
              entity_type: "INFRASTRUCTURE",
              last_repair_cycle: 1,
              last_repair_handle: "Sable",
            },
          ],
        },
      },
      players: [],
      events: [],
      now: NOW,
    });
    const roomsOut = snap.rooms as Array<{ name?: string; traces?: unknown }>;
    expect(roomsOut.map((r) => r.name)).toEqual(["Grid Anchor"]);
    expect(roomsOut[0].traces).toBeUndefined();
    expect(JSON.stringify(snap)).not.toMatch(/Sealed Vault|hidden-scar|A notice on the board/);
  });

  it("WATCH inspect markup reads room traces without innerHTML", () => {
    const html = watchHtml();
    expect(html).toContain("r.traces");
    expect(html).toContain("watch-traces");
    expect(html).not.toMatch(/\.innerHTML\s*=/);
  });

  it("WATCH paints public descriptor bands and stays silent when empty", () => {
    const html = watchHtml();
    expect(html).toContain('id="watch-standing"');
    expect(html).toContain("public_descriptor_lines");
    expect(html).toContain("watch-standing-list");
    expect(html).not.toMatch(/id="watch-standing"[^>]*aria-live/);
    expect(html).toMatch(/box\.hidden = !lines\.length|standing\.hidden = !lines\.length|list\.hidden/);
  });

  it("projects genesis RUIN and unclaimed works onto public rooms", () => {
    const snap = buildWatchLive({
      world_id: "w",
      cycle: 12,
      sequence: 40,
      rooms: {
        "room.spur": {
          room_id: "room.spur",
          name: "Dead Spur",
          description: "A worn yard.",
          exits: [],
          entities: [
            {
              entity_id: "entity.failed-claim",
              label: "collapsed-gantry",
              entity_type: "RUIN",
            },
            {
              entity_id: "entity.relay-a",
              label: "north-relay",
              entity_type: "INFRASTRUCTURE",
              unclaimed: true,
            },
          ],
        },
      },
      players: [],
      events: [],
      now: NOW,
    });
    const spur = (snap.rooms as Array<{ name?: string; traces?: Array<{ kind: string; text: string }> }>).find(
      (r) => r.name === "Dead Spur",
    );
    expect(spur?.traces?.map((t) => t.text)).toEqual([
      "A scar remains (collapsed-gantry).",
      "The north relay is unclaimed.",
    ]);
    expect(JSON.stringify(spur?.traces)).not.toMatch(/entity\.|player\.|source_state_ref/);
  });

  it("projects public rumor and org insignia onto WATCH room traces", () => {
    const snap = buildWatchLive({
      world_id: "w",
      cycle: 4,
      sequence: 12,
      rooms: {
        "room.hub": {
          room_id: "room.hub",
          name: "Grid Anchor",
          description: "A frontier anchor.",
          exits: [],
          entities: [
            {
              entity_id: "entity.relay-7",
              label: "scarred-conduit",
              entity_type: "INFRASTRUCTURE",
              owner_id: "org.line",
            },
          ],
        },
      },
      players: [],
      events: [],
      rumor: {
        claims: {
          "claim.pub": { visibility: "PUBLIC", subject_ref: "entity.relay-7", origin_claim_id: "claim.pub" },
        },
      },
      organizations: [{ org_id: "org.line", name: "Line", offices: { o1: { display_name: "Treasurer", status: "VACANT" } } }],
      now: NOW,
    });
    const hub = (snap.rooms as Array<{ name?: string; traces?: Array<{ text: string }> }>).find(
      (r) => r.name === "Grid Anchor",
    );
    expect(hub?.traces?.map((t) => t.text)).toEqual([
      "A public report concerns this site.",
      "Marks of Line remain here.",
      "Treasurer of Line stands vacant.",
    ]);
    expect(JSON.stringify(hub?.traces)).not.toMatch(/org\.|entity\.|claim\./);
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
    const plated = homeExcerptFromLive({
      players_present: 0,
      rooms: [
        {
          room_id: "room.hub",
          name: "Grid Anchor",
          traces: [{ kind: "construction", text: "A maintenance plate names Sable as the last repairer." }],
        },
      ],
      narrative: { now: { line: "The Chamber is quiet." }, recently: [], world: { players_present: 0 } },
    });
    expect(plated).toContain("A maintenance plate names Sable as the last repairer.");
    expect(plated.join("\n")).not.toMatch(/entity\.|player\./);
    expect(lines.length).toBeLessThanOrEqual(5);

    const named = homeExcerptFromLive({
      players_present: 2,
      rooms: [{
        room_id: "room.civic-exchange",
        name: "Civic Exchange",
        players_present: 2,
        public_player_labels: ["tester", "reach-maint3", "Civic Exchange"],
      }],
      narrative: {
        now: { line: "tester entered Civic Exchange", room_id: "room.civic-exchange", sequence: 8 },
        recently: [],
        world: { players_present: 2 },
      },
    });
    expect(named).toContain("tester, reach-maint3 are there.");
    expect(named.join("\n")).not.toMatch(/Civic Exchange is there/);
    expect(named.join("\n")).not.toMatch(/2 Players are there/);

    const standing = homeExcerptFromLive({
      players_present: 0,
      public_descriptor_lines: [
        "Nacre is publicly dangerous.",
        "You have found Nacre reliable in trade.",
        "player.secret is publicly deceptive.",
      ],
      narrative: { now: { line: "The Chamber is quiet." }, recently: [], world: { players_present: 0 } },
    });
    expect(standing).toContain("Nacre is publicly dangerous.");
    expect(standing.join("\n")).not.toMatch(/reliable|unknown|player\./i);
  });
});

describe("home WATCH fetch at the rendered page seam", () => {
  const pages = [
    ["Worker Home", landingHtml()],
    ["static Home", readFileSync(join(HERE, "../../../site/index.html"), "utf8")],
  ] as const;

  function runHomeScript(html: string, fetchImpl: typeof fetch) {
    const script = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
      .map((match) => match[1])
      .find((body) => body.includes("homeExcerptFromLive") && body.includes("/v1/watch/live"));
    if (!script) throw new Error("Home WATCH script missing");
    const initial = html.match(/<span id="home-now">([^<]*)<\/span>/)?.[1];
    if (!initial) throw new Error("Home fallback missing");
    const now = { textContent: initial };
    const live = { hidden: true, className: "tag", textContent: "live" };
    runInNewContext(script, {
      fetch: fetchImpl,
      document: { getElementById: (id: string) => id === "home-now" ? now : id === "home-live" ? live : null },
      AbortController,
      setTimeout,
      clearTimeout,
    });
    return { now, live };
  }

  it.each(pages)("%s keeps the fallback and badge hidden for failed or unusable WATCH data", async (_, html) => {
    for (const fetchImpl of [
      () => Promise.reject(new Error("network unavailable")),
      () => Promise.resolve({ ok: false }),
      () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
      () => Promise.resolve({ ok: true, json: () => Promise.resolve({ narrative: { now: { line: "The Chamber is quiet." } } }) }),
    ]) {
      const { now, live } = runHomeScript(html, fetchImpl as unknown as typeof fetch);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(now.textContent).toBe(HOME_EXCERPT_FALLBACK);
      expect(live.hidden).toBe(true);
    }
  });

  it.each(pages)("%s shows only bounded, WATCH-safe lines from a valid response", async (_, html) => {
    const fetchImpl = (() => Promise.resolve({ ok: true, json: () => Promise.resolve({
      narrative: {
        now: { line: "The relay dimmed." },
        recently: [
          { line: "player.secret-id arrived." },
          ...Array.from({ length: 9 }, (_, i) => ({ line: `Public event ${i}.` })),
        ],
      },
    }) })) as unknown as typeof fetch;
    const { now, live } = runHomeScript(html, fetchImpl);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(now.textContent.split("\n")[0]).toBe("The relay dimmed.");
    expect(now.textContent.split("\n").length).toBeLessThanOrEqual(5);
    expect(now.textContent).not.toContain("player.secret-id");
    expect(live.hidden).toBe(false);
  });

  it.each(pages)("%s ignores a WATCH response arriving after the timeout", async (_, html) => {
    vi.useFakeTimers();
    try {
      let resolveFetch: ((response: Response) => void) | undefined;
      const fetchImpl = (() => new Promise<Response>((resolve) => { resolveFetch = resolve; })) as typeof fetch;
      const { now, live } = runHomeScript(html, fetchImpl);
      await vi.advanceTimersByTimeAsync(5000);
      resolveFetch?.({ ok: true, json: () => Promise.resolve({ narrative: { now: { line: "Too late." } } }) } as Response);
      await Promise.resolve();
      await Promise.resolve();
      expect(now.textContent).toBe(HOME_EXCERPT_FALLBACK);
      expect(live.hidden).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it.each(pages)("%s aborts a hung WATCH attempt and retains the rendered fallback", async (_, html) => {
    vi.useFakeTimers();
    try {
      let signal: AbortSignal | undefined;
      const fetchImpl = vi.fn((_url: string, options: RequestInit) => {
        signal = options.signal as AbortSignal;
        return new Promise<Response>(() => {});
      }) as unknown as typeof fetch;
      const { now, live } = runHomeScript(html, fetchImpl);
      expect(now.textContent).toBe(HOME_EXCERPT_FALLBACK);
      expect(live.hidden).toBe(true);
      await vi.advanceTimersByTimeAsync(3999);
      expect(signal?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(signal?.aborted).toBe(true);
      expect(now.textContent).toBe(HOME_EXCERPT_FALLBACK);
      expect(live.hidden).toBe(true);
    } finally {
      vi.useRealTimers();
    }
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

  it("keeps the public map before subordinate activity and chrome", () => {
    expect(html.indexOf('class="watch-col watch-map-col"')).toBeGreaterThan(-1);
    expect(html.indexOf('class="watch-col watch-map-col"')).toBeLessThan(html.indexOf('id="watch-hero"'));
    expect(html).toMatch(/\.watch-stage\{display:grid;grid-template-columns:minmax\(0,1\.65fr\) minmax\(17rem,\.75fr\)/);
    expect(html).toContain('class="watch-side" aria-label="Current and recent public activity"');
    expect(html).not.toContain('class="watch-atmos"');
    expect(html).not.toContain("watch-spectator.jpg");
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
    expect(html).toMatch(/@media\(max-width:860px\)\{[\s\S]*\.watch-stage\{grid-template-columns:1fr/);
    expect(html).toContain(".watch-feed .line{overflow-wrap:anywhere}");
    expect(html).toContain('id="watch-here-open"');
    expect(html).toContain('id="watch-here-close"');
    expect(html).toContain('id="watch-here-sheet"');
    expect(html).toMatch(/aria-controls="watch-here-sheet"/);
    expect(html).toContain("setHereOpen");
    expect(html).toMatch(/@media\(min-width:861px\)[\s\S]*#watch-here-open/);
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
    expect(html).not.toMatch(/sparkline/i);
    expect(html).toContain("/assets/watch-map-gl.js");
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
  dataset: Record<string, string>;
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
  insertAdjacentHTML(position: string, html: string): void;
  fire(type: string, ev?: unknown): void;
};

function makeWatchDom() {
  let focused: FakeNode | null = null;
  const htmlWrites: Array<{ tag: string; sink: string; value: string }> = [];
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
      dataset: {},
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
      insertAdjacentHTML(position, html) {
        htmlWrites.push({ tag: n.tagName, sink: `insertAdjacentHTML:${position}`, value: String(html) });
      },
      fire(type, ev) {
        for (const fn of n.handlers[type] || []) fn(ev);
      },
    };
    for (const sink of ["innerHTML", "outerHTML"] as const) {
      let current = "";
      Object.defineProperty(n, sink, {
        configurable: true,
        get: () => current,
        set: (value: string) => {
          current = String(value);
          htmlWrites.push({ tag: n.tagName, sink, value: current });
        },
      });
    }
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
    addEventListener(type: string, fn: (ev: unknown) => void) {
      body.addEventListener(type, fn);
    },
  };
  return {
    doc,
    byId,
    htmlWrites,
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

async function bootWatchClient(initial: () => unknown, map?: { reduce: boolean; focus: Array<[string, number]> }) {
  const dom = makeWatchDom();
  const chunks = watchHtml(map ? { mode: "map" } : undefined).split("<script>").map((s) => s.split("</script>")[0]);
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
  g.location = { search: map ? "?mode=map" : "", protocol: "https:", host: "noema.test" };
  if (map) {
    (dom.doc.getElementById("watch-map-gl") as FakeNode & { getContext: (id: string) => object }).getContext = () => ({});
  }
  g.window = {
    matchMedia: () => ({ matches: map?.reduce ?? false }),
    ...(map ? { NoemaWatchMapGl: { mount: () => ({ update() {}, focus(id: string, ms: number) { map.focus.push([id, ms]); }, dispose() {} }) } } : {}),
  }; // no WebSocket → HTTP path; only map canvas/stage primitives are stubbed
  g.fetch = async (url: string) => map && url === "/v1/watch/map"
    ? okResponse({ world_id: "world.test", cycle: 4, sequence: 20, freshness: "live", layers: [], base: { rooms: [] } })
    : fetcher();
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

function readinessFrame(sequence = 20, roomId = "room.market") {
  const room = {
    room_id: roomId, name: roomId === "room.east" ? "East Gallery" : "Chamber Market",
    description: "Public test site.", players_present: 1, active: true,
    exits: [], entities: [],
  };
  const event = {
    sequence, cycle: 4, tier: "MAJOR", projection_id: "discovery",
    line: `Public signal ${sequence}`, room_id: roomId,
  };
  return snapshot({ sequence, rooms: [room], recent_events: [event], notable_event: event });
}

async function bootReadinessMap(reduce = false) {
  const focus: Array<[string, number]> = [];
  const client = await bootWatchClient(() => okResponse(readinessFrame()), { reduce, focus });
  return { client, focus };
}
describe("driven watch client (§11/§13)", () => {
  // Executed-client fixture coverage, not native browser keyboard acceptance (#857).
  it.each(["Escape", "close", "backdrop"])("#857 restores Here opener focus after %s dismissal", async (dismissal) => {
    const client = await bootWatchClient(() => okResponse(snapshot()));
    try {
      const opener = client.$("watch-here-open");
      const sheet = client.dom.doc.getElementById("watch-here-sheet")!;
      const backdrop = client.$("watch-here-backdrop");
      opener.fire("click");
      expect(client.dom.doc.activeElement).toBe(client.$("watch-here-close"));
      expect(opener.getAttribute("aria-expanded")).toBe("true");
      expect(sheet.classList.contains("is-open")).toBe(true);
      // Model focus after native Tab to the recent-events summary. The fixture
      // does not synthesize browser Tab, Enter or Space default actions.
      const summary = client.dom.doc.getElementById("watch-public-recent-summary")!;
      summary.focus();
      if (dismissal === "Escape") {
        let prevented = false;
        client.dom.doc.body.fire("keydown", { key: "Escape", target: summary, preventDefault() { prevented = true; } });
        expect(prevented).toBe(true);
      } else {
        client.$(dismissal === "close" ? "watch-here-close" : "watch-here-backdrop").fire("click");
      }
      expect(opener.getAttribute("aria-expanded")).toBe("false");
      expect(sheet.classList.contains("is-open")).toBe(false);
      expect(backdrop.hidden).toBe(true);
      expect(client.dom.doc.activeElement).toBe(opener);
      summary.focus();
      await client.refresh();
      expect(client.dom.doc.activeElement).toBe(summary);
    } finally {
      client.restore();
    }
  });
  it("T35 generated WATCH uses fresh text nodes, never HTML sinks, for scar on startup and Refresh", async () => {
    const projection = (label: string, sequence: number) => buildWatchLive({
      world_id: "world.test", cycle: 4, sequence, players: [], events: [],
      rooms: { "room.market": {
        room_id: "room.market", name: "Market", description: "Public site", exits: [],
        entities: [{ entity_id: "entity.scar", label, entity_type: "RUIN", scar: true }],
      } },
    });
    const first = "A scar remains (Scar <em>first</em>).";
    const second = "A scar remains (Scar <strong>second</strong>).";
    const initial = projection("Scar <em>first</em>", 20);
    const later = projection("Scar <strong>second</strong>", 21);
    expect((initial.rooms as Array<{ traces: Array<{ text: string }> }>)[0].traces[0].text).toBe(first);
    expect((later.rooms as Array<{ traces: Array<{ text: string }> }>)[0].traces[0].text).toBe(second);
    const client = await bootWatchClient(() => okResponse(initial));
    try {
      const traceNodes = () => client.$("watch-map").querySelectorAll("p")
        .filter((n) => n.className === "watch-traces")
        .flatMap((n) => n.querySelectorAll("span"))
        .flatMap((n) => n.children.filter((c) => c.tagName === "#text"));
      expect(client.dom.htmlWrites, "startup HTML sink writes").toEqual([]);
      const startupNodes = traceNodes();
      expect(startupNodes.map((n) => n.textContent)).toContain(first);
      const oldNodeSet = new Set(startupNodes);
      const sinkBoundary = client.dom.htmlWrites.length;
      client.setFetch(() => okResponse(later));
      await client.refresh();
      expect(client.dom.htmlWrites.slice(sinkBoundary), "Refresh HTML sink writes").toEqual([]);
      const newNodes = traceNodes().filter((n) => !oldNodeSet.has(n));
      expect(newNodes.map((n) => n.textContent)).toContain(second);
      expect(newNodes.map((n) => n.textContent)).not.toContain(first);
    } finally { client.restore(); }
  });
  it("R806-next10 10 overlapping Refresh admits only one pending live request", async () => {
    const { client, focus } = await bootReadinessMap();
    let release: (value: ReturnType<typeof okResponse>) => void = () => {};
    const pending = new Promise<ReturnType<typeof okResponse>>((resolve) => { release = resolve; });
    try {
      let calls = 0;
      client.setFetch(() => { calls++; return pending; });
      focus.length = 0;
      await Promise.all([client.refresh(), client.refresh()]);
      expect(calls).toBe(1);
      expect(focus).toEqual([]);
      release(okResponse(readinessFrame(21)));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(focus).toContainEqual(["room.market", 560]);
      expect(client.$("watch-seq").textContent).toBe("21");
    } finally {
      release(okResponse(readinessFrame(21)));
      await new Promise((resolve) => setTimeout(resolve, 0));
      client.restore();
    }
  });

  it("R806-next10 09 hidden document blocks Refresh until visible", async () => {
    const { client, focus } = await bootReadinessMap();
    try {
      let calls = 0;
      client.setFetch(() => { calls++; return okResponse(readinessFrame(21)); });
      client.dom.doc.hidden = true;
      focus.length = 0;
      await client.refresh();
      expect(calls).toBe(0);
      expect(focus).toEqual([]);
      client.dom.doc.hidden = false;
      await client.refresh();
      expect(calls).toBe(1);
      expect(focus).toContainEqual(["room.market", 560]);
    } finally { client.restore(); }
  });

  it("R806-next10 08 resume immediately restores public MAP updates", async () => {
    const { client, focus } = await bootReadinessMap();
    try {
      client.$("watch-pause").fire("click");
      focus.length = 0;
      client.setFetch(() => okResponse(readinessFrame(21, "room.east")));
      client.$("watch-pause").fire("click");
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(focus).toContainEqual(["room.east", 560]);
      expect(client.$("watch-state").textContent).toBe("live");
      expect(client.$("watch-pause").getAttribute("aria-pressed")).toBe("false");
      expect(client.$("watch-seq").textContent).toBe("21");
    } finally { client.restore(); }
  });

  it("R806-next10 07 pause blocks manual Refresh requests and focus", async () => {
    const { client, focus } = await bootReadinessMap();
    try {
      let calls = 0;
      client.setFetch(() => { calls++; return okResponse(readinessFrame(21)); });
      client.$("watch-pause").fire("click");
      focus.length = 0;
      await client.refresh();
      expect(calls).toBe(0);
      expect(focus).toEqual([]);
      expect(client.$("watch-state").textContent).toBe("paused");
      expect(client.$("watch-pause").getAttribute("aria-pressed")).toBe("true");
    } finally { client.restore(); }
  });

  it("R806-next10 06 MAP feed and camera recover after a failed Refresh", async () => {
    const { client, focus } = await bootReadinessMap();
    try {
      client.setFetch(() => { throw new Error("synthetic public feed failure"); });
      await client.refresh();
      expect(client.$("watch-state").textContent).toBe("unavailable");
      focus.length = 0;
      client.setFetch(() => okResponse(readinessFrame(21, "room.east")));
      await client.refresh();
      expect(focus).toContainEqual(["room.east", 560]);
      expect(client.$("watch-state").textContent).toBe("live");
      expect(textOf(client.$("watch-feed"))).toContain("Public signal 21");
      expect(textOf(client.$("watch-feed"))).not.toContain("Projection unavailable.");
    } finally { client.restore(); }
  });

  it("R806-next10 05 MAP live-fetch failure clears the previous feed", async () => {
    const { client } = await bootReadinessMap();
    try {
      expect(textOf(client.$("watch-feed"))).toContain("Public signal 20");
      client.setFetch(() => { throw new Error("synthetic public feed failure"); });
      await client.refresh();
      expect(textOf(client.$("watch-feed"))).not.toContain("Public signal 20");
      expect(client.$("watch-state").textContent).toBe("unavailable");
      expect(client.$("watch-headline").textContent).toBe("Projection unavailable.");
    } finally { client.restore(); }
  });

  it("R806-next10 04 absent public site never receives camera focus", async () => {
    const { client, focus } = await bootReadinessMap();
    try {
      focus.length = 0;
      const frame = readinessFrame(21, "room.east");
      client.setFetch(() => okResponse({ ...frame, rooms: [] }));
      await client.refresh();
      expect(focus).toEqual([]);
      expect(client.$("watch-state").textContent).toBe("live");
      expect(textOf(client.$("watch-feed"))).toContain("Public signal 21");
    } finally { client.restore(); }
  });

  it("R806-next10 03 new public major event retargets camera after Refresh", async () => {
    const { client, focus } = await bootReadinessMap();
    try {
      focus.length = 0;
      client.setFetch(() => okResponse(readinessFrame(21, "room.east")));
      await client.refresh();
      expect(focus).toContainEqual(["room.east", 560]);
      expect(focus.some(([id]) => id === "room.market")).toBe(false);
      expect(textOf(client.$("watch-feed"))).toContain("Public signal 21");
    } finally { client.restore(); }
  });

  it("R806-next10 02 reduced-motion Refresh records a new zero-duration focus", async () => {
    const { client, focus } = await bootReadinessMap(true);
    try {
      focus.length = 0;
      client.setFetch(() => okResponse(readinessFrame(21)));
      await client.refresh();
      expect(focus).toContainEqual(["room.market", 0]);
      expect(focus.every(([, ms]) => ms === 0)).toBe(true);
      expect(client.$("watch-state").textContent).toBe("live");
    } finally { client.restore(); }
  });

  it("R806-next10 01 normal Refresh records a new focus call", async () => {
    const { client, focus } = await bootReadinessMap();
    try {
      focus.length = 0;
      client.setFetch(() => okResponse(readinessFrame(21)));
      await client.refresh();
      expect(focus).toContainEqual(["room.market", 560]);
      expect(client.$("watch-seq").textContent).toBe("21");
      expect(client.$("watch-state").textContent).toBe("live");
    } finally { client.restore(); }
  });

  it.each([false, true])("keeps healthy MAP feed and focuses its camera after refresh (reduced motion=%s)", async (reduce) => {
    const focus: Array<[string, number]> = [];
    const notable = { sequence: 20, cycle: 4, tier: "NOTABLE", projection_id: "trade", line: "A trade at Chamber Market", room_id: "room.market" };
    const client = await bootWatchClient(() => okResponse(snapshot({ recent_events: [notable], notable_event: notable })), { reduce, focus });
    try {
      expect(client.$("watch-state").textContent).toBe("live");
      expect(client.$("watch-headline").textContent).not.toBe("Projection unavailable.");
      expect(textOf(client.$("watch-feed"))).toContain("A trade at Chamber Market");
      expect(focus).toContainEqual(["room.market", reduce ? 0 : 560]);
      const refreshed = { ...notable, sequence: 21, line: "A second trade at Chamber Market" };
      client.setFetch(() => okResponse(snapshot({ sequence: 21, recent_events: [refreshed], notable_event: refreshed })));
      await client.refresh();
      expect(client.$("watch-state").textContent).toBe("live");
      expect(textOf(client.$("watch-feed"))).toContain("A second trade at Chamber Market");
      expect(focus).toContainEqual(["room.market", reduce ? 0 : 560]);
    } finally {
      client.restore();
    }
  });

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

  it("names Civic Exchange occupants by handle, never the room title", async () => {
    const client = await bootWatchClient(() =>
      okResponse(snapshot({
        players_present: 2,
        rooms: [{
          room_id: "room.civic-exchange",
          name: "Civic Exchange",
          description: "Central meeting and trade hub.",
          players_present: 2,
          active: true,
          public_player_labels: ["tester", "reach-maint3", "Civic Exchange"],
          player_glyph: "player",
          glyph: "loc",
          exits: [],
          entities: [],
        }],
        recent_events: [{
          sequence: 20,
          cycle: 4,
          tier: "NORMAL",
          projection_id: "agent_move",
          line: "tester entered Civic Exchange",
          room_id: "room.civic-exchange",
          actor_label: "tester",
        }],
        notable_event: {
          sequence: 20,
          cycle: 4,
          tier: "NORMAL",
          projection_id: "agent_move",
          line: "tester entered Civic Exchange",
          room_id: "room.civic-exchange",
          actor_label: "tester",
        },
      })),
    );
    try {
      const site = client.$("watch-map").children[0];
      const body = textOf(site);
      expect(body).toContain("Civic Exchange");
      expect(body).toContain("tester");
      expect(body).toContain("reach-maint3");
      const inspect = site.children.find((c) => c.tagName === "details")?.children.find((c) => c.className === "watch-inspect");
      const occupantLine = inspect ? textOf(inspect.children[0]) : "";
      expect(occupantLine).toContain("tester");
      expect(occupantLine).toContain("reach-maint3");
      expect(occupantLine).not.toMatch(/Civic Exchange/);
    } finally {
      client.restore();
    }
  });

  it("paints Gate D TEXT facts from public actor, site, and withheld absences", async () => {
    const client = await bootWatchClient(() =>
      okResponse(
        snapshot({
          players_present: 0,
          rooms: [
            {
              room_id: "room.civic-exchange",
              name: "Civic Exchange",
              description: "Open floor.",
              players_present: 0,
              active: true,
              exits: [],
              entities: [],
            },
          ],
          recent_events: [
            {
              sequence: 41816,
              cycle: 17779,
              tier: "NORMAL",
              projection_id: "production",
              line: "Stocks recovered at Civic Exchange",
              room_id: "room.civic-exchange",
              actor_label: "reach-maint3",
              consequence: "Stocks recovered",
            },
            {
              sequence: 41816,
              cycle: 17779,
              tier: "NOTABLE",
              projection_id: "message_notice",
              line: "A report is circulating.",
            },
            {
              sequence: 41815,
              cycle: 17779,
              tier: "NOTABLE",
              projection_id: "organization",
              line: "An institution declared a temporary repair authority.",
            },
          ],
          notable_event: {
            sequence: 41816,
            cycle: 17779,
            tier: "NOTABLE",
            projection_id: "message_notice",
            line: "A report is circulating.",
          },
        }),
      ),
    );
    try {
      expect(client.$("watch-headline").textContent).toBe("A report is circulating.");
      expect(client.$("watch-hero-who").textContent).toBe("Who not projected publicly");
      expect(client.$("watch-hero-where").textContent).toBe("Where not projected publicly");
      expect(client.$("watch-conseq").textContent).toBe("Consequence not projected publicly");
      expect(client.$("watch-now-actors").textContent).toBe("Actors: reach-maint3");
      expect(client.$("watch-now-sites").textContent).toBe("Sites: Civic Exchange");
      expect(client.$("watch-players").textContent).toBe("Agents in public sites: 0");
      expect(client.$("watch-players").textContent).not.toMatch(/^0 players$/i);
      const feed = textOf(client.$("watch-feed"));
      expect(feed).toContain("Who reach-maint3");
      expect(feed).toContain("Where Civic Exchange");
      expect(feed).toContain("Consequence Stocks recovered");
      expect(feed).not.toMatch(/authority\.Consequence/);
      expect(feed).not.toMatch(/ExchangeWho/);
      const withheld = textOf(client.$("watch-withheld-list"));
      expect(withheld).toContain("Notice author is not projected publicly");
      expect(withheld).toContain("Institution name is not projected publicly");
      expect(withheld).not.toContain("None marked");
    } finally {
      client.restore();
    }
  });

  it("omits missing recent facts and shows an honest empty Withheld band", async () => {
    const client = await bootWatchClient(() =>
      okResponse(
        snapshot({
          players_present: 2,
          recent_events: [
            { sequence: 20, cycle: 4, tier: "NORMAL", projection_id: "production", line: "Stocks recovered at Chamber Market" },
          ],
          notable_event: {
            sequence: 20,
            cycle: 4,
            tier: "NORMAL",
            projection_id: "production",
            line: "Stocks recovered at Chamber Market",
            room_id: "room.market",
            actor_label: "tester",
            consequence: "Stocks recovered",
          },
        }),
      ),
    );
    try {
      expect(client.$("watch-hero-who").textContent).toBe("Who tester");
      expect(client.$("watch-hero-where").textContent).toBe("Where Chamber Market");
      expect(client.$("watch-conseq").textContent).toBe("Consequence Stocks recovered");
      const row = textOf(client.$("watch-feed").children[0]);
      expect(row).toContain("Stocks recovered at Chamber Market");
      expect(row).not.toContain("Who ");
      expect(row).not.toContain("Consequence ");
      expect(textOf(client.$("watch-withheld-list"))).toBe("None marked");
      expect(client.$("watch-players").textContent).toBe("Agents in public sites: 2");
    } finally {
      client.restore();
    }
  });

  it("paints gateway-derived C5 consequences from buildWatchLive", async () => {
    const live = buildWatchLive({
      world_id: "world.perihelion-reach-3",
      cycle: 17779,
      sequence: 41816,
      rooms: {
        "room.civic-exchange": {
          room_id: "room.civic-exchange",
          name: "Civic Exchange",
          description: "Open floor.",
          exits: [],
          entities: [{ entity_id: "entity.cache", label: "salvage-cache", entity_type: "NODE" }],
        },
      },
      players: [],
      events: [
        src({
          event_type: "ENTITY_UPDATE",
          sequence: 41814,
          handle: "reach-maint3",
          payload: { entity_id: "entity.cache", operation: "PRODUCTION", field: "stock_amount", from: 3, to: 8 },
        }),
      ],
      public_pulses: [
        "A report is circulating.",
        { text: "An institution declared a temporary repair authority.", room_id: "room.civic-exchange" },
      ],
      now: NOW,
    });
    const client = await bootWatchClient(() => okResponse(live));
    try {
      expect(client.$("watch-headline").textContent).toBe("A report is circulating.");
      expect(client.$("watch-conseq").textContent).toBe("Consequence A report is circulating");
      const feed = textOf(client.$("watch-feed"));
      expect(feed).toContain("Consequence Stocks recovered");
      expect(feed).toContain("Who reach-maint3");
      expect(feed).toContain("Where Civic Exchange");
      expect(feed).toContain("An institution declared a temporary repair authority.");
      expect(feed).toContain(
        "An institution declared a temporary repair authority. · Where Civic Exchange · Consequence Temporary repair authority is in force",
      );
      expect(feed).toContain("Consequence Temporary repair authority is in force");
      expect(feed).not.toContain("Consequence An institution declared a temporary repair authority");
      expect(feed).not.toMatch(/authority\.Consequence/);
      expect(feed).not.toMatch(/ExchangeWho/);
    } finally {
      client.restore();
    }
  });

  it("paints org-act Where and a Consequence distinct from the headline", async () => {
    const civic = {
      room_id: "room.civic-exchange",
      name: "Civic Exchange",
      description: "Open floor.",
      exits: [],
      entities: [],
    };
    const live = buildWatchLive({
      world_id: "world.perihelion-reach-3",
      cycle: 21943,
      sequence: 59526,
      rooms: { "room.civic-exchange": civic },
      players: [livePlayer("player.aaaaaaaaaaaa", "device48f89b55e0fe", "room.civic-exchange")],
      events: [
        src({
          event_type: "ORG_CREATE",
          sequence: 59526,
          handle: "device48f89b55e0fe",
          payload: { room_name: "Civic Exchange" },
        }),
      ],
      now: NOW,
    });
    const notable = live.notable_event as WatchEvent;
    expect(notable.projection_id).toBe("organization");
    expect(notable.line).toBe("An organization acted at Civic Exchange");
    expect(notable.room_id).toBe("room.civic-exchange");
    expect(notable.actor_label).toBe("device48f89b55e0fe");
    expect(notable.consequence).toBe("An organization formed");
    expect(notable.consequence).not.toBe(notable.line);
    const client = await bootWatchClient(() => okResponse(live));
    try {
      expect(client.$("watch-headline").textContent).toBe("An organization acted at Civic Exchange");
      expect(client.$("watch-hero-who").textContent).toBe("Who device48f89b55e0fe");
      expect(client.$("watch-hero-where").textContent).toBe("Where Civic Exchange");
      expect(client.$("watch-hero-where").textContent).not.toBe("Where not projected publicly");
      expect(client.$("watch-conseq").textContent).toBe("Consequence An organization formed");
      expect(client.$("watch-conseq").textContent).not.toBe("Consequence not projected publicly");
      expect(client.$("watch-conseq").textContent).not.toBe("Consequence " + client.$("watch-headline").textContent);
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
    expect(studyHtml()).not.toMatch(/not open/i);
    expect(studyHtml()).toContain("/v1/watch/live");
    expect(studyHtml()).not.toContain("watch-phosphor");
    expect(adminHtml()).toContain("Keep the world legible.");
    expect(adminHtml()).toContain("ADMIN / operations");
    expect(watchHtml()).not.toContain("system_actors");
    expect(watchHtml()).not.toContain("ADMIN / operations");
    expect(watchHtml()).toContain("occupantLabelsForRoom");
  });
});

describe("occupant labels are actor handles, never room titles", () => {
  const civic = [{ name: "Civic Exchange", room_id: "room.civic-exchange" }];

  it("accepts system actor handles and rejects the room name", () => {
    expect(publicOccupantLabel({ handle: "tester", player_id: "player.tester" }, civic)).toBe("tester");
    expect(publicOccupantLabel({ handle: "reach-maint3", player_id: "player.reach-maint3" }, civic)).toBe("reach-maint3");
    expect(publicOccupantLabel({ handle: "Civic Exchange", player_id: "player.ghost" }, civic)).toBeNull();
    expect(publicOccupantLabel({ handle: "civic-exchange", player_id: "player.ghost" }, civic)).toBeNull();
    expect(isRoomNameOccupantLabel("Civic Exchange", civic)).toBe(true);
    expect(isRoomNameOccupantLabel("tester", civic)).toBe(false);
  });
});

describe("H7 bounded public recent disclosure", () => {
  it.each(["text", "pixel", "map", "3d"])("H7 native disclosure is closed and labeled in %s mode", (mode) => {
    const html = watchHtml({ mode });
    const disclosure = html.match(/<details\b[^>]*id="watch-public-recent"[^>]*>/)?.[0];
    expect(disclosure, "Missing adopted H7 disclosure").toBeDefined();
    expect(disclosure).not.toMatch(/\sopen(?:\s|=|>)/);
    expect(disclosure).toContain('aria-live="off"');
    expect(html).toContain('<summary id="watch-public-recent-summary">Recent public events</summary>');
    expect(html).toContain('<ol class="watch-feed" id="watch-public-recent-list"></ol>');
    expect(html).toContain('id="watch-public-recent-status"');
    expect(html).toContain("Bounded public projection, not world truth or complete history.");
  });
});

function h7PublicFrame(offset = 0, hostile = false) {
  const entities = Array.from({ length: 8 }, (_, i) => ({
    entity_id: `entity.h7-${offset + i + 1}`,
    label: hostile ? `<em>Relay ${offset + i + 1}</em>` : `Relay ${offset + i + 1}`,
    entity_type: "INFRASTRUCTURE",
  }));
  const events = entities.map((entity, i) => src({
    event_type: "ENTITY_UPDATE", sequence: offset + i + 1,
    payload: { entity_id: entity.entity_id, operation: "REPAIR", last_repair_handle: "Wren" },
  }));
  return buildWatchLive({
    world_id: "world.h7", cycle: 4, sequence: offset + 8, now: NOW, players: [],
    rooms: { "room.h7": { room_id: "room.h7", name: "Public Workshop", description: "Visible works.", exits: [], entities } },
    events,
  });
}

describe("H7 generated public recent disclosure", () => {
  it.each([false, true])("H7 renders all eight public rows rather than curated six (map=%s)", async (map) => {
    const frame = h7PublicFrame();
    expect((frame.recent_events as WatchEvent[])).toHaveLength(8);
    expect((frame.narrative as { recently: WatchEvent[] }).recently).toHaveLength(6);
    const client = await bootWatchClient(() => okResponse(frame), map ? { reduce: false, focus: [] } : undefined);
    try {
      const list = client.dom.doc.getElementById("watch-public-recent-list")!;
      expect(list.children.map(textOf), "H7 public window must render").toEqual(
        Array.from({ length: 8 }, (_, i) => `Wren repaired Relay ${8 - i}`),
      );
      expect(client.dom.htmlWrites).toEqual([]);
    } finally { client.restore(); }
  });
});

describe("H7 public disclosure updates and refusal", () => {
  it("H7 renders literal projected text without HTML sinks", async () => {
    const frame = h7PublicFrame(0, true);
    const client = await bootWatchClient(() => okResponse(frame));
    try {
      const list = client.$("watch-public-recent-list");
      expect(client.dom.htmlWrites).toEqual([]);
      expect(list.children).toHaveLength(8);
      expect(textOf(list.children[0])).toBe("Wren repaired <em>Relay 8</em>");
      // Existing el() assigns textContent; the fake DOM does not synthesize native text child nodes.
      expect(list.children[0].textContent).toBe("Wren repaired <em>Relay 8</em>");
      expect(list.children[0].querySelector("em")).toBeNull();
    } finally { client.restore(); }
  });

  it("H7 sorts and caps oversized transport data using only already-public lines", async () => {
    const older = h7PublicFrame();
    const newer = h7PublicFrame(8);
    const frame = { ...older, recent_events: [
      ...(newer.recent_events as WatchEvent[]), ...(older.recent_events as WatchEvent[]),
    ].reverse() }; // Deliberately oversized/reordered transport fixture, not a server acceptance claim.
    const client = await bootWatchClient(() => okResponse(frame));
    try {
      expect(client.$("watch-public-recent-list").children.map(textOf)).toEqual(
        Array.from({ length: 8 }, (_, i) => `Wren repaired Relay ${16 - i}`),
      );
    } finally { client.restore(); }
  });

  it("H7 preserves summary focus and open state across populated empty and recovered reads", async () => {
    const client = await bootWatchClient(() => okResponse(h7PublicFrame()));
    try {
      const list = client.$("watch-public-recent-list");
      expect(list.children).toHaveLength(8);
      const oldRows = new Set(list.children);
      const panel = client.dom.doc.getElementById("watch-public-recent")!;
      const summary = client.dom.doc.getElementById("watch-public-recent-summary")!;
      panel.open = true; summary.focus();
      client.setFetch(() => okResponse({ ...h7PublicFrame(), recent_events: [] }));
      await client.refresh();
      expect(list.children).toEqual([]);
      expect(client.$("watch-public-recent-status").textContent).toBe("No recent public events.");
      expect(panel.open).toBe(true); expect(client.dom.focused).toBe(summary);
      client.setFetch(() => okResponse(h7PublicFrame(8)));
      await client.refresh();
      expect(textOf(list.children[0])).toBe("Wren repaired Relay 16");
      expect(list.children.every((node) => !oldRows.has(node))).toBe(true);
      expect(client.dom.doc.getElementById("watch-public-recent-summary")).toBe(summary);
      expect(panel.open).toBe(true); expect(client.dom.focused).toBe(summary);
      expect(client.dom.htmlWrites).toEqual([]);
    } finally { client.restore(); }
  });

  it.each(["missing", "not-array", "invalid-row", "empty-line", "bad-sequence", "private", "stale", "incident"])(
    "H7 clears %s feeds without narrative or unprojected fallback", async (variant) => {
      const client = await bootWatchClient(() => okResponse(h7PublicFrame()));
      try {
        const list = client.$("watch-public-recent-list");
        expect(list.children).toHaveLength(8);
        const bad: Record<string, unknown> = { ...h7PublicFrame(), events: [{ line: "Not a public source" }] };
        if (variant === "missing") delete bad.recent_events;
        if (variant === "not-array") bad.recent_events = {};
        if (variant === "invalid-row") bad.recent_events = [null];
        if (variant === "empty-line") bad.recent_events = [{ sequence: 1, line: "" }];
        if (variant === "bad-sequence") bad.recent_events = [{ sequence: "1", line: "Not a valid event" }];
        if (variant === "private") bad.projection = "private";
        if (variant === "stale" || variant === "incident") bad.freshness = variant;
        client.setFetch(() => okResponse(bad)); await client.refresh();
        expect(list.children).toEqual([]);
        expect(client.$("watch-public-recent-status").textContent).toBe("Public events unavailable.");
        expect(client.dom.htmlWrites).toEqual([]);
      } finally { client.restore(); }
    },
  );

  it.each(["reject", "non-ok"])("H7 clears last rows on HTTP %s then recovers", async (failure) => {
    const client = await bootWatchClient(() => okResponse(h7PublicFrame()));
    try {
      const list = client.$("watch-public-recent-list");
      expect(list.children).toHaveLength(8);
      client.setFetch(() => {
        if (failure === "reject") throw new Error("offline");
        return { ok: false, statusText: "Unavailable", json: async () => ({}) };
      });
      await client.refresh();
      expect(list.children, "H7 stale rows must clear on failed HTTP read").toEqual([]);
      expect(client.$("watch-public-recent-status").textContent).toBe("Public events unavailable.");
      client.setFetch(() => okResponse(h7PublicFrame(8))); await client.refresh();
      expect(textOf(list.children[0])).toBe("Wren repaired Relay 16");
    } finally { client.restore(); }
  });

  it("H7 lists adjacent public rows without inventing a cause", async () => {
    const frame = h7PublicFrame();
    const client = await bootWatchClient(() => okResponse(frame));
    try {
      const lines = client.$("watch-public-recent-list").children.map(textOf);
      expect(lines).toHaveLength(8);
      expect(lines.join("\n")).not.toMatch(/because|caused by|caused_by|parent_event/i);
      for (const row of frame.recent_events as WatchEvent[]) {
        expect(explicitWatchCause({
          sequence: row.sequence,
          previous_sequence: row.sequence - 1,
        })).toBeNull();
      }
    } finally { client.restore(); }
  });
});

describe("H7 stream and pause controls", () => {
  it("H7 clears malformed stream data and recovers without a real socket", async () => {
    const client = await bootWatchClient(() => okResponse(h7PublicFrame()));
    const globals = globalThis as Record<string, unknown>;
    const originalSocket = globals.WebSocket;
    const sockets: H7Socket[] = [];
    class H7Socket {
      readyState = 1;
      onmessage?: (event: { data: string }) => void;
      onclose?: () => void;
      onerror?: () => void;
      constructor() { sockets.push(this); }
      send() {}
      close() { this.readyState = 3; this.onclose?.(); }
    }
    try {
      const list = client.$("watch-public-recent-list");
      expect(list.children).toHaveLength(8);
      globals.WebSocket = H7Socket;
      (globals.window as Record<string, unknown>).WebSocket = H7Socket;
      await client.refresh();
      expect(sockets).toHaveLength(1);
      sockets[0].onmessage!({ data: "{" });
      expect(list.children, "H7 stale rows must clear on malformed stream frame").toEqual([]);
      expect(client.$("watch-public-recent-status").textContent).toBe("Public events unavailable.");
      sockets[0].onmessage!({ data: JSON.stringify(h7PublicFrame(8)) });
      expect(textOf(list.children[0])).toBe("Wren repaired Relay 16");
      expect(client.dom.htmlWrites).toEqual([]);
    } finally {
      for (const socket of sockets) socket.close();
      globals.WebSocket = originalSocket;
      client.restore();
    }
  });

  it("H7 follows existing paused HTTP refresh and resumes with fresh rows", async () => {
    const client = await bootWatchClient(() => okResponse(h7PublicFrame()));
    try {
      const list = client.$("watch-public-recent-list");
      expect(textOf(list.children[0])).toBe("Wren repaired Relay 8");
      const rows = list.children.slice();
      client.$("watch-pause").fire("click");
      client.setFetch(() => okResponse(h7PublicFrame(8)));
      await client.refresh();
      expect(list.children).toEqual(rows);
      client.$("watch-pause").fire("click");
      await client.refresh();
      expect(textOf(list.children[0])).toBe("Wren repaired Relay 16");
      expect(list.children.every((node) => !rows.includes(node))).toBe(true);
    } finally { client.restore(); }
  });
});
