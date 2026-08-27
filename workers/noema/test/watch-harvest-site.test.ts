import { describe, expect, it } from "vitest";
import { buildWatchLive, entityScopeId, phraseWatchEvent } from "../src/watch-live";
import type { WatchSourceEvent } from "../src/watch-live";

const NOW = 1_700_000_000_000;

function rooms() {
  return {
    "room.market": {
      room_id: "room.market",
      name: "Chamber Market",
      description: "Open stalls.",
      exits: [],
      entities: [{ entity_id: "entity.node", label: "ore node", entity_type: "INFRASTRUCTURE" }],
    },
    "room.vault": {
      room_id: "room.vault",
      name: "Sealed Vault",
      description: "Not for spectators.",
      hidden: true,
      tags: ["hidden"],
      exits: [],
      entities: [{ entity_id: "entity.secret-node", label: "cache", entity_type: "INFRASTRUCTURE" }],
    },
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
  } as WatchSourceEvent;
}

const player = {
  player_id: "player.aaaaaaaaaaaa",
  handle: "Vesper-7",
  room_id: "room.market",
  entered: true,
  last_seen_ms: NOW,
  actor_kind: "live" as const,
};

function harvest(sequence: number, fromId: string): WatchSourceEvent {
  return src({
    event_type: "RESOURCE_TRANSFER",
    sequence,
    payload: { kind: "harvest", from_id: fromId, to_id: player.player_id, resource: "ore", amount: 3 },
  });
}

function feed(events: WatchSourceEvent[]): { sequence: number; line: string }[] {
  const snap = buildWatchLive({
    world_id: "w",
    cycle: 4,
    sequence: 30,
    rooms: rooms() as never,
    players: [player] as never,
    events,
    now: NOW,
  }) as Record<string, unknown>;
  return ((snap.recent_events as { sequence: number; line: string }[]) || []).map((e) => ({
    sequence: e.sequence,
    line: e.line,
  }));
}

describe("§5 — a harvest is an entity-scoped event and must resolve its site", () => {
  it("scopes by entity_id, and by from_id when only that names an entity", () => {
    expect(entityScopeId({ entity_id: "entity.node" })).toBe("entity.node");
    expect(entityScopeId({ kind: "harvest", from_id: "entity.node" })).toBe("entity.node");
    // A trade leg's from_id is a player, not an entity — must not be scoped by it.
    expect(entityScopeId({ from_id: "player.aaaaaaaaaaaa" })).toBeUndefined();
    expect(entityScopeId({})).toBeUndefined();
    expect(entityScopeId(undefined)).toBeUndefined();
  });

  it("locates a public-room harvest instead of the unlocated filler line", () => {
    expect(phraseWatchEvent(harvest(29, "entity.node"), rooms() as never)).toBe(
      "Harvest at Chamber Market",
    );
  });

  it("omits a hidden-room harvest rather than anonymizing it", () => {
    // Before this fix both rendered as "A harvest was recorded", so a hidden-room
    // harvest reached the public wire indistinguishable from a public one.
    const lines = feed([harvest(29, "entity.node"), harvest(28, "entity.secret-node")]);
    expect(lines).toEqual([{ sequence: 29, line: "Harvest at Chamber Market" }]);
    expect(JSON.stringify(lines)).not.toContain("Sealed Vault");
    expect(JSON.stringify(lines)).not.toContain("secret-node");
  });

  it("never emits the unlocated harvest line at all", () => {
    const lines = feed([harvest(29, "entity.node"), harvest(28, "entity.secret-node")]);
    expect(JSON.stringify(lines)).not.toContain("A harvest was recorded");
  });

  it("leaves a trade-leg RESOURCE_TRANSFER alone", () => {
    const leg = src({
      event_type: "RESOURCE_TRANSFER",
      sequence: 27,
      payload: { from_id: player.player_id, to_id: "player.bbbbbbbbbbbb", resource: "ore", amount: 1 },
    });
    expect(phraseWatchEvent(leg, rooms() as never)).toBe("Resources changed hands");
  });
});
