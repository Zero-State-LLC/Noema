import { describe, expect, it } from "vitest";
import { buildWatchLive } from "../src/watch-live";
import {
  buildWatchMap,
  pressureBand,
  registerWatchMapLayer,
  scarBand,
  watchMapLayerCatalog,
  WATCH_MAP_PIN,
} from "../src/watch-map";
import { watchMapHtml } from "../src/watch-map-page";
import { isPublicReadPath } from "../src/cors";

function liveFixture() {
  return buildWatchLive({
    world_id: "world.test",
    cycle: 4,
    sequence: 9,
    rooms: {
      "room.hub": { room_id: "room.hub", name: "Hub", description: "", exits: [], entities: [] },
      "room.east": { room_id: "room.east", name: "East", description: "", exits: [], entities: [] },
      "room.vault": { room_id: "room.vault", name: "Vault", description: "", hidden: true, exits: [], entities: [] },
    },
    players: [{ player_id: "player.a", handle: "a", room_id: "room.hub", entered: true, last_seen_ms: Date.now() }],
    events: [{ event_type: "MESSAGE", sequence: 9, cycle: 4, handle: "a", line: "hello" } as never],
  });
}

describe("watch-map/1.0", () => {
  it("layers include the spec table and accept an extension layer", () => {
    const ids = watchMapLayerCatalog().map((l) => l.id);
    expect(ids).toEqual(expect.arrayContaining(["base", "activity", "state", "entity", "event", "narrative", "health", "delight"]));
    registerWatchMapLayer({ id: "test-ext", z: 9, label: "Test", toggle: true, glanceable: "ext" });
    expect(watchMapLayerCatalog().some((l) => l.id === "test-ext")).toBe(true);
  });

  it("bands map raw values without leaking them", () => {
    expect(scarBand(0.01)).toBeNull();
    expect(scarBand(0.05)).toBe("faint");
    expect(scarBand(0.4)).toBe("marked");
    expect(scarBand(0.9)).toBe("deep");
    expect(pressureBand(0)).toBeNull();
    expect(pressureBand(3)).toBe("low");
    expect(pressureBand(8.16)).toBe("moderate");
    expect(pressureBand(40)).toBe("high");
  });

  it("scar residue is public-only, banded, floored; no reputation fields", () => {
    const map = buildWatchMap({
      live: liveFixture(),
      scars: [
        { room_id: "room.hub", strength: 0.5, visibility: "public", domain: "economic" },
        { room_id: "room.east", strength: 0.9, visibility: "hidden", domain: "social" },
        { room_id: "room.east", strength: 0.01, visibility: "public", domain: "economic" },
      ],
      harvest_pressure: { "room.hub": 3 },
    });
    expect(map.watch_map).toBe(WATCH_MAP_PIN);
    const nodes = (map.base as { rooms: Array<{ room_id: string; scar_band: string | null; pressure_band: string | null }> }).rooms;
    const hub = nodes.find((n) => n.room_id === "room.hub");
    const east = nodes.find((n) => n.room_id === "room.east");
    expect(hub?.scar_band).toBe("marked");
    expect(hub?.pressure_band).toBe("low");
    // hidden scar and below-public-floor scar never band
    expect(east?.scar_band).toBeNull();
    const text = JSON.stringify(map);
    expect(text).not.toMatch(/image_score/);
    expect(text).not.toMatch(/reputation_summary/);
    expect(text).not.toMatch(/second_order/);
    expect((map.health as { scar_band: string }).scar_band).toBe("marked");
    expect(Array.isArray((map.event as { river: unknown[] }).river)).toBe(true);
  });

  it("§7: hidden-room keys in source maps never reach the wire", () => {
    const map = buildWatchMap({
      live: liveFixture(),
      scars: [{ room_id: "room.secret-annex", strength: 0.9, visibility: "public", domain: "economic" }],
      harvest_pressure: { "room.secret-annex": 40, "room.never-published": 9, "room.hub": 2 },
      protocol_strength: { "room.secret-annex": 12 },
    });
    const text = JSON.stringify(map);
    // room.vault is hidden upstream (buildWatchLive), the others exist only in
    // the raw source maps — none of them may serialize.
    expect(text).not.toContain("room.vault");
    expect(text).not.toContain("room.secret-annex");
    expect(text).not.toContain("room.never-published");
    const state = map.state as { rooms: Record<string, unknown> };
    expect(Object.keys(state.rooms)).toEqual(["room.hub"]);
  });

  it("§7: no raw counters, amounts, or research metrics on the public wire", () => {
    const map = buildWatchMap({
      live: liveFixture(),
      scars: [{ room_id: "room.hub", strength: 0.37, visibility: "public", domain: "economic" }],
      harvest_pressure: { "room.hub": 8.161139200000001 },
      protocol_strength: { "room.hub": 2.5 },
    });
    const text = JSON.stringify(map);
    expect(text).not.toContain("8.16");
    expect(text).not.toContain("0.37");
    expect(text).not.toContain("2.5");
    expect(text).not.toMatch(/harvest_pressure|protocol_strength|scar_residue/);
    expect(text).not.toMatch(/path_dependence_index|cascading_risk|stock_velocity|scar_persistence/);
  });

  it("page builds DOM safely and the JSON alias is public-read", () => {
    const html = watchMapHtml();
    expect(html).not.toContain(".innerHTML");
    expect(html).toContain("replaceChildren");
    expect(html).toContain("textContent");
    expect(html).not.toContain("#7a4");
    expect(isPublicReadPath("/watch/map.json")).toBe(true);
    expect(isPublicReadPath("/v1/watch/map")).toBe(true);
  });
});

describe("mapping v0.1.1 integration (spec §5.1/§6.1 + de-orphan)", () => {
  it("registry validates, dedups by id, never shadows core, and unregisters", async () => {
    const { registerWatchMapLayer, unregisterWatchMapLayer, watchMapLayerCatalog } = await import("../src/watch-map");
    const count = () => watchMapLayerCatalog().length;
    const base = count();
    registerWatchMapLayer({ id: "", z: 20, label: "bad", toggle: true, glanceable: "" });
    registerWatchMapLayer({ id: "state", z: 21, label: "shadow", toggle: true, glanceable: "" });
    expect(count()).toBe(base);
    registerWatchMapLayer({ id: "ext-a", z: 22, label: "A", toggle: true, glanceable: "a" });
    registerWatchMapLayer({ id: "ext-a", z: 23, label: "A2", toggle: true, glanceable: "a2" });
    expect(count()).toBe(base + 1);
    expect(watchMapLayerCatalog().find((l) => l.id === "ext-a")?.label).toBe("A2");
    unregisterWatchMapLayer("ext-a");
    expect(count()).toBe(base);
  });

  it("page ships a pause control and only working layer toggles", () => {
    const html = watchMapHtml();
    expect(html).toContain('id="map-pause"');
    expect(html).toContain("!paused && !document.hidden");
    expect(html).toContain("HIDEABLE = { activity: 1, state: 1, event: 1, health: 1, narrative: 1 }");
    expect(html).toContain("min-height:8rem");
  });

  it("/watch links to the map (route is no longer an orphan)", async () => {
    const { watchHtml } = await import("../src/watch");
    expect(watchHtml()).toContain('href="/watch/map"');
  });
});
