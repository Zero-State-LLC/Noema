import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { haveSpecsArtifacts } from "./specs-checkout";
import { buildWatchLive, projectionIdForEvent } from "../src/watch-live";
import type { WatchSourceEvent } from "../src/watch-live";

type Op = "RESTORE" | "VEST" | "PROMOTE";
type FeedItem = {
  projection_id?: string;
  line?: string;
  consequence?: string;
  detail?: string;
  actor_label?: string;
  [key: string]: unknown;
};

const NOW = 1_700_000_000_000;
const PLAYER_ID = "player.aaaaaaaaaaaa";
const PUBLIC_SITE = "Civic Exchange";
const HIDDEN_ROOM = "room.vault";
const HIDDEN_NAME = "Sealed Vault";
const OPENED: Op[] = ["RESTORE", "VEST", "PROMOTE"];

const ENTITY_BY_OP: Record<Op, string> = {
  RESTORE: "entity.restore-1",
  VEST: "entity.vest-1",
  PROMOTE: "entity.promote-1",
};

const HIDDEN_ENTITY_BY_OP: Record<Op, string> = {
  RESTORE: "entity.restore-hidden",
  VEST: "entity.vest-hidden",
  PROMOTE: "entity.promote-hidden",
};

const EXPECTED_PROJECTION: Record<Op, string> = {
  RESTORE: "production",
  VEST: "organization",
  PROMOTE: "production",
};

const ROOMS = {
  "room.civic-exchange": {
    room_id: "room.civic-exchange",
    name: PUBLIC_SITE,
    description: "The hub.",
    exits: [],
    entities: [
      { entity_id: ENTITY_BY_OP.RESTORE, label: "ruin", entity_type: "RUIN" },
      { entity_id: ENTITY_BY_OP.VEST, label: "workshop", entity_type: "INFRASTRUCTURE" },
      { entity_id: ENTITY_BY_OP.PROMOTE, label: "workshop", entity_type: "INFRASTRUCTURE" },
    ],
  },
  [HIDDEN_ROOM]: {
    room_id: HIDDEN_ROOM,
    name: HIDDEN_NAME,
    description: "Not for spectators.",
    hidden: true,
    tags: ["hidden"],
    exits: [],
    entities: [
      { entity_id: HIDDEN_ENTITY_BY_OP.RESTORE, label: "hidden ruin", entity_type: "RUIN" },
      { entity_id: HIDDEN_ENTITY_BY_OP.VEST, label: "hidden workshop", entity_type: "INFRASTRUCTURE" },
      { entity_id: HIDDEN_ENTITY_BY_OP.PROMOTE, label: "hidden workshop", entity_type: "INFRASTRUCTURE" },
    ],
  },
};

const PLAYER = {
  player_id: PLAYER_ID,
  handle: "agent.tester",
  room_id: "room.civic-exchange",
  entered: true,
  last_seen_ms: NOW,
  actor_kind: "live" as const,
};

const SEQUENCE: Record<Op, number> = { RESTORE: 31, VEST: 32, PROMOTE: 33 };

const EVIDENCE_PAYLOAD: Record<Op, Record<string, unknown>> = {
  RESTORE: {
    entity_id: ENTITY_BY_OP.RESTORE,
    set: { unclaimed: false, condition: 37, last_steward_cycle: 4 },
    unset: ["unclaimed"],
    operation: "RESTORE",
  },
  VEST: {
    entity_id: ENTITY_BY_OP.VEST,
    set: { owner_id: "org.nacre-compact", last_steward_cycle: 4, infra_type: "workshop" },
    unset: [],
    operation: "VEST",
  },
  PROMOTE: {
    entity_id: ENTITY_BY_OP.PROMOTE,
    set: { in_progress: false, last_steward_cycle: 4, infra_type: "workshop" },
    unset: ["in_progress"],
    operation: "PROMOTE",
  },
};

function feedEvent(
  payload: Record<string, unknown>,
  extra: Partial<WatchSourceEvent> = {},
): WatchSourceEvent {
  return {
    event_type: "ENTITY_UPDATE",
    sequence: 31,
    cycle: 4,
    handle: "agent.tester",
    player_id: PLAYER_ID,
    actor_kind: "live",
    at: NOW,
    payload,
    ...extra,
  } as WatchSourceEvent;
}

function sourceEvent(
  operation: Op,
  entityId: string,
  payloadExtra: Record<string, unknown> = {},
): WatchSourceEvent {
  const base = EVIDENCE_PAYLOAD[operation];
  const set = { ...(base.set as Record<string, unknown>) };
  return feedEvent(
    { ...base, entity_id: entityId, set, ...payloadExtra },
    { sequence: SEQUENCE[operation] },
  );
}

function build(events: WatchSourceEvent[]): Record<string, unknown> {
  return buildWatchLive({
    world_id: "w",
    cycle: 4,
    sequence: 40,
    rooms: ROOMS as never,
    players: [PLAYER] as never,
    events,
    now: NOW,
  }) as Record<string, unknown>;
}

function feed(events: WatchSourceEvent[]): FeedItem[] {
  return ((build(events).recent_events as FeedItem[]) || []);
}

const RFC_0132_CONTRACT = join(
  new URL(".", import.meta.url).pathname,
  "../../../../Noema-Specs/specs/watch-entity-update-exposure-decisions.rfc-0132.json",
);

describe("RFC-0132 WATCH exposure decisions", () => {
  it("opens the three completed acts with one public line each", () => {
    const expected: Record<Op, { projection_id: string; line: string }> = {
      RESTORE: { projection_id: "production", line: `A ruin was restored at ${PUBLIC_SITE}` },
      VEST: { projection_id: "organization", line: `An asset at ${PUBLIC_SITE} passed into institutional hands` },
      PROMOTE: { projection_id: "production", line: `Construction finished at ${PUBLIC_SITE}` },
    };
    for (const op of OPENED) {
      const items = feed([sourceEvent(op, ENTITY_BY_OP[op])]);
      expect(items).toHaveLength(1);
      expect(items[0].projection_id).toBe(expected[op].projection_id);
      expect(items[0].line).toBe(expected[op].line);
    }
  });

  it("drops the same acts in a hidden room or with no public home", () => {
    for (const op of OPENED) {
      expect(feed([sourceEvent(op, HIDDEN_ENTITY_BY_OP[op])])).toEqual([]);
      expect(feed([sourceEvent(op, "entity.nowhere")])).toEqual([]);
    }
  });

  it("never names the receiving organization on VEST", () => {
    const snapshot = build([sourceEvent("VEST", ENTITY_BY_OP.VEST)]);
    const serialized = JSON.stringify(snapshot);
    expect(serialized).not.toContain("org.nacre-compact");
    expect(serialized).not.toContain("Nacre Compact");
    expect(serialized).not.toContain("owner_id");
    const item = (snapshot.recent_events as FeedItem[])[0];
    const fields = [item.line, item.consequence, item.detail]
      .map((v) => String(v ?? ""))
      .join(" ");
    expect(fields).not.toContain("org.");
    expect(fields).not.toContain("entity.");
    expect(fields).not.toContain("player.");
  });

  it("keeps entity internals off every one of the three items", () => {
    const snapshot = build(OPENED.map((op) => sourceEvent(op, ENTITY_BY_OP[op])));
    const serialized = JSON.stringify(snapshot);
    expect(serialized).not.toContain("entity.");
    expect(serialized).not.toContain("player.");
    expect(serialized).not.toContain("owner_id");
    expect(serialized).not.toContain("last_steward_cycle");
    expect(serialized).not.toContain("infra_type");
    expect(serialized).not.toContain("condition");
    const items = snapshot.recent_events as FeedItem[];
    expect(items).toHaveLength(3);
    for (const item of items) {
      const fields = JSON.stringify(item);
      expect(fields).not.toContain("workshop");
      expect(fields).not.toContain("37");
    }
  });

  it("omits actor_label on PROMOTE and follows public-handle rules on RESTORE", () => {
    const promote = feed([sourceEvent("PROMOTE", ENTITY_BY_OP.PROMOTE)])[0];
    expect(promote.actor_label).toBeUndefined();

    const restore = feed([sourceEvent("RESTORE", ENTITY_BY_OP.RESTORE)])[0];
    expect(restore.actor_label).toBe("agent.tester");

    const playerShaped = feed([{
      ...sourceEvent("RESTORE", ENTITY_BY_OP.RESTORE),
      handle: "player.bert",
    }])[0];
    expect(playerShaped.actor_label).toBeUndefined();

    const hex = feed([{
      ...sourceEvent("RESTORE", ENTITY_BY_OP.RESTORE),
      handle: "0123456789ab",
    }])[0];
    expect(hex.actor_label).toBeUndefined();
  });

  it("stays closed without the completed state change", () => {
    for (const op of OPENED) {
      expect(projectionIdForEvent("ENTITY_UPDATE", { operation: op })).toBeNull();
      expect(feed([feedEvent({ operation: op, entity_id: ENTITY_BY_OP[op] })])).toEqual([]);
    }
    expect(projectionIdForEvent("ENTITY_UPDATE", {
      operation: "PROMOTE",
      in_progress: true,
      set: { in_progress: false },
    })).toBeNull();
    expect(projectionIdForEvent("ENTITY_UPDATE", {
      operation: "PROMOTE",
      set: { in_progress: true },
    })).toBeNull();
    expect(feed([feedEvent({
      operation: "PROMOTE",
      entity_id: ENTITY_BY_OP.PROMOTE,
      in_progress: true,
      set: { in_progress: false },
    })])).toEqual([]);
    expect(feed([feedEvent({
      operation: "PROMOTE",
      entity_id: ENTITY_BY_OP.PROMOTE,
      set: { in_progress: true },
    })])).toEqual([]);
    expect(projectionIdForEvent("ENTITY_UPDATE", {
      operation: "RESTORE",
      set: { unclaimed: true },
    })).toBeNull();
    expect(projectionIdForEvent("ENTITY_UPDATE", {
      operation: "VEST",
      set: { owner_id: "" },
    })).toBeNull();
  });

  it("leaves share, connect, consent, consensus, rule and unknown operations closed", () => {
    for (const operation of ["SHARE", "CONNECT", "CONSENT", "CONSENSUS", "RULE", "FUTURE_OPERATION"]) {
      const payload = {
        operation,
        entity_id: ENTITY_BY_OP.VEST,
        set: { owner_id: "org.nacre-compact", in_progress: false, unclaimed: false },
      };
      expect(projectionIdForEvent("ENTITY_UPDATE", payload)).toBeNull();
      expect(feed([feedEvent(payload)])).toEqual([]);
    }
  });

  it.skipIf(!haveSpecsArtifacts(RFC_0132_CONTRACT))("matches the RFC-0132 machine contract", () => {
    const contract = JSON.parse(readFileSync(RFC_0132_CONTRACT, "utf8")) as {
      opened_operations?: Record<string, unknown>;
      closed_operations?: unknown;
      default_watch_projection?: unknown;
      unknown_operation_watch_projection?: unknown;
    };
    const opened = contract.opened_operations || {};
    expect(Object.keys(opened).sort()).toEqual(["PROMOTE", "RESTORE", "VEST"]);
    for (const op of OPENED) {
      const entry = opened[op];
      const projection = typeof entry === "string"
        ? entry
        : entry && typeof entry === "object"
          ? String((entry as { projection_id?: unknown }).projection_id)
          : undefined;
      expect(projection).toBe(EXPECTED_PROJECTION[op]);
      expect(projectionIdForEvent("ENTITY_UPDATE", EVIDENCE_PAYLOAD[op])).toBe(EXPECTED_PROJECTION[op]);
    }
    const closed = contract.closed_operations;
    if (Array.isArray(closed)) {
      for (const operation of closed.map((v) => String(v))) {
        expect(projectionIdForEvent("ENTITY_UPDATE", { operation })).toBeNull();
      }
    } else if (closed && typeof closed === "object") {
      for (const [operation, value] of Object.entries(closed as Record<string, unknown>)) {
        expect(value).toBeNull();
        expect(projectionIdForEvent("ENTITY_UPDATE", { operation })).toBeNull();
      }
    } else {
      expect(closed).toBeDefined();
    }
    expect(contract.default_watch_projection).toBeNull();
    expect(contract.unknown_operation_watch_projection).toBeNull();
    expect(projectionIdForEvent("ENTITY_UPDATE", {})).toBeNull();
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "FUTURE_OPERATION" })).toBeNull();
  });
});
