/**
 * Phosphor Cartography — optional WATCH pixel layer.
 * Same public watch-live/1.0 snapshot. Never a second authority.
 * All 14 catalog `d` paths stroke on the field to match `#world-key`.
 */

import { GLYPH_IDS, glyphMeta, type GlyphId } from "./presentation/glyphs";

export const PHOSPHOR_WIDTH = 320;
export const PHOSPHOR_HEIGHT = 180;
export const PHOSPHOR_HIT_RADIUS = 28;
export const PHOSPHOR_MAX_FPS = 20;
export const PHOSPHOR_JS_BUDGET = 100 * 1024;
export const PHOSPHOR_ASSET_BUDGET = 200 * 1024;

export const PHOSPHOR_COLORS = {
  ground: "#0E1114",
  ink: "#101820",
  dim: "rgba(61, 220, 255, 0.45)",
  copper: "#3DDCFF",
  amber: "#FFB020",
  wash: "#0E1114",
} as const;

export type PhosphorCertainty = "unknown" | "empty" | "partial" | "known" | "active";
export type PhosphorTier = "NORMAL" | "NOTABLE" | "MAJOR";
export type PhosphorMode = "text" | "pixel";

export type PhosphorExit = {
  direction?: string;
  to_room_id?: string;
  to_room_name?: string;
  hidden?: boolean;
};

export type PhosphorRoom = {
  room_id?: string;
  name?: string;
  description?: string;
  hidden?: boolean;
  tags?: string[];
  active?: boolean;
  players_present?: number;
  public_player_labels?: string[];
  entities?: Array<{
    hidden?: boolean;
    label?: string;
    entity_id?: string;
    entity_type?: string;
    glyph?: string;
  }>;
  exits?: PhosphorExit[];
};

export type PhosphorEvent = {
  sequence?: number;
  tier?: string;
  room_id?: string;
  line?: string;
  glyph?: string;
  projection_id?: string;
};

export type PhosphorSnapshot = {
  rooms?: PhosphorRoom[];
  recent_events?: PhosphorEvent[];
  sequence?: number;
  /** Operator follow: light this room without MAJOR pulses. Public WATCH leaves this unset. */
  focus_room_id?: string;
};

export type PhosphorNode = {
  room_id: string;
  name: string;
  x: number;
  y: number;
  certainty: PhosphorCertainty;
  players: number;
  labels: string[];
  marks: GlyphId[];
};

export type PhosphorEdge = {
  from: string;
  to: string;
  direction: string;
  dashed?: boolean;
};

export type PhosphorGlyphId =
  | "room_empty"
  | "room_known"
  | "room_active"
  | "room_partial"
  | "player_single"
  | "player_multi"
  | "player_cluster"
  | "exit"
  | "exit_active"
  | "pulse_normal"
  | "pulse_notable"
  | "pulse_major";

export const PHOSPHOR_GLYPH_IDS: PhosphorGlyphId[] = [
  "room_empty",
  "room_known",
  "room_active",
  "room_partial",
  "player_single",
  "player_multi",
  "player_cluster",
  "exit",
  "exit_active",
  "pulse_normal",
  "pulse_notable",
  "pulse_major",
];

/** Live catalog `d` strings PIXEL traces. Certainty/count still select PhosphorGlyphId. */
export const PHOSPHOR_CATALOG_PATHS = Object.fromEntries(
  GLYPH_IDS.map((id) => [id, glyphMeta(id).d]),
) as Record<GlyphId, string>;

export type PhosphorCatalogMark = GlyphId;

export function phosphorCatalogMark(id: PhosphorGlyphId): PhosphorCatalogMark | null {
  if (id === "room_partial") return "unknown";
  if (id.startsWith("room_")) return "loc";
  if (id.startsWith("player_")) return "player";
  if (id === "exit" || id === "exit_active") return "threshold";
  return null;
}

export function roomGlyphId(certainty: PhosphorCertainty): PhosphorGlyphId {
  if (certainty === "active") return "room_active";
  if (certainty === "known") return "room_known";
  if (certainty === "partial") return "room_partial";
  return "room_empty";
}

export function playerGlyphId(count: number): PhosphorGlyphId | null {
  if (count <= 0) return null;
  if (count === 1) return "player_single";
  if (count < 10) return "player_multi";
  return "player_cluster";
}

export function pulseGlyphId(tier: PhosphorTier): PhosphorGlyphId {
  if (tier === "MAJOR") return "pulse_major";
  if (tier === "NOTABLE") return "pulse_notable";
  return "pulse_normal";
}

export type PhosphorLayout = {
  nodes: PhosphorNode[];
  edges: PhosphorEdge[];
};

export type PhosphorPulse = {
  room_id: string;
  tier: PhosphorTier;
  born: number;
  ttl: number;
  /** Source recent_events sequence — caps keep the newest across polls (§18.6 rule 3). */
  sequence?: number;
  /** Public agent_move — lights public edges touching the room (exit_active). */
  move?: boolean;
};

export const PHOSPHOR_DIR: Record<string, [number, number]> = {
  north: [0, -1],
  n: [0, -1],
  south: [0, 1],
  s: [0, 1],
  east: [1, 0],
  e: [1, 0],
  west: [-1, 0],
  w: [-1, 0],
  up: [0.35, -0.65],
  down: [-0.35, 0.65],
  northeast: [1, -1],
  northwest: [-1, -1],
  southeast: [1, 1],
  southwest: [-1, 1],
};

const PULSE_TTL: Record<PhosphorTier, number> = {
  NORMAL: 280,
  NOTABLE: 560,
  MAJOR: 920,
};

export function isPublicWatchRoom(room: PhosphorRoom | null | undefined): boolean {
  if (!room || !room.room_id) return false;
  if (room.hidden === true) return false;
  const tags = room.tags || [];
  for (let i = 0; i < tags.length; i++) {
    const t = String(tags[i] || "").toLowerCase();
    if (t === "hidden" || t === "secret" || t === "unpublished") return false;
  }
  return true;
}

export function safePhosphorLabel(raw: unknown): string {
  return String(raw || "")
    .replace(/[<>&"'`]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .slice(0, 24);
}

export function roomCertainty(
  room: PhosphorRoom,
  recent?: PhosphorEvent[],
  focusRoomId?: string,
): PhosphorCertainty {
  if (!isPublicWatchRoom(room)) return "unknown";
  const players = Number(room.players_present || 0);
  const focus = String(focusRoomId || "");
  if (focus) {
    if (String(room.room_id || "") === focus) return "active";
  } else {
    const active = room.active === true || players > 0;
    if (active) return "active";
  }
  const id = room.room_id || "";
  if (!focus) {
    const hit = (recent || []).some((ev) => ev.room_id === id);
    if (hit) return "active";
  }
  const ents = (room.entities || []).filter((e) => e && e.hidden !== true);
  if (ents.length || String(room.description || "").trim()) return "known";
  if (focus && players > 0) return "known";
  const tags = room.tags || [];
  for (let i = 0; i < tags.length; i++) {
    if (String(tags[i] || "").toLowerCase() === "partial") return "partial";
  }
  return "empty";
}

export function markFromRaw(raw: unknown): GlyphId | null {
  const id = String(raw || "");
  if (!id || id === "loc" || id === "player") return null;
  if (!Object.prototype.hasOwnProperty.call(PHOSPHOR_CATALOG_PATHS, id)) return null;
  return id as GlyphId;
}

/** Public entity + event catalog ids at a site. loc/player stay the room and occupancy marks. */
export function collectSiteMarks(room: PhosphorRoom, recent?: PhosphorEvent[]): GlyphId[] {
  const seen: Record<string, true> = {};
  const out: GlyphId[] = [];
  function add(id: GlyphId | null) {
    if (!id || seen[id]) return;
    seen[id] = true;
    out.push(id);
  }
  const ents = room.entities || [];
  for (let i = 0; i < ents.length; i++) {
    const e = ents[i];
    if (!e || e.hidden === true) continue;
    add(markFromRaw(e.glyph));
  }
  const rid = room.room_id || "";
  const evs = recent || [];
  for (let i = 0; i < evs.length; i++) {
    const ev = evs[i];
    if (!ev || ev.room_id !== rid) continue;
    add(markFromRaw(ev.glyph));
  }
  out.sort();
  return out.slice(0, 4);
}

function publicExits(room: PhosphorRoom, allowed: Set<string>): PhosphorExit[] {
  const out: PhosphorExit[] = [];
  const exits = room.exits || [];
  for (let i = 0; i < exits.length; i++) {
    const x = exits[i];
    if (!x || x.hidden === true) continue;
    const to = String(x.to_room_id || "");
    if (!to || !allowed.has(to)) continue;
    out.push(x);
  }
  return out;
}

function dirVec(direction: string | undefined, salt: number): [number, number] {
  const key = String(direction || "").toLowerCase().trim();
  if (PHOSPHOR_DIR[key]) return PHOSPHOR_DIR[key];
  const step = ((salt % 4) + 4) % 4;
  if (step === 0) return [1, 0];
  if (step === 1) return [0, 1];
  if (step === 2) return [-1, 0];
  return [0, -1];
}

function occupyKey(x: number, y: number): string {
  return Math.round(x * 2) / 2 + "," + (Math.round(y * 2) / 2);
}

function nudge(x: number, y: number, taken: Set<string>): [number, number] {
  if (!taken.has(occupyKey(x, y))) return [x, y];
  const ring = [1, -1, 2, -2, 3, -3];
  for (let i = 0; i < ring.length; i++) {
    const dx = ring[i];
    for (let j = 0; j < ring.length; j++) {
      const nx = x + dx * 0.5;
      const ny = y + ring[j] * 0.5;
      if (!taken.has(occupyKey(nx, ny))) return [nx, ny];
    }
  }
  return [x + 0.75, y + 0.75];
}

/** Deterministic public topology. Hidden rooms/exits never enter the graph. */
export function layoutPublicTopology(
  rooms: PhosphorRoom[] | undefined | null,
  recent?: PhosphorEvent[],
  focusRoomId?: string,
): PhosphorLayout {
  const publicRooms = (rooms || []).filter(isPublicWatchRoom).slice().sort((a, b) =>
    String(a.room_id).localeCompare(String(b.room_id)),
  );
  const allowed = new Set(publicRooms.map((r) => String(r.room_id)));
  const pos = new Map<string, [number, number]>();
  const taken = new Set<string>();
  const edges: PhosphorEdge[] = [];
  const edgeSeen = new Set<string>();

  if (publicRooms.length) {
    const first = String(publicRooms[0].room_id);
    pos.set(first, [0, 0]);
    taken.add(occupyKey(0, 0));
    const q = [first];
    const seen = new Set<string>([first]);
    while (q.length) {
      const id = q.shift() as string;
      const room = publicRooms.find((r) => r.room_id === id);
      if (!room) continue;
      const here = pos.get(id) || [0, 0];
      const exits = publicExits(room, allowed).slice().sort((a, b) => {
        const d = String(a.direction || "").localeCompare(String(b.direction || ""));
        return d || String(a.to_room_id || "").localeCompare(String(b.to_room_id || ""));
      });
      for (let i = 0; i < exits.length; i++) {
        const to = String(exits[i].to_room_id);
        const pair = id < to ? id + ">" + to : to + ">" + id;
        if (!edgeSeen.has(pair)) {
          edgeSeen.add(pair);
          // §18.6: exit lighting comes only from live agent_move pulses at draw
          // time. Layout itself never lights an edge from recent_events.
          edges.push({ from: id, to, direction: String(exits[i].direction || "") });
        }
        if (seen.has(to)) continue;
        const vec = dirVec(exits[i].direction, i + id.length);
        let nx = here[0] + vec[0] * 2;
        let ny = here[1] + vec[1] * 2;
        const parked = nudge(nx, ny, taken);
        nx = parked[0];
        ny = parked[1];
        pos.set(to, [nx, ny]);
        taken.add(occupyKey(nx, ny));
        seen.add(to);
        q.push(to);
      }
    }
    let extra = 0;
    for (let i = 0; i < publicRooms.length; i++) {
      const id = String(publicRooms[i].room_id);
      if (pos.has(id)) continue;
      const parked = nudge(extra * 2, 2, taken);
      pos.set(id, parked);
      taken.add(occupyKey(parked[0], parked[1]));
      extra += 1;
    }
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  pos.forEach((p) => {
    if (p[0] < minX) minX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] > maxY) maxY = p[1];
  });
  if (!Number.isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 0;
    maxY = 0;
  }
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const padX = 28;
  const padY = 24;
  const innerW = PHOSPHOR_WIDTH - padX * 2;
  const innerH = PHOSPHOR_HEIGHT - padY * 2;

  const nodes: PhosphorNode[] = publicRooms.map((room) => {
    const id = String(room.room_id);
    const p = pos.get(id) || [0, 0];
    const rawX = padX + ((p[0] - minX) / spanX) * innerW;
    const rawY = padY + ((p[1] - minY) / spanY) * innerH;
    const clamped = clampPhosphorNode(rawX, rawY);
    const labels = (room.public_player_labels || []).map(safePhosphorLabel).filter(Boolean);
    return {
      room_id: id,
      name: safePhosphorLabel(room.name || id),
      x: clamped.x,
      y: clamped.y,
      certainty: roomCertainty(room, recent, focusRoomId),
      players: Math.max(0, Number(room.players_present || 0) || 0),
      labels,
      marks: collectSiteMarks(room, recent),
    };
  });

  const certById = new Map(nodes.map((n) => [n.room_id, n.certainty]));
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    const ca = certById.get(e.from);
    const cb = certById.get(e.to);
    e.dashed = ca === "partial" || cb === "partial";
  }

  return { nodes, edges };
}

/** Living Chamber (§18.6): tiered event pulses. 1 MAJOR, ≤3 non-MAJOR, newest win. */
export function collectPulses(
  prevSeq: number,
  snapshot: PhosphorSnapshot,
  now: number,
  reducedMotion: boolean,
  publicRoomIds?: { has(id: string): boolean } | null,
): PhosphorPulse[] {
  if (reducedMotion) return [];
  const events = snapshot.recent_events || [];
  const fresh: Array<{ seq: number; pulse: PhosphorPulse }> = [];
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const seq = Number(ev.sequence || 0);
    if (seq <= prevSeq) continue;
    const room = String(ev.room_id || "");
    if (!room) continue;
    // §18.6 rule 1: only events in the public layout may pulse. Hidden or
    // unknown rooms never consume cap slots or schedule frames.
    if (publicRoomIds && !publicRoomIds.has(room)) continue;
    const tier: PhosphorTier =
      ev.tier === "MAJOR" ? "MAJOR" : ev.tier === "NOTABLE" ? "NOTABLE" : "NORMAL";
    const pulse: PhosphorPulse = { room_id: room, tier, born: now, ttl: PULSE_TTL[tier], sequence: seq };
    if (String(ev.projection_id || "") === "agent_move") pulse.move = true;
    fresh.push({ seq, pulse });
  }
  fresh.sort((a, b) => b.seq - a.seq);
  const pulses: PhosphorPulse[] = [];
  let major = 0;
  let minor = 0;
  for (let i = 0; i < fresh.length; i++) {
    const p = fresh[i].pulse;
    if (p.tier === "MAJOR") {
      if (major >= 1) continue;
      major += 1;
    } else {
      if (minor >= 3) continue;
      minor += 1;
    }
    pulses.push(p);
  }
  return pulses;
}

/** §18.6 rule 3 across polls: 1 MAJOR + ≤3 non-MAJOR, NEWEST win. Output stays newest-first. */
export function capPulses(pulses: PhosphorPulse[]): PhosphorPulse[] {
  const sorted = pulses
    .slice()
    .sort((a, b) => (Number(b.sequence) || 0) - (Number(a.sequence) || 0) || b.born - a.born);
  const out: PhosphorPulse[] = [];
  let major = 0;
  let minor = 0;
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    if (p.tier === "MAJOR") {
      if (major >= 1) continue;
      major += 1;
    } else {
      if (minor >= 3) continue;
      minor += 1;
    }
    out.push(p);
  }
  return out;
}

export function expirePulses(pulses: PhosphorPulse[], now: number): PhosphorPulse[] {
  return pulses.filter((p) => now - p.born < p.ttl);
}

export const CARTOGRAM_COLS = 78;
export const CARTOGRAM_ROWS = 24;
export const CARTOGRAM_MAX_SITES = 24;

/**
 * §4.B.1 ASCII cartogram — TEXT-mode sibling of the PIXEL sketch.
 * Rasterizes the SAME deterministic public layout (single spatial truth).
 * Pure and deterministic; returns null when the graph will not fit the budget.
 */
export function asciiCartogram(
  layout: PhosphorLayout | null | undefined,
  opts?: { majorRoomId?: string; pickedRoomId?: string },
): string | null {
  const nodes = layout && Array.isArray(layout.nodes) ? layout.nodes : [];
  const edges = layout && Array.isArray(layout.edges) ? layout.edges : [];
  if (!nodes.length || nodes.length > CARTOGRAM_MAX_SITES) return null;
  const cols = CARTOGRAM_COLS;
  const rows = CARTOGRAM_ROWS;
  const majorId = String((opts && opts.majorRoomId) || "");
  const pickedId = String((opts && opts.pickedRoomId) || "");

  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) grid.push(new Array(cols).fill(" "));

  const gx = (x: number) => Math.max(1, Math.min(cols - 2, Math.round((x / PHOSPHOR_WIDTH) * (cols - 2)) + 1));
  const gy = (y: number) => Math.max(0, Math.min(rows - 1, Math.round((y / PHOSPHOR_HEIGHT) * (rows - 1))));
  const anchors = new Map<string, { cx: number; cy: number }>();
  for (let i = 0; i < nodes.length; i++) {
    anchors.set(nodes[i].room_id, { cx: gx(nodes[i].x), cy: gy(nodes[i].y) });
  }

  // Edges first; labels stroke over them. Empty cells only — never overwrite.
  const put = (r: number, c: number, ch: string) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (grid[r][c] === " ") grid[r][c] = ch;
  };
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    const a = anchors.get(e.from);
    const b = anchors.get(e.to);
    if (!a || !b) continue;
    const dc = b.cx - a.cx;
    const dr = b.cy - a.cy;
    const steps = Math.max(Math.abs(dc), Math.abs(dr));
    if (steps < 2) continue;
    const solid = Math.abs(dc) >= 2 * Math.abs(dr) ? "-" : Math.abs(dr) >= 2 * Math.abs(dc) ? "|" : dc * dr > 0 ? "\\" : "/";
    const ch = e.dashed === true ? "." : solid;
    for (let s = 1; s < steps; s++) {
      put(Math.round(a.cy + (dr * s) / steps), Math.round(a.cx + (dc * s) / steps), ch);
    }
  }

  // Labels: [NAME] + * activity, count, ! MAJOR, + picked. Sorted for determinism.
  const ordered = [...nodes].sort((a, b) => a.room_id.localeCompare(b.room_id));
  const taken: Array<{ r: number; c0: number; c1: number }> = [];
  let crowded = false;
  for (let i = 0; i < ordered.length; i++) {
    const n = ordered[i];
    const a = anchors.get(n.room_id);
    if (!a) continue;
    const active = n.certainty === "active" || n.players > 0;
    let label = "[" + safePhosphorLabel(n.name).toUpperCase().slice(0, 14) + "]";
    if (active) label += "*";
    if (n.players > 0) label += String(Math.min(n.players, 99));
    if (majorId && n.room_id === majorId) label += "!";
    if (pickedId && n.room_id === pickedId) label += "+";
    let c0 = Math.max(0, Math.min(cols - label.length, a.cx - (label.length >> 1)));
    let placedRow = -1;
    for (let d = 0; d < 5 && placedRow < 0; d++) {
      const r = a.cy + (d % 2 === 0 ? d / 2 : -((d + 1) / 2));
      if (r < 0 || r >= rows) continue;
      const clash = taken.some((t) => t.r === r && c0 <= t.c1 + 1 && c0 + label.length >= t.c0);
      if (!clash) placedRow = r;
    }
    if (placedRow < 0) {
      crowded = true;
      break;
    }
    for (let k = 0; k < label.length; k++) grid[placedRow][c0 + k] = label[k];
    taken.push({ r: placedRow, c0, c1: c0 + label.length - 1 });
  }
  if (crowded) return null;

  const lines = grid.map((r) => r.join("").replace(/\s+$/, ""));
  while (lines.length && !lines[0]) lines.shift();
  while (lines.length && !lines[lines.length - 1]) lines.pop();
  // Sparse worlds: collapse runs of identical connector-only rows to two.
  const connectorOnly = (l: string) => l.length > 0 && !/[^\s|/\\.-]/.test(l);
  const out: string[] = [];
  let run = 0;
  for (let i = 0; i < lines.length; i++) {
    if (i > 0 && lines[i] === lines[i - 1] && connectorOnly(lines[i])) {
      run += 1;
      if (run >= 2) continue;
    } else {
      run = 0;
    }
    out.push(lines[i]);
  }
  return out.length ? out.join("\n") : null;
}

type DrawCtx = {
  fillStyle: string;
  strokeStyle: string;
  globalAlpha: number;
  lineWidth: number;
  lineCap: string;
  font: string;
  imageSmoothingEnabled?: boolean;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo?(cpx: number, cpy: number, x: number, y: number): void;
  setLineDash?(segments: number[]): void;
  closePath(): void;
  stroke(): void;
  fill(): void;
  fillText?(text: string, x: number, y: number): void;
};

function inkFor(intensity: number): string {
  if (intensity > 0.7) return PHOSPHOR_COLORS.amber;
  if (intensity > 0.35) return PHOSPHOR_COLORS.copper;
  return PHOSPHOR_COLORS.dim;
}

function locOuterPath(): string {
  const d = PHOSPHOR_CATALOG_PATHS.loc;
  const i = d.indexOf(" M");
  return i < 0 ? d : d.slice(0, i);
}

function locInnerPath(): string {
  const d = PHOSPHOR_CATALOG_PATHS.loc;
  const i = d.indexOf(" M");
  return i < 0 ? "" : d.slice(i + 1);
}

/** Subset stroker for catalog `d` (M/L/H/V/A/m/l/h/v/a/z). Arcs become a single quadratic. */
function traceSvgPath(ctx: DrawCtx, d: string, ox: number, oy: number, scale: number): void {
  const tokens = d.match(/[MmLlHhVvAaZz]|[-+]?\d*\.?\d+/g);
  if (!tokens) return;
  let i = 0;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let cmd = "";
  const isCmd = (t: string | undefined): boolean => Boolean(t && /^[MmLlHhVvAaZz]$/.test(t));
  const num = (): number => {
    const n = Number(tokens[i]);
    i += 1;
    return n;
  };
  const px = (nx: number, ny: number): [number, number] => [
    Math.round((ox + nx * scale) * 1000) / 1000,
    Math.round((oy + ny * scale) * 1000) / 1000,
  ];
  while (i < tokens.length) {
    if (isCmd(tokens[i])) {
      cmd = tokens[i] as string;
      i += 1;
      if (cmd === "Z" || cmd === "z") {
        ctx.closePath();
        x = startX;
        y = startY;
        continue;
      }
    }
    if (!cmd || i >= tokens.length) break;
    if (cmd === "M") {
      x = num();
      y = num();
      startX = x;
      startY = y;
      const p = px(x, y);
      ctx.moveTo(p[0], p[1]);
      cmd = "L";
      continue;
    }
    if (cmd === "m") {
      x += num();
      y += num();
      startX = x;
      startY = y;
      const p = px(x, y);
      ctx.moveTo(p[0], p[1]);
      cmd = "l";
      continue;
    }
    if (cmd === "A" || cmd === "a") {
      const rx = num();
      const ry = num();
      num();
      const large = num();
      const sweep = num();
      const nx = cmd === "A" ? num() : x + num();
      const ny = cmd === "A" ? num() : y + num();
      const dx = nx - x;
      const dy = ny - y;
      const len = Math.hypot(dx, dy) || 1;
      const bulge = (sweep ? 1 : -1) * Math.min(rx, ry) * (large ? 1 : 0.55);
      const cpx = (x + nx) / 2 + (-dy / len) * bulge * 0.5;
      const cpy = (y + ny) / 2 + (dx / len) * bulge * 0.5;
      const c = px(cpx, cpy);
      const p = px(nx, ny);
      if (ctx.quadraticCurveTo) ctx.quadraticCurveTo(c[0], c[1], p[0], p[1]);
      else ctx.lineTo(p[0], p[1]);
      x = nx;
      y = ny;
      continue;
    }
    if (cmd === "L") {
      x = num();
      y = num();
    } else if (cmd === "l") {
      x += num();
      y += num();
    } else if (cmd === "H") {
      x = num();
    } else if (cmd === "h") {
      x += num();
    } else if (cmd === "V") {
      y = num();
    } else if (cmd === "v") {
      y += num();
    } else {
      i += 1;
      continue;
    }
    const p = px(x, y);
    ctx.lineTo(p[0], p[1]);
  }
}

function strokeCatalogPath(ctx: DrawCtx, d: string, ox: number, oy: number, size: number): void {
  if (!d) return;
  ctx.beginPath();
  traceSvgPath(ctx, d, ox, oy, size / 16);
  ctx.stroke();
}

function fillCatalogPath(ctx: DrawCtx, d: string, ox: number, oy: number, size: number): void {
  if (!d) return;
  ctx.beginPath();
  traceSvgPath(ctx, d, ox, oy, size / 16);
  ctx.fill();
}

export function drawGlyph(ctx: DrawCtx, id: PhosphorGlyphId, cx: number, cy: number, intensity = 1): void {
  const c = inkFor(intensity);
  ctx.fillStyle = c;
  ctx.strokeStyle = c;
  ctx.lineWidth = 1;
  ctx.lineCap = "square";
  switch (id) {
    case "room_empty":
      strokeCatalogPath(ctx, locOuterPath(), cx, cy, 8);
      return;
    case "room_known":
      strokeCatalogPath(ctx, locOuterPath(), cx, cy, 8);
      fillCatalogPath(ctx, locInnerPath(), cx, cy, 8);
      return;
    case "room_active":
      ctx.fillStyle = PHOSPHOR_COLORS.amber;
      ctx.strokeStyle = PHOSPHOR_COLORS.amber;
      fillCatalogPath(ctx, locOuterPath(), cx, cy, 8);
      ctx.fillStyle = PHOSPHOR_COLORS.ink;
      fillCatalogPath(ctx, locInnerPath(), cx, cy, 8);
      return;
    case "room_partial":
      strokeCatalogPath(ctx, PHOSPHOR_CATALOG_PATHS.unknown, cx, cy, 8);
      return;
    case "player_single":
      fillCatalogPath(ctx, PHOSPHOR_CATALOG_PATHS.player, cx, cy, 8);
      return;
    case "player_multi":
      fillCatalogPath(ctx, PHOSPHOR_CATALOG_PATHS.player, cx - 1, cy - 1, 5);
      fillCatalogPath(ctx, PHOSPHOR_CATALOG_PATHS.player, cx + 3, cy + 2, 5);
      return;
    case "player_cluster":
      fillCatalogPath(ctx, PHOSPHOR_CATALOG_PATHS.player, cx - 1, cy + 2, 5);
      fillCatalogPath(ctx, PHOSPHOR_CATALOG_PATHS.player, cx + 3, cy + 2, 5);
      fillCatalogPath(ctx, PHOSPHOR_CATALOG_PATHS.player, cx + 1, cy - 1, 5);
      return;
    case "exit":
      strokeCatalogPath(ctx, PHOSPHOR_CATALOG_PATHS.threshold, cx, cy, 8);
      return;
    case "exit_active":
      ctx.strokeStyle = PHOSPHOR_COLORS.amber;
      strokeCatalogPath(ctx, PHOSPHOR_CATALOG_PATHS.threshold, cx, cy, 8);
      return;
    default:
      return;
  }
}

export function drawCatalogMark(ctx: DrawCtx, id: GlyphId, cx: number, cy: number, intensity = 0.55): void {
  const d = PHOSPHOR_CATALOG_PATHS[id];
  if (!d) return;
  ctx.strokeStyle = inkFor(intensity);
  ctx.lineWidth = 1;
  ctx.lineCap = "square";
  strokeCatalogPath(ctx, d, cx, cy, 8);
}

export function drawExit(
  ctx: DrawCtx,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  active = false,
  dashed = false,
): void {
  ctx.strokeStyle = active ? PHOSPHOR_COLORS.amber : PHOSPHOR_COLORS.dim;
  ctx.lineWidth = 1;
  ctx.lineCap = "square";
  if (ctx.setLineDash) ctx.setLineDash(dashed ? [3, 3] : []);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const bulge = Math.min(16, len * 0.2);
  const cpx = (x1 + x2) / 2 - (dy / len) * bulge;
  const cpy = (y1 + y2) / 2 + (dx / len) * bulge;
  if (ctx.quadraticCurveTo) ctx.quadraticCurveTo(cpx, cpy, x2, y2);
  else ctx.lineTo(x2, y2);
  ctx.stroke();
  if (ctx.setLineDash) ctx.setLineDash([]);
  if (!dashed) strokeCatalogPath(ctx, PHOSPHOR_CATALOG_PATHS.threshold, x2 - 4, y2 - 4, 8);
}

function drawRoomLabel(ctx: DrawCtx, x: number, y: number, name: string): void {
  if (!ctx.fillText) return;
  const label = safePhosphorLabel(name).toUpperCase().slice(0, 14);
  if (!label) return;
  ctx.fillStyle = PHOSPHOR_COLORS.dim;
  ctx.font = "8px ui-monospace, monospace";
  const a = phosphorLabelAnchor(x, y);
  ctx.fillText(label, a.x, a.y);
}

const MARK_RING: Array<[number, number]> = [
  [-11, -9],
  [10, -9],
  [-11, 9],
  [10, 9],
];

export function drawPulse(ctx: DrawCtx, cx: number, cy: number, tier: PhosphorTier, age: number): void {
  const t = Math.max(0, Math.min(1, age));
  const span = tier === "MAJOR" ? 14 : tier === "NOTABLE" ? 10 : 6;
  const r = 3 + t * span;
  ctx.globalAlpha = 1 - t;
  ctx.strokeStyle = tier === "MAJOR" ? PHOSPHOR_COLORS.amber : PHOSPHOR_COLORS.copper;
  ctx.lineWidth = 1;
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.lineTo(cx, cy - r);
  ctx.closePath();
  ctx.stroke();
  if (tier === "MAJOR" && t < 0.45) {
    const inner = Math.max(2, r - 3);
    ctx.globalAlpha = 0.45 * (1 - t);
    ctx.beginPath();
    ctx.moveTo(cx + inner, cy);
    ctx.lineTo(cx, cy + inner);
    ctx.lineTo(cx - inner, cy);
    ctx.lineTo(cx, cy - inner);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawPhosphorFrame(
  ctx: DrawCtx,
  layout: PhosphorLayout,
  pulses: PhosphorPulse[],
  now: number,
): void {
  ctx.globalAlpha = 1;
  ctx.fillStyle = PHOSPHOR_COLORS.ground;
  ctx.fillRect(0, 0, PHOSPHOR_WIDTH, PHOSPHOR_HEIGHT);
  if (ctx.imageSmoothingEnabled != null) ctx.imageSmoothingEnabled = false;
  // §18 topology-before-scenery: ground fill + border only. No decorative wash.
  ctx.strokeStyle = PHOSPHOR_COLORS.dim;
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, PHOSPHOR_WIDTH - 2, PHOSPHOR_HEIGHT - 2);

  const byId = new Map(layout.nodes.map((n) => [n.room_id, n]));
  const lit: Record<string, true> = {};
  for (let i = 0; i < pulses.length; i++) {
    const p = pulses[i];
    if (p.move === true && now - p.born < p.ttl) lit[p.room_id] = true;
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < layout.edges.length; i++) {
    const e = layout.edges[i];
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) continue;
    const active = lit[e.from] === true || lit[e.to] === true;
    drawExit(ctx, a.x, a.y, b.x, b.y, active, e.dashed === true);
  }

  for (let i = 0; i < layout.nodes.length; i++) {
    const n = layout.nodes[i];
    const intensity = n.certainty === "active" ? 1 : n.certainty === "known" ? 0.55 : 0.3;
    drawGlyph(ctx, roomGlyphId(n.certainty), n.x - 4, n.y - 4, intensity);
    const marks = n.marks || [];
    for (let m = 0; m < marks.length && m < MARK_RING.length; m++) {
      drawCatalogMark(ctx, marks[m], n.x + MARK_RING[m][0], n.y + MARK_RING[m][1], intensity);
    }
  }

  for (let i = 0; i < layout.nodes.length; i++) {
    const n = layout.nodes[i];
    const pg = playerGlyphId(n.players);
    if (pg) drawGlyph(ctx, pg, n.x + 6, n.y - 2, 1);
    drawRoomLabel(ctx, n.x, n.y, n.name);
  }

  let majorSeen = false;
  let minorSeen = 0;
  for (let i = 0; i < pulses.length; i++) {
    const p = pulses[i];
    if (p.tier === "MAJOR") {
      if (majorSeen) continue;
      majorSeen = true;
    } else {
      if (minorSeen >= 3) continue;
      minorSeen += 1;
    }
    const n = byId.get(p.room_id);
    if (!n) continue;
    drawPulse(ctx, n.x, n.y, p.tier, (now - p.born) / p.ttl);
  }
  ctx.globalAlpha = 1;
}

function pageIsHidden(): boolean {
  const g = globalThis as unknown as { document?: { hidden?: boolean } };
  return Boolean(g.document && g.document.hidden);
}



export type PhosphorSession = {
  mode: PhosphorMode;
  reducedMotion: boolean;
  idle: boolean;
  rafStarts: number;
  lastLayout: PhosphorLayout;
  pulses: PhosphorPulse[];
  setMode(mode: PhosphorMode): void;
  setReducedMotion(on: boolean): void;
  update(snapshot: PhosphorSnapshot): void;
  fail(): void;
  tick(now?: number): void;
  hit(x: number, y: number): PhosphorNode | null;
  /** §4.B.1: ASCII cartogram of lastLayout; null when it will not fit. */
  ascii(opts?: { majorRoomId?: string; pickedRoomId?: string }): string | null;
};

export function phosphorLabelAnchor(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(4, Math.min(PHOSPHOR_WIDTH - 56, Number(x) + 10)),
    y: Math.max(10, Math.min(PHOSPHOR_HEIGHT - 4, Number(y) + 3)),
  };
}

function clampPhosphorNode(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(12, Math.min(PHOSPHOR_WIDTH - 12, Math.round(x))),
    y: Math.max(14, Math.min(PHOSPHOR_HEIGHT - 14, Math.round(y))),
  };
}

export function canvasPointFromEvent(
  canvas: { getBoundingClientRect(): { left: number; top: number; width: number; height: number } },
  ev: { clientX: number; clientY: number },
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const w = Number(rect.width) || PHOSPHOR_WIDTH;
  const h = Number(rect.height) || PHOSPHOR_HEIGHT;
  return {
    x: ((Number(ev.clientX) - Number(rect.left)) / w) * PHOSPHOR_WIDTH,
    y: ((Number(ev.clientY) - Number(rect.top)) / h) * PHOSPHOR_HEIGHT,
  };
}

/** Nearest public node or its room label. Hidden rooms never enter lastLayout. */
export function hitPhosphorNode(
  layout: PhosphorLayout | undefined | null,
  x: number,
  y: number,
  radius = PHOSPHOR_HIT_RADIUS,
): PhosphorNode | null {
  const nodes = layout && Array.isArray(layout.nodes) ? layout.nodes : [];
  let best: PhosphorNode | null = null;
  let bestD = radius * radius;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (!n || !n.room_id) continue;
    const nx = Number(n.x);
    const ny = Number(n.y);
    const a = phosphorLabelAnchor(nx, ny);
    const x0 = a.x - 2;
    const y0 = a.y - 10;
    const x1 = a.x + 56;
    const y1 = a.y + 6;
    const cx = Math.max(x0, Math.min(x1, x));
    const cy = Math.max(y0, Math.min(y1, y));
    const spots = [
      [nx, ny],
      [a.x, a.y],
      [cx, cy],
    ];
    for (let s = 0; s < spots.length; s++) {
      const dx = spots[s][0] - x;
      const dy = spots[s][1] - y;
      const d = dx * dx + dy * dy;
      if (d <= bestD) {
        bestD = d;
        best = n;
      }
    }
  }
  return best;
}

type CanvasLike = {
  width: number;
  height: number;
  getContext(type: string): DrawCtx | null;
};

export function createPhosphorSession(opts: {
  canvas?: CanvasLike | null;
  reducedMotion?: boolean;
  mode?: PhosphorMode;
  now?: () => number;
  raf?: (cb: (t: number) => void) => number;
  caf?: (id: number) => void;
}): PhosphorSession {
  const nowFn = opts.now || (() => Date.now());
  let ctx: DrawCtx | null = null;
  try {
    ctx = opts.canvas ? opts.canvas.getContext("2d") : null;
  } catch {
    ctx = null;
  }
  if (opts.canvas) {
    opts.canvas.width = PHOSPHOR_WIDTH;
    opts.canvas.height = PHOSPHOR_HEIGHT;
  }
  let mode: PhosphorMode = !ctx ? "text" : opts.mode || "text";
  let reduced = Boolean(opts.reducedMotion);
  let pulses: PhosphorPulse[] = [];
  let lastSeq = -1;
  let lastLayout: PhosphorLayout = { nodes: [], edges: [] };
  let lastSnapshot: PhosphorSnapshot | null = null;
  let rafId = 0;
  let rafStarts = 0;
  let lastFrame = 0;
  const frameGap = 1000 / PHOSPHOR_MAX_FPS;

  function stopRaf() {
    if (rafId && opts.caf) opts.caf(rafId);
    rafId = 0;
  }

  function paint(now: number) {
    if (!ctx || mode !== "pixel") return;
    drawPhosphorFrame(ctx, lastLayout, reduced ? [] : pulses, now);
  }

  function loop(ts: number) {
    rafId = 0;
    if (pageIsHidden()) return;
    const t = nowFn();
    if (ts - lastFrame < frameGap) {
      if (pulses.length && opts.raf) {
        rafId = opts.raf(loop);
      }
      return;
    }
    lastFrame = ts;
    pulses = expirePulses(pulses, t);
    paint(t);
    if (pulses.length && opts.raf) rafId = opts.raf(loop);
  }

  function kick() {
    if (pageIsHidden()) return;
    if (mode !== "pixel" || reduced || !pulses.length || !opts.raf) return;
    if (rafId) return;
    rafStarts += 1;
    rafId = opts.raf(loop);
  }

  function ingest(snapshot: PhosphorSnapshot) {
    lastLayout = layoutPublicTopology(
      snapshot.rooms || [],
      snapshot.recent_events,
      snapshot.focus_room_id,
    );
    const t = nowFn();
    if (!reduced && ctx && mode === "pixel") {
      const roomSet = new Set(lastLayout.nodes.map(function (n) { return n.room_id; }));
      const born = collectPulses(lastSeq, snapshot, t, reduced, roomSet);
      // Caps enforced at merge time, newest-first — a newer event replaces
      // the oldest live pulse instead of being silently dropped (§18.6).
      pulses = capPulses(expirePulses(pulses.concat(born), t));
      lastSeq = Number(snapshot.sequence || 0);
    } else {
      pulses = [];
    }
    paint(t);
    kick();
  }

  const session: PhosphorSession = {
    get mode() {
      return mode;
    },
    get reducedMotion() {
      return reduced;
    },
    get idle() {
      return rafId === 0 && pulses.length === 0;
    },
    get rafStarts() {
      return rafStarts;
    },
    get lastLayout() {
      return lastLayout;
    },
    get pulses() {
      return pulses.slice();
    },
    setMode(next: PhosphorMode) {
      if (!ctx) {
        mode = "text";
        stopRaf();
        return;
      }
      const prev = mode;
      mode = next;
      if (mode === "text") {
        pulses = [];
        stopRaf();
        return;
      }
      if (prev !== "pixel" && lastSnapshot) ingest(lastSnapshot);
      else {
        paint(nowFn());
        kick();
      }
    },
    setReducedMotion(on: boolean) {
      reduced = Boolean(on);
      if (reduced) {
        pulses = [];
        stopRaf();
      }
      paint(nowFn());
    },
    update(snapshot: PhosphorSnapshot) {
      lastSnapshot = snapshot;
      ingest(snapshot);
    },
    fail() {
      mode = "text";
      pulses = [];
      stopRaf();
    },
    tick(now?: number) {
      const t = now == null ? nowFn() : now;
      pulses = expirePulses(pulses, t);
      paint(t);
      if (!pulses.length) stopRaf();
    },
    hit(x: number, y: number) {
      return hitPhosphorNode(lastLayout, x, y);
    },
    ascii(opts?: { majorRoomId?: string; pickedRoomId?: string }) {
      return asciiCartogram(lastLayout, opts);
    },
  };
  return session;
}

export function phosphorInlineScript(bind?: {
  canvasId?: string;
  wrapId?: string;
  textBtnId?: string;
  pixelBtnId?: string;
  globalName?: string;
}): string {
  const canvasId = bind?.canvasId || "watch-phosphor";
  const wrapId = bind?.wrapId || "watch-phos-wrap";
  const textBtnId = bind?.textBtnId || "watch-mode-text";
  const pixelBtnId = bind?.pixelBtnId || "watch-mode-pixel";
  const globalName = bind?.globalName || "NoemaPhosphor";
  return `(() => {
    const __name = function(fn) { return fn; };
    const PHOSPHOR_WIDTH = ${PHOSPHOR_WIDTH};
    const PHOSPHOR_HEIGHT = ${PHOSPHOR_HEIGHT};
    const PHOSPHOR_HIT_RADIUS = ${PHOSPHOR_HIT_RADIUS};
    const PHOSPHOR_MAX_FPS = ${PHOSPHOR_MAX_FPS};
    const PHOSPHOR_COLORS = ${JSON.stringify(PHOSPHOR_COLORS)};
    const PHOSPHOR_DIR = ${JSON.stringify(PHOSPHOR_DIR)};
    const PULSE_TTL = ${JSON.stringify(PULSE_TTL)};
    const isPublicWatchRoom = ${isPublicWatchRoom.toString()};
    const safePhosphorLabel = ${safePhosphorLabel.toString()};
    const roomCertainty = ${roomCertainty.toString()};
    const roomGlyphId = ${roomGlyphId.toString()};
    const playerGlyphId = ${playerGlyphId.toString()};
    const pulseGlyphId = ${pulseGlyphId.toString()};
    const publicExits = ${publicExits.toString()};
    const dirVec = ${dirVec.toString()};
    const occupyKey = ${occupyKey.toString()};
    const nudge = ${nudge.toString()};
    const phosphorLabelAnchor = ${phosphorLabelAnchor.toString()};
    const clampPhosphorNode = ${clampPhosphorNode.toString()};
    const layoutPublicTopology = ${layoutPublicTopology.toString()};
    const collectPulses = ${collectPulses.toString()};
    const capPulses = ${capPulses.toString()};
    const expirePulses = ${expirePulses.toString()};
    const inkFor = ${inkFor.toString()};
    const PHOSPHOR_CATALOG_PATHS = ${JSON.stringify(PHOSPHOR_CATALOG_PATHS)};
    const locOuterPath = ${locOuterPath.toString()};
    const locInnerPath = ${locInnerPath.toString()};
    const markFromRaw = ${markFromRaw.toString()};
    const collectSiteMarks = ${collectSiteMarks.toString()};
    const traceSvgPath = ${traceSvgPath.toString()};
    const strokeCatalogPath = ${strokeCatalogPath.toString()};
    const fillCatalogPath = ${fillCatalogPath.toString()};
    const drawCatalogMark = ${drawCatalogMark.toString()};
    const drawGlyph = ${drawGlyph.toString()};
    const drawExit = ${drawExit.toString()};
    const MARK_RING = ${JSON.stringify(MARK_RING)};
    const drawRoomLabel = ${drawRoomLabel.toString()};
    const drawPulse = ${drawPulse.toString()};
    const pageIsHidden = ${pageIsHidden.toString()};
    const drawPhosphorFrame = ${drawPhosphorFrame.toString()};
    const canvasPointFromEvent = ${canvasPointFromEvent.toString()};
    const hitPhosphorNode = ${hitPhosphorNode.toString()};
    const CARTOGRAM_COLS = ${CARTOGRAM_COLS};
    const CARTOGRAM_ROWS = ${CARTOGRAM_ROWS};
    const CARTOGRAM_MAX_SITES = ${CARTOGRAM_MAX_SITES};
    const asciiCartogram = ${asciiCartogram.toString()};
    const createPhosphorSession = ${createPhosphorSession.toString()};

    const canvas = document.getElementById(${JSON.stringify(canvasId)});
    const wrap = document.getElementById(${JSON.stringify(wrapId)});
    const textBtn = document.getElementById(${JSON.stringify(textBtnId)});
    const pixelBtn = document.getElementById(${JSON.stringify(pixelBtnId)});
    let reduce = false;
    try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    // §18: default is PIXEL when Canvas 2D is available. TEXT persists client-locally.
    const MODE_KEY = "noema.watch.mode";
    let bootMode = "pixel";
    try {
      const m = localStorage.getItem(MODE_KEY);
      if (m === "text" || m === "pixel") bootMode = m;
    } catch (e) { /* preference only */ }
    const session = createPhosphorSession({
      canvas: canvas,
      reducedMotion: reduce,
      mode: bootMode,
      now: function() { return Date.now(); },
      raf: function(cb) { return window.requestAnimationFrame(cb); },
      caf: function(id) { window.cancelAnimationFrame(id); }
    });
    function storeMode(m) {
      try { localStorage.setItem(MODE_KEY, m); } catch (e) { /* preference only */ }
    }
    function syncMode() {
      const pixel = session.mode === "pixel";
      if (wrap) wrap.hidden = !pixel;
      if (textBtn) textBtn.setAttribute("aria-pressed", pixel ? "false" : "true");
      if (pixelBtn) pixelBtn.setAttribute("aria-pressed", pixel ? "true" : "false");
    }
    if (textBtn) textBtn.addEventListener("click", function() { session.setMode("text"); storeMode("text"); syncMode(); });
    if (pixelBtn) pixelBtn.addEventListener("click", function() { session.setMode("pixel"); storeMode("pixel"); syncMode(); });
    if (canvas && typeof canvas.addEventListener === "function") {
      try { if (canvas.style) canvas.style.cursor = "pointer"; } catch (e) {}
      canvas.addEventListener("click", function(ev) {
        if (session.mode !== "pixel") return;
        const pt = canvasPointFromEvent(canvas, ev);
        const n = session.hit(pt.x, pt.y);
        if (!n) return;
        const pick = window[${JSON.stringify(globalName + "Pick")}];
        if (typeof pick === "function") pick(n.room_id);
      });
    }
    window[${JSON.stringify(globalName)}] = session;
    syncMode();
    document.addEventListener("visibilitychange", function() {
      if (document.hidden) session.setMode(session.mode);
    });
  })();`;
}
