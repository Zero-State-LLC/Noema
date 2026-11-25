/**
 * WATCH Chamber stage model (Noema-Specs specify/watch-single-3d-stage.md).
 * Pure: turns one public watch-live snapshot into what the 3D stage draws.
 * It reuses the Phosphor public layout (WS3-01) and never invents rooms,
 * routes or identities (WS3-02). The browser renderer lives in
 * watch-stage-client.js and is bundled to /assets/watch-stage.js; the page
 * loads it through STAGE_SRC (watch-stage-view.ts), which carries its version.
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
/** D6: how long a caption stays on screen, per tier. Never longer than four seconds. */
export const STAGE_CAPTION_HOLD_MS = { NORMAL: 2500, NOTABLE: 3500, MAJOR: 4000 };
/** D6: pacing of a fresh burst — one slot per event, never more than MAX_TOTAL_MS overall. */
export const STAGE_PLAYBACK = { MIN_GAP_MS: 400, MAX_GAP_MS: 2500, UNKNOWN_GAP_MS: 600, MAX_TOTAL_MS: 9000 };

/**
 * D6 paced playback: the order and spacing a burst of fresh pulses and
 * captions plays in. Sorted ascending by sequence, equal sequences being one
 * moment. The first slot is now (0). A gap is the public occurred_at delta
 * clamped to MIN_GAP_MS..MAX_GAP_MS, or UNKNOWN_GAP_MS when the delta is not
 * known or time runs backwards. A schedule longer than MAX_TOTAL_MS is scaled
 * to fit, so a long backlog still reads as a burst and not as a queue.
 */
export function stagePlaybackSchedule(
  items: Array<{ sequence: number; occurredAt?: number }>,
): Array<{ sequence: number; atMs: number }> {
  const rows: Array<{ sequence: number; occurredAt: number | null }> = [];
  for (const item of Array.isArray(items) ? items : []) {
    const sequence = item?.sequence;
    if (typeof sequence !== "number" || !Number.isSafeInteger(sequence)) continue;
    const raw = item?.occurredAt;
    const occurredAt = typeof raw === "number" && Number.isFinite(raw) ? raw : null;
    const seen = rows.find((row) => row.sequence === sequence);
    if (seen) {
      if (seen.occurredAt === null && occurredAt !== null) seen.occurredAt = occurredAt;
      continue;
    }
    rows.push({ sequence, occurredAt });
  }
  rows.sort((a, b) => a.sequence - b.sequence);
  const out: Array<{ sequence: number; atMs: number }> = [];
  for (let i = 0; i < rows.length; i++) {
    let atMs = 0;
    if (i > 0) {
      const from = rows[i - 1].occurredAt;
      const to = rows[i].occurredAt;
      let gap = STAGE_PLAYBACK.UNKNOWN_GAP_MS;
      if (from !== null && to !== null) {
        const delta = to - from;
        if (delta >= 0) gap = Math.min(STAGE_PLAYBACK.MAX_GAP_MS, Math.max(STAGE_PLAYBACK.MIN_GAP_MS, delta));
      }
      atMs = out[i - 1].atMs + gap;
    }
    out.push({ sequence: rows[i].sequence, atMs });
  }
  const last = out.length ? out[out.length - 1].atMs : 0;
  if (last > STAGE_PLAYBACK.MAX_TOTAL_MS) {
    const scale = STAGE_PLAYBACK.MAX_TOTAL_MS / last;
    for (const row of out) row.atMs = Math.round(row.atMs * scale);
  }
  return out;
}

export const STAGE_FALLBACK_LINE = "3D view is unavailable here. Showing the text map.";
export const STAGE_LOW_NOISE_LINE = "Low noise is on. Showing the text map.";

type LiveRoom = PhosphorRoom & {
  traces?: Array<{ text?: unknown } | null>;
  public_title_lines?: unknown[];
  public_focus_lines?: unknown[];
};

/** A public event with the optional public text fields D6 reads. */
type StageEvent = PhosphorEvent & {
  line?: unknown;
  actor_label?: unknown;
  consequence?: unknown;
  projection_id?: unknown;
  glyph?: unknown;
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
  /** Optional watch-map/1.0 payload for the same head; bands only (WS3-05). */
  map?: unknown;
};

export type ScarBand = "" | "faint" | "marked" | "deep";
export type LoadBand = "" | "low" | "moderate" | "high";
export type StageBands = { scar: ScarBand; pressure: LoadBand; protocol: LoadBand };

const SCAR_BANDS: ScarBand[] = ["faint", "marked", "deep"];
const LOAD_BANDS: LoadBand[] = ["low", "moderate", "high"];

function bandOf<T extends string>(value: unknown, allowed: T[]): T | "" {
  const v = String(value ?? "").trim().toLowerCase();
  return (allowed as string[]).includes(v) ? (v as T) : "";
}

/**
 * Public bands per site from a watch-map/1.0 payload. Only the documented
 * band words pass; raw numbers or unknown words are dropped (§7 bands only).
 */
export function stageBandsFromMap(map: unknown): Record<string, StageBands> {
  const out: Record<string, StageBands> = {};
  const base = map && typeof map === "object" ? (map as { base?: { rooms?: unknown } }).base : null;
  const rooms = base && Array.isArray(base.rooms) ? base.rooms : [];
  for (const r of rooms) {
    if (!r || typeof r !== "object") continue;
    const row = r as Record<string, unknown>;
    const id = String(row.room_id || "");
    if (!id) continue;
    const bands: StageBands = {
      scar: bandOf(row.scar_band, SCAR_BANDS),
      pressure: bandOf(row.pressure_band, LOAD_BANDS),
      protocol: bandOf(row.protocol_band, LOAD_BANDS),
    };
    if (bands.scar || bands.pressure || bands.protocol) out[id] = bands;
  }
  return out;
}

/** Plain-language band line for a site label, e.g. "scar deep · pressure high". */
export function stageBandLine(b: StageBands): string {
  const parts: string[] = [];
  if (b.scar) parts.push("scar " + b.scar);
  if (b.pressure) parts.push("pressure " + b.pressure);
  if (b.protocol) parts.push("protocol " + b.protocol);
  return parts.join(" · ");
}

export type StageSite = {
  id: string;
  name: string;
  x: number;
  z: number;
  certainty: PhosphorCertainty;
  active: boolean;
  players: number;
  handles: string[];
  /** Named tokens in order, each carrying a verbatim public line or "". */
  tokens: Array<{ handle: string; line: string }>;
  /** Agents with no public handle drawn as anonymous tokens. */
  unnamed: number;
  /** Tokens and handles beyond the six the stage draws. */
  more: number;
  traces: number;
  selected: boolean;
  followed: boolean;
  major: boolean;
  bands: StageBands;
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
  /** The public projection the event came from; only "agent_move" lights routes. */
  projectionId?: string;
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

/** The public line a handle's token shows: the line that starts with "<handle> ", verbatim. */
function lineForHandle(lines: unknown, handle: string): string {
  const prefix = handle + " ";
  for (const raw of Array.isArray(lines) ? lines : []) {
    if (String(raw ?? "").startsWith(prefix)) return clean(raw, 120);
  }
  return "";
}

function tokenLineFor(room: LiveRoom, handle: string): string {
  const focus = lineForHandle(room.public_focus_lines, handle);
  if (focus) return focus;
  return lineForHandle(room.public_title_lines, handle);
}

export function buildStageModel(live: StageLive | null | undefined, ctx: StageContext = {}): StageModel {
  const rooms = Array.isArray(live?.rooms) ? live!.rooms! : [];
  const events = Array.isArray(live?.recent_events) ? live!.recent_events! : [];
  const layout = layoutPublicTopology(rooms, events);
  const byId = new Map<string, LiveRoom>();
  for (const r of rooms) if (isPublicWatchRoom(r)) byId.set(String(r.room_id), r);
  // Bands attach only to sites the live snapshot already makes public.
  const bandsById = stageBandsFromMap(ctx.map);
  const noBands: StageBands = { scar: "", pressure: "", protocol: "" };

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
    const players = Math.max(0, Number(room.players_present) || 0);
    const handles = stageHandles(room);
    const tokens = handles.slice(0, 6).map((handle) => ({ handle, line: tokenLineFor(room, handle) }));
    sites.push({
      id: n.room_id,
      name,
      x,
      z,
      certainty: n.certainty,
      active: room.active === true || n.certainty === "active",
      players,
      handles,
      tokens,
      unnamed: Math.max(0, Math.min(players, 6) - tokens.length),
      more: Math.max(0, Math.max(players, handles.length) - 6),
      traces,
      selected: !!ctx.selectedId && ctx.selectedId === n.room_id,
      followed: !!ctx.followRoomId && ctx.followRoomId === n.room_id,
      major: !!ctx.majorRoomId && ctx.majorRoomId === n.room_id,
      bands: bandsById[n.room_id] || noBands,
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
    const pulse: StagePulse = { roomId, tier, ttl: PULSE_TTL[tier], sequence: seq };
    const projection = (ev as StageEvent).projection_id;
    if (typeof projection === "string" && projection) pulse.projectionId = projection;
    fresh.push(pulse);
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

export type StageCaption = {
  roomId: string;
  tier: PhosphorTier;
  sequence: number;
  line: string;
  actor: string;
  consequence: string;
  holdMs: number;
};

function sameCaptionText(a: string, b: string): boolean {
  const normalize = (s: string) => s.replace(/\.+$/, "").toLowerCase();
  return normalize(a) === normalize(b);
}

/**
 * D6 captions: the one line of public narration for a site, in the same words
 * as Recently. The same freshness rule as pulses (first snapshot never fires,
 * hidden rooms never show), and text that leaks an id is dropped. At most one
 * MAJOR caption plus two others, newest first. Text is not suppressed by
 * reduced motion; only the renderer's animation is.
 */
export function newStageCaptions(
  events: PhosphorEvent[] | null | undefined,
  lastSequence: number | null,
  publicRoomIds: Iterable<string>,
): StageCaption[] {
  if (lastSequence === null) return [];
  const allowed = new Set(publicRoomIds);
  const fresh: StageCaption[] = [];
  for (const raw of Array.isArray(events) ? events : []) {
    const ev = raw as StageEvent;
    const seq = ev?.sequence;
    if (typeof seq !== "number" || !Number.isSafeInteger(seq)) continue;
    if (seq <= lastSequence) continue;
    const roomId = String(ev.room_id || "");
    if (!allowed.has(roomId)) continue;
    const line = clean(ev.line, 120);
    if (!line) continue;
    const tier = tierOf(ev.tier);
    const actor = clean(ev.actor_label, 32);
    let consequence = clean(ev.consequence, 120);
    if (consequence && sameCaptionText(consequence, line)) consequence = "";
    fresh.push({ roomId, tier, sequence: seq, line, actor, consequence, holdMs: STAGE_CAPTION_HOLD_MS[tier] });
  }
  fresh.sort((a, b) => b.sequence - a.sequence);
  const major = fresh.find((c) => c.tier === "MAJOR");
  const others = fresh.filter((c) => c.tier !== "MAJOR").slice(0, 2);
  return major ? [major, ...others] : others;
}

/**
 * §18.6 exit lighting: the drawn routes that touch a live pulse room, keyed as
 * "from|to" so the renderer can match its own lines. A pulse with no room in
 * common with a route lights nothing.
 */
export function stageLitRoutes(
  pulses: Array<{ roomId: string; ttl: number }>,
  routes: StageRoute[],
): Set<string> {
  const lit = new Set<string>();
  for (const p of Array.isArray(pulses) ? pulses : []) {
    for (const r of routes) {
      if (r.from === p.roomId || r.to === p.roomId) lit.add(r.from + "|" + r.to);
    }
  }
  return lit;
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
