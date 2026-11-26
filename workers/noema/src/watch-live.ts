/**
 * Public WATCH live snapshot — watch-live/1.0
 * Derived projection only. Never world truth. Never a writer.
 */

import { isHiddenRoom } from "./construction";
import { isPresentNow, isPublicActivityPlayer, type PresencePlayer } from "./ops";
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
  /** §4.A.1 / Gate D C5: server-derived public consequence; omitted when unprovable. */
  consequence?: string;
  /** RFC-0134: lowercase canonical presentation verb token. */
  verb?: string;
  /** RFC-0134: public entity label resolved strictly from publicEntities (never raw entity_id). */
  target_label?: string;
};

export type WatchRoomActivityKind = "deed" | "speech" | "posture";

export type WatchRoomActivity = {
  sequence: number;
  cycle: number;
  occurred_at?: number;
  tier: WatchTier;
  verb: string;
  actor_label?: string;
  target_label?: string;
  listener_label?: string;
  line: string;
  speech?: string;
  kind: WatchRoomActivityKind;
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

/**
 * Every event type that can reach the public feed, including the three the
 * projection handles by rule rather than by table. Exported so the redaction
 * sweep enumerates the real set: hidden-room coverage used to be written case
 * by case, which is how the harvest path (#520) went years without any.
 */
export const PUBLIC_EVENT_TYPES: string[] = [
  ...Object.keys(EVENT_TO_PROJECTION).filter((k) => EVENT_TO_PROJECTION[k] !== null),
  "ENTITY_UPDATE",
  "RESOURCE_TRANSFER",
  "INFRASTRUCTURE_DISRUPTED",
];

export function watchEventTier(projectionId: string, band?: string): WatchTier {
  if (projectionId === "infrastructure" && band === "failed") return "MAJOR";
  if (projectionId === "infrastructure_disrupted") return "MAJOR";
  return TIER_BY_PROJECTION[projectionId] || "NORMAL";
}

/**
 * RFC-0132: an operation only opens once the completed state change is on the
 * event, exactly as `world-actions.ts` emits it. A bare `{ operation }` is not
 * evidence and stays closed.
 */
export function rfc0132Operation(
  payload?: Record<string, unknown>,
): "RESTORE" | "VEST" | "PROMOTE" | null {
  if (!payload || payload.in_progress === true) return null;
  const set = payload.set;
  if (!set || typeof set !== "object" || Array.isArray(set)) return null;
  const completed = set as Record<string, unknown>;
  if (payload.operation === "RESTORE") {
    return completed.unclaimed === false ? "RESTORE" : null;
  }
  if (payload.operation === "VEST") {
    return typeof completed.owner_id === "string" && completed.owner_id !== "" ? "VEST" : null;
  }
  if (payload.operation === "PROMOTE") {
    return completed.in_progress === false ? "PROMOTE" : null;
  }
  return null;
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
    // RFC-0133: SUPPLY (transfer_id "supply.*") is WATCH-silent; no exposure decision exists.
    if (typeof payload?.transfer_id === "string" && payload.transfer_id.startsWith("supply.")) return null;
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
    if (payload?.in_progress === true) return null;
    // RFC-0132: RESTORE/VEST/PROMOTE open only on the completed state change
    // carried by the event. A named-but-bare operation stays closed.
    const rfc0132 = rfc0132Operation(payload);
    if (rfc0132 === "RESTORE" || rfc0132 === "PROMOTE") return "production";
    if (rfc0132 === "VEST") return "organization";
    if (
      payload?.operation === "RESTORE" ||
      payload?.operation === "VEST" ||
      payload?.operation === "PROMOTE"
    ) return null;
    if (payload?.operation === "CONSENT" || payload?.operation === "CONSENSUS") return null;
    if (payload?.operation === "RULE") return null;
    if (payload?.operation === "SHARE") return null;
    if (payload?.operation === "CONNECT") return null;
    if (
      payload?.operation === "HARVEST" ||
      payload?.operation === "ATTEST" ||
      payload?.operation === "INFORMATION_CONTEST" ||
      payload?.operation === "PRESENCE_PRESSURE"
    ) return null;
    if (payload?.kind === "repair" || payload?.operation === "REPAIR") return "production";
    if (payload?.operation === "PRODUCTION") return "production";
    if (payload?.band === "failed" || payload?.status === "failed") return "infrastructure_disrupted";
    if (payload?.kind === "infra" || payload?.entity_type === "INFRASTRUCTURE") return "infrastructure";
    // RFC-0126: ENTITY_UPDATE exposure is allowlisted. A future or unnamed
    // operation stays off the public door until a separate exposure decision
    // grants it an explicit projection.
    return null;
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

/**
 * §5: the id an entity-scoped event is scoped *by*. Entity mutations carry
 * `entity_id`; a harvest carries the node as `RESOURCE_TRANSFER.from_id` and no
 * `entity_id` at all, which is how it slipped past the #508 site resolution and
 * kept rendering unlocated. Only an `entity.` ref counts — a trade leg's
 * `from_id` is a player.
 */
export function entityScopeId(payload: Record<string, unknown> | undefined): string | undefined {
  const direct = payload?.entity_id;
  if (typeof direct === "string" && direct) return direct;
  const from = payload?.from_id;
  if (typeof from === "string" && from.startsWith("entity.")) return from;
  return undefined;
}

function isRepairUpdate(ev: WatchSourceEvent): boolean {
  if (String(ev.event_type || "").toUpperCase() !== "ENTITY_UPDATE") return false;
  return ev.payload?.operation === "REPAIR" || ev.payload?.kind === "repair";
}

function bareWatchPhrase(line?: string): string {
  return String(line || "").trim().replace(/\.+$/, "");
}

/** Gate D: organization Consequence must not be the headline copied onto itself. */
export function distinctFromHeadline(headline?: string, consequence?: string): string | undefined {
  const con = String(consequence || "").trim();
  if (!con) return undefined;
  if (bareWatchPhrase(con).toLowerCase() === bareWatchPhrase(headline).toLowerCase()) return undefined;
  return con;
}

function organizationActConsequence(eventType: string): string | undefined {
  const t = eventType.toUpperCase();
  if (t === "ORG_CREATE") return "An organization formed";
  if (t === "ORG_MEMBER_ADD" || t === "ORG_MEMBER_REMOVE") return "A membership changed";
  return undefined;
}

/**
 * Gate D C5 sibling: public-result consequence for production / organization /
 * message_notice. Never invents motives, authors, quantities, or hidden state.
 * Organization consequences are a distinct public result, never the headline.
 * Other bands still omit when the public line does not already carry the fact.
 */
export function consequenceForPublicBand(projectionId: string, line?: string): string | undefined {
  const bare = bareWatchPhrase(line);
  if (!bare) return undefined;
  if (projectionId === "production") {
    if (/^Stocks recovered(?:\s+at\s+.+)?$/i.test(bare)) return "Stocks recovered";
    return undefined;
  }
  if (projectionId === "message_notice") {
    if (/^A report is circulating$/i.test(bare)) return "A report is circulating";
    if (/^A notice reached\s+\S/i.test(bare)) return bare;
    if (/^A public notice circulated$/i.test(bare)) return "A public notice circulated";
    return undefined;
  }
  if (projectionId === "organization") {
    if (/^An institution declared a temporary repair authority$/i.test(bare)) {
      return distinctFromHeadline(bare, "Temporary repair authority is in force");
    }
    if (/^A designated successor has taken an institution office$/i.test(bare)) {
      return distinctFromHeadline(bare, "An institution office has a new holder");
    }
    if (/^An organization acted(?:\s+at\s+.+)?$/i.test(bare)) {
      return distinctFromHeadline(bare, "An organization took a public action");
    }
    return undefined;
  }
  return undefined;
}

/**
 * §4.A.1: deterministic public consequence. Condition bands plus C5 public
 * asset/notice/office lines. Omitted when unprovable. Integers never leave.
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
  }
  if (typeof before === "number" && typeof after === "number") {
    const home = entityHome(entityId, publicRooms);
    if (!home) return undefined;
    const from = conditionBand(before);
    const to = conditionBand(after);
    if (from === to) return undefined;
    return `${home.label}: ${from} → ${to}`;
  }
  // RFC-0132: these three public lines carry no separate consequence.
  if (t === "ENTITY_UPDATE" && rfc0132Operation(payload)) return undefined;
  const projectionId = projectionIdForEvent(ev.event_type, ev.payload);
  if (projectionId === "organization") {
    const act = organizationActConsequence(t);
    if (act) return act;
    const line = phraseWatchEvent(ev, publicRooms);
    return distinctFromHeadline(line, consequenceForPublicBand(projectionId, line));
  }
  if (projectionId === "production" || projectionId === "message_notice") {
    return consequenceForPublicBand(projectionId, phraseWatchEvent(ev, publicRooms));
  }
  return undefined;
}

function payloadRoomId(payload: Record<string, unknown> | undefined): string | undefined {
  const keys = ["to", "to_room_id", "room_id", "from"];
  for (const k of keys) {
    const v = payload?.[k];
    if (typeof v === "string" && v) return v;
  }
  return undefined;
}

function publicRoomMatchingName(
  name: string | undefined,
  publicRooms: Record<string, { name?: string; room_id?: string; hidden?: boolean; tags?: string[] }>,
): { name?: string; room_id?: string } | undefined {
  const n = String(name || "").trim();
  if (!n) return undefined;
  for (const room of Object.values(publicRooms)) {
    if (isHiddenRoom(room)) continue;
    if (String(room?.name || "").trim() === n) return room;
  }
  return undefined;
}

/**
 * Public site for a watch event. Hidden rooms never resolve. A non-public
 * `room_name` (digest fallback from a hidden site) withholds instead of
 * relocating the act to the actor's current public room.
 */
export function publicWatchRoomId(
  ev: WatchSourceEvent,
  publicRooms: Record<string, WatchRoomIn>,
  players: WatchPlayerIn[] = [],
): string | undefined {
  const payload = ev.payload || {};
  const direct = payloadRoomId(payload);
  if (direct) {
    const room = publicRooms[direct];
    if (!room || isHiddenRoom(room)) return undefined;
    return direct;
  }
  const named = typeof payload.room_name === "string" ? payload.room_name : undefined;
  if (named && named.trim()) {
    const hit = publicRoomMatchingName(named, publicRooms);
    return typeof hit?.room_id === "string" && publicRooms[hit.room_id] ? hit.room_id : undefined;
  }
  if (projectionIdForEvent(ev.event_type, ev.payload) !== "organization") return undefined;
  const handle = String(ev.handle || "").trim();
  const pid = String(ev.player_id || "").trim();
  for (const p of players) {
    if (!p.entered || !p.room_id || !publicRooms[p.room_id]) continue;
    if ((handle && p.handle === handle) || (pid && p.player_id === pid)) return p.room_id;
  }
  return undefined;
}

function withResolvedPublicRoom(ev: WatchSourceEvent, roomId: string | undefined): WatchSourceEvent {
  if (!roomId) return ev;
  if (ev.payload?.room_id === roomId) return ev;
  return { ...ev, payload: { ...(ev.payload || {}), room_id: roomId } };
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
  // Digest org/institution rows often carry a public `room_name` without
  // `room_id`. Match the name only against already-public rooms.
  const namedPublicSite = publicRoomMatchingName(
    typeof payload.room_name === "string" ? payload.room_name : undefined,
    publicRooms,
  )?.name;
  // §4: any entity-scoped event MUST resolve its public site. An entity
  // mutation carries entity_id and normally no room_id, so payload room ids
  // alone leave it unlocated and it degrades to the filler the spec bans.
  const entitySite = entityHome(
    entityScopeId(payload),
    publicRooms as Record<string, WatchRoomIn>,
  )?.room.name;
  const site =
    destName ||
    roomName(typeof payload.room_id === "string" ? payload.room_id : destId, publicRooms) ||
    entitySite ||
    namedPublicSite;

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
      if (String(payload.operation || "").toUpperCase() === "PRODUCTION") {
        // Recovery happened, never how much: quantities are counters (§7).
        // The unlocated arm is unreachable — sourceToWatchEvent drops any
        // entity-scoped event that resolves no public room — and returns empty
        // rather than an unlocated "Stocks recovered", which would be the very
        // filler §4 bans if anything ever bypassed that gate.
        return site ? `Stocks recovered at ${site}` : "";
      }
      // RFC-0132: one line per act, site only, no actor or private state.
      const rfc0132 = rfc0132Operation(payload);
      if (rfc0132 === "RESTORE") return site ? `An abandoned asset was restored at ${site}` : "";
      if (rfc0132 === "VEST") return site ? `An asset at ${site} passed into institutional hands` : "";
      if (rfc0132 === "PROMOTE") return site ? `Construction finished at ${site}` : "";
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
  if (ranked[0]) return preferDeedOverAmbient(ranked[0], candidates);
  return quietHeadline(opts.players_present);
}

function isAmbientPulse(ev: WatchEvent): boolean {
  return ev.tier === "NOTABLE" && !ev.actor_label && !ev.room_id && !ev.consequence && ev.projection_id !== "world_status";
}

function isConcreteDeed(ev: WatchEvent): boolean {
  return Boolean(ev.actor_label && ev.room_id);
}

function preferDeedOverAmbient(top: WatchEvent, window: WatchEvent[]): WatchEvent {
  if (!isAmbientPulse(top)) return top;
  const deed = window.find(isConcreteDeed);
  return deed || top;
}

export function holdHeadline(held: HeldHeadline, window: WatchEvent[]): WatchEvent | null {
  const inWindow = window.find((e) => e.sequence === held.sequence && e.projection_id === held.projection_id);
  const heldDeed = Boolean(inWindow && isConcreteDeed(inWindow));
  const higher = window.some(
    (e) => TIER_RANK[e.tier] > TIER_RANK[held.tier] && !(heldDeed && isAmbientPulse(e)),
  );
  // §4A step 5: age by newer PUBLIC candidates, never by raw ledger-sequence
  // arithmetic — private LOOK/MESSAGE traffic must not rotate the headline.
  const aged = window.filter((e) => e.sequence > held.sequence).length > 8;
  if (inWindow && !higher && !aged) {
    return { ...held, ...inWindow };
  }
  const pool = aged && inWindow ? window.filter((e) => e.sequence !== held.sequence) : window;
  const top = rankEvents(pool)[0] || rankEvents(window)[0];
  return top ? preferDeedOverAmbient(top, pool) : null;
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
    const sq = b.sequence - a.sequence;
    if (sq) return sq;
    const pid = String(a.projection_id || "").localeCompare(String(b.projection_id || ""));
    if (pid) return pid;
    return String(a.line || "").localeCompare(String(b.line || ""));
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

const INTERNAL_ID_RE = /\b(?:player|room|entity|ctrl|event|controller|device|org|sess)\.[a-z0-9._-]+/i;
const RESERVED_SYSTEM_PLAYER_RE = /^player\.(?:reach-maint|tester|system-)/i;

export function containsInternalId(text: string | undefined | null): boolean {
  if (!text) return false;
  return INTERNAL_ID_RE.test(text);
}

function sanitizePublicLabel(raw: string | undefined | null): string | undefined {
  const cleaned = String(raw || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || containsInternalId(cleaned)) return undefined;
  return cleaned.slice(0, 64);
}

function sanitizePublicSpeech(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const cleaned = raw
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || containsInternalId(cleaned)) return undefined;
  return cleaned.slice(0, 180);
}

export function verbForEvent(ev: WatchSourceEvent, projectionId?: string | null): string {
  const eventType = String(ev.event_type || "").toUpperCase();
  const payload = ev.payload || {};
  const op = String(payload.operation || "").toUpperCase();
  switch (eventType) {
    case "MOVE":
    case "AGENT_ENTERED_WORLD":
    case "AGENT_LEFT_WORLD":
      return "move";
    case "LOOK":
    case "OBSERVE":
    case "OBSERVATION_GENERATED":
      return "look";
    case "INSPECT":
    case "DISCOVERY":
      return "inspect";
    case "WAIT":
      return "wait";
    case "MESSAGE":
    case "MESSAGE_DELIVERED":
      return "message";
    case "TRADE_PROPOSED":
    case "TRADE_ACCEPTED":
    case "TRADE_REJECTED":
    case "TRADE_CANCELLED":
    case "MARKET_SHIFT":
    case "AGREEMENT_FORMED":
    case "AGREEMENT_BROKEN":
      return "trade";
    case "CONTEST_DECLARED":
    case "CONTEST_RESOLVED":
      return "contest";
    case "ORG_CREATE":
    case "ORG_MEMBER_ADD":
    case "ORG_MEMBER_REMOVE":
    case "ORG_RESPONSE":
    case "ACCESS_CHANGED":
      return "org";
    case "INFRASTRUCTURE_DISRUPTED":
    case "COMMUNICATION_DISRUPTED":
    case "SHORTAGE":
    case "WORLD_PRESSURE":
    case "FRONTIER_PRESSURE":
    case "CRIME_DETECTED":
      return "disruption";
    case "RESOURCE_TRANSFER": {
      if (
        (typeof payload.transfer_id === "string" && payload.transfer_id.startsWith("supply.")) ||
        payload.kind === "supply" ||
        op === "SUPPLY" ||
        op === "COMMIT_SUPPLY"
      ) {
        return "commit_supply";
      }
      if (projectionIdForEvent("RESOURCE_TRANSFER", payload) === "harvest") return "harvest";
      if (typeof payload.trade_id === "string" && payload.trade_id) return "trade";
      return "production";
    }
    case "ENTITY_CREATE":
      return "build";
    case "ENTITY_DESTROY":
      return "abandon";
    case "ENTITY_UPDATE": {
      if (isRepairUpdate(ev)) return "repair";
      if (op === "RESTORE") return "restore";
      if (op === "VEST") return "vest";
      if (op === "PROMOTE") return "promote";
      if (op === "REPURPOSE") return "repurpose";
      if (op === "ABANDON" || payload.unclaimed === true) return "abandon";
      if (op === "CONSTRUCT" || op === "BUILD" || payload.in_progress === true) return "build";
      if (op === "PRODUCTION") return "production";
      if (op === "HARVEST") return "harvest";
      if (
        payload.band === "failed" ||
        payload.status === "failed" ||
        projectionId === "infrastructure" ||
        projectionId === "infrastructure_disrupted"
      ) {
        return "disruption";
      }
      return "production";
    }
    default: {
      if (projectionId === "agent_move") return "move";
      if (projectionId === "harvest") return "harvest";
      if (projectionId === "trade" || projectionId === "market_shift" || projectionId === "agreement_formed" || projectionId === "agreement_broken") return "trade";
      if (projectionId === "organization" || projectionId === "organization_response") return "org";
      if (projectionId === "contest_declared" || projectionId === "contest_resolved") return "contest";
      if (projectionId === "message_notice" || projectionId === "conflicting_reports") return "message";
      if (
        projectionId === "infrastructure" ||
        projectionId === "infrastructure_disrupted" ||
        projectionId === "communication_disrupted" ||
        projectionId === "shortage" ||
        projectionId === "world_pressure" ||
        projectionId === "frontier_pressure" ||
        projectionId === "crime_detected"
      ) {
        return "disruption";
      }
      return "production";
    }
  }
}

function resolvePublicTargetLabel(
  ev: WatchSourceEvent,
  publicRooms: Record<string, WatchRoomIn>,
  publicRoomId?: string,
): string | undefined {
  const payload = ev.payload || {};
  const scopeId = entityScopeId(payload);
  if (scopeId) {
    const home = entityHome(scopeId, publicRooms);
    if (home) return sanitizePublicLabel(home.label);
    return undefined;
  }
  if (typeof payload.target_entity_id === "string" && payload.target_entity_id) {
    const home = entityHome(payload.target_entity_id, publicRooms);
    if (home) return sanitizePublicLabel(home.label);
    return undefined;
  }
  const candidate =
    (typeof payload.target_label === "string" && payload.target_label.trim()) ||
    (typeof payload.label === "string" && payload.label.trim()) ||
    "";
  if (candidate && publicRoomId && publicRooms[publicRoomId]) {
    const needle = candidate.toLowerCase();
    const hit = (publicRooms[publicRoomId].entities || []).find(
      (e) => e.hidden !== true && String(e.label || "").trim().toLowerCase() === needle,
    );
    if (hit) return sanitizePublicLabel(hit.label);
  }
  return undefined;
}

function sourceToWatchEvent(
  ev: WatchSourceEvent,
  publicRooms: Record<string, WatchRoomIn>,
  players: WatchPlayerIn[] = [],
): WatchEvent | null {
  const projectionId = projectionIdForEvent(ev.event_type, ev.payload);
  if (!projectionId) return null;
  const roomId = payloadRoomId(ev.payload);
  if (roomId && !publicRooms[roomId] && ev.event_type.toUpperCase() !== "AGENT_LEFT_WORLD") {
    // Hidden or unknown room — still allow leave; drop other room-bound leaks.
    if (roomId.startsWith("room.")) return null;
  }
  let publicRoomId = publicWatchRoomId(ev, publicRooms, players);
  // RFC-0057 grants REPURPOSE a PLAY line only; WATCH stays silent.
  if (String(ev.payload?.operation || "").toUpperCase() === "REPURPOSE") return null;
  // §4: ANY entity-scoped event resolves its public site this way, not just
  // repair and disruption. Narrowing it here is what left the live feed
  // rendering every maintenance event as unlocated "Public activity".
  const scopeId = entityScopeId(ev.payload);
  // RFC-0132: a completed RESTORE/VEST/PROMOTE is located by the entity's
  // public home. The actor-room fallback above must not relocate the act to
  // wherever the agent has since moved.
  const rfc0132Act =
    String(ev.event_type || "").toUpperCase() === "ENTITY_UPDATE" && rfc0132Operation(ev.payload) !== null;
  if (scopeId || rfc0132Act) {
    // §5: resolve via the entity's public room; if none, the event is
    // omitted, not anonymized into filler. Actor-site fallback must not
    // republish a hidden-entity org act as a public Chamber Market line.
    const home = entityHome(scopeId, publicRooms);
    if (!home) return null;
    if (!publicRoomId || rfc0132Act) publicRoomId = home.room.room_id;
  }
  const located = withResolvedPublicRoom(ev, publicRoomId);
  const band = typeof ev.payload?.band === "string" ? ev.payload.band : undefined;
  const roomRefs = Object.values(publicRooms);
  // RFC-0132: PROMOTE is a system act — never attach an actor label.
  const actor = ev.event_type.toUpperCase() === "ENTITY_UPDATE" && rfc0132Operation(ev.payload) === "PROMOTE"
    ? null
    : publicOccupantLabel(ev, roomRefs) ||
      (isRepairUpdate(ev)
        ? publicOccupantLabel({ handle: typeof ev.payload?.last_repair_handle === "string" ? ev.payload.last_repair_handle : "" }, roomRefs)
        : null);
  const consequence = consequenceForEvent(located, publicRooms);
  const verb = verbForEvent(located, projectionId);
  // RFC-0132 pins RESTORE/VEST/PROMOTE recent_events items free of entity labels/class names.
  const targetLabel = rfc0132Act ? undefined : resolvePublicTargetLabel(located, publicRooms, publicRoomId);
  return {
    sequence: ev.sequence,
    cycle: ev.cycle ?? 0,
    tier: watchEventTier(projectionId, band),
    projection_id: projectionId,
    line: phraseWatchEvent(located, publicRooms),
    glyph: glyphForProjection(projectionId),
    room_id: publicRoomId,
    occurred_at: typeof ev.at === "number" ? ev.at : undefined,
    ...(actor ? { actor_label: actor } : {}),
    ...(consequence ? { consequence } : {}),
    ...(verb ? { verb } : {}),
    ...(targetLabel ? { target_label: targetLabel } : {}),
  };
}

/** Pulse text, or text plus the act's public site when the writer already has one. */
export type PublicPulseIn = string | { text: string; room_id?: string };

function publicPulseText(pulse: PublicPulseIn): string {
  return typeof pulse === "string" ? pulse : String(pulse?.text || "");
}

function publicPulseRoomId(pulse: PublicPulseIn): string | undefined {
  if (typeof pulse === "string") return undefined;
  const id = pulse?.room_id;
  return typeof id === "string" && id ? id : undefined;
}

/**
 * Keep the public `public_pulses` list as unique texts. If the same fact
 * arrives as a bare string and as a located copy, keep the public room.
 */
function normalizePublicPulses(raw: PublicPulseIn[] | undefined): Array<{ text: string; room_id?: string }> {
  const out: Array<{ text: string; room_id?: string }> = [];
  const index = new Map<string, number>();
  for (const pulse of raw || []) {
    const text = publicPulseText(pulse);
    if (!text) continue;
    const room_id = publicPulseRoomId(pulse);
    const existing = index.get(text);
    if (existing !== undefined) {
      if (room_id && !out[existing].room_id) out[existing].room_id = room_id;
      continue;
    }
    index.set(text, out.length);
    out.push(room_id ? { text, room_id } : { text });
  }
  return out.slice(0, 4);
}

function publicPulseWatchRoomId(
  roomId: string | undefined,
  publicRooms: Record<string, WatchRoomIn>,
): string | undefined {
  if (!roomId || !publicRooms[roomId] || isHiddenRoom(publicRooms[roomId])) return undefined;
  return roomId;
}

function pulseToWatchEvent(
  text: string,
  sequence: number,
  cycle: number,
  publicRooms: Record<string, WatchRoomIn>,
  roomId?: string,
): WatchEvent {
  const projectionId = PULSE_PROJECTION[text] || "public_pulse";
  const raw = consequenceForPublicBand(projectionId, text);
  const consequence = projectionId === "organization" ? distinctFromHeadline(text, raw) : raw;
  const publicRoomId = publicPulseWatchRoomId(roomId, publicRooms);
  return {
    sequence,
    cycle,
    tier: projectionId === "resource_change" ? "NORMAL" : "NOTABLE",
    projection_id: projectionId,
    line: text,
    glyph: glyphForProjection(projectionId),
    ...(publicRoomId ? { room_id: publicRoomId } : {}),
    ...(consequence ? { consequence } : {}),
  };
}

function hasHiddenRoomReference(
  payload: Record<string, unknown> | undefined,
  publicRooms: Record<string, WatchRoomIn>,
): boolean {
  const direct = payloadRoomId(payload);
  if (direct && !publicRooms[direct] && direct.startsWith("room.")) return true;
  const named = typeof payload?.room_name === "string" ? payload.room_name.trim() : "";
  if (named && !(direct && publicRooms[direct]) && !publicRoomMatchingName(named, publicRooms)) {
    return true;
  }
  return false;
}

type MessageMeta = {
  sender_id?: string;
  recipient_id?: string;
  text?: string;
};

type RoomActivityEntry = {
  room_id: string;
  message_id?: string;
  item: WatchRoomActivity;
};

function buildRoomActivityMap(
  events: WatchSourceEvent[],
  publicRooms: Record<string, WatchRoomIn>,
  allPlayers: WatchPlayerIn[],
  livePlayers: WatchPlayerIn[],
): Map<string, WatchRoomActivity[]> {
  const roomRefs = Object.values(publicRooms);
  const playerById = new Map<string, WatchPlayerIn>();
  const playerByHandle = new Map<string, WatchPlayerIn>();
  for (const p of allPlayers) {
    if (p.player_id) playerById.set(p.player_id, p);
    const h = String(p.handle || "").trim().toLowerCase();
    if (h) playerByHandle.set(h, p);
  }

  const resolvePlayer = (id?: string, handle?: string): WatchPlayerIn | undefined => {
    if (id && playerById.has(id)) return playerById.get(id);
    const h = String(handle || "").trim().toLowerCase();
    if (h && playerByHandle.has(h)) return playerByHandle.get(h);
    return undefined;
  };

  const isSenderResident = (ev: WatchSourceEvent, senderId?: string, senderPlayer?: WatchPlayerIn): boolean => {
    if (senderPlayer) return isPublicActivityPlayer(senderPlayer.player_id, senderPlayer);
    if (ev.actor_kind === "system") return true;
    if (senderId && RESERVED_SYSTEM_PLAYER_RE.test(senderId)) return true;
    return false;
  };

  const isRecipientResident = (recId?: string, recHandle?: string): boolean => {
    const rec = resolvePlayer(recId, recHandle);
    if (!rec) return false;
    return isPublicActivityPlayer(rec.player_id, rec);
  };

  // Merge MESSAGE / MESSAGE_DELIVERED metadata sharing the same message_id.
  const messageById = new Map<string, MessageMeta>();
  for (const ev of events) {
    const t = String(ev.event_type || "").toUpperCase();
    if (t !== "MESSAGE" && t !== "MESSAGE_DELIVERED") continue;
    const p = ev.payload || {};
    const mid = typeof p.message_id === "string" && p.message_id ? p.message_id : undefined;
    if (!mid) continue;
    const cur = messageById.get(mid) || {};
    if (!cur.sender_id) {
      cur.sender_id = (typeof p.sender_id === "string" && p.sender_id) || ev.player_id;
    }
    if (!cur.recipient_id) {
      cur.recipient_id =
        (typeof p.to_player_id === "string" && p.to_player_id) ||
        (typeof p.recipient_id === "string" && p.recipient_id) ||
        undefined;
    }
    if (!cur.text) {
      const raw = p.text ?? p.body ?? p.message;
      if (typeof raw === "string") cur.text = raw;
    }
    messageById.set(mid, cur);
  }

  const resolvePublicRoomForEvent = (
    ev: WatchSourceEvent,
    fallbackPlayer?: WatchPlayerIn,
  ): string | undefined => {
    const payload = ev.payload || {};
    if (hasHiddenRoomReference(payload, publicRooms)) return undefined;
    const direct = payloadRoomId(payload);
    if (direct && publicRooms[direct]) return direct;
    const named = typeof payload.room_name === "string" ? payload.room_name : undefined;
    if (named && named.trim()) {
      const hit = publicRoomMatchingName(named, publicRooms);
      if (hit?.room_id && publicRooms[hit.room_id]) return hit.room_id;
    }
    const scopeId =
      entityScopeId(payload) ||
      (typeof payload.target_entity_id === "string" ? payload.target_entity_id : undefined);
    if (scopeId) {
      const home = entityHome(scopeId, publicRooms);
      return home?.room.room_id;
    }
    if (fallbackPlayer?.room_id && publicRooms[fallbackPlayer.room_id]) {
      return fallbackPlayer.room_id;
    }
    return undefined;
  };

  const isSafeActivity = (item: WatchRoomActivity): boolean => {
    if (!item.line || containsInternalId(item.line)) return false;
    if (item.target_label && containsInternalId(item.target_label)) return false;
    if (item.actor_label && containsInternalId(item.actor_label)) return false;
    if (item.listener_label && containsInternalId(item.listener_label)) return false;
    if (item.speech && containsInternalId(item.speech)) return false;
    return true;
  };

  const rawEntries: RoomActivityEntry[] = [];

  for (const ev of events) {
    const eventType = String(ev.event_type || "").toUpperCase();
    const payload = ev.payload || {};
    const op = String(payload.operation || "").toUpperCase();
    const occurredAt = typeof ev.at === "number" ? ev.at : undefined;
    const cycle = ev.cycle ?? 0;

    // Hidden room / hidden entity gate applies universally, even for resident agents.
    if (hasHiddenRoomReference(payload, publicRooms)) continue;
    const scopeId =
      entityScopeId(payload) ||
      (typeof payload.target_entity_id === "string" ? payload.target_entity_id : undefined);
    if (scopeId && !entityHome(scopeId, publicRooms)) continue;

    const senderId = (typeof payload.sender_id === "string" && payload.sender_id) || ev.player_id;
    const senderPlayer = resolvePlayer(senderId, ev.handle);
    const senderResident = isSenderResident(ev, senderId, senderPlayer);

    // 1. MESSAGE / MESSAGE_DELIVERED (resident-to-resident or resident room broadcast speech).
    if (eventType === "MESSAGE" || eventType === "MESSAGE_DELIVERED") {
      const roomId = resolvePublicRoomForEvent(ev, senderPlayer);
      if (!roomId || !publicRooms[roomId]) continue;
      const mid = typeof payload.message_id === "string" && payload.message_id ? payload.message_id : undefined;
      const merged = mid ? messageById.get(mid) : undefined;
      const effSenderId = (typeof payload.sender_id === "string" && payload.sender_id) || merged?.sender_id || ev.player_id;
      const effSenderPlayer = resolvePlayer(effSenderId, ev.handle);
      const effSenderResident = isSenderResident(ev, effSenderId, effSenderPlayer);

      const recipients: Array<{ id?: string; handle?: string }> = [];
      if (Array.isArray(payload.recipient_ids) && payload.recipient_ids.length > 0) {
        for (const r of payload.recipient_ids) {
          if (typeof r === "string" && r.trim()) recipients.push({ id: r.trim() });
        }
      } else {
        const recId =
          (typeof payload.to_player_id === "string" && payload.to_player_id.trim()) ||
          (typeof payload.recipient_id === "string" && payload.recipient_id.trim()) ||
          merged?.recipient_id;
        const recHandle =
          (typeof payload.to_handle === "string" && payload.to_handle.trim()) ||
          (typeof payload.listener_label === "string" && payload.listener_label.trim()) ||
          undefined;
        if (recId || recHandle) recipients.push({ id: recId, handle: recHandle });
      }

      const surface = String(payload.surface || "").toUpperCase();
      const isRoomBroadcast =
        recipients.length === 0 &&
        (payload.broadcast === true ||
          payload.scope === "room" ||
          payload.channel === "room" ||
          surface === "TRADE_NOTICE" ||
          surface === "ROOM" ||
          surface === "ROOM_BROADCAST");

      const allRecipientsResident =
        recipients.length > 0 && recipients.every((r) => isRecipientResident(r.id, r.handle));
      const allowSpeech = effSenderResident && (isRoomBroadcast || allRecipientsResident);

      if (allowSpeech) {
        const actorLabel = publicOccupantLabel(
          { handle: effSenderPlayer?.handle || ev.handle, player_id: effSenderId },
          roomRefs,
        );
        if (!actorLabel) continue;
        const firstRec = recipients[0] ? resolvePlayer(recipients[0].id, recipients[0].handle) : undefined;
        const listenerLabel = firstRec
          ? publicOccupantLabel({ handle: firstRec.handle, player_id: firstRec.player_id }, roomRefs) || undefined
          : undefined;
        const rawText = payload.text ?? payload.body ?? payload.message ?? merged?.text;
        const speech = sanitizePublicSpeech(rawText);
        const site = publicRooms[roomId].name;
        const line = speech
          ? (listenerLabel ? `${actorLabel} to ${listenerLabel}: ${speech}` : `${actorLabel}: ${speech}`)
          : (listenerLabel ? `${actorLabel} spoke with ${listenerLabel}` : `${actorLabel} spoke at ${site}`);
        const item: WatchRoomActivity = {
          sequence: ev.sequence,
          cycle,
          ...(occurredAt !== undefined ? { occurred_at: occurredAt } : {}),
          tier: "NORMAL",
          verb: "message",
          actor_label: actorLabel,
          ...(listenerLabel ? { listener_label: listenerLabel } : {}),
          line,
          ...(speech ? { speech } : {}),
          kind: "speech",
        };
        if (isSafeActivity(item)) rawEntries.push({ room_id: roomId, message_id: mid, item });
        continue;
      }

      // Fail-closed privacy boundary for external DMs and resident<->external DMs:
      // MESSAGE stays completely silent; MESSAGE_DELIVERED only keeps the redacted deed notice.
      if (eventType === "MESSAGE") continue;
      const we = sourceToWatchEvent(ev, publicRooms, livePlayers);
      if (we && we.room_id && publicRooms[we.room_id]) {
        const item: WatchRoomActivity = {
          sequence: we.sequence,
          cycle: we.cycle,
          ...(we.occurred_at !== undefined ? { occurred_at: we.occurred_at } : {}),
          tier: we.tier,
          verb: "message",
          ...(we.actor_label ? { actor_label: we.actor_label } : {}),
          line: we.line,
          kind: "deed",
        };
        if (isSafeActivity(item)) rawEntries.push({ room_id: we.room_id, message_id: mid, item });
      }
      continue;
    }

    // 2. Resident posture acts: LOOK / OBSERVE / INSPECT / WAIT (never on global recent_events).
    if (eventType === "LOOK" || eventType === "OBSERVE" || eventType === "INSPECT" || eventType === "WAIT") {
      if (!senderResident) continue;
      const roomId = resolvePublicRoomForEvent(ev, senderPlayer);
      if (!roomId || !publicRooms[roomId]) continue;
      const actorLabel = publicOccupantLabel(
        { handle: senderPlayer?.handle || ev.handle, player_id: senderId },
        roomRefs,
      );
      if (!actorLabel) continue;
      const roomTitle = publicRooms[roomId].name;
      const targetLabel = eventType === "INSPECT" ? resolvePublicTargetLabel(ev, publicRooms, roomId) : undefined;
      const verb = eventType === "INSPECT" ? "inspect" : eventType === "WAIT" ? "wait" : "look";
      const line =
        eventType === "INSPECT"
          ? (targetLabel ? `${actorLabel} inspected ${targetLabel}` : `${actorLabel} surveyed ${roomTitle}`)
          : eventType === "WAIT"
            ? `${actorLabel} held watch in ${roomTitle}`
            : `${actorLabel} surveyed ${roomTitle}`;
      const item: WatchRoomActivity = {
        sequence: ev.sequence,
        cycle,
        ...(occurredAt !== undefined ? { occurred_at: occurredAt } : {}),
        tier: "NORMAL",
        verb,
        actor_label: actorLabel,
        ...(targetLabel ? { target_label: targetLabel } : {}),
        line,
        kind: "posture",
      };
      if (isSafeActivity(item)) rawEntries.push({ room_id: roomId, item });
      continue;
    }

    // 3. Public-room work lifecycle acts (ENTITY_CREATE, in_progress construction/repair, REPURPOSE, ABANDON).
    if (eventType === "ENTITY_CREATE") {
      const home = entityHome(scopeId, publicRooms);
      if (!home) continue;
      const targetLabel = sanitizePublicLabel(home.label);
      const actorLabel = publicOccupantLabel(ev, roomRefs) || undefined;
      const item: WatchRoomActivity = {
        sequence: ev.sequence,
        cycle,
        ...(occurredAt !== undefined ? { occurred_at: occurredAt } : {}),
        tier: "NORMAL",
        verb: "build",
        ...(actorLabel ? { actor_label: actorLabel } : {}),
        ...(targetLabel ? { target_label: targetLabel } : {}),
        line: targetLabel
          ? `Work began on ${targetLabel} at ${home.room.name}`
          : `Construction underway at ${home.room.name}`,
        kind: "deed",
      };
      if (isSafeActivity(item)) rawEntries.push({ room_id: home.room.room_id, item });
      continue;
    }

    if (eventType === "ENTITY_UPDATE") {
      // Keep closed RFC-0132/RFC-0126 private-tie / hidden-topology / duplicate operations closed.
      if (
        op === "SHARE" ||
        op === "CONNECT" ||
        op === "CONSENT" ||
        op === "CONSENSUS" ||
        op === "RULE" ||
        op === "HARVEST" ||
        op === "ATTEST" ||
        op === "INFORMATION_CONTEST" ||
        op === "PRESENCE_PRESSURE"
      ) {
        continue;
      }
      if (payload.in_progress === true || op === "CONSTRUCT" || op === "BUILD") {
        const home = entityHome(scopeId, publicRooms);
        if (!home) continue;
        const targetLabel = sanitizePublicLabel(home.label);
        const actorLabel = publicOccupantLabel(ev, roomRefs) || undefined;
        const repairing = isRepairUpdate(ev);
        const verb = repairing ? "repair" : "build";
        const line = repairing
          ? (actorLabel && targetLabel
            ? `${actorLabel} worked on ${targetLabel}`
            : `Repair underway at ${home.room.name}`)
          : (targetLabel
            ? `Work began on ${targetLabel} at ${home.room.name}`
            : `Construction underway at ${home.room.name}`);
        const item: WatchRoomActivity = {
          sequence: ev.sequence,
          cycle,
          ...(occurredAt !== undefined ? { occurred_at: occurredAt } : {}),
          tier: "NORMAL",
          verb,
          ...(actorLabel ? { actor_label: actorLabel } : {}),
          ...(targetLabel ? { target_label: targetLabel } : {}),
          line,
          kind: "deed",
        };
        if (isSafeActivity(item)) rawEntries.push({ room_id: home.room.room_id, item });
        continue;
      }
      if (op === "REPURPOSE") {
        const home = entityHome(scopeId, publicRooms);
        if (!home) continue;
        const targetLabel = sanitizePublicLabel(home.label);
        const actorLabel = publicOccupantLabel(ev, roomRefs) || undefined;
        const item: WatchRoomActivity = {
          sequence: ev.sequence,
          cycle,
          ...(occurredAt !== undefined ? { occurred_at: occurredAt } : {}),
          tier: "NORMAL",
          verb: "repurpose",
          ...(actorLabel ? { actor_label: actorLabel } : {}),
          ...(targetLabel ? { target_label: targetLabel } : {}),
          line: `A public work was repurposed at ${home.room.name}`,
          kind: "deed",
        };
        if (isSafeActivity(item)) rawEntries.push({ room_id: home.room.room_id, item });
        continue;
      }
      if (op === "ABANDON" || payload.unclaimed === true) {
        const home = entityHome(scopeId, publicRooms);
        if (!home) continue;
        const targetLabel = sanitizePublicLabel(home.label);
        const actorLabel = publicOccupantLabel(ev, roomRefs) || undefined;
        const item: WatchRoomActivity = {
          sequence: ev.sequence,
          cycle,
          ...(occurredAt !== undefined ? { occurred_at: occurredAt } : {}),
          tier: "NORMAL",
          verb: "abandon",
          ...(actorLabel ? { actor_label: actorLabel } : {}),
          ...(targetLabel ? { target_label: targetLabel } : {}),
          line: `A public work was abandoned at ${home.room.name}`,
          kind: "deed",
        };
        if (isSafeActivity(item)) rawEntries.push({ room_id: home.room.room_id, item });
        continue;
      }
    }

    // Resident COMMIT_SUPPLY / supply.* transfer.
    if (
      eventType === "RESOURCE_TRANSFER" &&
      senderResident &&
      ((typeof payload.transfer_id === "string" && payload.transfer_id.startsWith("supply.")) ||
        payload.kind === "supply" ||
        op === "SUPPLY" ||
        op === "COMMIT_SUPPLY")
    ) {
      const roomId = resolvePublicRoomForEvent(ev, senderPlayer);
      if (!roomId || !publicRooms[roomId]) continue;
      const actorLabel = publicOccupantLabel(
        { handle: senderPlayer?.handle || ev.handle, player_id: senderId },
        roomRefs,
      ) || undefined;
      const targetLabel = resolvePublicTargetLabel(ev, publicRooms, roomId);
      const site = publicRooms[roomId].name;
      const item: WatchRoomActivity = {
        sequence: ev.sequence,
        cycle,
        ...(occurredAt !== undefined ? { occurred_at: occurredAt } : {}),
        tier: "NORMAL",
        verb: "commit_supply",
        ...(actorLabel ? { actor_label: actorLabel } : {}),
        ...(targetLabel ? { target_label: targetLabel } : {}),
        line: actorLabel ? `${actorLabel} committed supplies at ${site}` : `Supplies committed at ${site}`,
        kind: "deed",
      };
      if (isSafeActivity(item)) rawEntries.push({ room_id: roomId, item });
      continue;
    }

    // 4. Every standard public WatchEvent located in a public room.
    const we = sourceToWatchEvent(ev, publicRooms, livePlayers);
    if (!we) continue;
    const locatedRoomId =
      (we.room_id && publicRooms[we.room_id] ? we.room_id : undefined) ||
      (!scopeId && senderResident && senderPlayer?.room_id && publicRooms[senderPlayer.room_id]
        ? senderPlayer.room_id
        : undefined);
    if (!locatedRoomId) continue;
    const targetLabel = we.target_label || resolvePublicTargetLabel(ev, publicRooms, locatedRoomId);
    const item: WatchRoomActivity = {
      sequence: we.sequence,
      cycle: we.cycle,
      ...(we.occurred_at !== undefined ? { occurred_at: we.occurred_at } : {}),
      tier: we.tier,
      verb: we.verb || verbForEvent(ev, we.projection_id),
      ...(we.actor_label ? { actor_label: we.actor_label } : {}),
      ...(targetLabel ? { target_label: targetLabel } : {}),
      line: we.line,
      kind: "deed",
    };
    if (isSafeActivity(item)) rawEntries.push({ room_id: locatedRoomId, item });
  }

  // Deduplicate MESSAGE + MESSAGE_DELIVERED sharing the same message_id (prefer speech / richer entry).
  const byRoom = new Map<string, RoomActivityEntry[]>();
  for (const entry of rawEntries) {
    const list = byRoom.get(entry.room_id) || [];
    if (entry.message_id) {
      const prevIdx = list.findIndex((x) => x.message_id === entry.message_id);
      if (prevIdx >= 0) {
        const prev = list[prevIdx];
        const preferNew =
          (entry.item.kind === "speech" && prev.item.kind !== "speech") ||
          (entry.item.kind === prev.item.kind &&
            (Boolean(entry.item.speech) && !prev.item.speech
              ? true
              : entry.item.sequence > prev.item.sequence));
        if (preferNew) list[prevIdx] = entry;
        continue;
      }
    }
    list.push(entry);
    byRoom.set(entry.room_id, list);
  }

  const out = new Map<string, WatchRoomActivity[]>();
  for (const [roomId, list] of byRoom.entries()) {
    const sorted = list
      .map((x) => x.item)
      .sort((a, b) => {
        const sq = b.sequence - a.sequence;
        if (sq) return sq;
        const vb = a.verb.localeCompare(b.verb);
        if (vb) return vb;
        return a.line.localeCompare(b.line);
      })
      .slice(0, 16);
    if (sorted.length) out.set(roomId, sorted);
  }
  return out;
}

export function buildWatchLive(input: {
  world_id: string;
  cycle: number;
  sequence: number;
  rooms: Record<string, WatchRoomIn>;
  players: WatchPlayerIn[];
  events: WatchSourceEvent[];
  public_pulses?: PublicPulseIn[];
  handles?: Record<string, string | undefined>;
  world_status?: string;
  freshness?: string;
  held?: HeldHeadline | null;
  now?: number;
  rumor?: LaterTraceRumor;
  organizations?: LaterTraceOrg[];
  // Raw records must pass the public visibility gate below.
  reconstructions?: Array<{ fidelity?: number; controllers?: number; visibility?: string }>;
  // Optional preprojected public values, never unfiltered reconstruction state.
  reconstruction_fidelity?: number;
  controllers?: number;
}): Record<string, unknown> {
  const now = input.now ?? Date.now();
  const freshness = input.freshness || "live";
  const locatedPulses = normalizePublicPulses(input.public_pulses);
  const pulses = locatedPulses.map((p) => p.text);

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
    .map((ev) => sourceToWatchEvent(ev, publicRooms, live))
    .filter((e): e is WatchEvent => Boolean(e));

  const fromPulses = locatedPulses.map((p, i) =>
    pulseToWatchEvent(p.text, input.sequence - i, input.cycle, publicRooms, p.room_id),
  );
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

  // RFC-0024 / GC6-S1: WATCH may project only public reconstructions.
  // Retain the existing first-public selection, not a new aggregation policy.
  // Both fields belong to that record. Missing public evidence keeps the
  // existing 0/1 defaults, and an explicit zero must not fall back to private data.
  const publicReconstruction = input.reconstructions?.find(
    (r) => r.visibility?.toUpperCase() === "PUBLIC",
  );
  const reconstruction_fidelity = input.reconstruction_fidelity ?? publicReconstruction?.fidelity ?? 0;
  const controllers = input.controllers ?? publicReconstruction?.controllers ?? 1;

  const roomActivityByRoom = buildRoomActivityMap(
    input.events || [],
    publicRooms,
    input.players || [],
    live,
  );

  const roomRefs = Object.values(publicRooms);
  const roomsOut = Object.values(publicRooms).map((r) => {
    const here = byRoom.get(r.room_id) || [];
    const labels = here.map((p) => publicPlayerLabel(p, roomRefs)).filter((h): h is string => Boolean(h));
    const exits = (r.exits || []).filter((x) => x.hidden !== true && Boolean(publicRooms[x.to_room_id]));
    const publicEntities = (r.entities || []).filter(isPublicEntity);
    // WATCH-LIGHTWEIGHT-SPECTATOR pins this projection to public entity fields
    // and separately forbids entity ids on `rooms[].traces[]`. The id was
    // shipped here for a `label || entity_id` fallback in the spectator page
    // that cannot fire -- `label` is required on EntityRuntime -- so it was
    // publishing an internal identifier to satisfy an unreachable branch.
    const entities = publicEntities.map((e) => ({
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
    const roomActivity = roomActivityByRoom.get(r.room_id) || [];
    const recentHere = candidates.some((ev) => ev.room_id === r.room_id) || roomActivity.length > 0;
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
    if (roomActivity.length) row.room_activity = roomActivity;
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

  const latestActionByActor = new Map<string, WatchEvent>();
  // Roster last_action uses the pre-truncation candidate window so a deed
  // dropped by the visible-feed cap or the movement cap is still the agent's
  // latest public action.
  const actionWindow = [...candidates].sort((a, b) => b.sequence - a.sequence);
  for (const ev of actionWindow) {
    if (ev.actor_label && !latestActionByActor.has(ev.actor_label)) {
      latestActionByActor.set(ev.actor_label, ev);
    }
  }
  const latestActivityByActor = new Map<string, WatchRoomActivity>();
  for (const acts of roomActivityByRoom.values()) {
    for (const act of acts) {
      if (!act.actor_label) continue;
      const prev = latestActivityByActor.get(act.actor_label);
      if (!prev || act.sequence > prev.sequence) {
        latestActivityByActor.set(act.actor_label, act);
      }
    }
  }
  const agents = live.flatMap((p) => {
    if (!p.room_id || !publicRooms[p.room_id]) return [];
    const label = publicPlayerLabel(p, roomRefs);
    if (!label) return [];
    const rid = p.room_id;
    const isPublic = isPublicActivityPlayer(p.player_id, p);
    const lastEv = latestActionByActor.get(label);
    const lastAct = latestActivityByActor.get(label);
    const useAct = isPublic && lastAct && (!lastEv || lastAct.sequence >= lastEv.sequence);
    const lastVerb = useAct ? lastAct.verb : (lastEv?.verb || lastAct?.verb);
    const lastTargetLabel = useAct
      ? (lastAct.target_label || lastEv?.target_label)
      : (lastEv?.target_label || lastAct?.target_label);
    return [
      {
        label,
        room_id: rid,
        room_name: publicRooms[rid]?.name || rid,
        last_action: useAct ? lastAct.line : (lastEv?.line || null),
        last_action_at: useAct ? (lastAct.occurred_at ?? lastEv?.occurred_at ?? null) : (lastEv?.occurred_at ?? null),
        active: true,
        public_activity: isPublic,
        ...(lastVerb ? { last_verb: lastVerb } : {}),
        ...(lastTargetLabel ? { last_target_label: lastTargetLabel } : {}),
      },
    ];
  });

  return { reconstruction_fidelity, controllers, corroboration: controllers, 
    watch_live: WATCH_LIVE_PIN,
    projection: "public",
    world_id: input.world_id,
    cycle: input.cycle,
    sequence: input.sequence,
    players_present: playersPresent,
    agents,
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

/** Alias for buildWatchLive used by RFC-0134 Room View projection callers. */
export const projectWatchLive = buildWatchLive;

/** Causal edges require an explicit payload relation. Sequence adjacency is not a cause. */
export function explicitWatchCause(payload?: Record<string, unknown> | null): string | null {
  if (!payload || typeof payload !== "object") return null;
  const rel = payload.caused_by ?? payload.parent_event_id ?? payload.relation;
  if (typeof rel !== "string") return null;
  const t = rel.trim();
  return t || null;
}
