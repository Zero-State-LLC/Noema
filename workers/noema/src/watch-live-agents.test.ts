import { describe, expect, it } from "vitest";
import {
  buildWatchLive,
  holdHeadline,
  selectNotableEvent,
  type WatchEvent,
} from "./watch-live";

const NOW = 1_700_000_000_000;

function rooms() {
  return {
    "room.relay-quarter": {
      room_id: "room.relay-quarter",
      name: "Relay Quarter",
      description: "A worn switching floor.",
      exits: [],
      entities: [],
    },
    "room.civic-exchange": {
      room_id: "room.civic-exchange",
      name: "Civic Exchange",
      description: "The public hall.",
      exits: [],
      entities: [],
    },
    "room.transit-ring": {
      room_id: "room.transit-ring",
      name: "Transit Ring",
      description: "A public corridor.",
      exits: [],
      entities: [],
    },
  };
}

function livePlayer(id: string, handle: string, room_id: string) {
  return {
    player_id: id,
    handle,
    room_id,
    entered: true,
    last_seen_ms: NOW,
    actor_kind: "live" as const,
  };
}

describe("WATCH live deed priority (ADR-0012)", () => {
  const ambientPulse: WatchEvent = {
    sequence: 100,
    cycle: 10,
    tier: "NOTABLE",
    projection_id: "organization",
    line: "A maintenance custom has become widely observed.",
  };
  const concreteDeed: WatchEvent = {
    sequence: 99,
    cycle: 10,
    tier: "NORMAL",
    projection_id: "production",
    line: "Rivet-Custodian repaired archive-annex",
    room_id: "room.relay-quarter",
    actor_label: "Rivet-Custodian",
  };

  it("prefers concrete actor-attributed deeds over actor-less ambient NOTABLE pulses", () => {
    const picked = selectNotableEvent({
      freshness: "live",
      players_present: 6,
      candidates: [ambientPulse, concreteDeed],
    });
    expect(picked.actor_label).toBe("Rivet-Custodian");
    expect(picked.line).toContain("repaired archive-annex");
  });

  it("still lets MAJOR events override NORMAL deeds", () => {
    const candidates: WatchEvent[] = [
      {
        sequence: 101,
        cycle: 10,
        tier: "MAJOR",
        projection_id: "contest",
        line: "A major contest erupted in Civic Exchange",
      },
      {
        sequence: 102,
        cycle: 10,
        tier: "NORMAL",
        projection_id: "agent_move",
        line: "Aphelia-Founder entered Transit Ring",
        room_id: "room.transit-ring",
        actor_label: "Aphelia-Founder",
      },
    ];
    const picked = selectNotableEvent({ freshness: "live", players_present: 6, candidates });
    expect(picked.tier).toBe("MAJOR");
  });

  it("keeps a held concrete deed instead of reverting to an ambient NOTABLE pulse", () => {
    const candidates = [ambientPulse, concreteDeed];
    const first = selectNotableEvent({ freshness: "live", players_present: 6, candidates });
    expect(first.actor_label).toBe("Rivet-Custodian");
    const held = {
      sequence: first.sequence,
      tier: first.tier,
      projection_id: first.projection_id,
      line: first.line,
    };
    expect(holdHeadline(held, candidates)?.actor_label).toBe("Rivet-Custodian");
    const second = selectNotableEvent({
      freshness: "live",
      players_present: 6,
      candidates,
      held,
    });
    expect(second.actor_label).toBe("Rivet-Custodian");
    expect(second.line).toContain("repaired archive-annex");
  });

  it("still releases a held NORMAL deed when a MAJOR event arrives", () => {
    const major: WatchEvent = {
      sequence: 110,
      cycle: 10,
      tier: "MAJOR",
      projection_id: "discovery",
      line: "A public discovery was announced",
    };
    const held = {
      sequence: concreteDeed.sequence,
      tier: concreteDeed.tier,
      projection_id: concreteDeed.projection_id,
      line: concreteDeed.line,
    };
    const window = [major, concreteDeed, ambientPulse];
    expect(holdHeadline(held, window)?.tier).toBe("MAJOR");
    const picked = selectNotableEvent({
      freshness: "live",
      players_present: 6,
      candidates: window,
      held,
    });
    expect(picked.tier).toBe("MAJOR");
    expect(picked.line).toBe("A public discovery was announced");
  });

  it("still lets an ambient NOTABLE pulse replace a held non-deed NORMAL headline", () => {
    const heldResource: WatchEvent = {
      sequence: 40,
      cycle: 10,
      tier: "NORMAL",
      projection_id: "resource_change",
      line: "Extraction at a storage cache has fallen.",
    };
    const newerPulse: WatchEvent = {
      sequence: 41,
      cycle: 10,
      tier: "NOTABLE",
      projection_id: "organization",
      line: "A maintenance custom has become widely observed.",
    };
    const window = [newerPulse, heldResource];
    const held = {
      sequence: heldResource.sequence,
      tier: heldResource.tier,
      projection_id: heldResource.projection_id,
      line: heldResource.line,
    };
    expect(holdHeadline(held, window)?.line).toBe("A maintenance custom has become widely observed.");
    const picked = selectNotableEvent({
      freshness: "live",
      players_present: 1,
      candidates: window,
      held,
    });
    expect(picked.line).toBe("A maintenance custom has become widely observed.");
  });

  it("ages out a held deed even when an ambient pulse remains in the window", () => {
    const deed: WatchEvent = {
      sequence: 10,
      cycle: 10,
      tier: "NORMAL",
      projection_id: "production",
      line: "Rivet-Custodian repaired archive-annex",
      room_id: "room.relay-quarter",
      actor_label: "Rivet-Custodian",
    };
    const pulse: WatchEvent = {
      sequence: 11,
      cycle: 10,
      tier: "NOTABLE",
      projection_id: "organization",
      line: "A maintenance custom has become widely observed.",
    };
    const window: WatchEvent[] = [deed, pulse];
    for (let i = 12; i <= 20; i++) {
      window.push({
        sequence: i,
        cycle: 10,
        tier: "NORMAL",
        projection_id: "agent_move",
        line: `m${i}`,
      });
    }
    expect(window.filter((e) => e.sequence > 10)).toHaveLength(10);
    const held = {
      sequence: deed.sequence,
      tier: deed.tier,
      projection_id: deed.projection_id,
      line: deed.line,
    };
    const picked = holdHeadline(held, window);
    expect(picked?.line).not.toBe(deed.line);
    expect(picked?.actor_label).not.toBe("Rivet-Custodian");
  });

  it("does not let a concrete deed replace the synthetic maintenance headline", () => {
    const picked = selectNotableEvent({
      freshness: "maintenance",
      players_present: 2,
      candidates: [concreteDeed],
    });
    expect(picked.projection_id).toBe("world_status");
    expect(picked.line).toBe("World is in maintenance.");
  });
});

describe("WATCH live agents roster (ADR-0012)", () => {
  it("derives last_action from the candidate window before feed truncation", () => {
    const snap = buildWatchLive({
      world_id: "w",
      cycle: 10,
      sequence: 30,
      rooms: rooms(),
      players: [
        livePlayer("player.rivet", "Rivet-Custodian", "room.relay-quarter"),
        livePlayer("player.aphelia", "Aphelia-Founder", "room.civic-exchange"),
        livePlayer("player.nacre", "Nacre", "room.transit-ring"),
      ],
      events: [
        {
          event_type: "MOVE",
          sequence: 30,
          cycle: 10,
          handle: "Rivet-Custodian",
          player_id: "player.rivet",
          actor_kind: "live",
          at: NOW,
          payload: { to: "room.relay-quarter", to_room_name: "Relay Quarter" },
        },
        {
          event_type: "MOVE",
          sequence: 29,
          cycle: 10,
          handle: "Aphelia-Founder",
          player_id: "player.aphelia",
          actor_kind: "live",
          at: NOW - 1000,
          payload: { to: "room.civic-exchange", to_room_name: "Civic Exchange" },
        },
        {
          event_type: "MOVE",
          sequence: 28,
          cycle: 10,
          handle: "Nacre",
          player_id: "player.nacre",
          actor_kind: "live",
          at: NOW - 2000,
          payload: { to: "room.transit-ring", to_room_name: "Transit Ring" },
        },
      ],
      now: NOW,
    });
    const recent = snap.recent_events as Array<{ line: string; actor_label?: string; projection_id: string }>;
    const moveLines = recent.filter((e) => e.projection_id === "agent_move");
    expect(moveLines).toHaveLength(2);
    expect(recent.some((e) => e.actor_label === "Nacre")).toBe(false);

    const agents = snap.agents as Array<{
      label: string;
      last_action: string | null;
      last_action_at: number | null;
      room_id: string;
    }>;
    const byLabel = Object.fromEntries(agents.map((a) => [a.label, a]));
    expect(byLabel["Rivet-Custodian"]?.last_action).toContain("entered Relay Quarter");
    expect(byLabel["Aphelia-Founder"]?.last_action).toContain("entered Civic Exchange");
    expect(byLabel["Nacre"]?.last_action).toContain("entered Transit Ring");
    expect(byLabel["Nacre"]?.last_action_at).toBe(NOW - 2000);
    expect(byLabel["Nacre"]?.room_id).toBe("room.transit-ring");
  });
});
