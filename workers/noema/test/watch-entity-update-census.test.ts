import { describe, expect, it } from "vitest";
import { phraseWatchEvent, projectionIdForEvent } from "../src/watch-live";
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

const GENERIC = ["HARVEST", "ATTEST", "INFORMATION_CONTEST", "PRESENCE_PRESSURE"] as const;

const ROOMS = {
  "room.civic-exchange": { room_id: "room.civic-exchange", name: "Civic Exchange", entities: [
    { entity_id: "entity.relay-1", label: "relay" },
  ] },
};

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

  it("leaves four on the generic line", () => {
    for (const operation of GENERIC) {
      expect(projectionIdForEvent("ENTITY_UPDATE", { operation })).not.toBeNull();
      expect(phraseWatchEvent(ev(operation), ROOMS)).toBe("Public activity at Civic Exchange");
    }
    expect(GENERIC).toHaveLength(4);
  });

  it("an unnamed operation also falls to the generic line", () => {
    const bare = { event_type: "ENTITY_UPDATE", sequence: 1, cycle: 1, handle: "agent.tester",
      payload: { entity_id: "entity.relay-1" } } as WatchSourceEvent;
    expect(phraseWatchEvent(bare, ROOMS)).toBe("Public activity at Civic Exchange");
  });

  it("the three sets are disjoint and cover sixteen named operations", () => {
    const all = [...SILENT, ...SPECIFIC, ...GENERIC];
    expect(new Set(all).size).toBe(all.length);
    expect(all).toHaveLength(16);
  });
});
