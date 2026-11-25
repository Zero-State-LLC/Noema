import { describe, expect, it } from "vitest";
import { selectNotableEvent, type WatchEvent } from "./watch-live";

describe("WATCH live deed priority (ADR-0012)", () => {
  it("prefers concrete actor-attributed deeds over actor-less ambient NOTABLE pulses", () => {
    const candidates: WatchEvent[] = [
      {
        sequence: 100,
        cycle: 10,
        tier: "NOTABLE",
        projection_id: "organization",
        line: "A maintenance custom has become widely observed.",
      },
      {
        sequence: 99,
        cycle: 10,
        tier: "NORMAL",
        projection_id: "production",
        line: "Rivet-Custodian repaired archive-annex",
        room_id: "room.relay-quarter",
        actor_label: "Rivet-Custodian",
      },
    ];
    const picked = selectNotableEvent({ freshness: "live", players_present: 6, candidates });
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
});
