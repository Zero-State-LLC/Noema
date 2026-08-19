/**
 * OBSERVED live Perihelion public subgraph (GET /v1/watch/live 2026-08-18).
 * Five rooms. Not the chamber-world 10. Hidden rooms stay off the map.
 */
import { describe, expect, it } from "vitest";
import { buildWatchLive, capVisibleEvents, type WatchRoomIn } from "../src/watch-live";
import { isPublicWatchRoom, layoutPublicTopology } from "../src/watch-phosphor";

const LIVE_PUBLIC: WatchRoomIn[] = [
  {
    room_id: "room.ruin-shelf",
    name: "Dead Spur",
    description: "",
    exits: [{ direction: "west", to_room_id: "room.civic-exchange" }],
    entities: [{ entity_id: "e.1", label: "x", entity_type: "SITE" }],
  },
  {
    room_id: "room.infra-vault",
    name: "Black Channel",
    description: "",
    exits: [{ direction: "up", to_room_id: "room.relay-quarter" }],
    entities: [],
  },
  {
    room_id: "room.transit-ring",
    name: "Coldline",
    description: "",
    exits: [
      { direction: "west", to_room_id: "room.relay-quarter" },
      { direction: "north", to_room_id: "room.civic-exchange" },
    ],
    entities: [],
  },
  {
    room_id: "room.relay-quarter",
    name: "Grid Anchor",
    description: "",
    exits: [
      { direction: "east", to_room_id: "room.transit-ring" },
      { direction: "down", to_room_id: "room.infra-vault" },
    ],
    entities: [],
  },
  {
    room_id: "room.civic-exchange",
    name: "Contract Town",
    description: "",
    exits: [
      { direction: "south", to_room_id: "room.transit-ring" },
      { direction: "east", to_room_id: "room.ruin-shelf" },
    ],
    entities: [],
  },
];

describe("WATCH public Perihelion subgraph", () => {
  it("projects only the five live public rooms and drops hidden extras", () => {
    const rooms: Record<string, WatchRoomIn> = Object.fromEntries(
      LIVE_PUBLIC.map((r) => [r.room_id, r]),
    );
    rooms["room.hidden-vault"] = {
      room_id: "room.hidden-vault",
      name: "Not Public",
      description: "",
      hidden: true,
      exits: [{ direction: "south", to_room_id: "room.relay-quarter" }],
      entities: [],
    };
    rooms["room.relay-quarter"].exits.push({
      direction: "north",
      to_room_id: "room.hidden-vault",
      hidden: true,
    });
    const snap = buildWatchLive({
      world_id: "world.perihelion-reach",
      cycle: 105,
      sequence: 303,
      rooms,
      players: [],
      events: [],
    });
    const ids = (snap.rooms as Array<{ room_id: string }>).map((r) => r.room_id).sort();
    expect(ids).toEqual([
      "room.civic-exchange",
      "room.infra-vault",
      "room.relay-quarter",
      "room.ruin-shelf",
      "room.transit-ring",
    ]);
    expect(ids).toHaveLength(5);
    expect(ids).not.toContain("room.hidden-vault");
    const names = (snap.rooms as Array<{ name: string }>).map((r) => r.name);
    expect(names).toEqual(expect.arrayContaining(["Grid Anchor", "Contract Town", "Coldline", "Dead Spur", "Black Channel"]));
    const relay = (snap.rooms as Array<{ room_id: string; exits: Array<{ to_room_id: string }> }>).find(
      (r) => r.room_id === "room.relay-quarter",
    );
    expect(relay?.exits.map((e) => e.to_room_id).sort()).toEqual(["room.infra-vault", "room.transit-ring"]);
    expect(JSON.stringify(snap)).not.toMatch(/room\.hidden-vault|chamber-world|room\.archive/);
  });

  it("phosphor layout labels only public rooms", () => {
    const hidden = { room_id: "room.secret", name: "Secret", hidden: true, tags: ["hidden"] };
    expect(isPublicWatchRoom(hidden)).toBe(false);
    const layout = layoutPublicTopology(
      [...LIVE_PUBLIC, hidden],
      [{ sequence: 1, cycle: 105, tier: "NORMAL", projection_id: "agent_move", line: "moved", room_id: "room.relay-quarter" }],
    );
    const laid = Object.keys(layout.nodes || layout.rooms || {}).length
      ? Object.keys((layout as { nodes?: Record<string, unknown> }).nodes || {})
      : (layout as { rooms?: Array<{ room_id: string }> }).rooms?.map((r) => r.room_id);
    // layout returns nodes array
    const nodeIds = Array.isArray((layout as { nodes?: Array<{ room_id: string }> }).nodes)
      ? (layout as { nodes: Array<{ room_id: string }> }).nodes.map((n) => n.room_id)
      : laid;
    expect(nodeIds).not.toContain("room.secret");
    expect((nodeIds || []).length).toBeLessThanOrEqual(5);
  });

  it("keeps recent events on the existing 8-cap contract", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      sequence: 300 + i,
      cycle: 105,
      tier: "NORMAL" as const,
      projection_id: "production",
      line: `Public activity ${i}`,
    }));
    const capped = capVisibleEvents(many);
    expect(capped.length).toBeLessThanOrEqual(8);
    expect(capped.length).toBeGreaterThan(0);
  });
});
