/**
 * WATCH Chamber stage model (Noema-Specs specify/watch-single-3d-stage.md).
 * Pure: turns one public watch-live snapshot into what the 3D stage draws.
 * It reuses the Phosphor public layout (WS3-01) and never invents rooms,
 * routes or identities (WS3-02). The browser renderer lives in
 * watch-stage-client.js and is bundled to STAGE_SRC.
 */

import {
  PULSE_TTL,
  isPublicWatchRoom,
  layoutPublicTopology,
  type PhosphorCertainty,
  type PhosphorEvent,
  type PhosphorRoom,
  type PhosphorTier,
} from "./watch-phosphor";

export const STAGE_SRC = "/assets/watch-stage.js";
/** D5: the stage chunk stays at or under this gzip size. */
export const STAGE_GZIP_BUDGET = 160 * 1024;
/** World units per Phosphor layout grid step. */
export const STAGE_SPACING = 4;
/** D4: orbit stays between 20° and 70° from vertical. */
export const STAGE_POLAR_MIN = (20 * Math.PI) / 180;
export const STAGE_POLAR_MAX = (70 * Math.PI) / 180;
/** D4: Direct-Camera eases within the NOTABLE pulse lifetime. */
export const STAGE_CAMERA_EASE_MS = PULSE_TTL.NOTABLE;
/** §18.6 caps: one MAJOR plus at most three others per update. */
export const STAGE_MAX_MINOR_PULSES = 3;

export const STAGE_FALLBACK_LINE = "3D view is unavailable here. Showing the text map.";

type LiveRoom = PhosphorRoom & {
  traces?: Array<{ text?: unknown } | null>;
};

export type StageLive = {
  projection?: string;
  sequence?: number;
  rooms?: LiveRoom[] | null;
  recent_events?: PhosphorEvent[] | null;
};

export type StageContext = {
  selectedId?: string;
  followRoomId?: string;
  majorRoomId?: string;
};

export type StageSite = {
  id: string;
  name: string;
  x: number;
  z: number;
  certainty: PhosphorCertainty;
  active: boolean;
  players: number;
  handles: string[];
  traces: number;
  selected: boolean;
  followed: boolean;
  major: boolean;
};

export type StageRoute = {
  from: string;
  to: string;
  direction: string;
  dashed: boolean;
  oneWay: boolean;
};

export type StageModel = {
  sites: StageSite[];
  routes: StageRoute[];
  /** Distance from the layout centre to its farthest site, plus one grid step. */
  radius: number;
};

export type StagePulse = {
  roomId: string;
  tier: PhosphorTier;
  ttl: number;
  sequence: number;
};

const ID_LEAK = /\b(?:player|room|entity|ctrl|event|controller|device)\.[a-z0-9._-]+/i;

function clean(value: unknown, max: number): string {
  const t = String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t || ID_LEAK.test(t)) return "";
  return t.length > max ? t.slice(0, max) : t;
}

/** Full public site name for a DOM label. Never an id. */
export function stageLabelText(name: unknown): string {
  return clean(name, 48);
}

/** Public handles at a site, minus ids and the site's own name. */
export function stageHandles(room: LiveRoom): string[] {
  const own = stageLabelText(room.name).toLowerCase();
  const out: string[] = [];
  for (const raw of Array.isArray(room.public_player_labels) ? room.public_player_labels : []) {
    const h = clean(raw, 32);
    if (!h || h.toLowerCase() === own || out.includes(h)) continue;
    out.push(h);
  }
  return out;
}

export function buildStageModel(live: StageLive | null | undefined, ctx: StageContext = {}): StageModel {
  const rooms = Array.isArray(live?.rooms) ? live!.rooms! : [];
  const events = Array.isArray(live?.recent_events) ? live!.recent_events! : [];
  const layout = layoutPublicTopology(rooms, events);
  const byId = new Map<string, LiveRoom>();
  for (const r of rooms) if (isPublicWatchRoom(r)) byId.set(String(r.room_id), r);

  const nodes = layout.nodes.filter((n) => byId.has(n.room_id));
  // Grid cells, not 2D canvas pixels: one cell is one STAGE_SPACING on both axes.
  const cx = nodes.length ? nodes.reduce((s, n) => s + (n.gx ?? 0), 0) / nodes.length : 0;
  const cy = nodes.length ? nodes.reduce((s, n) => s + (n.gy ?? 0), 0) / nodes.length : 0;

  const sites: StageSite[] = [];
  let far = 0;
  for (const n of nodes) {
    const room = byId.get(n.room_id)!;
    const name = stageLabelText(room.name);
    if (!name) continue;
    const x = ((n.gx ?? 0) - cx) * STAGE_SPACING;
    const z = ((n.gy ?? 0) - cy) * STAGE_SPACING;
    far = Math.max(far, Math.hypot(x, z));
    const traces = Array.isArray(room.traces)
      ? room.traces.filter((t) => t && clean(t.text, 400)).length
      : 0;
    sites.push({
      id: n.room_id,
      name,
      x,
      z,
      certainty: n.certainty,
      active: room.active === true || n.certainty === "active",
      players: Math.max(0, Number(room.players_present) || 0),
      handles: stageHandles(room),
      traces,
      selected: !!ctx.selectedId && ctx.selectedId === n.room_id,
      followed: !!ctx.followRoomId && ctx.followRoomId === n.room_id,
      major: !!ctx.majorRoomId && ctx.majorRoomId === n.room_id,
    });
  }

  const drawn = new Set(sites.map((s) => s.id));
  const routes: StageRoute[] = [];
  for (const e of layout.edges) {
    if (!drawn.has(e.from) || !drawn.has(e.to)) continue;
    const back = (byId.get(e.to)?.exits || []).some(
      (x) => x && x.hidden !== true && String(x.to_room_id) === e.from,
    );
    routes.push({ from: e.from, to: e.to, direction: e.direction, dashed: !!e.dashed, oneWay: !back });
  }

  return { sites, routes, radius: far + STAGE_SPACING * 0.75 };
}

function tierOf(raw: unknown): PhosphorTier {
  const t = String(raw || "").toUpperCase();
  return t === "MAJOR" || t === "NOTABLE" ? t : "NORMAL";
}

/**
 * Event-born pulses (WS3-05, WS3-08). Only events newer than the last applied
 * sequence pulse. The first snapshot a window sees never pulses: loading the
 * page and refreshing are not events. It still sets the baseline, from its
 * events or else its world sequence, so the first event after load pulses
 * even when that snapshot listed none. Reduced motion advances the sequence
 * without pulsing.
 */
export function newStagePulses(
  events: PhosphorEvent[] | null | undefined,
  lastSequence: number | null,
  publicRoomIds: Iterable<string>,
  opts: { reduce?: boolean; snapshotSequence?: number } = {},
): { pulses: StagePulse[]; lastSequence: number | null } {
  const allowed = new Set(publicRoomIds);
  const fresh: StagePulse[] = [];
  let newest = lastSequence;
  for (const ev of Array.isArray(events) ? events : []) {
    const seq = ev?.sequence;
    if (typeof seq !== "number" || !Number.isSafeInteger(seq)) continue;
    if (newest === null || seq > newest) newest = seq;
    if (lastSequence === null || seq <= lastSequence) continue;
    const roomId = String(ev.room_id || "");
    if (!allowed.has(roomId)) continue;
    const tier = tierOf(ev.tier);
    fresh.push({ roomId, tier, ttl: PULSE_TTL[tier], sequence: seq });
  }
  if (lastSequence === null) {
    const head = Number.isSafeInteger(opts.snapshotSequence) ? (opts.snapshotSequence as number) : 0;
    return { pulses: [], lastSequence: Math.max(newest ?? head, head) };
  }
  if (opts.reduce) return { pulses: [], lastSequence: newest };
  fresh.sort((a, b) => b.sequence - a.sequence);
  const major = fresh.find((p) => p.tier === "MAJOR");
  const minor = fresh.filter((p) => p.tier !== "MAJOR").slice(0, STAGE_MAX_MINOR_PULSES);
  return { pulses: major ? [major, ...minor] : minor, lastSequence: newest };
}

export type StageCameraLimits = {
  minDistance: number;
  maxDistance: number;
  maxTargetRadius: number;
  minPolarAngle: number;
  maxPolarAngle: number;
};

export function stageCameraLimits(radius: number): StageCameraLimits {
  const r = Math.max(radius, STAGE_SPACING * 2);
  return {
    minDistance: r * 0.8,
    maxDistance: r * 3.2,
    maxTargetRadius: r,
    minPolarAngle: STAGE_POLAR_MIN,
    maxPolarAngle: STAGE_POLAR_MAX,
  };
}

/** Default oblique framing: from the south-south-west, 40° from vertical, whole layout in view. */
export function stageDefaultView(radius: number): { target: [number, number, number]; position: [number, number, number] } {
  const r = Math.max(radius, STAGE_SPACING * 2);
  const d = r * 2.3;
  const polar = (40 * Math.PI) / 180;
  const azimuth = -0.35;
  return {
    target: [0, 0, 0],
    position: [d * Math.sin(polar) * Math.sin(azimuth), d * Math.cos(polar), d * Math.sin(polar) * Math.cos(azimuth)],
  };
}

/**
 * D4 Direct-Camera: move only for a new selection, a new Follow target, or a
 * newly observed MAJOR event, and never after the spectator has moved the
 * camera (until they select, Follow or reset). Returns the site to frame, or "".
 */
export function stageCameraTarget(
  prev: StageContext,
  next: StageContext,
  majorPulseRoomId: string,
  spectatorMoved: boolean,
): string {
  if (next.selectedId && next.selectedId !== prev.selectedId) return next.selectedId;
  if (next.followRoomId && next.followRoomId !== prev.followRoomId) return next.followRoomId;
  if (spectatorMoved) return "";
  return majorPulseRoomId || "";
}
