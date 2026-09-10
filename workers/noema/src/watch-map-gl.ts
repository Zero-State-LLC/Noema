/**
 * MAP P0 Direct-Camera + head parity. Leaves for the /watch IIFE.
 * No Three.js here — TEXT/PIXEL never pay the GL chunk.
 * Specs: WATCH-REAL-TIME-MAPPING §3.3 after Noema-Specs #336.
 */

/** Match Phosphor NOTABLE pulse (560ms), inside the 400–600ms camera window. */
export const MAP_CAM_EASE_MS = 560;
export const MAP_GL_SRC = "/assets/watch-map-gl.js";
export const MAP_PARITY_LINE = "Map overlay is behind the live window.";

export const MAP_GL_CSS = `
.map-gl{
  display:block;width:100%;max-width:none;height:auto;
  aspect-ratio:16/9;min-height:min(52vh,28rem);
  background:var(--void);border:1px solid var(--line);
}
.map-gl[hidden]{display:none}
.map-parity{margin:.35rem 0 0;color:var(--color-state-warning);font:.74rem/1.4 var(--font-mono)}
.map-parity[hidden]{display:none}
.map-node.is-follow{outline:2px solid var(--color-state-active)}
.map-node.is-cam{box-shadow:0 0 0 2px color-mix(in srgb,var(--color-state-warning) 55%,transparent)}
`;

export type MapCamHead = {
  tier?: string;
  room_id?: string;
  projection_id?: string;
  actor_label?: string;
};

export type MapCamExit = { to_room_id?: string };

export type MapCamRoom = {
  room_id?: string;
  name?: string;
  x?: unknown;
  y?: unknown;
  players_present?: unknown;
  public_player_labels?: unknown;
  exits?: MapCamExit[] | unknown;
  active?: unknown;
};

export type MapCamFollow = { kind?: string; id?: string } | null;

/** Public room_id only. Empty if missing or not on the snapshot. */
export function mapPublicRoomId(
  rooms?: MapCamRoom[] | null,
  roomId?: string | null,
): string {
  const id = String(roomId || "").trim();
  if (!id) return "";
  const list = Array.isArray(rooms) ? rooms : [];
  for (let i = 0; i < list.length; i++) {
    if (String((list[i] && list[i].room_id) || "") === id) return id;
  }
  return "";
}

/** NOTABLE/MAJOR with a public room_id. Missing site stays put — never invent. */
export function mapActionCameraRoom(
  head?: MapCamHead | null,
  rooms?: MapCamRoom[] | null,
): string {
  const tier = String((head && head.tier) || "").toUpperCase();
  if (tier !== "NOTABLE" && tier !== "MAJOR") return "";
  return mapPublicRoomId(rooms, head && head.room_id);
}

/** Followed agent's newest public MOVE. Emphasis only — does not filter a feed. */
export function mapFollowMoveRoom(
  follow?: MapCamFollow,
  events?: Array<MapCamHead | null | undefined> | null,
  rooms?: MapCamRoom[] | null,
): string {
  if (!follow || follow.kind !== "agent" || !follow.id) return "";
  const list = Array.isArray(events) ? events : [];
  for (let i = 0; i < list.length; i++) {
    const ev = list[i];
    if (!ev) continue;
    if (String(ev.projection_id || "") !== "agent_move") continue;
    if (String(ev.actor_label || "") !== follow.id) continue;
    const hit = mapPublicRoomId(rooms, ev.room_id);
    if (hit) return hit;
  }
  return "";
}

export function mapFollowedRoomId(follow?: MapCamFollow, rooms?: MapCamRoom[] | null): string {
  if (!follow || !follow.id) return "";
  const list = Array.isArray(rooms) ? rooms : [];
  if (follow.kind === "site") return mapPublicRoomId(list, follow.id);
  if (follow.kind !== "agent") return "";
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    const labels = r && Array.isArray(r.public_player_labels) ? r.public_player_labels : [];
    if (labels.indexOf(follow.id) >= 0) return String((r && r.room_id) || "");
  }
  return "";
}

/** Action magnet wins. Else follow MOVE. Else stay (empty). */
export function mapCameraTarget(opts: {
  head?: MapCamHead | null;
  rooms?: MapCamRoom[] | null;
  events?: Array<MapCamHead | null | undefined> | null;
  follow?: MapCamFollow;
}): string {
  const action = mapActionCameraRoom(opts.head, opts.rooms);
  if (action) return action;
  return mapFollowMoveRoom(opts.follow, opts.events, opts.rooms);
}

export function mapCameraEaseMs(reduce?: boolean | null): number {
  return reduce ? 0 : MAP_CAM_EASE_MS;
}

export function mapHeadsDisagree(
  live?: { world_id?: unknown; cycle?: unknown; sequence?: unknown; freshness?: unknown } | null,
  map?: { world_id?: unknown; cycle?: unknown; sequence?: unknown; freshness?: unknown } | null,
): boolean {
  if (!live || !map) return false;
  if (String(live.world_id || "") !== String(map.world_id || "")) return true;
  if (String(live.cycle ?? "") !== String(map.cycle ?? "")) return true;
  if (String(live.sequence ?? "") !== String(map.sequence ?? "")) return true;
  if (String(live.freshness || "live") !== String(map.freshness || "live")) return true;
  return false;
}

export function mapGlUsable(canvas?: { getContext?: (id: string) => unknown } | null): boolean {
  if (!canvas || !canvas.getContext) return false;
  try {
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return !!gl;
  } catch (e) {
    return false;
  }
}

export function mapNodeClassName(
  n?: MapCamRoom | null,
  camId?: string | null,
  followId?: string | null,
): string {
  let c = "map-node";
  if (n && n.active) c += " is-active";
  const id = String((n && n.room_id) || "");
  if (id && camId && id === camId) c += " is-cam";
  if (id && followId && id === followId) c += " is-follow";
  return c;
}

/**
 * Live rooms are SoT. Map JSON may supply x/y for the same public ids.
 * Never add a room that is not already on the live snapshot.
 */
export function mapPublicExitTarget(toRoomId?: string | null, liveIds?: Record<string, number> | null): string {
  const to = String(toRoomId || "");
  if (!to || !liveIds || !liveIds[to]) return "";
  return to;
}

export function mapStageNodes(
  liveRooms?: MapCamRoom[] | null,
  mapRooms?: MapCamRoom[] | null,
): MapCamRoom[] {
  const byId: Record<string, MapCamRoom> = {};
  const liveIds: Record<string, number> = {};
  const maps = Array.isArray(mapRooms) ? mapRooms : [];
  for (let i = 0; i < maps.length; i++) {
    const id = String((maps[i] && maps[i].room_id) || "");
    if (id) byId[id] = maps[i];
  }
  const lives = Array.isArray(liveRooms) ? liveRooms : [];
  for (let i = 0; i < lives.length; i++) {
    const id = String((lives[i] && lives[i].room_id) || "");
    if (id) liveIds[id] = 1;
  }
  const out: MapCamRoom[] = [];
  for (let i = 0; i < lives.length; i++) {
    const r = lives[i];
    if (!r || !r.room_id) continue;
    const m = byId[r.room_id];
    const x = m && Number.isFinite(Number(m.x)) ? Number(m.x) : i % 4;
    const y = m && Number.isFinite(Number(m.y)) ? Number(m.y) : Math.floor(i / 4);
    const rawExits = Array.isArray(r.exits) ? r.exits : [];
    const exits: MapCamExit[] = [];
    for (let e = 0; e < rawExits.length; e++) {
      const ex = rawExits[e] || {};
      const to = mapPublicExitTarget(ex.to_room_id, liveIds);
      if (!to) continue;
      exits.push({ to_room_id: to });
    }
    out.push({
      room_id: r.room_id,
      name: r.name || r.room_id,
      x,
      y,
      players_present: Number(r.players_present || 0),
      public_player_labels: r.public_player_labels,
      exits,
      active: Boolean(r.active),
    });
  }
  return out;
}

const MAP_GL_INLINE_FNS = [
  mapPublicRoomId,
  mapPublicExitTarget,
  mapActionCameraRoom,
  mapFollowMoveRoom,
  mapFollowedRoomId,
  mapCameraTarget,
  mapCameraEaseMs,
  mapHeadsDisagree,
  mapGlUsable,
  mapNodeClassName,
  mapStageNodes,
] as const;

export function watchMapGlInlineSource(): string {
  return MAP_GL_INLINE_FNS.map((fn) => {
    const src = fn.toString();
    if (src.includes("__name")) {
      throw new Error("watch map-gl helper leaked bundler keepNames");
    }
    return src;
  }).join("\n");
}
