/**
 * WATCH Chamber stage spectacle pass A (Noema-Specs specify/watch-single-3d-stage.md D6).
 * Event captions, named agent tokens + nameplates, and exit lighting.
 */
import { describe, expect, it } from "vitest";
import { PULSE_TTL } from "../src/watch-phosphor";
import {
  STAGE_CAPTION_HOLD_MS,
  buildStageModel,
  newStageCaptions,
  newStagePulses,
  stageLitRoutes,
} from "../src/watch-stage-model";

const IDS = ["room.civic-exchange", "room.transit-ring"];

type TestEvent = {
  sequence: number;
  tier?: string;
  room_id?: string;
  line?: string;
  actor_label?: string;
  consequence?: string;
  projection_id?: string;
};

const ev = (sequence: number, over: Partial<TestEvent> = {}): TestEvent => ({
  sequence,
  tier: "NORMAL",
  room_id: "room.civic-exchange",
  ...over,
});

describe("newStageCaptions (D6)", () => {
  it("never fires on the first snapshot a window sees", () => {
    expect(newStageCaptions([ev(5, { line: "A door opens." })], null, IDS)).toEqual([]);
  });

  it("takes only events newer than the last applied sequence", () => {
    const out = newStageCaptions([ev(5, { line: "Old news." }), ev(6, { line: "Fresh news." })], 5, IDS);
    expect(out.map((c) => c.line)).toEqual(["Fresh news."]);
    expect(out[0].sequence).toBe(6);
  });

  it("drops captions at rooms that are not public", () => {
    expect(newStageCaptions([ev(6, { line: "Hidden.", room_id: "room.vault" })], 5, IDS)).toEqual([]);
  });

  it("drops a caption whose text leaks an id", () => {
    expect(newStageCaptions([ev(6, { line: "Watch player.ae12f open the gate." })], 5, IDS)).toEqual([]);
  });

  it("skips events whose cleaned line is empty", () => {
    expect(newStageCaptions([ev(6, { line: "   " }), ev(7, {})], 5, IDS)).toEqual([]);
  });

  it("caps line, actor and consequence", () => {
    const out = newStageCaptions(
      [ev(6, { line: "L".repeat(200), actor_label: "A".repeat(60), consequence: "C".repeat(200) })],
      5,
      IDS,
    );
    expect(out[0].line).toHaveLength(120);
    expect(out[0].actor).toHaveLength(32);
    expect(out[0].consequence).toHaveLength(120);
  });

  it("omits a consequence that only repeats the line", () => {
    expect(newStageCaptions([ev(6, { line: "The gate closes.", consequence: "the gate closes" })], 5, IDS)[0].consequence).toBe("");
    expect(newStageCaptions([ev(6, { line: "The gate closes", consequence: "The gate closes." })], 5, IDS)[0].consequence).toBe("");
    expect(newStageCaptions([ev(6, { line: "The gate closes.", consequence: "The lamp dims." })], 5, IDS)[0].consequence).toBe("The lamp dims.");
  });

  it("holds every tier's caption no longer than four seconds", () => {
    expect(STAGE_CAPTION_HOLD_MS.NORMAL).toBeLessThanOrEqual(4000);
    expect(STAGE_CAPTION_HOLD_MS.NOTABLE).toBeLessThanOrEqual(4000);
    expect(STAGE_CAPTION_HOLD_MS.MAJOR).toBeLessThanOrEqual(4000);
    const out = newStageCaptions([ev(6, { line: "A bell.", tier: "MAJOR" })], 5, IDS);
    expect(out[0].tier).toBe("MAJOR");
    expect(out[0].holdMs).toBe(STAGE_CAPTION_HOLD_MS.MAJOR);
  });

  it("keeps at most one MAJOR caption plus two others, newest first", () => {
    const out = newStageCaptions(
      [
        ev(11, { line: "one", tier: "MAJOR" }),
        ev(12, { line: "two", tier: "MAJOR" }),
        ev(13, { line: "three" }),
        ev(14, { line: "four" }),
        ev(15, { line: "five" }),
      ],
      10,
      IDS,
    );
    expect(out.filter((c) => c.tier === "MAJOR").map((c) => c.sequence)).toEqual([12]);
    expect(out.filter((c) => c.tier !== "MAJOR").map((c) => c.sequence)).toEqual([15, 14]);
  });

  it("carries the actor and room through for the renderer", () => {
    const out = newStageCaptions([ev(6, { line: "The arch holds.", actor_label: "reach-maint3" })], 5, IDS);
    expect(out[0].roomId).toBe("room.civic-exchange");
    expect(out[0].actor).toBe("reach-maint3");
  });
});

type TokenRoom = {
  room_id: string;
  name: string;
  players_present: number;
  public_player_labels: string[];
  public_focus_lines: string[];
  public_title_lines: string[];
  exits: never[];
};

function tokenRoom(over: Partial<TokenRoom> = {}): TokenRoom {
  return {
    room_id: "room.civic-exchange",
    name: "Civic Exchange",
    players_present: 0,
    public_player_labels: [],
    public_focus_lines: [],
    public_title_lines: [],
    exits: [],
    ...over,
  };
}

describe("named agent tokens + nameplates (D6)", () => {
  it("names up to six handles in order and folds the rest into more", () => {
    const site = buildStageModel({
      rooms: [tokenRoom({ players_present: 8, public_player_labels: ["a", "b", "c", "d", "e", "f", "g", "h"] })],
    }).sites[0];
    expect(site.tokens.map((t) => t.handle)).toEqual(["a", "b", "c", "d", "e", "f"]);
    expect(site.unnamed).toBe(0);
    expect(site.more).toBe(2);
  });

  it("keeps anonymous agents as unnamed tokens with no overflow", () => {
    const site = buildStageModel({
      rooms: [tokenRoom({ players_present: 4, public_player_labels: ["a", "b"] })],
    }).sites[0];
    expect(site.tokens.map((t) => t.handle)).toEqual(["a", "b"]);
    expect(site.unnamed).toBe(2);
    expect(site.more).toBe(0);
  });

  it("never counts a negative overflow when named handles outnumber the six drawn", () => {
    const site = buildStageModel({
      rooms: [tokenRoom({ players_present: 0, public_player_labels: ["a", "b", "c", "d", "e", "f", "g", "h"] })],
    }).sites[0];
    expect(site.unnamed).toBe(0);
    expect(site.more).toBe(2);
  });

  it("copies the public focus line for a handle verbatim", () => {
    const site = buildStageModel({
      rooms: [tokenRoom({
        players_present: 1,
        public_player_labels: ["reach-maint3"],
        public_focus_lines: ["reach-maint3 Rebuilding the west arch.", "Something else."],
      })],
    }).sites[0];
    expect(site.tokens[0].line).toBe("reach-maint3 Rebuilding the west arch.");
  });

  it("falls back to the matching title line, and never invents one", () => {
    const site = buildStageModel({
      rooms: [tokenRoom({
        players_present: 2,
        public_player_labels: ["tester", "juno"],
        public_title_lines: ["tester Reading the ledger."],
      })],
    }).sites[0];
    expect(site.tokens[0].line).toBe("tester Reading the ledger.");
    expect(site.tokens[1].line).toBe("");
  });

  it("needs the handle prefix exactly and drops id-leaking public lines", () => {
    const site = buildStageModel({
      rooms: [tokenRoom({
        players_present: 2,
        public_player_labels: ["reach-maint3", "tester"],
        public_focus_lines: ["reach-maint30 Doing things.", "reach-maint3 Watching player.ae12f."],
      })],
    }).sites[0];
    expect(site.tokens[0].line).toBe("");
    expect(site.tokens[1].line).toBe("");
  });
});

describe("stageLitRoutes (§18.6 exit lighting)", () => {
  const routes = [
    { from: "room.civic-exchange", to: "room.transit-ring", direction: "east", dashed: false, oneWay: false },
    { from: "room.civic-exchange", to: "room.relay-quarter", direction: "north", dashed: false, oneWay: true },
  ];

  it("lights only the drawn routes that touch a pulse room", () => {
    expect([...stageLitRoutes([{ roomId: "room.transit-ring", ttl: 2500 }], routes)]).toEqual([
      "room.civic-exchange|room.transit-ring",
    ]);
  });

  it("lights every route touching a given room, and nothing without a pulse", () => {
    expect(stageLitRoutes([{ roomId: "room.civic-exchange", ttl: 2500 }], routes).size).toBe(2);
    expect(stageLitRoutes([{ roomId: "room.relay-quarter", ttl: 1 }], routes).size).toBe(1);
    expect(stageLitRoutes([], routes).size).toBe(0);
  });
});

describe("newStagePulses stays additive", () => {
  it("still returns the same pulses and sequence for existing inputs", () => {
    const before = newStagePulses(
      [
        { sequence: 6, tier: "NOTABLE", room_id: "room.civic-exchange" },
        { sequence: 7, tier: "NORMAL", room_id: "room.transit-ring" },
      ],
      5,
      IDS,
    );
    expect(before.pulses.map((p) => [p.roomId, p.tier, p.ttl, p.sequence])).toEqual([
      ["room.transit-ring", "NORMAL", PULSE_TTL.NORMAL, 7],
      ["room.civic-exchange", "NOTABLE", PULSE_TTL.NOTABLE, 6],
    ]);
    expect(before.lastSequence).toBe(7);
    expect(before.pulses[0].projectionId).toBeUndefined();
  });

  it("carries projectionId through without touching anything else", () => {
    const event: TestEvent = {
      sequence: 6,
      tier: "NORMAL",
      room_id: "room.civic-exchange",
      projection_id: "agent_move",
    };
    const out = newStagePulses([event], 5, IDS);
    expect(out.pulses).toHaveLength(1);
    expect(out.pulses[0].projectionId).toBe("agent_move");
    expect(out.pulses[0].roomId).toBe("room.civic-exchange");
    expect(out.pulses[0].sequence).toBe(6);
    expect(out.pulses[0].ttl).toBe(PULSE_TTL.NORMAL);
    expect(out.lastSequence).toBe(6);
  });
});
