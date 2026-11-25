import { describe, expect, it } from "vitest";
import { PUBLIC_EVENT_TYPES, buildWatchLive, explicitWatchCause } from "../src/watch-live";
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

describe("#784 R4 S6 WATCH repeatability, causal boundary, and adversarial privacy", () => {
  it("T6.1 buildWatchLive is repeatable across repeated calls and event-order/sequence-tie permutations", () => {
    const e1: WatchSourceEvent = {
      event_type: "ENTITY_UPDATE",
      sequence: 40,
      cycle: 4,
      handle: "Vesper-7",
      player_id: player.player_id,
      actor_kind: "live",
      at: NOW,
      payload: { room_id: "room.market", entity_id: "entity.node", kind: "repair", condition: 90 },
    } as WatchSourceEvent;
    const e2: WatchSourceEvent = {
      event_type: "RESOURCE_TRANSFER",
      sequence: 40,
      cycle: 4,
      handle: "Vesper-7",
      player_id: player.player_id,
      actor_kind: "live",
      at: NOW,
      payload: { room_id: "room.market", entity_id: "entity.node", kind: "harvest", amount: 2 },
    } as WatchSourceEvent;
    const e3: WatchSourceEvent = {
      event_type: "PLAYER_MOVED",
      sequence: 38,
      cycle: 4,
      handle: "Vesper-7",
      player_id: player.player_id,
      actor_kind: "live",
      at: NOW - 1000,
      payload: { room_id: "room.market", to_room_id: "room.market" },
    } as WatchSourceEvent;

    const first = build([e1, e2, e3]);
    const repeat = build([e1, e2, e3]);
    const reversed = build([e3, e2, e1]);
    expect(repeat).toEqual(first);
    expect((reversed.narrative as { now?: unknown }).now).toEqual((first.narrative as { now?: unknown }).now);
    expect(((reversed.recent_events as { line: string }[]) || []).map((x) => x.line).sort()).toEqual(
      (((first.recent_events as { line: string }[]) || []).map((x) => x.line).sort()),
    );
  });

  it("T6.3 / AC24 explicitWatchCause never fabricates causality from temporal adjacency alone", () => {
    expect(explicitWatchCause(undefined)).toBeNull();
    expect(explicitWatchCause({})).toBeNull();
    expect(explicitWatchCause({ room_id: "room.market", condition: 80 })).toBeNull();
    expect(explicitWatchCause({ cause: "   " })).toBeNull();
  });

  it("T6.4 adversarial private events, research_private overlays, internal IDs, and smoke/operator handles never leak", () => {
    const sentinel = "SENTINEL_PRIVATE_OVERLAY_991";
    const smokePlayer = {
      player_id: "player.smokeprobe99",
      handle: "smoke-probe-99",
      room_id: "room.market",
      entered: true,
      last_seen_ms: NOW,
      actor_kind: "live" as const,
    };
    const hiddenPlayer = {
      player_id: "player.hidden99",
      handle: "GhostVault",
      room_id: HIDDEN_ROOM,
      entered: true,
      last_seen_ms: NOW,
      actor_kind: "live" as const,
    };
    const privateEvents: WatchSourceEvent[] = [
      ev("LOOK", { room_id: "room.market", text: sentinel, research_private: sentinel }),
      ev("MESSAGE", { room_id: "room.market", text: sentinel, private_cognition: sentinel }),
      ev("PRIVATE_MESSAGE", { room_id: "room.market", text: sentinel, controller_id: "ctrl.secret.1" }),
      ev("ENTITY_UPDATE", {
        room_id: "room.market",
        entity_id: "entity.node",
        kind: "repair",
        research_private: sentinel,
        private_cognition: sentinel,
        session_id: "sess.secret.1",
      }),
    ];

    const payload = buildWatchLive({
      world_id: "w",
      cycle: 4,
      sequence: 40,
      rooms: rooms() as never,
      players: [player, smokePlayer, hiddenPlayer] as never,
      events: privateEvents,
      now: NOW,
    });
    const wire = JSON.stringify(payload);
    expect(wire).not.toContain(sentinel);
    expect(wire).not.toContain("smoke-probe-99");
    expect(wire).not.toContain("GhostVault");
    expect(wire).not.toContain("player.aaaaaaaaaaaa");
    expect(wire).not.toContain("ctrl.secret.1");
    expect(wire).not.toContain("sess.secret.1");
    expect(wire).not.toContain(HIDDEN_NAME);
    expect(wire).not.toContain(HIDDEN_ROOM);
  });
});
