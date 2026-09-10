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
.map-gl-frame{position:relative;min-width:0;isolation:isolate}
.map-gl{
  display:block;width:100%;max-width:none;height:auto;
  aspect-ratio:16/9;min-height:min(52vh,28rem);
  background:var(--panel);border:1px solid var(--line-hot);
  position:relative;z-index:0; /* WebGL layer otherwise covers sibling labels */
}
.map-gl[hidden]{display:none}
.map-labels{
  position:absolute;inset:0;z-index:1;margin:0;padding:0;list-style:none;
  pointer-events:none;overflow:hidden;
}
.map-labels[hidden]{display:none}
.map-room-label{
  position:absolute;transform:translate(-50%,.28rem);
  max-width:9.5rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  color:var(--ink);font:550 .68rem/1.2 var(--font-mono);
  text-shadow:0 1px 2px var(--void);
}
.map-room-label.is-focus{color:var(--color-state-active);font-weight:650}
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

export const MAP_ROOM_GAP = 2.2;
export const MAP_CAM_FOV_DEG = 40;
export const MAP_CAM_PAD = 1.4;

export type MapCamPose = {
  eyeX: number;
  eyeY: number;
  eyeZ: number;
  lookX: number;
  lookY: number;
  lookZ: number;
};

export type MapCamBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  cx: number;
  cz: number;
  span: number;
};

/** World-space AABB of public rooms. Empty graph collapses to the origin. */
export function mapGraphBounds(rooms?: Array<{ x?: unknown; y?: unknown } | null> | null): MapCamBounds {
  const list = Array.isArray(rooms) ? rooms : [];
  let minX = 0;
  let maxX = 0;
  let minZ = 0;
  let maxZ = 0;
  let n = 0;
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    if (!r) continue;
    const x = Number(r.x || 0) * MAP_ROOM_GAP;
    const z = Number(r.y || 0) * MAP_ROOM_GAP;
    if (!n) {
      minX = x;
      maxX = x;
      minZ = z;
      maxZ = z;
    } else {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    n += 1;
  }
  const spanX = maxX - minX + 1.2;
  const spanZ = maxZ - minZ + 1.2;
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    cx: (minX + maxX) / 2,
    cz: (minZ + maxZ) / 2,
    span: Math.max(spanX, spanZ, 2.2),
  };
}

/**
 * Fit the room graph in frame with padding. Look-at is the focus room or the
 * centroid — never a corner that leaves the upper canvas empty.
 */
export function mapCameraPose(opts?: {
  rooms?: Array<{ room_id?: string; x?: unknown; y?: unknown } | null> | null;
  focusId?: string | null;
  aspect?: number | null;
} | null): MapCamPose {
  const rooms = opts && Array.isArray(opts.rooms) ? opts.rooms : [];
  const b = mapGraphBounds(rooms);
  let lookX = b.cx;
  let lookZ = b.cz;
  const focus = opts ? String(opts.focusId || "") : "";
  if (focus) {
    for (let i = 0; i < rooms.length; i++) {
      const r = rooms[i];
      if (r && String(r.room_id || "") === focus) {
        lookX = Number(r.x || 0) * MAP_ROOM_GAP;
        lookZ = Number(r.y || 0) * MAP_ROOM_GAP;
        break;
      }
    }
  }
  const aspect = opts && Number(opts.aspect) > 0.25 ? Number(opts.aspect) : 16 / 9;
  const half = b.span * 0.5 + MAP_CAM_PAD;
  const fov = (MAP_CAM_FOV_DEG * Math.PI) / 180;
  const fitH = half / Math.tan(fov * 0.5);
  const fitW = half / (Math.tan(fov * 0.5) * aspect);
  const dist = Math.max(fitH, fitW, 6.4);
  const dx = 0.64;
  const dy = 0.68;
  const dz = 0.8;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const lookY = 0.55;
  return {
    eyeX: lookX + (dx / len) * dist,
    eyeY: lookY + (dy / len) * dist,
    eyeZ: lookZ + (dz / len) * dist,
    lookX,
    lookY,
    lookZ,
  };
}

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
      name: r.name || (m && m.name) || "",
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

/** Public site title only. Raw room.* ids and empty names stay off the sketch. */
export function mapRoomLabelText(name?: string | null): string {
  const t = String(name || "").trim().replace(/[<>&"'`]/g, "").replace(/[\u0000-\u001f\u007f]/g, "");
  if (!t) return "";
  if (/^room\./i.test(t)) return "";
  return t.length > 32 ? t.slice(0, 32) : t;
}

export type MapLabelItem = {
  id: string;
  name: string;
  x: number;
  y: number;
  focus: boolean;
};

/**
 * Project a world point through the Direct-Camera pose. Matches Three.js
 * PerspectiveCamera + lookAt (Y-up, camera looks down −Z).
 */
export function mapProjectPoint(opts?: {
  x?: number | null;
  y?: number | null;
  z?: number | null;
  pose?: MapCamPose | null;
  aspect?: number | null;
  width?: number | null;
  height?: number | null;
  fovDeg?: number | null;
} | null): { x: number; y: number; visible: boolean } {
  const o = opts || {};
  const pose = o.pose;
  const width = Number(o.width || 0);
  const height = Number(o.height || 0);
  if (!pose || width < 2 || height < 2) return { x: 0, y: 0, visible: false };
  const wx = Number(o.x || 0);
  const wy = Number(o.y || 0);
  const wz = Number(o.z || 0);
  const dx = wx - pose.eyeX;
  const dy = wy - pose.eyeY;
  const dz = wz - pose.eyeZ;
  let zx = pose.eyeX - pose.lookX;
  let zy = pose.eyeY - pose.lookY;
  let zz = pose.eyeZ - pose.lookZ;
  let zlen = Math.sqrt(zx * zx + zy * zy + zz * zz);
  if (!(zlen > 1e-8)) return { x: 0, y: 0, visible: false };
  zx /= zlen;
  zy /= zlen;
  zz /= zlen;
  let xx = zz;
  let xy = 0;
  let xz = -zx;
  let xlen = Math.sqrt(xx * xx + xy * xy + xz * xz);
  if (!(xlen > 1e-8)) return { x: 0, y: 0, visible: false };
  xx /= xlen;
  xy /= xlen;
  xz /= xlen;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  const viewX = dx * xx + dy * xy + dz * xz;
  const viewY = dx * yx + dy * yy + dz * yz;
  const viewZ = dx * zx + dy * zy + dz * zz;
  if (!(viewZ < 0)) return { x: 0, y: 0, visible: false };
  const aspect = Number(o.aspect) > 0.25 ? Number(o.aspect) : width / height;
  const fov = Number(o.fovDeg) > 1 ? Number(o.fovDeg) : MAP_CAM_FOV_DEG;
  const f = 1 / Math.tan((fov * Math.PI) / 360);
  const ndcX = ((f / aspect) * viewX) / -viewZ;
  const ndcY = (f * viewY) / -viewZ;
  const sx = (ndcX * 0.5 + 0.5) * width;
  const sy = (-ndcY * 0.5 + 0.5) * height;
  const visible = ndcX >= -1.15 && ndcX <= 1.15 && ndcY >= -1.15 && ndcY <= 1.15;
  return { x: sx, y: sy, visible };
}

/** Public names only, screen-projected. Missing titles never become fake rooms. */
export function mapLabelScreenItems(opts?: {
  rooms?: Array<{ room_id?: string; name?: string; x?: unknown; y?: unknown } | null> | null;
  pose?: MapCamPose | null;
  aspect?: number | null;
  width?: number | null;
  height?: number | null;
  focusId?: string | null;
} | null): MapLabelItem[] {
  const o = opts || {};
  const rooms = Array.isArray(o.rooms) ? o.rooms : [];
  const pose = o.pose || null;
  const width = Number(o.width || 0);
  const height = Number(o.height || 0);
  const aspect = Number(o.aspect) > 0.25 ? Number(o.aspect) : width > 2 && height > 2 ? width / height : 16 / 9;
  const focus = String(o.focusId || "");
  const out: MapLabelItem[] = [];
  if (!pose || width < 2 || height < 2) return out;
  for (let i = 0; i < rooms.length; i++) {
    const r = rooms[i];
    if (!r) continue;
    const id = String(r.room_id || "");
    const name = mapRoomLabelText(r.name);
    if (!name) continue;
    const p = mapProjectPoint({
      x: Number(r.x || 0) * MAP_ROOM_GAP,
      y: 0.82,
      z: Number(r.y || 0) * MAP_ROOM_GAP,
      pose,
      aspect,
      width,
      height,
    });
    if (!p.visible) continue;
    out.push({ id, name, x: p.x, y: p.y, focus: !!id && id === focus });
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
  mapRoomLabelText,
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
