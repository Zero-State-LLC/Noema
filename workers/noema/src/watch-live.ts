/**
 * Public WATCH live snapshot — watch-live/1.0
 * Derived projection only. Never world truth. Never a writer.
 */

import { isHiddenRoom } from "./construction";
import { isPresentNow, type PresencePlayer } from "./ops";
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
import {
  laterTraceInputs,
  projectRoomTraces,
  publicTraces,
  type LaterTraceOrg,
  type LaterTraceRumor,
} from "./play-traces";

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
  /** §6: public handle of the acting Player; omitted (never "A player") when not public. */
  actor_label?: string;
  /** §4.A.1: server-derived public consequence; bands only, omitted when unprovable. */
  consequence?: string;
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
  entities: Array<{
    entity_id: string;
    label: string;
    entity_type: string;
    hidden?: boolean;
    scar?: boolean;
    in_progress?: boolean;
    unclaimed?: boolean;
    owner_id?: string;
    last_repair_cycle?: number;
    last_repair_handle?: string;
  }>;
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
  if (t === "CRIME_DETECTED") {
    // §7 redaction / §4E: only crimes already public may reach the public window.
    const flags = Array.isArray(payload?.flags) ? (payload!.flags as unknown[]).map(String) : [];
    if (payload?.visibility === "PUBLIC" || flags.includes("PUBLIC_HISTORY")) return "crime_detected";
    return null;
  }
  if (t === "RESOURCE_TRANSFER") {
    const fromId = typeof payload?.from_id === "string" ? payload.from_id : "";
    if (payload?.kind === "harvest" || payload?.from === "node" || fromId.startsWith("entity.")) return "harvest";
    return "resource_change";
  }
  if (t === "INFRASTRUCTURE_DISRUPTED") {
    // §4.E: band failed → MAJOR infrastructure_disrupted; else NOTABLE infrastructure.
    const after = typeof payload?.condition_after === "number" ? payload.condition_after : undefined;
    if (after !== undefined && conditionBand(after) === "failed") return "infrastructure_disrupted";
    return "infrastructure";
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

export type OccupantRoomRef = { name?: string; room_id?: string };

/** True when a candidate occupant label is actually a room title or room id. */
export function isRoomNameOccupantLabel(label: string, rooms?: Iterable<OccupantRoomRef>): boolean {
  const n = String(label || "").trim().toLowerCase();
  if (!n) return true;
  if (n.startsWith("room.")) return true;
  if (!rooms) return false;
  for (const room of rooms) {
    if (String(room?.name || "").trim().toLowerCase() === n) return true;
    const id = String(room?.room_id || "").trim().toLowerCase();
    if (id && (id === n || id.replace(/^room\./, "") === n)) return true;
  }
  return false;
}

/**
 * Occupant label is the actor handle (tester, reach-maint3, hermes).
 * Never a room name / room id — Civic Exchange is a site, not a Player.
 */
export function publicOccupantLabel(
  p: { handle?: string; player_id?: string },
  rooms?: Iterable<OccupantRoomRef>,
): string | null {
  const label = publicHandle(p);
  if (!label || isRoomNameOccupantLabel(label, rooms)) return null;
  return label;
}

export function occupantLabelsFrom(
  labels: unknown,
  rooms?: Iterable<OccupantRoomRef>,
): string[] {
  if (!Array.isArray(labels)) return [];
  const out: string[] = [];
  for (const raw of labels) {
    const label = String(raw || "").trim();
    if (!label || isRoomNameOccupantLabel(label, rooms)) continue;
    if (out.includes(label)) continue;
    out.push(label.slice(0, 32));
  }
  return out;
}

function labelOf(ev: WatchSourceEvent, rooms?: Iterable<OccupantRoomRef>): string {
  return publicOccupantLabel(ev, rooms) || "A player";
}

function roomName(id: string | undefined, rooms: Record<string, { name?: string }>): string | undefined {
  if (!id) return undefined;
  return rooms[id]?.name;
}

/** SPECTATOR.md public bands: >=75 ok, 25..74 degraded, <25 failed. Integers never leave the Worker. */
export function conditionBand(n: number): "ok" | "degraded" | "failed" {
  if (n >= 75) return "ok";
  if (n >= 25) return "degraded";
  return "failed";
}

/** Public room containing a public entity, or undefined. Hidden rooms/entities never match, even on unfiltered input. */
function entityHome(
  entityId: string | undefined,
  publicRooms: Record<string, WatchRoomIn>,
): { room: WatchRoomIn; label: string } | undefined {
  if (!entityId) return undefined;
  for (const room of Object.values(publicRooms)) {
    if (!room || isHiddenRoom(room)) continue;
    const hit = (room.entities || []).find((e) => e.entity_id === entityId && e.hidden !== true);
    if (hit) return { room, label: hit.label || "infrastructure" };
  }
  return undefined;
}

function isRepairUpdate(ev: WatchSourceEvent): boolean {
  if (String(ev.event_type || "").toUpperCase() !== "ENTITY_UPDATE") return false;
  return ev.payload?.operation === "REPAIR" || ev.payload?.kind === "repair";
}

/**
 * §4.A.1: deterministic public consequence. Bands only; omitted when unprovable.
 * Derives solely from public event payload numbers that never reach the wire.
 */
export function consequenceForEvent(
  ev: WatchSourceEvent,
  publicRooms: Record<string, WatchRoomIn>,
): string | undefined {
  const t = String(ev.event_type || "").toUpperCase();
  const payload = ev.payload || {};
  let before: unknown;
  let after: unknown;
  let entityId: string | undefined;
  if (t === "INFRASTRUCTURE_DISRUPTED") {
    before = payload.condition_before;
    after = payload.condition_after;
    entityId = typeof payload.entity_id === "string" ? payload.entity_id : undefined;
  } else if (t === "ENTITY_UPDATE" && payload.field === "condition" && (isRepairUpdate(ev) || payload.authorizer === "schedule")) {
    before = payload.from;
    after = payload.to;
    entityId = typeof payload.entity_id === "string" ? payload.entity_id : undefined;
  } else {
    return undefined;
  }
  if (typeof before !== "number" || typeof after !== "number") return undefined;
  const home = entityHome(entityId, publicRooms);
  if (!home) return undefined;
  const from = conditionBand(before);
  const to = conditionBand(after);
  if (from === to) return undefined;
  return `${home.label}: ${from} → ${to}`;
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
  publicRooms: Record<string, { name?: string; room_id?: string }>,
): string {
  const who = labelOf(ev, Object.values(publicRooms));
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
      // §5: "Harvest at <site>" only for harvests. Trade legs and contest
      // seizures also emit RESOURCE_TRANSFER and must not be narrated as harvests.
      if (projectionIdForEvent("RESOURCE_TRANSFER", payload) === "harvest") {
        return site ? `Harvest at ${site}` : "A harvest was recorded";
      }
      return site ? `Resources moved at ${site}` : "Resources changed hands";
    case "ORG_CREATE":
    case "ORG_MEMBER_ADD":
    case "ORG_MEMBER_REMOVE":
      return site ? `An organization acted at ${site}` : "An organization acted";
    case "ENTITY_UPDATE": {
      if (isRepairUpdate(ev)) {
        const home = entityHome(typeof payload.entity_id === "string" ? payload.entity_id : undefined, publicRooms as Record<string, WatchRoomIn>);
        const target = home?.label || "infrastructure";
        const repairer = publicOccupantLabel({ handle: typeof payload.last_repair_handle === "string" ? payload.last_repair_handle : ev.handle }, Object.values(publicRooms)) || labelOf(ev, Object.values(publicRooms));
        return `${repairer} repaired ${target}`;
      }
      return site ? `Public activity at ${site}` : "Public activity";
    }
    case "INFRASTRUCTURE_DISRUPTED": {
      const home = entityHome(typeof payload.entity_id === "string" ? payload.entity_id : undefined, publicRooms as Record<string, WatchRoomIn>);
      const target = home?.label || "Infrastructure";
      const at = site || home?.room.name;
      return at ? `${target} was disrupted at ${at}` : `${target} was disrupted`;
    }
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
    const heldPick = holdHeadline(opts.held, candidates);
    if (heldPick) return heldPick;
  }
  if (ranked[0]) return ranked[0];
  return quietHeadline(opts.players_present);
}

export function holdHeadline(held: HeldHeadline, window: WatchEvent[]): WatchEvent | null {
  const inWindow = window.find((e) => e.sequence === held.sequence && e.projection_id === held.projection_id);
  const higher = window.some((e) => TIER_RANK[e.tier] > TIER_RANK[held.tier]);
  // §4A step 5: age by newer PUBLIC candidates, never by raw ledger-sequence
  // arithmetic — private LOOK/MESSAGE traffic must not rotate the headline.
  const aged = window.filter((e) => e.sequence > held.sequence).length > 8;
  if (inWindow && !higher && !aged) {
    return { ...held, ...inWindow };
  }
  const pool = aged && inWindow ? window.filter((e) => e.sequence !== held.sequence) : window;
  return rankEvents(pool)[0] || rankEvents(window)[0] || null;
}

/**
 * Carry the served headline between polls so the §4A hold is wired for every
 * non-page consumer (HTTP poll and WS stream). Synthetic world-status and the
 * quiet fallback are never held.
 */
export function heldFromSnapshot(snapshot: Record<string, unknown> | null | undefined): HeldHeadline | null {
  const n = snapshot?.notable_event as Partial<WatchEvent> | null | undefined;
  if (!n || typeof n.sequence !== "number" || n.sequence <= 0) return null;
  if (typeof n.projection_id !== "string" || n.projection_id === "world_status") return null;
  if (typeof n.line !== "string" || !n.line) return null;
  if (n.tier !== "NORMAL" && n.tier !== "NOTABLE" && n.tier !== "MAJOR") return null;
  const held: HeldHeadline = {
    sequence: n.sequence,
    tier: n.tier,
    projection_id: n.projection_id,
    line: n.line,
  };
  if (typeof n.cycle === "number") held.cycle = n.cycle;
  if (typeof n.room_id === "string") held.room_id = n.room_id;
  if (typeof n.occurred_at === "number") held.occurred_at = n.occurred_at;
  if (typeof n.detail === "string") held.detail = n.detail;
  return held;
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

function publicPlayerLabel(p: WatchPlayerIn, rooms?: Iterable<OccupantRoomRef>): string | null {
  return publicOccupantLabel(p, rooms);
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
  let publicRoomId = roomId && publicRooms[roomId] ? roomId : undefined;
  const infraShaped = isRepairUpdate(ev) || ev.event_type.toUpperCase() === "INFRASTRUCTURE_DISRUPTED";
  if (!publicRoomId && infraShaped) {
    // §5: a public repair/disruption resolves its public site via the entity's
    // public room; if none, the event is omitted, not anonymized into filler.
    const home = entityHome(
      typeof ev.payload?.entity_id === "string" ? ev.payload.entity_id : undefined,
      publicRooms,
    );
    if (!home) return null;
    publicRoomId = home.room.room_id;
  }
  const band = typeof ev.payload?.band === "string" ? ev.payload.band : undefined;
  const roomRefs = Object.values(publicRooms);
  const actor = publicOccupantLabel(ev, roomRefs) ||
    (isRepairUpdate(ev)
      ? publicOccupantLabel({ handle: typeof ev.payload?.last_repair_handle === "string" ? ev.payload.last_repair_handle : "" }, roomRefs)
      : null);
  const consequence = consequenceForEvent(ev, publicRooms);
  return {
    sequence: ev.sequence,
    cycle: ev.cycle ?? 0,
    tier: watchEventTier(projectionId, band),
    projection_id: projectionId,
    line: phraseWatchEvent(ev, publicRooms),
    glyph: glyphForProjection(projectionId),
    room_id: publicRoomId,
    occurred_at: typeof ev.at === "number" ? ev.at : undefined,
    ...(actor ? { actor_label: actor } : {}),
    ...(consequence ? { consequence } : {}),
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
  rumor?: LaterTraceRumor;
  organizations?: LaterTraceOrg[];
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

  const roomRefs = Object.values(publicRooms);
  const roomsOut = Object.values(publicRooms).map((r) => {
    const here = byRoom.get(r.room_id) || [];
    const labels = here.map((p) => publicPlayerLabel(p, roomRefs)).filter((h): h is string => Boolean(h));
    const exits = (r.exits || []).filter((x) => x.hidden !== true && Boolean(publicRooms[x.to_room_id]));
    const publicEntities = (r.entities || []).filter(isPublicEntity);
    const entities = publicEntities.map((e) => ({
      entity_id: e.entity_id,
      label: e.label,
      entity_type: e.entity_type,
      glyph: glyphForEntity(e.entity_type, e.label),
    }));
    const traces = publicTraces(
      projectRoomTraces({
        hidden: r.hidden,
        entities: publicEntities,
        ...laterTraceInputs({
          room_id: r.room_id,
          entities: publicEntities,
          rumor: input.rumor,
          orgs: input.organizations,
        }),
      }),
    );
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
    if (traces.length) row.traces = traces;
    if (labels.length) row.public_player_labels = labels;
    const titles = here
      .map((p) => publicTitleLine(publicPlayerLabel(p, roomRefs), p.practice, input.cycle, p.player_id))
      .filter((line): line is string => Boolean(line));
    if (titles.length) row.public_title_lines = titles;
    const focuses = here
      .map((p) => publicFocusLine(publicPlayerLabel(p, roomRefs), p.focus, p.practice, input.cycle, p.player_id))
      .filter((line): line is string => Boolean(line));
    if (focuses.length) row.public_focus_lines = focuses;
    return row;
  });

  const playersPresent = live.filter((p) => p.room_id && publicRooms[p.room_id]).length;
  const public_title_lines = live
    .filter((p) => p.room_id && publicRooms[p.room_id])
    .map((p) => publicTitleLine(publicPlayerLabel(p, roomRefs), p.practice, input.cycle, p.player_id))
    .filter((line): line is string => Boolean(line));
  const public_focus_lines = live
    .filter((p) => p.room_id && publicRooms[p.room_id])
    .map((p) => publicFocusLine(publicPlayerLabel(p, roomRefs), p.focus, p.practice, input.cycle, p.player_id))
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
    narrative: buildWatchNarrative({
      now: notable,
      recent,
      world_status: input.world_status || null,
      cycle: input.cycle,
      players_present: playersPresent,
      public_pulses: pulses,
      rooms_present: roomsOut.length,
    }),
    note: "Spectator projection is never world truth and never mutates the ledger.",
  };
}

export type WatchNarrative = {
  now: WatchEvent;
  recently: WatchEvent[];
  world: {
    status: string | null;
    cycle: number;
    players_present: number;
    rooms_present: number;
    pulses: string[];
  };
};

/** NOW / RECENTLY / WORLD from the existing public projection. No new feed. */
export function buildWatchNarrative(opts: {
  now: WatchEvent;
  recent: WatchEvent[];
  world_status: string | null;
  cycle: number;
  players_present: number;
  public_pulses?: string[];
  rooms_present: number;
}): WatchNarrative {
  const nowSeq = opts.now.sequence;
  const recently = opts.recent.filter((e) => e.sequence !== nowSeq).slice(0, 6);
  return {
    now: opts.now,
    recently,
    world: {
      status: opts.world_status,
      cycle: opts.cycle,
      players_present: opts.players_present,
      rooms_present: opts.rooms_present,
      pulses: (opts.public_pulses || []).slice(0, 4),
    },
  };
}

/** Causal edges require an explicit payload relation. Sequence adjacency is not a cause. */
export function explicitWatchCause(payload?: Record<string, unknown> | null): string | null {
  if (!payload || typeof payload !== "object") return null;
  const rel = payload.caused_by ?? payload.parent_event_id ?? payload.relation;
  if (typeof rel !== "string") return null;
  const t = rel.trim();
  return t || null;
}
