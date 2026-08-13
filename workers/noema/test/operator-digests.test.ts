import { describe, expect, it } from "vitest";
import {
  cadenceElapsed,
  composeDigest,
  DEFAULT_DIGEST_CONFIG,
  nextWindows,
  type DigestEvent,
} from "../src/operator-digests";

const snap = {
  world_id: "world.perihelion-reach",
  world_name: "Perihelion Reach",
  world_status: "ACTIVE",
  settlement_health: "HEALTHY",
  players_present: 7,
  open_trades: 3,
};

function ev(partial: Partial<DigestEvent> & Pick<DigestEvent, "event_type" | "sequence">): DigestEvent {
  return {
    event_id: `evt.${partial.sequence}`,
    at: 1_000,
    cycle: 10,
    player_id: "player.nacre",
    handle: "Nacre",
    ...partial,
  };
}

describe("operator digest cadence", () => {
  it("does not fire before the preset elapses", () => {
    expect(cadenceElapsed(0, "PT30M", 10 * 60 * 1000)).toBe(false);
    expect(cadenceElapsed(0, "PT30M", 30 * 60 * 1000)).toBe(true);
  });

  it("emits separate missed windows then the current one", () => {
    const wins = nextWindows(0, "PT15M", 45 * 60 * 1000);
    expect(wins.length).toBe(3);
    expect(wins[0].missed).toBe(true);
    expect(wins[1].missed).toBe(true);
    expect(wins[2].missed).toBe(false);
    expect(wins[0].end).toBe(wins[1].start);
  });
});

describe("operator digest composition", () => {
  it("uses Player names not controller types", () => {
    const d = composeDigest(
      [ev({ event_type: "MOVE", sequence: 2, payload: { to_room_name: "Coldline" } })],
      snap,
      DEFAULT_DIGEST_CONFIG,
      { start: 0, end: 2000 },
    );
    expect(d.text).toMatch(/Nacre moved toward Coldline/);
    expect(d.text).not.toMatch(/AI Agent|Human Player/);
    expect(d.text).toMatch(/World ACTIVE/);
    expect(d.generation_mode).toBe("deterministic");
  });

  it("omits private message text", () => {
    const d = composeDigest(
      [ev({ event_type: "MESSAGE_DELIVERED", sequence: 3, payload: { text: "secret plan" } })],
      snap,
      DEFAULT_DIGEST_CONFIG,
      { start: 0, end: 2000 },
    );
    expect(d.text).toMatch(/private message events delivered/);
    expect(d.text).not.toMatch(/secret plan/);
  });

  it("BRIEF is counts only", () => {
    const d = composeDigest(
      [ev({ event_type: "TRADE_PROPOSED", sequence: 4 })],
      snap,
      { ...DEFAULT_DIGEST_CONFIG, depth: "BRIEF" },
      { start: 0, end: 2000 },
    );
    expect(d.text).toMatch(/1 trades proposed/);
    expect(d.text).toMatch(/7 Players active/);
  });
});
