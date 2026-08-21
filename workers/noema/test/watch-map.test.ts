import { describe, expect, it } from "vitest";
import { buildWatchLive } from "../src/watch-live";
import { buildWatchMap, registerWatchMapLayer, watchMapLayerCatalog, WATCH_MAP_PIN } from "../src/watch-map";

describe("watch-map/1.0", () => {
  it("layers include the spec table and accept an extension layer", () => {
    const ids = watchMapLayerCatalog().map((l) => l.id);
    expect(ids).toEqual(expect.arrayContaining(["base", "activity", "state", "entity", "event", "narrative", "health", "delight"]));
    registerWatchMapLayer({ id: "test-ext", z: 9, label: "Test", toggle: true, glanceable: "ext" });
    expect(watchMapLayerCatalog().some((l) => l.id === "test-ext")).toBe(true);
  });

  it("scar residue is public-only; no reputation fields", () => {
    const live = buildWatchLive({
      world_id: "world.test",
      cycle: 4,
      sequence: 9,
      rooms: {
        "room.hub": { room_id: "room.hub", name: "Hub", description: "", exits: [], entities: [] },
        "room.east": { room_id: "room.east", name: "East", description: "", exits: [], entities: [] },
      },
      players: [{ player_id: "player.a", handle: "a", room_id: "room.hub", entered: true, last_seen_ms: Date.now() }],
      events: [{ event_type: "MESSAGE", sequence: 9, cycle: 4, handle: "a", line: "hello" } as never],
    });
    const map = buildWatchMap({
      live,
      scars: [
        { room_id: "room.hub", strength: 0.5, visibility: "public", domain: "economic" },
        { room_id: "room.east", strength: 0.9, visibility: "hidden", domain: "social" },
      ],
      harvest_pressure: { "room.hub": 3 },
    });
    expect(map.watch_map).toBe(WATCH_MAP_PIN);
    const nodes = (map.base as { rooms: Array<{ room_id: string; scar_residue: number }> }).rooms;
    const hub = nodes.find((n) => n.room_id === "room.hub");
    const east = nodes.find((n) => n.room_id === "room.east");
    expect(hub?.scar_residue).toBe(0.5);
    expect(east?.scar_residue).toBe(0);
    const text = JSON.stringify(map);
    expect(text).not.toMatch(/image_score/);
    expect(text).not.toMatch(/reputation_summary/);
    expect(text).not.toMatch(/second_order/);
    expect((map.health as { scar_activity: number }).scar_activity).toBe(0.5);
    expect(Array.isArray((map.event as { river: unknown[] }).river)).toBe(true);
  });
});
