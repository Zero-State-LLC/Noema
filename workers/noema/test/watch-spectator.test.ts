/** §4.A.1 consequence + §4.G Follow + actor_label — WATCH spectator experience. */

import { describe, expect, it } from "vitest";
import {
  buildWatchLive,
  conditionBand,
  consequenceForEvent,
  phraseWatchEvent,
  type WatchSourceEvent,
} from "../src/watch-live";
import { watchHtml } from "../src/watch";

const NOW = 1_700_000_000_000;

function rooms() {
  return {
    "room.anchor": {
      room_id: "room.anchor",
      name: "Grid Anchor",
      description: "Trunk relays hum here.",
      exits: [{ direction: "east", to_room_id: "room.town" }],
      entities: [
        { entity_id: "entity.relay-trunk", label: "Relay Trunk", entity_type: "INFRASTRUCTURE" },
        { entity_id: "entity.ghost", label: "Ghost Coil", entity_type: "INFRASTRUCTURE", hidden: true },
      ],
    },
    "room.town": {
      room_id: "room.town",
      name: "Contract Town",
      description: "Open trade floor.",
      exits: [{ direction: "west", to_room_id: "room.anchor" }],
      entities: [],
    },
    "room.vault": {
      room_id: "room.vault",
      name: "Sealed Vault",
      description: "Not public.",
      hidden: true,
      exits: [],
      entities: [{ entity_id: "entity.core", label: "Core", entity_type: "INFRASTRUCTURE" }],
    },
  };
}

function player(id: string, handle: string, room_id: string) {
  return { player_id: id, handle, room_id, entered: true, last_seen_ms: NOW, actor_kind: "live" as const };
}

function ev(partial: Partial<WatchSourceEvent> & Pick<WatchSourceEvent, "event_type" | "sequence">): WatchSourceEvent {
  return { cycle: 184, handle: "Nacre", player_id: "player.aaaaaaaaaaaa", actor_kind: "live", at: NOW, payload: {}, ...partial };
}

function snap(events: WatchSourceEvent[]) {
  return buildWatchLive({
    world_id: "world.test",
    cycle: 184,
    sequence: events.length ? Math.max(...events.map((e) => e.sequence)) : 10,
    rooms: rooms() as never,
    players: [player("player.aaaaaaaaaaaa", "Nacre", "room.anchor"), player("player.bbbbbbbbbbbb", "smoke-probe", "room.town")] as never,
    events,
  });
}

const repairPayload = {
  entity_id: "entity.relay-trunk",
  field: "condition",
  from: 35,
  to: 80,
  operation: "REPAIR",
  actor_id: "player.aaaaaaaaaaaa",
  last_repair_cycle: 184,
  last_repair_handle: "Nacre",
};

describe("§4.A.1 public consequence line", () => {
  it("maps public bands, never integers", () => {
    expect(conditionBand(80)).toBe("ok");
    expect(conditionBand(75)).toBe("ok");
    expect(conditionBand(50)).toBe("degraded");
    expect(conditionBand(25)).toBe("degraded");
    expect(conditionBand(10)).toBe("failed");
  });

  it("derives a band transition from a public repair and omits same-band repairs", () => {
    const crossed = consequenceForEvent(ev({ event_type: "ENTITY_UPDATE", sequence: 20, payload: repairPayload }), rooms() as never);
    expect(crossed).toBe("Relay Trunk: degraded → ok");
    const sameBand = consequenceForEvent(
      ev({ event_type: "ENTITY_UPDATE", sequence: 21, payload: { ...repairPayload, from: 35, to: 50 } }),
      rooms() as never,
    );
    expect(sameBand).toBeUndefined();
  });

  it("derives disruption consequences and refuses hidden entities", () => {
    const failed = consequenceForEvent(
      ev({ event_type: "INFRASTRUCTURE_DISRUPTED", sequence: 22, payload: { entity_id: "entity.relay-trunk", condition_before: 60, condition_after: 10, room_id: "room.anchor" } }),
      rooms() as never,
    );
    expect(failed).toBe("Relay Trunk: degraded → failed");
    const hidden = consequenceForEvent(
      ev({ event_type: "INFRASTRUCTURE_DISRUPTED", sequence: 23, payload: { entity_id: "entity.core", condition_before: 60, condition_after: 10 } }),
      rooms() as never,
    );
    expect(hidden).toBeUndefined();
    const ghost = consequenceForEvent(
      ev({ event_type: "ENTITY_UPDATE", sequence: 24, payload: { ...repairPayload, entity_id: "entity.ghost" } }),
      rooms() as never,
    );
    expect(ghost).toBeUndefined();
  });

  it("never lets condition integers reach the wire", () => {
    const s = snap([
      ev({ event_type: "ENTITY_UPDATE", sequence: 30, payload: repairPayload }),
      ev({ event_type: "INFRASTRUCTURE_DISRUPTED", sequence: 31, payload: { entity_id: "entity.relay-trunk", condition_before: 60, condition_after: 10, room_id: "room.anchor" } }),
    ]);
    const wire = JSON.stringify(s);
    expect(wire).not.toMatch(/\d+\s*→/);
    expect(wire).not.toMatch(/→\s*\d+/);
    expect(wire).not.toContain('"from"');
    expect(wire).not.toContain('"condition_before"');
    const events = (s.recent_events as Array<{ consequence?: string }>) || [];
    expect(events.some((e) => e.consequence === "Relay Trunk: degraded → ok")).toBe(true);
  });
});

describe("§5 repair/disruption location and phrasing", () => {
  it("locates a public repair via its entity's public room and names the repairer", () => {
    const s = snap([ev({ event_type: "ENTITY_UPDATE", sequence: 40, handle: "", payload: repairPayload })]);
    const events = s.recent_events as Array<{ line: string; room_id?: string; projection_id: string }>;
    const repair = events.find((e) => e.projection_id === "production");
    expect(repair?.line).toBe("Nacre repaired Relay Trunk");
    expect(repair?.room_id).toBe("room.anchor");
    expect(repair?.line).not.toContain("Public activity");
  });

  it("omits, not anonymizes, a repair whose entity has no public home", () => {
    const s = snap([ev({ event_type: "ENTITY_UPDATE", sequence: 41, handle: "", payload: { ...repairPayload, entity_id: "entity.core" } })]);
    const events = s.recent_events as Array<{ projection_id: string }>;
    expect(events.some((e) => e.projection_id === "production")).toBe(false);
    expect(JSON.stringify(s)).not.toContain("Public activity");
  });

  it("tiers disruption by after-band: failed is MAJOR, degraded stays NOTABLE infrastructure", () => {
    const s = snap([
      ev({ event_type: "INFRASTRUCTURE_DISRUPTED", sequence: 42, payload: { entity_id: "entity.relay-trunk", condition_before: 90, condition_after: 10, room_id: "room.anchor" } }),
    ]);
    const events = s.recent_events as Array<{ projection_id: string; tier: string; line: string }>;
    const hit = events.find((e) => e.projection_id === "infrastructure_disrupted");
    expect(hit?.tier).toBe("MAJOR");
    expect(hit?.line).toBe("Relay Trunk was disrupted at Grid Anchor");
    const soft = snap([
      ev({ event_type: "INFRASTRUCTURE_DISRUPTED", sequence: 43, payload: { entity_id: "entity.relay-trunk", condition_before: 90, condition_after: 40, room_id: "room.anchor" } }),
    ]);
    const softEvents = soft.recent_events as Array<{ projection_id: string; tier: string }>;
    expect(softEvents.find((e) => e.projection_id === "infrastructure")?.tier).toBe("NOTABLE");
  });
});

describe("§6 actor_label", () => {
  it("carries the public handle and omits the field for non-public actors", () => {
    const s = snap([
      ev({ event_type: "MOVE", sequence: 50, payload: { to: "room.town" } }),
      ev({ event_type: "MOVE", sequence: 51, handle: "smoke-probe", player_id: "player.bbbbbbbbbbbb", payload: { to: "room.anchor" } }),
    ]);
    const events = s.recent_events as Array<{ sequence: number; actor_label?: string; line: string }>;
    const pub = events.find((e) => e.sequence === 50);
    const smoke = events.find((e) => e.sequence === 51);
    expect(pub?.actor_label).toBe("Nacre");
    expect(smoke?.actor_label).toBeUndefined();
    expect(smoke?.line).toContain("A player");
    expect(JSON.stringify(s)).not.toContain('"actor_label":"A player"');
  });
});

describe("§4.G follow chrome (client wiring)", () => {
  const html = watchHtml();

  it("is client-local: localStorage key, no follow state on the wire", () => {
    expect(html).toContain('"noema.watch.follow"');
    expect(html).toContain('fetch("/v1/watch/live")');
    expect(html).not.toMatch(/fetch\([^)]*follow/);
  });

  it("ships FOLLOW / FOLLOWING / CLEAR controls and the summary panel", () => {
    expect(html).toContain('id="watch-follow-actor"');
    expect(html).toContain('id="watch-follow-site"');
    expect(html).toContain('id="watch-follow-clear"');
    expect(html).toContain('id="watch-following"');
    expect(html).toContain('id="watch-summary"');
    expect(html).toContain('id="watch-conseq"');
    expect(html).toContain("watch-handle-btn");
    expect(html).toContain("followedRoomId");
    expect(html).toContain("is not in a public site.");
  });

  it("follow is emphasis-only: feed rows always render, follow adds a class", () => {
    expect(html).toContain("follow-hit");
    // the feed loop never filters on follow state
    expect(html).not.toMatch(/events\s*=\s*events\.filter\([^)]*follow/i);
    expect(html).not.toContain(".innerHTML");
  });

  it("keeps summaries inside the public snapshot window", () => {
    expect(html).toContain("knownForLine");
    expect(html).toContain(".slice(0, 3)");
    expect(html).not.toMatch(/controller|provider|model[_ ]?name/i);
  });
});

/**
 * §4 entity-scoped site resolution (Specs #259).
 * Regression: the live feed on world.perihelion-reach-3 rendered every
 * maintenance event as unlocated "Public activity" — the exact filler §4 bans —
 * because site resolved only from payload room ids and only the REPAIR branch
 * looked the entity up. Fourteen operations ride ENTITY_UPDATE; one worked.
 */
describe("§4 entity-scoped events resolve their public site", () => {
  type Ev = { sequence: number; line: string };
  const evs = (o: Record<string, unknown>) => (o.recent_events as Ev[]) || [];
  const production = (entity_id: string) => ({
    entity_id,
    operation: "PRODUCTION",
    field: "stock",
  });

  it("locates a production event from entity_id alone, with no room_id in the payload", () => {
    const line = phraseWatchEvent(
      ev({ event_type: "ENTITY_UPDATE", sequence: 61, payload: production("entity.relay-trunk") }),
      rooms() as never,
    );
    expect(line).toBe("Stocks recovered at Grid Anchor");
  });

  it("never states how much recovered — quantities are counters (§7)", () => {
    const line = phraseWatchEvent(
      ev({
        event_type: "ENTITY_UPDATE",
        sequence: 62,
        payload: { ...production("entity.relay-trunk"), from: 12, to: 40, amount: 28 },
      }),
      rooms() as never,
    );
    expect(line).toBe("Stocks recovered at Grid Anchor");
    for (const n of ["12", "40", "28"]) expect(line).not.toContain(n);
  });

  it("omits a production event in a hidden room rather than anonymizing it", () => {
    const out = snap([ev({ event_type: "ENTITY_UPDATE", sequence: 63, payload: production("entity.core") })]);
    expect(evs(out).find((e) => e.sequence === 63)).toBeUndefined();
  });

  it("omits an entity event whose entity is in no public room", () => {
    const out = snap([ev({ event_type: "ENTITY_UPDATE", sequence: 64, payload: production("entity.nowhere") })]);
    expect(evs(out).find((e) => e.sequence === 64)).toBeUndefined();
  });

  it("keeps REPURPOSE off WATCH entirely (RFC-0057 grants it a PLAY line only)", () => {
    const out = snap([
      ev({
        event_type: "ENTITY_UPDATE",
        sequence: 65,
        payload: { entity_id: "entity.relay-trunk", operation: "REPURPOSE" },
      }),
    ]);
    expect(evs(out).find((e) => e.sequence === 65)).toBeUndefined();
  });

  it("no public line is the bare unlocated filler the spec bans", () => {
    const out = snap([
      ev({ event_type: "ENTITY_UPDATE", sequence: 66, payload: production("entity.relay-trunk") }),
      ev({ event_type: "ENTITY_UPDATE", sequence: 67, payload: { ...repairPayload } }),
    ]);
    expect(evs(out).length).toBeGreaterThan(0);
    for (const e of evs(out)) expect(e.line).not.toBe("Public activity");
  });

  it("still locates a hidden entity's event nowhere, so §7 redaction is unchanged", () => {
    const out = snap([ev({ event_type: "ENTITY_UPDATE", sequence: 68, payload: production("entity.ghost") })]);
    const got = evs(out).find((e) => e.sequence === 68);
    // entity.ghost is hidden inside a public room: it must not be narrated.
    if (got) expect(got.line).not.toContain("Ghost");
  });
});
