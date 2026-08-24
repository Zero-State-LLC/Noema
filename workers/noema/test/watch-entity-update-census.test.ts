import { describe, expect, it } from "vitest";
import { buildWatchLive, phraseWatchEvent, projectionIdForEvent } from "../src/watch-live";
import type { WatchSourceEvent } from "../src/watch-live";

/**
 * Every `operation` the runtime puts on an ENTITY_UPDATE, and what WATCH does
 * with it. SPEC-FREEZE-CORE-LOOP's Slice C row counted these by hand and got the
 * shape wrong — most are deliberate silences, not unrendered gaps. This pins the
 * split so the next count is read rather than estimated.
 *
 * Regenerate the operation list with:
 *   grep -A22 'pushEvent("ENTITY_UPDATE"' src/world-actions.ts | grep -oE 'operation: "[A-Z_]+"'
 */
const SILENT = [
  "REPURPOSE",
  "ABANDON",
  "RESTORE",
  "CONSENT",
  "CONSENSUS",
  "RULE",
  "PROMOTE",
  "VEST",
  "SHARE",
  "CONNECT",
] as const;

const SPECIFIC = ["REPAIR", "PRODUCTION"] as const;

const GENERIC = ["HARVEST", "ATTEST", "INFORMATION_CONTEST"] as const;

/**
 * Reaches no feed line, but not by a rule that says so. Its `entity_id` is the
 * target *agent*, and an agent id is not a room entity, so §5's resolve-or-omit
 * gate drops it on the way out. Silence by accident of the id space, not by
 * decision — if a Player ever gained a room-entity representation this would
 * start publishing "Public activity at <site>" for someone being disabled.
 */
const DROPPED_INCIDENTALLY = ["PRESENCE_PRESSURE"] as const;

const NOW = 1_700_000_000_000;
const PLAYER = "player.aaaaaaaaaaaa";

const ROOMS = {
  "room.civic-exchange": {
    room_id: "room.civic-exchange",
    name: "Civic Exchange",
    description: "The hub.",
    exits: [],
    entities: [{ entity_id: "entity.relay-1", label: "relay", entity_type: "INFRASTRUCTURE" }],
  },
};

/**
 * The payload each operation actually carries, copied from its emission site in
 * `world-actions.ts`. An earlier version of this file asserted on
 * `phraseWatchEvent` alone, which is the phrasing function and not the feed —
 * it reported PRESENCE_PRESSURE as rendering a generic line when the projection
 * drops it before phrasing ever runs.
 */
const PAYLOADS: Record<string, Record<string, unknown>> = {
  HARVEST: { entity_id: "entity.relay-1", field: "stock_amount", to: 7 },
  ATTEST: {
    entity_id: "entity.relay-1",
    attester_id: PLAYER,
    visibility: "PUBLIC",
    subject_entity_id: "entity.relay-1",
    archive_claim: "the relay was sabotaged",
  },
  INFORMATION_CONTEST: {
    entity_id: "entity.relay-1",
    field: "inspect_restricted_until",
    to: 12,
    contest_id: "contest.1",
  },
  // The target is an agent, not a room entity — that is the whole point.
  PRESENCE_PRESSURE: { entity_id: PLAYER, field: "disabled_until_cycle", to: 7, contest_id: "contest.2" },
};

function feedLines(operation: string): string[] {
  const snap = buildWatchLive({
    world_id: "w",
    cycle: 4,
    sequence: 40,
    rooms: ROOMS as never,
    players: [{
      player_id: PLAYER, handle: "agent.tester", room_id: "room.civic-exchange",
      entered: true, last_seen_ms: NOW, actor_kind: "live",
    }] as never,
    events: [{
      event_type: "ENTITY_UPDATE", sequence: 39, cycle: 4, handle: "agent.tester",
      player_id: PLAYER, actor_kind: "live", at: NOW,
      payload: { operation, ...(PAYLOADS[operation] || {}) },
    }] as never,
    now: NOW,
  }) as Record<string, unknown>;
  return ((snap.recent_events as { line: string }[]) || []).map((e) => e.line);
}

function ev(operation: string, extra: Record<string, unknown> = {}): WatchSourceEvent {
  return {
    event_type: "ENTITY_UPDATE",
    sequence: 1,
    cycle: 1,
    handle: "agent.tester",
    payload: { operation, entity_id: "entity.relay-1", ...extra },
  } as WatchSourceEvent;
}

describe("ENTITY_UPDATE census — what WATCH does with each operation", () => {
  it("keeps ten operations off the public feed entirely", () => {
    for (const operation of SILENT) {
      expect(projectionIdForEvent("ENTITY_UPDATE", { operation })).toBeNull();
    }
    expect(SILENT).toHaveLength(10);
  });

  it("narrates two specifically", () => {
    expect(phraseWatchEvent(ev("REPAIR", { field: "condition" }), ROOMS)).toBe(
      "agent.tester repaired relay",
    );
    expect(phraseWatchEvent(ev("PRODUCTION", { field: "stock_amount" }), ROOMS)).toBe(
      "Stocks recovered at Civic Exchange",
    );
    expect(SPECIFIC).toHaveLength(2);
  });

  it("leaves three on the generic line, end to end", () => {
    for (const operation of GENERIC) {
      expect(feedLines(operation)).toEqual(["Public activity at Civic Exchange"]);
    }
    expect(GENERIC).toHaveLength(3);
  });

  it("drops PRESENCE_PRESSURE incidentally, because its target is an agent", () => {
    for (const operation of DROPPED_INCIDENTALLY) {
      // Not on the silent list: the projection is willing to narrate it.
      expect(projectionIdForEvent("ENTITY_UPDATE", { operation })).not.toBeNull();
      // §5 drops it anyway — an agent id resolves to no public room.
      expect(feedLines(operation)).toEqual([]);
      // And it would narrate if the target ever were a room entity.
      expect(phraseWatchEvent(ev(operation), ROOMS)).toBe("Public activity at Civic Exchange");
    }
  });

  it("an unnamed operation also falls to the generic line", () => {
    const bare = { event_type: "ENTITY_UPDATE", sequence: 1, cycle: 1, handle: "agent.tester",
      payload: { entity_id: "entity.relay-1" } } as WatchSourceEvent;
    expect(phraseWatchEvent(bare, ROOMS)).toBe("Public activity at Civic Exchange");
  });

  it("the sets are disjoint and cover sixteen named operations", () => {
    const all = [...SILENT, ...SPECIFIC, ...GENERIC, ...DROPPED_INCIDENTALLY];
    expect(new Set(all).size).toBe(all.length);
    expect(all).toHaveLength(16);
  });
});
