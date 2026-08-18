/**
 * Public WATCH live snapshot — watch-live/1.0
 * Derived projection only. Never world truth. Never a writer.
 */

import { isHiddenRoom } from "./construction";
import { inferActorKind, isPresentNow, type PresencePlayer } from "./ops";
import { publicTitleLine, type PracticeState } from "./practice";
import { publicFocusLine, type FocusState } from "./focus";
import { watchPublicDescriptorLines, type SocialEvent } from "./social-memory";
import {
  glyphForEntity,
  glyphForExit,
  glyphForPlayer,
  glyphForProjection,
  glyphForRoom,
} from "./presentation/glyphs";

export const WATCH_LIVE_PIN = "watch-live/1.0";

export type WatchTier = "NORMAL" | "NOTABLE" | "MAJOR";

export type WatchEvent = {
  sequence: number;
  cycle: number;
  tier: WatchTier;
  projection_id: string;
  line: string;
  glyph?: string;
  room_id?: string;
  occurred_at?: number;
  detail?: string;
};

export type WatchSourceEvent = {
  event_type: string;
  sequence: number;
  cycle?: number;
  handle?: string;
  player_id?: string;
  actor_kind?: "live" | "system";
  at?: number;
  payload?: Record<string, unknown>;
};

export type WatchRoomIn = {
  room_id: string;
  name: string;
  description: string;
  exits: Array<{ direction: string; to_room_id: string; hidden?: boolean }>;
  entities: Array<{ entity_id: string; label: string; entity_type: string; hidden?: boolean }>;
  hidden?: boolean;
  tags?: string[];
};

export type WatchPlayerIn = PresencePlayer & {
  player_id: string;
  practice?: PracticeState;
  focus?: FocusState;
};

export type HeldHeadline = Pick<WatchEvent, "sequence" | "tier" | "projection_id" | "line"> &
  Partial<Pick<WatchEvent, "cycle" | "room_id" | "occurred_at" | "detail">>;

const TIER_RANK: Record<WatchTier, number> = { NORMAL: 1, NOTABLE: 2, MAJOR: 3 };

const TIER_BY_PROJECTION: Record<string, WatchTier> = {
  agent_move: "NORMAL",
  harvest: "NORMAL",
  message_notice: "NORMAL",
  production: "NORMAL",
  resource_change: "NORMAL",
  trade: "NOTABLE",
  organization: "NOTABLE",
  organization_response: "NOTABLE",
  market_shift: "NOTABLE",
  agreement_formed: "NOTABLE",
  agreement_broken: "NOTABLE",
  contest_declared: "NOTABLE",
  infrastructure: "NOTABLE",
  communication_disrupted: "NOTABLE",
  conflicting_reports: "NOTABLE",
  discovery: "MAJOR",
  contest_resolved: "MAJOR",
  infrastructure_disrupted: "MAJOR",
  shortage: "MAJOR",
  world_pressure: "MAJOR",
  frontier_pressure: "MAJOR",
  crime_detected: "MAJOR",
  access_changed: "MAJOR",
  world_status: "MAJOR",
};

const EVENT_TO_PROJECTION: Record<string, string | null> = {
  MOVE: "agent_move",
  AGENT_ENTERED_WORLD: "agent_move",
  AGENT_LEFT_WORLD: "agent_move",
  TRADE_PROPOSED: "trade",
  TRADE_ACCEPTED: "trade",
  TRADE_REJECTED: "trade",
  TRADE_CANCELLED: "trade",
  ORG_CREATE: "organization",
  ORG_MEMBER_ADD: "organization",
  ORG_MEMBER_REMOVE: "organization",
  ORG_RESPONSE: "organization_response",
  MARKET_SHIFT: "market_shift",
  AGREEMENT_FORMED: "agreement_formed",
  AGREEMENT_BROKEN: "agreement_broken",
  CONTEST_DECLARED: "contest_declared",
  CONTEST_RESOLVED: "contest_resolved",
  MESSAGE_DELIVERED: "message_notice",
  DISCOVERY: "discovery",
  SHORTAGE: "shortage",
  WORLD_PRESSURE: "world_pressure",
  FRONTIER_PRESSURE: "frontier_pressure",
  CRIME_DETECTED: "crime_detected",
  ACCESS_CHANGED: "access_changed",
  COMMUNICATION_DISRUPTED: "communication_disrupted",
  LOOK: null,
  OBSERVE: null,
  OBSERVATION_GENERATED: null,
  INSPECT: null,
  WAIT: null,
  MESSAGE: null,
};

const PULSE_PROJECTION: Record<string, string> = {
  "A report is circulating.": "message_notice",
  "Conflicting accounts are circulating.": "conflicting_reports",
  "A public account is contested.": "conflicting_reports",
  "A relay in the hub has degraded.": "infrastructure",
  "Extraction at a storage cache has fallen.": "resource_change",
  "Traffic through a public corridor has slowed.": "communication_disrupted",
  "A designated successor has taken an institution office.": "organization",
  "An institution declared a temporary repair authority.": "organization",
  "A maintenance custom has become widely observed.": "organization",
};

const PRIVATE_EVENT_TYPES = new Set(Object.keys(EVENT_TO_PROJECTION).filter((k) => EVENT_TO_PROJECTION[k] === null));

export function watchEventTier(projectionId: string, band?: string): WatchTier {
  if (projectionId === "infrastructure" && band === "failed") return "MAJOR";
  if (projectionId === "infrastructure_disrupted") return "MAJOR";
  return TIER_BY_PROJECTION[projectionId] || "NORMAL";
}

export function projectionIdForEvent(eventType: string, payload?: Record<string, unknown>): string | null {
  const t = String(eventType || "").toUpperCase();
  if (PRIVATE_EVENT_TYPES.has(t)) return null;
  if (t === "RESOURCE_TRANSFER") {
    if (payload?.kind === "harvest" || payload?.from === "node") return "harvest";
    return "resource_change";
  }
  if (t === "ENTITY_UPDATE") {
    if (payload?.operation === "REPURPOSE") return null;
    if (payload?.operation === "ABANDON" || payload?.unclaimed === true) return null;
    if (payload?.operation === "RESTORE") return null;
    if (payload?.operation === "CONSENT" || payload?.operation === "CONSENSUS") return null;
    if (payload?.operation === "RULE") return null;
    if (payload?.operation === "PROMOTE" || payload?.in_progress === true) return null;
    if (payload?.operation === "VEST") return null;
    if (payload?.operation === "SHARE") return null;
    if (payload?.operation === "CONNECT") return null;
    if (payload?.kind === "repair" || payload?.operation === "REPAIR") return "production";
    if (payload?.band === "failed" || payload?.status === "failed") return "infrastructure_disrupted";
    if (payload?.kind === "infra" || payload?.entity_type === "INFRASTRUCTURE") return "infrastructure";
    return "production";
  }
  if (t in EVENT_TO_PROJECTION) return EVENT_TO_PROJECTION[t] ?? null;
  return null;
}

function isOperatorOrSmokeHandle(handle: string): boolean {
  const n = handle.trim().toLowerCase();
  if (!n) return true;
  if (/^smoke[-_]/.test(n)) return true;
  if (/^op\./.test(n) || /^operator[._-]/.test(n)) return true;
  return false;
}

function publicHandle(p: { handle?: string; player_id?: string }): string | null {
  const h = String(p.handle || "").trim();
  if (!h) return null;
  if (/^player\./i.test(h)) return null;
  if (p.player_id && h === p.player_id) return null;
  // Default mint is the 12-hex suffix of player_id — counts only, not a public name.
  if (/^[0-9a-f]{12}$/i.test(h)) return null;
  if (isOperatorOrSmokeHandle(h)) return null;
  return h.slice(0, 32);
}

function labelOf(ev: WatchSourceEvent): string {
  if (ev.player_id && inferActorKind(ev.player_id, ev.actor_kind) === "system") {
    return "A player";
  }
  return publicHandle(ev) || "A player";
}

function roomName(id: string | undefined, rooms: Record<string, { name?: string }>): string | undefined {
  if (!id) return undefined;
  return rooms[id]?.name;
}

function payloadRoomId(payload: Record<string, unknown> | undefined): string | undefined {
  const keys = ["to", "to_room_id", "room_id", "from"];
  for (const k of keys) {
    const v = payload?.[k];
    if (typeof v === "string" && v) return v;
  }
  return undefined;
}

export function phraseWatchEvent(
  ev: WatchSourceEvent,
  publicRooms: Record<string, { name?: string }>,
): string {
  const who = labelOf(ev);
  const payload = ev.payload || {};
  const destId = typeof payload.to === "string" ? payload.to : typeof payload.to_room_id === "string" ? payload.to_room_id : undefined;
  const destPublic = destId ? publicRooms[destId] : undefined;
  const destName =
    destPublic?.name ||
    (typeof payload.to_room_name === "string" && destPublic ? payload.to_room_name : undefined) ||
    (typeof payload.room_name === "string" && publicRooms[String(payload.room_id || "")]
      ? payload.room_name
      : undefined);
  const site = destName || roomName(typeof payload.room_id === "string" ? payload.room_id : destId, publicRooms);

  switch (String(ev.event_type || "").toUpperCase()) {
    case "MOVE":
    case "AGENT_ENTERED_WORLD":
      return site ? `${who} entered ${site}` : `${who} entered a public site`;
    case "AGENT_LEFT_WORLD":
      return `${who} left the Chamber`;
    case "TRADE_PROPOSED":
      return `${who} offered a trade`;
    case "TRADE_REJECTED":
      return `${who} refused a trade`;
    case "TRADE_ACCEPTED":
      return `${who} settled a trade`;
    case "TRADE_CANCELLED":
      return `${who} withdrew a trade`;
    case "MESSAGE_DELIVERED":
      return site ? `A notice reached ${site}` : "A public notice circulated";
    case "CONTEST_DECLARED":
      return site ? `A contest was declared at ${site}` : "A contest was declared";
    case "CONTEST_RESOLVED":
      return site ? `A contest resolved at ${site}` : "A contest resolved";
    case "RESOURCE_TRANSFER":
      return site ? `Harvest at ${site}` : "A harvest was recorded";
    case "ORG_CREATE":
    case "ORG_MEMBER_ADD":
    case "ORG_MEMBER_REMOVE":
      return site ? `An organization acted at ${site}` : "An organization acted";
    default:
      return site ? `Public activity at ${site}` : "Public activity";
  }
}

export function selectNotableEvent(opts: {
  freshness: string;
  players_present: number;
  candidates: WatchEvent[];
  held?: HeldHeadline | null;
}): WatchEvent {
  const candidates = [...opts.candidates];
  if (opts.freshness === "incident") {
    return {
      sequence: Math.max(0, ...candidates.map((c) => c.sequence)),
      cycle: candidates[0]?.cycle ?? 0,
      tier: "MAJOR",
      projection_id: "world_status",
      line: "World incident — projection is stale.",
    };
  }
  if (opts.freshness === "maintenance") {
    candidates.push({
      sequence: Math.max(0, ...candidates.map((c) => c.sequence)),
      cycle: candidates[0]?.cycle ?? 0,
      tier: "NOTABLE",
      projection_id: "world_status",
      line: "World is in maintenance.",
    });
  }
  const ranked = rankEvents(candidates);
  if (opts.held) {
    const newest = Math.max(0, ...candidates.map((c) => c.sequence));
    const heldPick = holdHeadline(opts.held, candidates, newest);
    if (heldPick) return heldPick;
  }
  if (ranked[0]) return ranked[0];
  return quietHeadline(opts.players_present);
}

export function holdHeadline(
  held: HeldHeadline,
  window: WatchEvent[],
  newestSequence: number,
): WatchEvent | null {
  const inWindow = window.find((e) => e.sequence === held.sequence && e.projection_id === held.projection_id);
  const higher = window.some((e) => TIER_RANK[e.tier] > TIER_RANK[held.tier]);
  const aged = newestSequence - held.sequence > 8;
  if (inWindow && !higher && !aged) {
    return { ...held, ...inWindow };
  }
  const pool = aged && inWindow ? window.filter((e) => e.sequence !== held.sequence) : window;
  return rankEvents(pool)[0] || rankEvents(window)[0] || null;
}

function rankEvents(events: WatchEvent[]): WatchEvent[] {
  return [...events].sort((a, b) => {
    const tr = TIER_RANK[b.tier] - TIER_RANK[a.tier];
    if (tr) return tr;
    return b.sequence - a.sequence;
  });
}

function quietHeadline(playersPresent: number): WatchEvent {
  return {
    sequence: 0,
    cycle: 0,
    tier: "NORMAL",
    projection_id: "world_status",
    line: "The Chamber is quiet.",
    detail: playersPresent > 0 ? `${playersPresent} player${playersPresent === 1 ? "" : "s"} present.` : undefined,
  };
}

export function capVisibleEvents(candidates: WatchEvent[], max = 8, min = 5, maxMoves = 2): WatchEvent[] {
  const newestFirst = [...candidates].sort((a, b) => b.sequence - a.sequence);
  const kept: WatchEvent[] = [];
  let moves = 0;
  for (const ev of newestFirst) {
    if (ev.projection_id === "agent_move") {
      if (moves >= maxMoves) continue;
      moves += 1;
    }
    kept.push(ev);
    if (kept.length >= max) break;
  }
  return kept.sort((a, b) => b.sequence - a.sequence);
}

function isPublicEntity(e: { hidden?: boolean }): boolean {
  return e.hidden !== true;
}

function livePublicPlayers(players: WatchPlayerIn[], now: number): WatchPlayerIn[] {
  return players.filter((p) => {
    if (!p.entered) return false;
    return isPresentNow(p, now);
  });
}

function publicPlayerLabel(p: WatchPlayerIn): string | null {
  return publicHandle(p);
}

function sourceToWatchEvent(
  ev: WatchSourceEvent,
  publicRooms: Record<string, WatchRoomIn>,
): WatchEvent | null {
  const projectionId = projectionIdForEvent(ev.event_type, ev.payload);
  if (!projectionId) return null;
  const roomId = payloadRoomId(ev.payload);
  if (roomId && !publicRooms[roomId] && ev.event_type.toUpperCase() !== "AGENT_LEFT_WORLD") {
    // Hidden or unknown room — still allow leave; drop other room-bound leaks.
    if (roomId.startsWith("room.")) return null;
  }
  const publicRoomId = roomId && publicRooms[roomId] ? roomId : undefined;
  const band = typeof ev.payload?.band === "string" ? ev.payload.band : undefined;
  return {
    sequence: ev.sequence,
    cycle: ev.cycle ?? 0,
    tier: watchEventTier(projectionId, band),
    projection_id: projectionId,
    line: phraseWatchEvent(ev, publicRooms),
    glyph: glyphForProjection(projectionId),
    room_id: publicRoomId,
    occurred_at: typeof ev.at === "number" ? ev.at : undefined,
  };
}

function pulseToWatchEvent(text: string, sequence: number, cycle: number): WatchEvent {
  const projectionId = PULSE_PROJECTION[text] || "public_pulse";
  return {
    sequence,
    cycle,
    tier: projectionId === "resource_change" ? "NORMAL" : "NOTABLE",
    projection_id: projectionId,
    line: text,
    glyph: glyphForProjection(projectionId),
  };
}

export function buildWatchLive(input: {
  world_id: string;
  cycle: number;
  sequence: number;
  rooms: Record<string, WatchRoomIn>;
  players: WatchPlayerIn[];
  events: WatchSourceEvent[];
  public_pulses?: string[];
  handles?: Record<string, string | undefined>;
  world_status?: string;
  freshness?: string;
  held?: HeldHeadline | null;
  now?: number;
}): Record<string, unknown> {
  const now = input.now ?? Date.now();
  const freshness = input.freshness || "live";
  const pulses = Array.isArray(input.public_pulses) ? input.public_pulses.slice(0, 4) : [];

  const publicRooms: Record<string, WatchRoomIn> = {};
  for (const r of Object.values(input.rooms || {})) {
    if (!r || isHiddenRoom(r)) continue;
    publicRooms[r.room_id] = r;
  }

  const live = livePublicPlayers(input.players || [], now);
  const byRoom = new Map<string, WatchPlayerIn[]>();
  for (const p of live) {
    if (!p.room_id || !publicRooms[p.room_id]) continue;
    const list = byRoom.get(p.room_id) || [];
    list.push(p);
    byRoom.set(p.room_id, list);
  }

  const fromEvents = (input.events || [])
    .map((ev) => sourceToWatchEvent(ev, publicRooms))
    .filter((e): e is WatchEvent => Boolean(e));

  const fromPulses = pulses.map((text, i) => pulseToWatchEvent(text, input.sequence - i, input.cycle));
  const candidates = [...fromEvents, ...fromPulses]
    .sort((a, b) => b.sequence - a.sequence)
    .slice(0, 16);

  const recent = capVisibleEvents(candidates);
  const notable = selectNotableEvent({
    freshness,
    players_present: live.filter((p) => p.room_id && publicRooms[p.room_id]).length,
    candidates,
    held: input.held,
  });

  const roomsOut = Object.values(publicRooms).map((r) => {
    const here = byRoom.get(r.room_id) || [];
    const labels = here.map(publicPlayerLabel).filter((h): h is string => Boolean(h));
    const exits = (r.exits || []).filter((x) => x.hidden !== true && Boolean(publicRooms[x.to_room_id]));
    const entities = (r.entities || []).filter(isPublicEntity).map((e) => ({
      entity_id: e.entity_id,
      label: e.label,
      entity_type: e.entity_type,
      glyph: glyphForEntity(e.entity_type, e.label),
    }));
    const recentHere = candidates.some((ev) => ev.room_id === r.room_id);
    const row: Record<string, unknown> = {
      room_id: r.room_id,
      name: r.name,
      description: r.description,
      glyph: glyphForRoom(),
      entity_count: entities.length,
      entities,
      exit_count: exits.length,
      exits: exits.map((x) => ({
        direction: x.direction,
        to_room_id: x.to_room_id,
        to_room_name: publicRooms[x.to_room_id]?.name,
        glyph: glyphForExit(),
      })),
      players_present: here.length,
      player_glyph: glyphForPlayer(),
      active: here.length > 0 || recentHere,
    };
    if (labels.length) row.public_player_labels = labels;
    const titles = here
      .map((p) => publicTitleLine(publicPlayerLabel(p), p.practice, input.cycle, p.player_id))
      .filter((line): line is string => Boolean(line));
    if (titles.length) row.public_title_lines = titles;
    const focuses = here
      .map((p) => publicFocusLine(publicPlayerLabel(p), p.focus, p.practice, input.cycle, p.player_id))
      .filter((line): line is string => Boolean(line));
    if (focuses.length) row.public_focus_lines = focuses;
    return row;
  });

  const playersPresent = live.filter((p) => p.room_id && publicRooms[p.room_id]).length;
  const public_title_lines = live
    .filter((p) => p.room_id && publicRooms[p.room_id])
    .map((p) => publicTitleLine(publicPlayerLabel(p), p.practice, input.cycle, p.player_id))
    .filter((line): line is string => Boolean(line));
  const public_focus_lines = live
    .filter((p) => p.room_id && publicRooms[p.room_id])
    .map((p) => publicFocusLine(publicPlayerLabel(p), p.focus, p.practice, input.cycle, p.player_id))
    .filter((line): line is string => Boolean(line));
  const handles = input.handles || Object.fromEntries((input.players || []).map((p) => [p.player_id, p.handle]));
  const public_descriptor_lines = watchPublicDescriptorLines(
    (input.events || []) as unknown as SocialEvent[],
    handles,
  );

  return {
    watch_live: WATCH_LIVE_PIN,
    projection: "public",
    world_id: input.world_id,
    cycle: input.cycle,
    sequence: input.sequence,
    players_present: playersPresent,
    world_status: input.world_status || null,
    freshness,
    public_pulses: pulses,
    public_descriptor_lines,
    ...(public_title_lines.length ? { public_title_lines } : {}),
    ...(public_focus_lines.length ? { public_focus_lines } : {}),
    rooms: roomsOut,
    recent_events: recent,
    notable_event: notable,
    note: "Spectator projection is never world truth and never mutates the ledger.",
  };
}
