/**
 * WATCH Chamber stage model (Noema-Specs specify/watch-single-3d-stage.md).
 * Pure model rules the 3D renderer depends on: shared public layout, no ids,
 * full names, event-born pulses, and the D4 camera rules.
 */
import { describe, expect, it } from "vitest";
import { PULSE_TTL } from "../src/watch-phosphor";
import {
  STAGE_POLAR_MAX,
  STAGE_POLAR_MIN,
  buildStageModel,
  newStagePulses,
  stageBandLine,
  stageBandsFromMap,
  stageCameraLimits,
  stageCameraTarget,
  stageDefaultView,
  stageHandles,
  stageLabelText,
} from "../src/watch-stage-model";

const LIVE = {
  projection: "public",
  rooms: [
    {
      room_id: "room.civic-exchange",
      name: "Civic Exchange",
      active: true,
      players_present: 2,
      public_player_labels: ["reach-maint3", "player.secret-id", "Civic Exchange", "reach-maint3", "tester"],
      traces: [{ text: "A maintenance plate names Sable as the last repairer." }, { text: "" }],
      exits: [
        { direction: "east", to_room_id: "room.transit-ring", to_room_name: "Transit Ring" },
        { direction: "north", to_room_id: "room.relay-quarter", to_room_name: "Relay Quarter" },
        { direction: "south", to_room_id: "room.vault", hidden: true },
      ],
    },
    {
      room_id: "room.transit-ring",
      name: "Transit Ring",
      exits: [{ direction: "west", to_room_id: "room.civic-exchange" }],
    },
    {
      room_id: "room.relay-quarter",
      name: "Infrastructure Vault Annex North",
      exits: [],
    },
    { room_id: "room.vault", name: "Vault", hidden: true, exits: [{ direction: "north", to_room_id: "room.civic-exchange" }] },
  ],
  recent_events: [] as Array<{ sequence: number; tier?: string; room_id?: string }>,
};

describe("buildStageModel", () => {
  const model = buildStageModel(LIVE, { selectedId: "room.transit-ring", followRoomId: "room.civic-exchange" });
  const site = (id: string) => model.sites.find((s) => s.id === id)!;

  it("draws only public sites from the shared layout, centred on the origin", () => {
    expect(model.sites.map((s) => s.id).sort()).toEqual(["room.civic-exchange", "room.relay-quarter", "room.transit-ring"]);
    const cx = model.sites.reduce((s, x) => s + x.x, 0) / model.sites.length;
    const cz = model.sites.reduce((s, x) => s + x.z, 0) / model.sites.length;
    expect(Math.abs(cx)).toBeLessThan(1e-9);
    expect(Math.abs(cz)).toBeLessThan(1e-9);
    expect(JSON.stringify(model)).not.toContain("room.vault");
  });

  it("keeps compass placement: east is +x, north is -z", () => {
    expect(site("room.transit-ring").x).toBeGreaterThan(site("room.civic-exchange").x);
    expect(site("room.relay-quarter").z).toBeLessThan(site("room.civic-exchange").z);
  });

  it("labels sites by full public name and occupants by public handle only", () => {
    expect(site("room.relay-quarter").name).toBe("Infrastructure Vault Annex North");
    expect(site("room.civic-exchange").handles).toEqual(["reach-maint3", "tester"]);
    expect(site("room.civic-exchange").players).toBe(2);
    expect(site("room.civic-exchange").traces).toBe(1);
    expect(stageLabelText("room.secret-annex")).toBe("");
    expect(stageHandles({ name: "X", public_player_labels: ["ctrl.abc", " ok-handle "] })).toEqual(["ok-handle"]);
  });

  it("carries selection, follow, and activity state", () => {
    expect(site("room.transit-ring").selected).toBe(true);
    expect(site("room.civic-exchange").followed).toBe(true);
    expect(site("room.civic-exchange").active).toBe(true);
    expect(model.sites.filter((s) => s.major)).toHaveLength(0);
  });

  it("keeps public routes, never hidden ones, and marks one-way routes", () => {
    const key = (r: { from: string; to: string }) => [r.from, r.to].sort().join("|");
    const routes = new Map(model.routes.map((r) => [key(r), r]));
    expect(routes.has("room.civic-exchange|room.transit-ring")).toBe(true);
    expect(routes.get("room.civic-exchange|room.transit-ring")!.oneWay).toBe(false);
    expect(routes.get("room.civic-exchange|room.relay-quarter")!.oneWay).toBe(true);
    expect([...routes.keys()].some((k) => k.includes("room.vault"))).toBe(false);
  });

  it("handles an empty or non-public snapshot without throwing", () => {
    expect(buildStageModel(null).sites).toEqual([]);
    expect(buildStageModel({ rooms: [] }).routes).toEqual([]);
  });
});

describe("map bands (WS3-05)", () => {
  const MAP = {
    base: {
      rooms: [
        { room_id: "room.civic-exchange", scar_band: "deep", pressure_band: "high", protocol_band: "low" },
        { room_id: "room.transit-ring", scar_band: 0.73, pressure_band: "extreme", protocol_band: null },
        { room_id: "room.vault", scar_band: "marked", pressure_band: "moderate" },
      ],
    },
  };

  it("passes only documented band words, never raw numbers or unknown words", () => {
    const bands = stageBandsFromMap(MAP);
    expect(bands["room.civic-exchange"]).toEqual({ scar: "deep", pressure: "high", protocol: "low" });
    expect(bands["room.transit-ring"]).toBeUndefined();
    expect(stageBandsFromMap(null)).toEqual({});
    expect(stageBandsFromMap({ base: { rooms: "x" } })).toEqual({});
  });

  it("attaches bands only to sites the live snapshot makes public", () => {
    const model = buildStageModel(LIVE, { map: MAP });
    const civic = model.sites.find((s) => s.id === "room.civic-exchange")!;
    expect(civic.bands).toEqual({ scar: "deep", pressure: "high", protocol: "low" });
    expect(model.sites.find((s) => s.id === "room.transit-ring")!.bands).toEqual({ scar: "", pressure: "", protocol: "" });
    expect(JSON.stringify(model)).not.toContain("room.vault");
  });

  it("reads bands as plain words for the label", () => {
    expect(stageBandLine({ scar: "deep", pressure: "high", protocol: "low" })).toBe("scar deep · pressure high · protocol low");
    expect(stageBandLine({ scar: "", pressure: "moderate", protocol: "" })).toBe("pressure moderate");
    expect(stageBandLine({ scar: "", pressure: "", protocol: "" })).toBe("");
  });
});

describe("newStagePulses", () => {
  const ids = ["room.civic-exchange", "room.transit-ring"];
  const ev = (sequence: number, tier = "NORMAL", room_id = "room.civic-exchange") => ({ sequence, tier, room_id });

  it("never pulses on the first snapshot a window sees", () => {
    const r = newStagePulses([ev(5, "MAJOR"), ev(4)], null, ids);
    expect(r.pulses).toEqual([]);
    expect(r.lastSequence).toBe(5);
  });

  it("an empty first snapshot still sets the baseline, so the next event pulses", () => {
    const first = newStagePulses([], null, ids, { snapshotSequence: 100 });
    expect(first).toEqual({ pulses: [], lastSequence: 100 });
    const next = newStagePulses([ev(101, "MAJOR")], first.lastSequence, ids);
    expect(next.pulses.map((p) => [p.sequence, p.tier])).toEqual([[101, "MAJOR"]]);
    const bare = newStagePulses([], null, ids);
    expect(bare.lastSequence).toBe(0);
    expect(newStagePulses([ev(1)], bare.lastSequence, ids).pulses).toHaveLength(1);
  });

  it("a first snapshot's events and world sequence both count toward the baseline", () => {
    expect(newStagePulses([ev(5)], null, ids, { snapshotSequence: 3 }).lastSequence).toBe(5);
    expect(newStagePulses([ev(5)], null, ids, { snapshotSequence: 9 }).lastSequence).toBe(9);
  });

  it("pulses only events newer than the last applied sequence, at their tier lifetime", () => {
    const r = newStagePulses([ev(5), ev(6, "NOTABLE"), ev(7, "NORMAL", "room.transit-ring")], 5, ids);
    expect(r.pulses.map((p) => p.sequence)).toEqual([7, 6]);
    expect(r.pulses.find((p) => p.sequence === 6)!.ttl).toBe(PULSE_TTL.NOTABLE);
    expect(r.lastSequence).toBe(7);
  });

  it("keeps at most one MAJOR and three others, newest first", () => {
    const r = newStagePulses([ev(11, "MAJOR"), ev(12, "MAJOR"), ev(13), ev(14), ev(15), ev(16)], 10, ids);
    expect(r.pulses.filter((p) => p.tier === "MAJOR").map((p) => p.sequence)).toEqual([12]);
    expect(r.pulses.filter((p) => p.tier !== "MAJOR").map((p) => p.sequence)).toEqual([16, 15, 14]);
  });

  it("drops events at non-public sites and malformed sequences", () => {
    const r = newStagePulses([ev(11, "MAJOR", "room.vault"), { sequence: 1.5, room_id: "room.civic-exchange" }], 10, ids);
    expect(r.pulses).toEqual([]);
    expect(r.lastSequence).toBe(11);
  });

  it("advances without pulsing under reduced motion", () => {
    const r = newStagePulses([ev(11, "MAJOR")], 10, ids, { reduce: true });
    expect(r.pulses).toEqual([]);
    expect(r.lastSequence).toBe(11);
  });
});

describe("camera rules (D4)", () => {
  it("bounds orbit between 20° and 70° and scales zoom and pan to the layout", () => {
    const lim = stageCameraLimits(20);
    expect(lim.minPolarAngle).toBeCloseTo(STAGE_POLAR_MIN);
    expect(lim.maxPolarAngle).toBeCloseTo(STAGE_POLAR_MAX);
    expect(STAGE_POLAR_MIN).toBeCloseTo((20 * Math.PI) / 180);
    expect(STAGE_POLAR_MAX).toBeCloseTo((70 * Math.PI) / 180);
    expect(lim.maxTargetRadius).toBe(20);
    expect(lim.minDistance).toBeLessThan(lim.maxDistance);
  });

  it("default view sits inside the orbit bounds and frames the whole layout", () => {
    const v = stageDefaultView(20);
    const [x, y, z] = v.position;
    const d = Math.hypot(x, y, z);
    const polar = Math.acos(y / d);
    expect(polar).toBeGreaterThan(STAGE_POLAR_MIN);
    expect(polar).toBeLessThan(STAGE_POLAR_MAX);
    const lim = stageCameraLimits(20);
    expect(d).toBeGreaterThan(lim.minDistance);
    expect(d).toBeLessThan(lim.maxDistance);
  });

  it("moves for a new selection or Follow, and for a new MAJOR only if the spectator has not moved", () => {
    expect(stageCameraTarget({}, { selectedId: "a" }, "", true)).toBe("a");
    expect(stageCameraTarget({ selectedId: "a" }, { selectedId: "a" }, "", false)).toBe("");
    expect(stageCameraTarget({}, { followRoomId: "b" }, "m", true)).toBe("b");
    expect(stageCameraTarget({}, {}, "m", false)).toBe("m");
    expect(stageCameraTarget({}, {}, "m", true)).toBe("");
  });
});
