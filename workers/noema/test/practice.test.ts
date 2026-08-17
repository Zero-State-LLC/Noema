import { describe, expect, it } from "vitest";
import {
  applyPracticeCredits,
  creditsFromEvent,
  emptyPractice,
  practiceLines,
  publicTitleLine,
} from "../src/practice";

describe("GC1-S0 practice mapper", () => {
  it("counts LOOK rooms, INSPECT entities, accepted trades, and attributed repairs", () => {
    const look = creditsFromEvent({
      event_id: "evt.1",
      event_type: "LOOK",
      payload: { player_id: "player.nacre", room_id: "room.hub" },
    });
    const inspect = creditsFromEvent({
      event_id: "evt.2",
      event_type: "INSPECT",
      payload: { player_id: "player.nacre", entity_id: "entity.relay-7" },
    });
    const trade = creditsFromEvent(
      {
        event_id: "evt.3",
        event_type: "TRADE_ACCEPTED",
        payload: { trade_id: "trade.1", accepted_by: "player.vesper" },
      },
      {
        trades: {
          "trade.1": { proposer_id: "player.nacre", counterparty_id: "player.vesper" },
        },
      },
    );
    const repair = creditsFromEvent(
      {
        event_id: "evt.4",
        event_type: "ENTITY_UPDATE",
        payload: { entity_id: "entity.relay-7", operation: "REPAIR", from: 10, to: 25 },
      },
      { actingPlayerId: "player.nacre" },
    );
    expect(repair[0]?.recognition_unit).toBe("entity.relay-7");

    expect(look).toEqual([
      { player_id: "player.nacre", track_id: "track.explorer.01", unit: "room.hub" },
    ]);
    expect(inspect[0]?.track_id).toBe("track.surveyor.01");
    expect(trade.map((c) => c.player_id).sort()).toEqual(["player.nacre", "player.vesper"]);
    expect(repair).toEqual([
      {
        player_id: "player.nacre",
        track_id: "track.engineer.01",
        unit: "evt.4",
        recognition_unit: "entity.relay-7",
      },
    ]);
  });

  it("ignores rejected trades, missing actor, other players, and observation events", () => {
    expect(
      creditsFromEvent({
        event_id: "evt.n1",
        event_type: "TRADE_REJECTED",
        payload: { trade_id: "trade.x", rejected_by: "player.vesper" },
      }),
    ).toEqual([]);
    expect(
      creditsFromEvent({
        event_id: "evt.n2",
        event_type: "ENTITY_UPDATE",
        payload: { entity_id: "entity.relay-7", set: { condition: 40 } },
      }),
    ).toEqual([]);
    expect(
      creditsFromEvent({
        event_id: "evt.n3",
        event_type: "LOOK",
        payload: { player_id: "player.vesper", room_id: "room.east" },
      }).every((c) => c.player_id !== "player.nacre"),
    ).toBe(true);
    expect(
      creditsFromEvent({
        event_id: "evt.n4",
        event_type: "OBSERVATION_GENERATED",
        payload: { player_id: "player.nacre" },
      }),
    ).toEqual([]);
  });

  it("does not double-count the same unit and caps PLAY lines at three", () => {
    let state = emptyPractice();
    state = applyPracticeCredits(state, [
      { track_id: "track.explorer.01", unit: "room.hub" },
      { track_id: "track.explorer.01", unit: "room.hub" },
      { track_id: "track.surveyor.01", unit: "entity.relay-7" },
      { track_id: "track.broker.01", unit: "trade.1" },
      { track_id: "track.engineer.01", unit: "evt.4" },
    ]);
    expect(state.tracks["track.explorer.01"]).toEqual(["room.hub"]);
    const lines = practiceLines(state);
    expect(lines).toHaveLength(3);
    expect(lines).toEqual([
      "You have been learning the rooms.",
      "You have been doing survey work.",
      "You have been closing exchanges.",
    ]);
    expect(lines.join(" ")).not.toMatch(/infrastructure/i);
    expect(lines.join(" ")).not.toMatch(/\bXP\b|level/i);
  });

  it("recognizes surveyor at five distinct entities and not engineer from one relay", () => {
    let state = emptyPractice();
    for (let i = 1; i <= 5; i += 1) {
      state = applyPracticeCredits(state, [
        { track_id: "track.surveyor.01", unit: `entity.${i}` },
        { track_id: "track.engineer.01", unit: `evt.${i}`, recognition_unit: "entity.relay-7" },
      ]);
    }
    const lines = practiceLines(state);
    expect(lines).toContain("You are known for survey work.");
    expect(lines).toContain("You have been keeping infrastructure alive.");
    expect(lines).not.toContain("You are known for keeping infrastructure alive.");
    expect(publicTitleLine("sable", state)).toBe("sable is known for survey work.");
  });
});
