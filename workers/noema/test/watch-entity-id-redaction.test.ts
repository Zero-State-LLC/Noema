/**
 * Entity ids stay off the public spectator wire.
 *
 * WATCH-LIGHTWEIGHT-SPECTATOR pins `rooms[].entities[]` to public entity fields
 * and separately forbids `source_state_ref`, entity ids, and player ids on
 * `rooms[].traces[]`. The projection nonetheless shipped `entity_id`, so ids
 * like `entity.salvage-cache` were public on /v1/watch/live (observed live
 * 2026-09-01, Worker c681fd71).
 *
 * It was there for a `label || entity_id` fallback in the spectator page that
 * cannot fire: `label` is required on EntityRuntime, so the branch is
 * unreachable and the field was publishing an internal identifier to satisfy
 * nothing. `glyph` stays -- it is required by the §18 glyph catalog and read by
 * the theater and phosphor renderers.
 */
import { describe, expect, it } from "vitest";
import { buildWatchLive } from "../src/watch-live";

function live() {
  return buildWatchLive({
    world_id: "world.test",
    cycle: 3,
    sequence: 7,
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "A public hub.",
        exits: [],
        entities: [
          { entity_id: "entity.salvage-cache", label: "salvage-cache", entity_type: "NODE" },
          {
            entity_id: "entity.ghost",
            label: "ghost-coil",
            entity_type: "INFRASTRUCTURE",
            hidden: true,
          },
        ],
      },
    },
    players: [],
    events: [],
  });
}

type PublicEntity = { label?: string; entity_type?: string; glyph?: string };
type PublicRoom = { room_id?: string; entities?: PublicEntity[] };

/** buildWatchLive returns Record<string, unknown>; read rooms through a shape. */
function hubEntities(): PublicEntity[] {
  const rooms = (live().rooms as PublicRoom[]) || [];
  const hub = rooms.find((r) => r.room_id === "room.hub");
  return hub?.entities || [];
}

describe("public entity projection", () => {
  it("carries the pinned public fields", () => {
    const ent = hubEntities()[0] as Record<string, unknown>;
    expect(ent.label).toBe("salvage-cache");
    expect(ent.entity_type).toBe("NODE");
    // §18 glyph catalog: the marker the renderers draw from.
    expect(ent.glyph).toBeTruthy();
  });

  it("does not put entity ids on the wire", () => {
    for (const ent of hubEntities()) {
      expect(Object.keys(ent as Record<string, unknown>)).not.toContain("entity_id");
    }
    // Nothing anywhere in the snapshot may carry a raw entity id for a room entity.
    expect(JSON.stringify(live())).not.toContain("entity.salvage-cache");
  });

  it("still omits hidden entities entirely", () => {
    const blob = JSON.stringify(live());
    expect(blob).not.toContain("ghost-coil");
    expect(blob).not.toContain("entity.ghost");
  });
});
