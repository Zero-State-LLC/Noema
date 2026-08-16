/**
 * Phosphor Cartography — optional WATCH pixel layer.
 * Same public watch-live/1.0 snapshot. Never a second authority.
 */

export const PHOSPHOR_WIDTH = 320;
export const PHOSPHOR_HEIGHT = 180;
export const PHOSPHOR_MAX_FPS = 20;
export const PHOSPHOR_JS_BUDGET = 100 * 1024;
export const PHOSPHOR_ASSET_BUDGET = 200 * 1024;

export const PHOSPHOR_COLORS = {
  ground: "#070a10",
  ink: "#101820",
  dim: "#2a3342",
  copper: "#c4784a",
  amber: "#e0a05a",
  wash: "#1a1008",
} as const;

export type PhosphorCertainty = "unknown" | "partial" | "known" | "active";
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
  entities?: Array<{ hidden?: boolean; label?: string; entity_id?: string }>;
  exits?: PhosphorExit[];
};

export type PhosphorEvent = {
  sequence?: number;
  tier?: string;
  room_id?: string;
  line?: string;
};

export type PhosphorSnapshot = {
  rooms?: PhosphorRoom[];
  recent_events?: PhosphorEvent[];
  sequence?: number;
};

export type PhosphorNode = {
  room_id: string;
  name: string;
  x: number;
  y: number;
  certainty: PhosphorCertainty;
  players: number;
  labels: string[];
};

export type PhosphorEdge = {
  from: string;
  to: string;
  direction: string;
};

export type PhosphorLayout = {
  nodes: PhosphorNode[];
  edges: PhosphorEdge[];
};

export type PhosphorPulse = {
  room_id: string;
  tier: PhosphorTier;
  born: number;
  ttl: number;
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

/** 8×8 player glyph — amber later. 1 = on. */
export const PLAYER_GLYPH = [
  0b00111100, 0b01111110, 0b11011011, 0b11111111, 0b11111111, 0b11011011, 0b01100110, 0b00111100,
];

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

export function roomCertainty(room: PhosphorRoom, recent?: PhosphorEvent[]): PhosphorCertainty {
  if (!isPublicWatchRoom(room)) return "unknown";
  const players = Number(room.players_present || 0);
  const active = room.active === true || players > 0;
  if (active) return "active";
  const id = room.room_id || "";
  const hit = (recent || []).some((ev) => ev.room_id === id);
  if (hit) return "active";
  const ents = (room.entities || []).filter((e) => e && e.hidden !== true);
  if (ents.length || String(room.description || "").trim()) return "known";
  return "partial";
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
export function layoutPublicTopology(rooms: PhosphorRoom[] | undefined | null): PhosphorLayout {
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
    const x = padX + ((p[0] - minX) / spanX) * innerW;
    const y = padY + ((p[1] - minY) / spanY) * innerH;
    const labels = (room.public_player_labels || []).map(safePhosphorLabel).filter(Boolean);
    return {
      room_id: id,
      name: safePhosphorLabel(room.name || id),
      x: Math.round(x),
      y: Math.round(y),
      certainty: roomCertainty(room),
      players: Math.max(0, Number(room.players_present || 0) || 0),
      labels,
    };
  });

  return { nodes, edges };
}

export function collectPulses(
  prevSeq: number,
  snapshot: PhosphorSnapshot,
  now: number,
  reducedMotion: boolean,
): PhosphorPulse[] {
  if (reducedMotion) return [];
  const events = snapshot.recent_events || [];
  const pulses: PhosphorPulse[] = [];
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const seq = Number(ev.sequence || 0);
    if (seq <= prevSeq) continue;
    const room = String(ev.room_id || "");
    if (!room) continue;
    const tier = ev.tier === "MAJOR" || ev.tier === "NOTABLE" ? ev.tier : "NORMAL";
    pulses.push({ room_id: room, tier, born: now, ttl: PULSE_TTL[tier] });
  }
  return pulses;
}

export function expirePulses(pulses: PhosphorPulse[], now: number): PhosphorPulse[] {
  return pulses.filter((p) => now - p.born < p.ttl);
}

type DrawCtx = {
  fillStyle: string;
  strokeStyle: string;
  globalAlpha: number;
  font: string;
  imageSmoothingEnabled?: boolean;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect?(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  fillText?(text: string, x: number, y: number): void;
};

function certaintyFill(c: PhosphorCertainty): string {
  if (c === "active") return PHOSPHOR_COLORS.amber;
  if (c === "known") return PHOSPHOR_COLORS.copper;
  if (c === "partial") return PHOSPHOR_COLORS.dim;
  return PHOSPHOR_COLORS.ink;
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

  const byId = new Map(layout.nodes.map((n) => [n.room_id, n]));
  ctx.strokeStyle = PHOSPHOR_COLORS.dim;
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < layout.edges.length; i++) {
    const e = layout.edges[i];
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) continue;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  for (let i = 0; i < layout.nodes.length; i++) {
    const n = layout.nodes[i];
    const size = n.certainty === "active" ? 7 : 5;
    ctx.globalAlpha = 1;
    ctx.fillStyle = certaintyFill(n.certainty);
    ctx.fillRect(n.x - Math.floor(size / 2), n.y - Math.floor(size / 2), size, size);
    if (ctx.fillText) {
      ctx.fillStyle = PHOSPHOR_COLORS.copper;
      ctx.font = "6px monospace";
      ctx.fillText(n.name.slice(0, 14), n.x + 5, n.y - 4);
    }
    const count = Math.min(6, n.players);
    for (let g = 0; g < count; g++) {
      stampGlyph(ctx, n.x - 10 + g * 5, n.y + 6, PHOSPHOR_COLORS.amber);
    }
    if (n.players > 0 && ctx.fillText) {
      ctx.fillStyle = PHOSPHOR_COLORS.amber;
      ctx.fillText(String(n.players), n.x + 5, n.y + 10);
    }
  }

  for (let i = 0; i < pulses.length; i++) {
    const p = pulses[i];
    const n = byId.get(p.room_id);
    if (!n) continue;
    const t = Math.max(0, Math.min(1, (now - p.born) / p.ttl));
    const radius = 4 + t * (p.tier === "MAJOR" ? 16 : p.tier === "NOTABLE" ? 11 : 7);
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = p.tier === "MAJOR" ? PHOSPHOR_COLORS.amber : PHOSPHOR_COLORS.copper;
    ctx.beginPath();
    ctx.moveTo(n.x + radius, n.y);
    ctx.lineTo(n.x, n.y + radius);
    ctx.lineTo(n.x - radius, n.y);
    ctx.lineTo(n.x, n.y - radius);
    ctx.lineTo(n.x + radius, n.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function stampGlyph(ctx: DrawCtx, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  for (let row = 0; row < PLAYER_GLYPH.length; row++) {
    const bits = PLAYER_GLYPH[row];
    for (let col = 0; col < 8; col++) {
      if (bits & (1 << (7 - col))) ctx.fillRect(x + col, y + row, 1, 1);
    }
  }
}

export type PhosphorSession = {
  mode: PhosphorMode;
  reducedMotion: boolean;
  idle: boolean;
  rafStarts: number;
  lastLayout: PhosphorLayout;
  setMode(mode: PhosphorMode): void;
  setReducedMotion(on: boolean): void;
  update(snapshot: PhosphorSnapshot): void;
  fail(): void;
  tick(now?: number): void;
};

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
  let mode: PhosphorMode = !ctx ? "text" : opts.mode || "pixel";
  let reduced = Boolean(opts.reducedMotion);
  let pulses: PhosphorPulse[] = [];
  let lastSeq = -1;
  let lastLayout: PhosphorLayout = { nodes: [], edges: [] };
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
    if (typeof document !== "undefined" && document.hidden) return;
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
    if (typeof document !== "undefined" && document.hidden) return;
    if (mode !== "pixel" || reduced || !pulses.length || !opts.raf) return;
    if (rafId) return;
    rafStarts += 1;
    rafId = opts.raf(loop);
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
    setMode(next: PhosphorMode) {
      if (!ctx) {
        mode = "text";
        stopRaf();
        return;
      }
      mode = next;
      if (mode === "text") stopRaf();
      else paint(nowFn());
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
      lastLayout = layoutPublicTopology(snapshot.rooms || []);
      const t = nowFn();
      if (!reduced && ctx && mode === "pixel") {
        const born = collectPulses(lastSeq, snapshot, t, reduced);
        pulses = expirePulses(pulses.concat(born), t);
      } else {
        pulses = [];
      }
      lastSeq = Number(snapshot.sequence || 0);
      paint(t);
      kick();
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
  };
  return session;
}

export function phosphorInlineScript(): string {
  return `(() => {
    const PHOSPHOR_WIDTH = ${PHOSPHOR_WIDTH};
    const PHOSPHOR_HEIGHT = ${PHOSPHOR_HEIGHT};
    const PHOSPHOR_MAX_FPS = ${PHOSPHOR_MAX_FPS};
    const PHOSPHOR_COLORS = ${JSON.stringify(PHOSPHOR_COLORS)};
    const PLAYER_GLYPH = ${JSON.stringify(PLAYER_GLYPH)};
    const PHOSPHOR_DIR = ${JSON.stringify(PHOSPHOR_DIR)};
    const PULSE_TTL = ${JSON.stringify(PULSE_TTL)};
    const isPublicWatchRoom = ${isPublicWatchRoom.toString()};
    const safePhosphorLabel = ${safePhosphorLabel.toString()};
    const roomCertainty = ${roomCertainty.toString()};
    const publicExits = ${publicExits.toString()};
    const dirVec = ${dirVec.toString()};
    const occupyKey = ${occupyKey.toString()};
    const nudge = ${nudge.toString()};
    const layoutPublicTopology = ${layoutPublicTopology.toString()};
    const collectPulses = ${collectPulses.toString()};
    const expirePulses = ${expirePulses.toString()};
    const certaintyFill = ${certaintyFill.toString()};
    const stampGlyph = ${stampGlyph.toString()};
    const drawPhosphorFrame = ${drawPhosphorFrame.toString()};
    const createPhosphorSession = ${createPhosphorSession.toString()};

    const canvas = document.getElementById("watch-phosphor");
    const wrap = document.getElementById("watch-phos-wrap");
    const textBtn = document.getElementById("watch-mode-text");
    const pixelBtn = document.getElementById("watch-mode-pixel");
    let reduce = false;
    try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    const session = createPhosphorSession({
      canvas: canvas,
      reducedMotion: reduce,
      now: function() { return Date.now(); },
      raf: function(cb) { return window.requestAnimationFrame(cb); },
      caf: function(id) { window.cancelAnimationFrame(id); }
    });
    function syncMode() {
      const pixel = session.mode === "pixel";
      if (wrap) wrap.hidden = !pixel;
      if (textBtn) textBtn.setAttribute("aria-pressed", pixel ? "false" : "true");
      if (pixelBtn) pixelBtn.setAttribute("aria-pressed", pixel ? "true" : "false");
    }
    if (textBtn) textBtn.addEventListener("click", function() { session.setMode("text"); syncMode(); });
    if (pixelBtn) pixelBtn.addEventListener("click", function() { session.setMode("pixel"); syncMode(); });
    window.NoemaPhosphor = session;
    syncMode();
    document.addEventListener("visibilitychange", function() {
      if (document.hidden) session.setMode(session.mode);
    });
  })();`;
}
