/**
 * WATCH Chamber stage D6 route travel (Noema-Specs specify/watch-single-3d-stage.md).
 * A token travels only along a drawn public route, only from the site the
 * public handle was shown at in the last applied snapshot to the site it is
 * shown at now, and never for hidden, multi-hop or inferred routes.
 */
import { describe, expect, it } from "vitest";
import {
  buildStageModel,
  stageHandleSites,
  stageTravels,
  type StagePulse,
} from "../src/watch-stage-model";

type Exit = { direction: string; to_room_id: string };
type Room = {
  room_id: string;
  name: string;
  exits: Exit[];
  public_player_labels: string[];
  players_present: number;
  hidden?: boolean;
};

/** alpha <-> beta (drawn both ways), beta -> gamma (one-way), no alpha <-> gamma. */
const PLAN: Array<{ room_id: string; name: string; exits: Exit[] }> = [
  { room_id: "room.alpha", name: "Alpha Post", exits: [{ direction: "east", to_room_id: "room.beta" }] },
  {
    room_id: "room.beta",
    name: "Beta Post",
    exits: [
      { direction: "west", to_room_id: "room.alpha" },
      { direction: "north", to_room_id: "room.gamma" },
    ],
  },
  { room_id: "room.gamma", name: "Gamma Post", exits: [] },
];

function rooms(labels: Record<string, string[]>, extra: Room[] = []): Room[] {
  const out: Room[] = PLAN.map((r) => ({
    room_id: r.room_id,
    name: r.name,
    exits: r.exits,
    public_player_labels: labels[r.room_id] || [],
    players_present: (labels[r.room_id] || []).length,
  }));
  return out.concat(extra);
}

function stageOf(labels: Record<string, string[]>, extra: Room[] = []) {
  return buildStageModel({ rooms: rooms(labels, extra) });
}

function pulse(sequence: number, roomId: string): StagePulse {
  return { roomId, tier: "NORMAL", ttl: 280, sequence, projectionId: "agent_move" };
}

function move(sequence: number, roomId: string, actor: string) {
  return { sequence, room_id: roomId, actor_label: actor, projection_id: "agent_move", tier: "NORMAL" };
}

describe("stageTravels (D6 route travel)", () => {
  it("draws the routes the travel rule needs", () => {
    const model = stageOf({});
    const has = (from: string, to: string) => model.routes.some((r) => r.from === from && r.to === to);
    expect(has("room.alpha", "room.beta")).toBe(true);
    expect(has("room.beta", "room.alpha")).toBe(false);
    expect(model.routes.find((r) => r.from === "room.alpha" && r.to === "room.beta")!.oneWay).toBe(false);
    expect(has("room.beta", "room.gamma")).toBe(true);
    expect(model.routes.find((r) => r.from === "room.beta" && r.to === "room.gamma")!.oneWay).toBe(true);
    expect(has("room.alpha", "room.gamma")).toBe(false);
    expect(has("room.gamma", "room.alpha")).toBe(false);
  });

  it("travels only along a drawn direct route", () => {
    const next = stageOf({ "room.beta": ["sable"] });
    const prev = stageHandleSites(stageOf({ "room.alpha": ["sable"] }));
    expect(prev.get("sable")).toBe("room.alpha");
    expect(stageHandleSites(next).get("sable")).toBe("room.beta");
    expect(next.routes.some((r) => r.from === "room.alpha" && r.to === "room.beta")).toBe(true);
    expect(stageTravels(prev, next, [pulse(11, "room.beta")], [move(11, "room.beta", "sable")])).toEqual([
      { handle: "sable", from: "room.alpha", to: "room.beta", sequence: 11 },
    ]);
  });

  it("travels a one-way route only in its drawn direction", () => {
    const beta = stageOf({ "room.beta": ["sable"] });
    const gamma = stageOf({ "room.gamma": ["sable"] });
    expect(stageTravels(stageHandleSites(beta), gamma, [pulse(4, "room.gamma")], [move(4, "room.gamma", "sable")])).toEqual([
      { handle: "sable", from: "room.beta", to: "room.gamma", sequence: 4 },
    ]);
    expect(stageTravels(stageHandleSites(gamma), beta, [pulse(5, "room.beta")], [move(5, "room.beta", "sable")])).toEqual([]);
  });

  it("needs a public actor_label on the matching agent_move event", () => {
    const next = stageOf({ "room.beta": ["sable"] });
    const prev = stageHandleSites(stageOf({ "room.alpha": ["sable"] }));
    const pulses = [pulse(12, "room.beta")];
    expect(stageTravels(prev, next, pulses, [{ sequence: 12, room_id: "room.beta" }])).toEqual([]);
    expect(stageTravels(prev, next, pulses, [{ sequence: 12, room_id: "room.beta", actor_label: "   " }])).toEqual([]);
    expect(
      stageTravels(prev, next, pulses, [{ sequence: 12, room_id: "room.beta", actor_label: "player.secret-id" }]),
    ).toEqual([]);
    // the label must be a handle that is public somewhere, not any string
    expect(stageTravels(prev, next, pulses, [move(12, "room.beta", "someone-else")])).toEqual([]);
    // a sequence with no matching event never travels
    expect(stageTravels(prev, next, pulses, [move(99, "room.beta", "sable")])).toEqual([]);
    // nor does a non-travel projection
    expect(stageTravels(prev, next, [{ roomId: "room.beta", tier: "NORMAL", ttl: 280, sequence: 12 }], [move(12, "room.beta", "sable")])).toEqual([]);
  });

  it("never travels when the handle is absent from the previous snapshot", () => {
    const next = stageOf({ "room.beta": ["sable"] });
    const empty = stageHandleSites(stageOf({}));
    expect(empty.size).toBe(0);
    expect(stageTravels(empty, next, [pulse(3, "room.beta")], [move(3, "room.beta", "sable")])).toEqual([]);
  });

  it("never travels for an ambiguous handle or an unchanged site", () => {
    const both = stageOf({ "room.alpha": ["sable"], "room.beta": ["sable"] });
    expect(stageHandleSites(both).has("sable")).toBe(false);
    expect(stageTravels(stageHandleSites(both), both, [pulse(6, "room.beta")], [move(6, "room.beta", "sable")])).toEqual([]);
    const alpha = stageOf({ "room.alpha": ["sable"] });
    expect(stageTravels(stageHandleSites(alpha), alpha, [pulse(7, "room.alpha")], [move(7, "room.alpha", "sable")])).toEqual([]);
    // ambiguous only in the new snapshot: nowhere to land
    expect(stageTravels(stageHandleSites(alpha), both, [pulse(8, "room.beta")], [move(8, "room.beta", "sable")])).toEqual([]);
  });

  it("never travels for a hidden or unknown room", () => {
    const hidden = stageOf({ "room.alpha": ["sable"] }, [
      {
        room_id: "room.vault",
        name: "Vault",
        hidden: true,
        exits: [{ direction: "south", to_room_id: "room.alpha" }],
        public_player_labels: ["sable"],
        players_present: 1,
      },
    ]);
    expect(hidden.sites.some((s) => s.id === "room.vault")).toBe(false);
    expect(hidden.routes.some((r) => r.from === "room.vault" || r.to === "room.vault")).toBe(false);
    const prev = stageHandleSites(stageOf({ "room.beta": ["sable"] }));
    expect(prev.get("sable")).toBe("room.beta");
    expect(stageTravels(prev, hidden, [pulse(9, "room.vault")], [move(9, "room.vault", "sable")])).toEqual([]);
    expect(stageTravels(prev, hidden, [pulse(10, "room.nothing")], [move(10, "room.nothing", "sable")])).toEqual([]);
    // a pulse whose room_id disagrees with its event's room_id travels nowhere
    const next = stageOf({ "room.beta": ["sable"] });
    expect(stageTravels(prev, next, [pulse(11, "room.beta")], [move(11, "room.alpha", "sable")])).toEqual([]);
  });

  it("never composes multi-hop routes", () => {
    const next = stageOf({ "room.gamma": ["sable"] });
    const prev = stageHandleSites(stageOf({ "room.alpha": ["sable"] }));
    expect(next.routes).toHaveLength(2);
    expect(
      next.routes.some(
        (r) =>
          (r.from === "room.alpha" && r.to === "room.gamma") || (r.from === "room.gamma" && r.to === "room.alpha"),
      ),
    ).toBe(false);
    expect(stageTravels(prev, next, [pulse(13, "room.gamma")], [move(13, "room.gamma", "sable")])).toEqual([]);
  });

  it("keeps one travel per handle, the latest sequence, in ascending order", () => {
    const next = stageOf({ "room.beta": ["sable"] });
    const prev = stageHandleSites(stageOf({ "room.alpha": ["sable"] }));
    expect(
      stageTravels(prev, next, [pulse(21, "room.beta"), pulse(20, "room.beta")], [
        move(20, "room.beta", "sable"),
        move(21, "room.beta", "sable"),
      ]),
    ).toEqual([{ handle: "sable", from: "room.alpha", to: "room.beta", sequence: 21 }]);

    const twoNext = stageOf({ "room.beta": ["sable"], "room.gamma": ["ash"] });
    const twoPrev = stageHandleSites(stageOf({ "room.alpha": ["sable"], "room.beta": ["ash"] }));
    expect(
      stageTravels(twoPrev, twoNext, [pulse(31, "room.beta"), pulse(30, "room.gamma")], [
        move(31, "room.beta", "sable"),
        move(30, "room.gamma", "ash"),
      ]),
    ).toEqual([
      { handle: "ash", from: "room.beta", to: "room.gamma", sequence: 30 },
      { handle: "sable", from: "room.alpha", to: "room.beta", sequence: 31 },
    ]);
  });
});

describe("stageHandleSites", () => {
  it("maps every public handle of a site, not only the six drawn tokens", () => {
    const many = ["h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8"];
    const model = stageOf({ "room.alpha": many });
    const sites = stageHandleSites(model);
    expect(sites.size).toBe(8);
    expect(sites.get("h7")).toBe("room.alpha");
    expect(model.sites[0].tokens).toHaveLength(6);
  });

  it("omits a handle listed at two sites in the same snapshot", () => {
    const model = stageOf({ "room.alpha": ["sable"], "room.beta": ["sable", "ash"] });
    const sites = stageHandleSites(model);
    expect(sites.has("sable")).toBe(false);
    expect(sites.get("ash")).toBe("room.beta");
    expect(stageHandleSites(stageOf({ "room.gamma": ["mars"] })).get("mars")).toBe("room.gamma");
    expect(stageHandleSites({ sites: [], routes: [], radius: 0 }).size).toBe(0);
  });
});
