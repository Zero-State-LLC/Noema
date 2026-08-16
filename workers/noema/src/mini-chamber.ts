/**
 * Isolated three-room seed for hosted C03/C04/C25.
 * Not Perihelion. Production PLAY never loads this via DEFAULT_WORLD_ID.
 */
import { enrichEntity } from "./actions";
import type { RoomState, WorldRuntime } from "./world-actions";

export const MINI_ENTRY_ROOM_ID = "room.anchor";
export const MINI_HALL_ROOM_ID = "room.hall";
export const MINI_DEADEND_ROOM_ID = "room.deadend";

export const MINI_ROOMS: Record<string, RoomState> = {
  [MINI_ENTRY_ROOM_ID]: {
    room_id: MINI_ENTRY_ROOM_ID,
    name: "Anchor",
    description: "A small public landing. East is a hall. There is no down route.",
    exits: [{ direction: "east", to_room_id: MINI_HALL_ROOM_ID }],
    entities: [
      enrichEntity({
        entity_id: "entity.way-lamp",
        label: "way-lamp",
        entity_type: "PROP",
      }),
    ],
  },
  [MINI_HALL_ROOM_ID]: {
    room_id: MINI_HALL_ROOM_ID,
    name: "Hall",
    description: "A short public corridor. West returns to the Anchor.",
    exits: [{ direction: "west", to_room_id: MINI_ENTRY_ROOM_ID }],
    entities: [],
  },
  [MINI_DEADEND_ROOM_ID]: {
    room_id: MINI_DEADEND_ROOM_ID,
    name: "Sealed Well",
    description: "Not for spectators.",
    hidden: true,
    tags: ["hidden"],
    exits: [{ direction: "up", to_room_id: MINI_HALL_ROOM_ID }],
    entities: [
      enrichEntity({
        entity_id: "entity.sealed-cache",
        label: "sealed-cache",
        entity_type: "PROP",
      }),
    ],
  },
};

export function miniChamberState(world_id: string): WorldRuntime {
  const rooms = structuredClone(MINI_ROOMS) as Record<string, RoomState>;
  for (const room of Object.values(rooms)) {
    room.entities = room.entities.map((e) => enrichEntity(e));
  }
  return {
    world_id,
    world_name: "Mini Chamber",
    world_seed: "mini-chamber-h2",
    cycle: 0,
    sequence: 0,
    entry_room_id: MINI_ENTRY_ROOM_ID,
    rooms,
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
  };
}
