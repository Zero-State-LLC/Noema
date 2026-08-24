import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
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

const RFC_0126_SILENT = ["HARVEST", "ATTEST", "INFORMATION_CONTEST", "PRESENCE_PRESSURE"] as const;

/**
 * RFC-0126 ships a machine contract. Until now nothing read it, so the list
 * above was a copy — and a copy of a contract drifts from it silently, which is
 * the failure this whole audit trail exists to catch. Checked when the Specs
 * repo is checked out beside this one, skipped when it is not, same as the
 * GC4-S8 fixtures.
 */
const RFC_0126_CONTRACT = join(
  new URL(".", import.meta.url).pathname,
  "../../../../Noema-Specs/specs/watch-entity-update-exposure.rfc-0126.json",
);

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

function linesFor(events: WatchSourceEvent[]): string[] {
  const snap = buildWatchLive({
    world_id: "w",
    cycle: 4,
    sequence: 40,
    rooms: ROOMS as never,
    players: [{
      player_id: PLAYER, handle: "agent.tester", room_id: "room.civic-exchange",
      entered: true, last_seen_ms: NOW, actor_kind: "live",
    }] as never,
    events: events as never,
    now: NOW,
  }) as Record<string, unknown>;
  return ((snap.recent_events as { line: string }[]) || []).map((e) => e.line);
}

function feedLines(operation?: string): string[] {
  return linesFor([{
    event_type: "ENTITY_UPDATE", sequence: 39, cycle: 4, handle: "agent.tester",
    player_id: PLAYER, actor_kind: "live", at: NOW,
    payload: operation
      ? { operation, ...(PAYLOADS[operation] || {}) }
      : { entity_id: "entity.relay-1" },
  } as WatchSourceEvent]);
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
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "REPAIR" })).toBe("production");
    expect(phraseWatchEvent(ev("REPAIR", { field: "condition" }), ROOMS)).toBe(
      "agent.tester repaired relay",
    );
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "PRODUCTION" })).toBe("production");
    expect(phraseWatchEvent(ev("PRODUCTION", { field: "stock_amount" }), ROOMS)).toBe(
      "Stocks recovered at Civic Exchange",
    );
    expect(SPECIFIC).toHaveLength(2);
  });

  it("preserves the explicit infrastructure payload projections", () => {
    expect(projectionIdForEvent("ENTITY_UPDATE", { band: "failed" })).toBe("infrastructure_disrupted");
    expect(projectionIdForEvent("ENTITY_UPDATE", { status: "failed" })).toBe("infrastructure_disrupted");
    expect(projectionIdForEvent("ENTITY_UPDATE", { kind: "infra" })).toBe("infrastructure");
    expect(projectionIdForEvent("ENTITY_UPDATE", { entity_type: "INFRASTRUCTURE" })).toBe("infrastructure");
  });

  it("keeps RFC-0126's four exposure decisions off the feed explicitly", () => {
    for (const operation of RFC_0126_SILENT) {
      expect(projectionIdForEvent("ENTITY_UPDATE", { operation })).toBeNull();
      expect(feedLines(operation)).toEqual([]);
    }
    expect(RFC_0126_SILENT).toHaveLength(4);
  });

  it.skipIf(!existsSync(RFC_0126_CONTRACT))("matches the RFC-0126 machine contract, not a copy of it", () => {
    const contract = JSON.parse(readFileSync(RFC_0126_CONTRACT, "utf8")) as {
      silent_operations: string[];
      explicit_operation_projections: Record<string, string>;
      default_watch_projection: string | null;
      unknown_operation_watch_projection: string | null;
    };
    expect([...RFC_0126_SILENT].sort()).toEqual([...contract.silent_operations].sort());
    expect([...SPECIFIC].sort()).toEqual(Object.keys(contract.explicit_operation_projections).sort());
    for (const [operation, projectionId] of Object.entries(contract.explicit_operation_projections)) {
      expect(projectionIdForEvent("ENTITY_UPDATE", { operation })).toBe(projectionId);
    }
    // Fail-closed: the contract pins both defaults to null, and so must the runtime.
    expect(contract.default_watch_projection).toBeNull();
    expect(contract.unknown_operation_watch_projection).toBeNull();
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "NOT_A_REAL_OPERATION" })).toBeNull();
    expect(projectionIdForEvent("ENTITY_UPDATE", {})).toBeNull();
  });

  it("renders one canonical line for one HARVEST act", () => {
    expect(linesFor([
      {
        event_type: "RESOURCE_TRANSFER", sequence: 38, cycle: 4, handle: "agent.tester",
        player_id: PLAYER, actor_kind: "live", at: NOW,
        payload: { kind: "harvest", from_id: "entity.relay-1", to_id: PLAYER, amount: 1 },
      } as WatchSourceEvent,
      {
        event_type: "ENTITY_UPDATE", sequence: 39, cycle: 4, handle: "agent.tester",
        player_id: PLAYER, actor_kind: "live", at: NOW,
        payload: { operation: "HARVEST", ...PAYLOADS.HARVEST },
      } as WatchSourceEvent,
    ])).toEqual(["Harvest at Civic Exchange"]);
  });

  it("fails closed for unnamed and future operations", () => {
    expect(projectionIdForEvent("ENTITY_UPDATE", { entity_id: "entity.relay-1" })).toBeNull();
    expect(feedLines()).toEqual([]);
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "FUTURE_OPERATION" })).toBeNull();
    expect(feedLines("FUTURE_OPERATION")).toEqual([]);
  });

  it("the sets are disjoint and cover sixteen named operations", () => {
    const all = [...SILENT, ...SPECIFIC, ...RFC_0126_SILENT];
    expect(new Set(all).size).toBe(all.length);
    expect(all).toHaveLength(16);
  });
});
