import { describe, expect, it } from "vitest";
import { adminHtml } from "../src/admin";
import { isPublicActivityPlayer, listLivePlayers, listSystemActors } from "../src/ops";
import {
  buildWatchLive,
  containsInternalId,
  projectWatchLive,
  type WatchEvent,
  type WatchPlayerIn,
  type WatchRoomActivity,
  type WatchRoomIn,
  type WatchSourceEvent,
} from "../src/watch-live";

const NOW = 1_700_000_000_000;
const BRAND_BAN = /Orbitron|scanline|glitch|reticle|neon-grid|dashboard|particle/i;

function fixtureRooms(): Record<string, WatchRoomIn> {
  return {
    "room.civic-exchange": {
      room_id: "room.civic-exchange",
      name: "Civic Exchange",
      description: "The public exchange floor.",
      exits: [{ direction: "north", to_room_id: "room.archive" }],
      entities: [
        { entity_id: "entity.salvage-cache", label: "salvage-cache", entity_type: "NODE" },
        { entity_id: "entity.workshop-1", label: "workshop", entity_type: "INFRASTRUCTURE" },
        { entity_id: "entity.hidden-coil", label: "hidden-coil", entity_type: "INFRASTRUCTURE", hidden: true },
      ],
    },
    "room.archive": {
      room_id: "room.archive",
      name: "Archive",
      description: "Subterranean codex vault.",
      exits: [{ direction: "south", to_room_id: "room.civic-exchange" }],
      entities: [
        { entity_id: "entity.codex-stack", label: "codex-stack", entity_type: "INFRASTRUCTURE" },
        { entity_id: "entity.relay-7", label: "relay-7", entity_type: "INFRASTRUCTURE", in_progress: true },
      ],
    },
    "room.sealed-vault": {
      room_id: "room.sealed-vault",
      name: "Sealed Vault",
      description: "Hidden from spectators.",
      hidden: true,
      tags: ["hidden"],
      exits: [],
      entities: [
        { entity_id: "entity.vault-core", label: "vault-core", entity_type: "INFRASTRUCTURE" },
      ],
    },
  };
}

function fixturePlayers(): WatchPlayerIn[] {
  return [
    {
      player_id: "player.aphelia",
      handle: "Aphelia-Founder",
      room_id: "room.civic-exchange",
      entered: true,
      last_seen_ms: NOW,
      actor_kind: "live",
      controller_type: "agent",
      public_activity: true,
    },
    {
      player_id: "player.rivet",
      handle: "Rivet-Custodian",
      room_id: "room.civic-exchange",
      entered: true,
      last_seen_ms: NOW,
      actor_kind: "live",
      controller_type: "agent",
      public_activity: true,
    },
    {
      player_id: "player.reach-maint3",
      handle: "reach-maint3",
      room_id: "room.archive",
      entered: true,
      last_seen_ms: NOW,
      actor_kind: "system",
    },
    {
      player_id: "player.external1",
      handle: "Vesper-7",
      room_id: "room.civic-exchange",
      entered: true,
      last_seen_ms: NOW,
      actor_kind: "live",
      controller_type: "agent",
    },
    {
      player_id: "player.external2",
      handle: "Nacre-9",
      room_id: "room.civic-exchange",
      entered: true,
      last_seen_ms: NOW,
      actor_kind: "live",
      controller_type: "agent",
      public_activity: false,
    },
    {
      player_id: "player.hidden-resident",
      handle: "Hidden-Scout",
      room_id: "room.sealed-vault",
      entered: true,
      last_seen_ms: NOW,
      actor_kind: "live",
      controller_type: "agent",
      public_activity: true,
    },
  ];
}

type ProjectedRoom = {
  room_id: string;
  name: string;
  room_activity?: WatchRoomActivity[];
};

type ProjectedAgent = {
  label: string;
  room_id: string;
  last_action: string | null;
  public_activity?: boolean;
  last_verb?: string;
  last_target_label?: string;
};

function project(events: WatchSourceEvent[], players = fixturePlayers()) {
  const snap = projectWatchLive({
    world_id: "world.perihelion-reach",
    cycle: 12,
    sequence: 100,
    rooms: fixtureRooms(),
    players,
    events,
    now: NOW,
  });
  return {
    snap,
    rooms: snap.rooms as ProjectedRoom[],
    agents: snap.agents as ProjectedAgent[],
    recent: snap.recent_events as WatchEvent[],
    room: (id: string) => (snap.rooms as ProjectedRoom[]).find((r) => r.room_id === id),
    agent: (label: string) => (snap.agents as ProjectedAgent[]).find((a) => a.label === label),
  };
}

describe("RFC-0134: isPublicActivityPlayer flag & actor roster", () => {
  it("respects explicit boolean overrides and falls back to actor_kind === system", () => {
    expect(isPublicActivityPlayer("player.reach-maint3", { actor_kind: "system" })).toBe(true);
    expect(isPublicActivityPlayer("player.reach-maint3", { actor_kind: "system", public_activity: false })).toBe(false);
    expect(isPublicActivityPlayer("player.ext1", { actor_kind: "live", controller_type: "agent" })).toBe(false);
    expect(
      isPublicActivityPlayer("player.orin1", {
        actor_kind: "live",
        controller_type: "agent",
        public_activity: true,
      }),
    ).toBe(true);
  });

  it("exposes public_activity on operator actor lists", () => {
    const players = {
      "player.orin1": {
        handle: "Aphelia-Founder",
        entered: true,
        last_seen_ms: NOW,
        actor_kind: "live" as const,
        controller_type: "agent",
        public_activity: true,
      },
      "player.ext1": {
        handle: "Vesper-7",
        entered: true,
        last_seen_ms: NOW,
        actor_kind: "live" as const,
        controller_type: "agent",
      },
      "player.reach-maint3": {
        handle: "reach-maint3",
        entered: true,
        last_seen_ms: NOW,
        actor_kind: "system" as const,
      },
    };
    const live = listLivePlayers(players, NOW);
    const sys = listSystemActors(players);
    expect(live.find((r) => r.player_id === "player.orin1")?.public_activity).toBe(true);
    expect(live.find((r) => r.player_id === "player.ext1")?.public_activity).toBe(false);
    expect(sys.find((r) => r.player_id === "player.reach-maint3")?.public_activity).toBe(true);
  });

  it("exports projectWatchLive as an alias for buildWatchLive", () => {
    expect(projectWatchLive).toBe(buildWatchLive);
  });
});

describe("RFC-0134: sanitized verb, public target_label, and agents[] fields", () => {
  it("populates canonical verb and public target_label without leaking entity_id", () => {
    const { snap, recent, room, agent } = project([
      {
        event_type: "RESOURCE_TRANSFER",
        sequence: 91,
        cycle: 12,
        player_id: "player.aphelia",
        handle: "Aphelia-Founder",
        actor_kind: "live",
        at: NOW - 2000,
        payload: { kind: "harvest", from_id: "entity.salvage-cache", amount: 3 },
      },
      {
        event_type: "ENTITY_UPDATE",
        sequence: 92,
        cycle: 12,
        player_id: "player.reach-maint3",
        handle: "reach-maint3",
        actor_kind: "system",
        at: NOW - 1000,
        payload: { operation: "REPAIR", entity_id: "entity.codex-stack", field: "condition", from: 40, to: 85 },
      },
    ]);

    const harvest = recent.find((e) => e.sequence === 91);
    expect(harvest?.verb).toBe("harvest");
    expect(harvest?.target_label).toBe("salvage-cache");

    const repair = recent.find((e) => e.sequence === 92);
    expect(repair?.verb).toBe("repair");
    expect(repair?.target_label).toBe("codex-stack");

    expect(agent("Aphelia-Founder")?.public_activity).toBe(true);
    expect(agent("Aphelia-Founder")?.last_verb).toBe("harvest");
    expect(agent("Aphelia-Founder")?.last_target_label).toBe("salvage-cache");
    expect(agent("reach-maint3")?.public_activity).toBe(true);
    expect(agent("reach-maint3")?.last_verb).toBe("repair");
    expect(agent("reach-maint3")?.last_target_label).toBe("codex-stack");
    expect(agent("Vesper-7")?.public_activity).toBe(false);

    const civicActs = room("room.civic-exchange")?.room_activity || [];
    expect(civicActs[0]?.verb).toBe("harvest");
    expect(civicActs[0]?.target_label).toBe("salvage-cache");
    expect(civicActs[0]?.kind).toBe("deed");

    const serialized = JSON.stringify(snap);
    expect(serialized).not.toContain("entity.salvage-cache");
    expect(serialized).not.toContain("entity.codex-stack");
  });

  it("drops unverified or ID-bearing target_label candidates", () => {
    expect(containsInternalId("entity.salvage-cache")).toBe(true);
    expect(containsInternalId("player.aphelia")).toBe(true);
    expect(containsInternalId("room.civic-exchange")).toBe(true);
    expect(containsInternalId("ctrl.abc123")).toBe(true);
    expect(containsInternalId("event.0001")).toBe(true);
    expect(containsInternalId("controller.foo")).toBe(true);
    expect(containsInternalId("device.bar")).toBe(true);
    expect(containsInternalId("salvage-cache")).toBe(false);

    const { recent } = project([
      {
        event_type: "MOVE",
        sequence: 95,
        cycle: 12,
        player_id: "player.aphelia",
        handle: "Aphelia-Founder",
        at: NOW,
        payload: {
          to: "room.civic-exchange",
          target_label: "entity.spoofed-1",
          label: "player.spoofed-2",
        },
      },
    ]);
    expect(recent[0]?.verb).toBe("move");
    expect(recent[0]?.target_label).toBeUndefined();
  });
});

describe("RFC-0134: rooms[].room_activity[] work lifecycle & resident posture", () => {
  it("projects in_progress build, REPURPOSE, and ABANDON into room_activity while keeping recent_events RFC-0132 silent", () => {
    const { recent, room } = project([
      {
        event_type: "ENTITY_UPDATE",
        sequence: 81,
        cycle: 12,
        player_id: "player.aphelia",
        handle: "Aphelia-Founder",
        at: NOW - 3000,
        payload: { operation: "CONSTRUCT", in_progress: true, entity_id: "entity.relay-7" },
      },
      {
        event_type: "ENTITY_UPDATE",
        sequence: 82,
        cycle: 12,
        player_id: "player.aphelia",
        handle: "Aphelia-Founder",
        at: NOW - 2000,
        payload: { operation: "REPURPOSE", entity_id: "entity.workshop-1" },
      },
      {
        event_type: "ENTITY_UPDATE",
        sequence: 83,
        cycle: 12,
        player_id: "player.aphelia",
        handle: "Aphelia-Founder",
        at: NOW - 1000,
        payload: { operation: "ABANDON", unclaimed: true, entity_id: "entity.workshop-1" },
      },
    ]);

    expect(recent).toEqual([]);

    const archiveActs = room("room.archive")?.room_activity || [];
    expect(archiveActs).toHaveLength(1);
    expect(archiveActs[0]).toMatchObject({
      sequence: 81,
      verb: "build",
      target_label: "relay-7",
      kind: "deed",
    });

    const civicActs = room("room.civic-exchange")?.room_activity || [];
    expect(civicActs).toHaveLength(2);
    expect(civicActs[0]).toMatchObject({
      sequence: 83,
      verb: "abandon",
      target_label: "workshop",
      kind: "deed",
    });
    expect(civicActs[1]).toMatchObject({
      sequence: 82,
      verb: "repurpose",
      target_label: "workshop",
      kind: "deed",
    });
  });

  it("projects resident LOOK/INSPECT/WAIT posture into room_activity and agents[] without flooding recent_events", () => {
    const { recent, room, agent } = project([
      {
        event_type: "INSPECT",
        sequence: 85,
        cycle: 12,
        player_id: "player.reach-maint3",
        handle: "reach-maint3",
        actor_kind: "system",
        at: NOW - 2000,
        payload: { room_id: "room.archive", entity_id: "entity.codex-stack" },
      },
      {
        event_type: "LOOK",
        sequence: 86,
        cycle: 12,
        player_id: "player.aphelia",
        handle: "Aphelia-Founder",
        actor_kind: "live",
        at: NOW - 1000,
        payload: { room_id: "room.civic-exchange" },
      },
      {
        event_type: "WAIT",
        sequence: 87,
        cycle: 12,
        player_id: "player.rivet",
        handle: "Rivet-Custodian",
        actor_kind: "live",
        at: NOW,
        payload: { room_name: "Civic Exchange" },
      },
      // External player posture MUST stay completely silent!
      {
        event_type: "INSPECT",
        sequence: 88,
        cycle: 12,
        player_id: "player.external1",
        handle: "Vesper-7",
        actor_kind: "live",
        at: NOW,
        payload: { room_id: "room.civic-exchange", entity_id: "entity.salvage-cache" },
      },
    ]);

    expect(recent).toEqual([]);

    const archiveActs = room("room.archive")?.room_activity || [];
    expect(archiveActs).toHaveLength(1);
    expect(archiveActs[0]).toMatchObject({
      verb: "inspect",
      actor_label: "reach-maint3",
      target_label: "codex-stack",
      kind: "posture",
      line: "reach-maint3 inspected codex-stack",
    });
    expect(agent("reach-maint3")?.last_verb).toBe("inspect");
    expect(agent("reach-maint3")?.last_target_label).toBe("codex-stack");

    const civicActs = room("room.civic-exchange")?.room_activity || [];
    expect(civicActs.map((a) => `${a.actor_label}:${a.verb}:${a.kind}`)).toEqual([
      "Rivet-Custodian:wait:posture",
      "Aphelia-Founder:look:posture",
    ]);
    expect(agent("Vesper-7")?.last_verb).toBeUndefined();
  });

  it("caps room_activity at 16 newest-first entries and omits room_activity when empty", () => {
    const events: WatchSourceEvent[] = [];
    for (let i = 1; i <= 22; i++) {
      events.push({
        event_type: "LOOK",
        sequence: i,
        cycle: 12,
        player_id: "player.aphelia",
        handle: "Aphelia-Founder",
        at: NOW - (30 - i) * 1000,
        payload: { room_id: "room.civic-exchange" },
      });
    }
    const { room } = project(events);
    const civicActs = room("room.civic-exchange")?.room_activity || [];
    expect(civicActs).toHaveLength(16);
    expect(civicActs[0]?.sequence).toBe(22);
    expect(civicActs[15]?.sequence).toBe(7);
    expect(room("room.archive")?.room_activity).toBeUndefined();
  });
});

describe("RFC-0134: resident dialogue & adversarial privacy invariants", () => {
  it("exposes sanitized resident-to-resident dialogue and deduplicates MESSAGE + MESSAGE_DELIVERED", () => {
    const longSpeech = "Relay load is stabilizing — routing reserve cells to Generator Hall. " + "x".repeat(200);
    const { recent, room } = project([
      {
        event_type: "MESSAGE",
        sequence: 70,
        cycle: 12,
        player_id: "player.aphelia",
        handle: "Aphelia-Founder",
        at: NOW - 1000,
        payload: {
          message_id: "msg.70",
          room_id: "room.civic-exchange",
          sender_id: "player.aphelia",
          to_player_id: "player.rivet",
          text: "Relay load\x00\x07\n   is stabilizing.",
        },
      },
      {
        event_type: "MESSAGE_DELIVERED",
        sequence: 71,
        cycle: 12,
        player_id: "player.aphelia",
        handle: "Aphelia-Founder",
        at: NOW - 1000,
        payload: {
          message_id: "msg.70",
          room_id: "room.civic-exchange",
          recipient_id: "player.rivet",
        },
      },
      {
        event_type: "MESSAGE",
        sequence: 72,
        cycle: 12,
        player_id: "player.rivet",
        handle: "Rivet-Custodian",
        at: NOW,
        payload: {
          message_id: "msg.72",
          room_id: "room.civic-exchange",
          sender_id: "player.rivet",
          to_player_id: "player.aphelia",
          text: longSpeech,
        },
      },
    ]);

    // Global feed keeps standard redacted notice only (never dialogue text).
    expect(JSON.stringify(recent)).not.toContain("Relay load");

    const civicActs = room("room.civic-exchange")?.room_activity || [];
    expect(civicActs).toHaveLength(2);
    expect(civicActs[0]).toMatchObject({
      sequence: 72,
      verb: "message",
      actor_label: "Rivet-Custodian",
      listener_label: "Aphelia-Founder",
      kind: "speech",
    });
    expect(civicActs[0]?.speech?.length).toBe(180);

    expect(civicActs[1]).toMatchObject({
      verb: "message",
      actor_label: "Aphelia-Founder",
      listener_label: "Rivet-Custodian",
      speech: "Relay load is stabilizing.",
      kind: "speech",
    });
  });

  it("allows room-wide resident broadcasts and drops speech containing internal IDs", () => {
    const { snap, room } = project([
      {
        event_type: "MESSAGE",
        sequence: 75,
        cycle: 12,
        player_id: "player.aphelia",
        handle: "Aphelia-Founder",
        at: NOW - 500,
        payload: {
          room_id: "room.civic-exchange",
          surface: "TRADE_NOTICE",
          text: "Reserve cells open for charter exchange.",
        },
      },
      {
        event_type: "MESSAGE",
        sequence: 76,
        cycle: 12,
        player_id: "player.aphelia",
        handle: "Aphelia-Founder",
        at: NOW,
        payload: {
          room_id: "room.civic-exchange",
          to_player_id: "player.rivet",
          text: "Inspect entity.salvage-cache for player.external1 now",
        },
      },
    ]);

    const civicActs = room("room.civic-exchange")?.room_activity || [];
    expect(civicActs).toHaveLength(2);
    expect(civicActs[0]?.speech).toBeUndefined();
    expect(civicActs[0]?.line).toBe("Aphelia-Founder spoke with Rivet-Custodian");
    expect(civicActs[1]?.speech).toBe("Reserve cells open for charter exchange.");

    const wire = JSON.stringify(snap);
    expect(wire).not.toContain("entity.salvage-cache");
    expect(wire).not.toContain("player.external1");
  });

  it("strictly redacts external-to-external, resident-to-external, external-to-resident, mixed, and unknown-recipient DMs", () => {
    const secrets = [
      "SECRET_EXT_EXT_101",
      "SECRET_RES_EXT_202",
      "SECRET_EXT_RES_303",
      "SECRET_MIXED_404",
      "SECRET_UNKNOWN_505",
    ];
    const { snap, room } = project([
      {
        event_type: "MESSAGE",
        sequence: 60,
        cycle: 12,
        player_id: "player.external1",
        handle: "Vesper-7",
        at: NOW,
        payload: { room_id: "room.civic-exchange", to_player_id: "player.external2", text: secrets[0] },
      },
      {
        event_type: "MESSAGE_DELIVERED",
        sequence: 61,
        cycle: 12,
        player_id: "player.aphelia",
        handle: "Aphelia-Founder",
        at: NOW,
        payload: { room_id: "room.civic-exchange", to_player_id: "player.external1", text: secrets[1] },
      },
      {
        event_type: "MESSAGE",
        sequence: 62,
        cycle: 12,
        player_id: "player.external1",
        handle: "Vesper-7",
        at: NOW,
        payload: { room_id: "room.civic-exchange", to_player_id: "player.aphelia", text: secrets[2] },
      },
      {
        event_type: "MESSAGE",
        sequence: 63,
        cycle: 12,
        player_id: "player.aphelia",
        handle: "Aphelia-Founder",
        at: NOW,
        payload: {
          room_id: "room.civic-exchange",
          recipient_ids: ["player.rivet", "player.external1"],
          text: secrets[3],
        },
      },
      {
        event_type: "MESSAGE",
        sequence: 64,
        cycle: 12,
        player_id: "player.aphelia",
        handle: "Aphelia-Founder",
        at: NOW,
        payload: { room_id: "room.civic-exchange", to_player_id: "player.unregistered", text: secrets[4] },
      },
    ]);

    const wire = JSON.stringify(snap);
    for (const s of secrets) {
      expect(wire).not.toContain(s);
    }
    const civicActs = room("room.civic-exchange")?.room_activity || [];
    for (const act of civicActs) {
      expect(act.speech).toBeUndefined();
      expect(act.listener_label).toBeUndefined();
      expect(act.kind).toBe("deed");
    }
  });

  it("never leaks hidden rooms, hidden entities, or closed RFC-0132 ops even for public_activity residents", () => {
    const { snap, room } = project([
      {
        event_type: "MESSAGE",
        sequence: 50,
        cycle: 12,
        player_id: "player.hidden-resident",
        handle: "Hidden-Scout",
        at: NOW,
        payload: {
          room_id: "room.sealed-vault",
          to_player_id: "player.aphelia",
          text: "SECRET_HIDDEN_ROOM_SPEECH",
        },
      },
      {
        event_type: "INSPECT",
        sequence: 51,
        cycle: 12,
        player_id: "player.aphelia",
        handle: "Aphelia-Founder",
        at: NOW,
        payload: { room_id: "room.civic-exchange", entity_id: "entity.hidden-coil" },
      },
      {
        event_type: "ENTITY_UPDATE",
        sequence: 52,
        cycle: 12,
        player_id: "player.aphelia",
        handle: "Aphelia-Founder",
        at: NOW,
        payload: { operation: "SHARE", entity_id: "entity.workshop-1" },
      },
      {
        event_type: "ENTITY_UPDATE",
        sequence: 53,
        cycle: 12,
        player_id: "player.aphelia",
        handle: "Aphelia-Founder",
        at: NOW,
        payload: { operation: "CONNECT", entity_id: "entity.workshop-1" },
      },
    ]);

    const wire = JSON.stringify(snap);
    expect(wire).not.toContain("Sealed Vault");
    expect(wire).not.toContain("room.sealed-vault");
    expect(wire).not.toContain("Hidden-Scout");
    expect(wire).not.toContain("SECRET_HIDDEN_ROOM_SPEECH");
    expect(wire).not.toContain("hidden-coil");
    expect(wire).not.toContain("entity.hidden-coil");
    expect(room("room.civic-exchange")?.room_activity).toBeUndefined();
  });
});

describe("RFC-0134: operator admin surface toggle", () => {
  it("wires /v1/operator/player/public-activity in adminHtml without introducing BRAND_BAN vocabulary", () => {
    const html = adminHtml();
    expect(html).toContain("/v1/operator/player/public-activity");
    expect(html).toContain("Public WATCH");
    const idx = html.indexOf("/v1/operator/player/public-activity");
    const snippet = html.slice(Math.max(0, idx - 400), idx + 400);
    expect(snippet).not.toMatch(BRAND_BAN);
  });
});
