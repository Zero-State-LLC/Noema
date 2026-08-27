import { describe, expect, it } from "vitest";
import { PUBLIC_EVENT_TYPES, buildWatchLive } from "../src/watch-live";
import type { WatchSourceEvent } from "../src/watch-live";

const NOW = 1_700_000_000_000;
const HIDDEN_ROOM = "room.vault";
const HIDDEN_NAME = "Sealed Vault";
const HIDDEN_ENTITY = "entity.secret-node";
const HIDDEN_LABEL = "buried cache";

function rooms() {
  return {
    "room.market": {
      room_id: "room.market",
      name: "Chamber Market",
      description: "Open stalls.",
      exits: [],
      entities: [{ entity_id: "entity.node", label: "ore node", entity_type: "INFRASTRUCTURE" }],
    },
    [HIDDEN_ROOM]: {
      room_id: HIDDEN_ROOM,
      name: HIDDEN_NAME,
      description: "Not for spectators.",
      hidden: true,
      tags: ["hidden"],
      exits: [],
      entities: [{ entity_id: HIDDEN_ENTITY, label: HIDDEN_LABEL, entity_type: "INFRASTRUCTURE" }],
    },
  };
}

const player = {
  player_id: "player.aaaaaaaaaaaa",
  handle: "Vesper-7",
  room_id: "room.market",
  entered: true,
  last_seen_ms: NOW,
  actor_kind: "live" as const,
};

function build(events: WatchSourceEvent[]): Record<string, unknown> {
  return buildWatchLive({
    world_id: "w",
    cycle: 4,
    sequence: 40,
    rooms: rooms() as never,
    players: [player] as never,
    events,
    now: NOW,
  }) as Record<string, unknown>;
}

function snapshot(events: WatchSourceEvent[]): string {
  return JSON.stringify(build(events));
}

function feedLines(events: WatchSourceEvent[]): string[] {
  return ((build(events).recent_events as { line: string }[]) || []).map((e) => e.line);
}

function ev(event_type: string, payload: Record<string, unknown>): WatchSourceEvent {
  return {
    event_type,
    sequence: 39,
    cycle: 4,
    handle: "Vesper-7",
    player_id: player.player_id,
    actor_kind: "live",
    at: NOW,
    payload,
  } as WatchSourceEvent;
}

/**
 * Hidden-room coverage in this suite has always been written case by case — MOVE
 * into the vault, a crime in the vault, traces. That is how a harvest at a hidden
 * node published "A harvest was recorded" to the public feed for as long as it
 * did: nobody wrote the harvest case. This sweep enumerates PUBLIC_EVENT_TYPES
 * instead, so a new event type is covered the moment it is added to the map.
 */
describe("redaction sweep — no public event names a hidden room", () => {
  it("covers every public event type", () => {
    expect(PUBLIC_EVENT_TYPES.length).toBeGreaterThanOrEqual(24);
    expect(PUBLIC_EVENT_TYPES).toContain("ENTITY_UPDATE");
    expect(PUBLIC_EVENT_TYPES).toContain("RESOURCE_TRANSFER");
  });

  for (const eventType of PUBLIC_EVENT_TYPES) {
    it(`${eventType}: a hidden room in any location key never reaches the wire`, () => {
      for (const key of ["room_id", "to", "to_room_id", "from"]) {
        const out = snapshot([ev(eventType, { [key]: HIDDEN_ROOM, to_room_name: HIDDEN_NAME, room_name: HIDDEN_NAME })]);
        expect(out).not.toContain(HIDDEN_NAME);
        expect(out).not.toContain(HIDDEN_ROOM);
      }
    });

    it(`${eventType}: an entity living in a hidden room produces no line at all`, () => {
      // §5: "omitted, not anonymized into filler". Naming nothing is not enough
      // — an unlocated line still publishes that something happened in there.
      // This is the assertion that fails without #520: the harvest leak named
      // neither the room nor the entity, it leaked existence.
      for (const key of ["entity_id", "from_id"]) {
        const events = [ev(eventType, { [key]: HIDDEN_ENTITY, kind: "harvest" })];
        expect(feedLines(events)).toEqual([]);
        const out = snapshot(events);
        expect(out).not.toContain(HIDDEN_NAME);
        expect(out).not.toContain(HIDDEN_ROOM);
        expect(out).not.toContain(HIDDEN_ENTITY);
        expect(out).not.toContain(HIDDEN_LABEL);
      }
    });
  }
});
