/**
 * Operator live theater — agent/system Player text + public site map.
 * Admin-only. Not public WATCH. Never a writer.
 */

import { isHiddenRoom } from "./construction";
import { isPresentNow, listSystemActors, type PresencePlayer } from "./ops";
import {
  glyphForCommandVerb,
  glyphForEntity,
  glyphForExit,
  glyphForPlayer,
  glyphForProjection,
  glyphForRoom,
  type GlyphId,
} from "./presentation/glyphs";

export const OPERATOR_WATCH_PIN = "operator-watch/1.0";
export const OPERATOR_WATCH_MAX_LINES = 80;

export type OperatorWatchLine = {
  at: number;
  handle: string;
  room_id?: string;
  room_name?: string;
  command: string;
  line: string;
  glyph: GlyphId;
  operator_id?: string;
};

export type OperatorWatchSite = {
  room_id: string;
  name: string;
  glyph: GlyphId;
  players_present: number;
  active: boolean;
  player_labels: string[];
  exits: Array<{ direction: string; to_room_id: string; to_room_name?: string; glyph: GlyphId }>;
  entities: Array<{ label: string; entity_type: string; glyph: GlyphId }>;
};

const PRIVATE_VERBS = new Set(["MESSAGE", "TALK"]);

export function actorVisibleToOperator(
  actor: { operator_id?: string; controller_type?: string },
  operatorId?: string,
): boolean {
  if (actor.controller_type && actor.controller_type !== "agent") return false;
  if (!actor.operator_id) return true;
  if (!operatorId) return true;
  return actor.operator_id === operatorId;
}

export function lineVisibleToOperator(line: { operator_id?: string }, operatorId?: string): boolean {
  if (!operatorId) return true;
  if (!line.operator_id) return true;
  return line.operator_id === operatorId;
}

export function redactOperatorWatchText(raw: unknown): string {
  return String(raw || "")
    .replace(/player\.[A-Za-z0-9._-]+/gi, "a player")
    .replace(/[<>&"'`]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export function commandVerb(command: string): string {
  return String(command || "")
    .trim()
    .split(/\s+/)[0]
    .toUpperCase();
}

export function lineFromObservation(opts: {
  command: string;
  consequence?: string;
  location?: { name?: string; description?: string };
  situation?: { place?: string };
}): { command: string; line: string; glyph: GlyphId } {
  const verb = commandVerb(opts.command);
  const glyph = glyphForCommandVerb(verb);
  if (PRIVATE_VERBS.has(verb)) {
    return { command: verb, line: "sent a message", glyph };
  }
  const place = opts.location?.name || opts.situation?.place || "";
  let body = "";
  if (verb === "LOOK" || verb === "INSPECT" || verb === "OBSERVE") {
    body = redactOperatorWatchText(opts.location?.description || opts.consequence || place);
  } else {
    body = redactOperatorWatchText(opts.consequence || opts.situation?.place || place);
  }
  const line = [place && verb === "LOOK" ? place : "", body].filter(Boolean).join(" — ") || verb.toLowerCase();
  return { command: verb || "LOOK", line: redactOperatorWatchText(line), glyph };
}

export function appendOperatorWatchLine(
  prev: OperatorWatchLine[] | undefined,
  next: OperatorWatchLine,
): OperatorWatchLine[] {
  const rows = Array.isArray(prev) ? prev.slice() : [];
  rows.push(next);
  return rows.slice(-OPERATOR_WATCH_MAX_LINES);
}

export function buildOperatorWatch(input: {
  world_id: string;
  cycle: number;
  sequence: number;
  rooms: Record<string, {
    room_id: string;
    name: string;
    description?: string;
    hidden?: boolean;
    tags?: string[];
    exits?: Array<{ direction: string; to_room_id: string; hidden?: boolean }>;
    entities?: Array<{ entity_id?: string; label: string; entity_type: string; hidden?: boolean }>;
  }>;
  players: Record<string, PresencePlayer>;
  lines: OperatorWatchLine[];
  now?: number;
  /** When set, hide other operators' owned agents. Unowned/legacy stay visible. */
  operator_id?: string;
}): Record<string, unknown> {
  const now = input.now ?? Date.now();
  const publicRooms: typeof input.rooms = {};
  for (const r of Object.values(input.rooms || {})) {
    if (!r || isHiddenRoom(r)) continue;
    publicRooms[r.room_id] = r;
  }
  const actors = listSystemActors(input.players)
    .filter((row) => actorVisibleToOperator(row, input.operator_id))
    .map((row) => {
    const room = row.room_id && publicRooms[row.room_id] ? publicRooms[row.room_id] : undefined;
    return {
      handle: row.handle,
      room_id: room?.room_id,
      room_name: room?.name,
      entered: row.entered,
      present: isPresentNow(input.players[row.player_id], now),
      glyph: glyphForPlayer(),
    };
  });
  const byRoom = new Map<string, string[]>();
  for (const a of actors) {
    if (!a.room_id || !a.present || !a.entered) continue;
    const list = byRoom.get(a.room_id) || [];
    list.push(a.handle);
    byRoom.set(a.room_id, list);
  }
  const sites: OperatorWatchSite[] = Object.values(publicRooms).map((r) => {
    const labels = byRoom.get(r.room_id) || [];
    const exits = (r.exits || []).filter((x) => x.hidden !== true && Boolean(publicRooms[x.to_room_id]));
    const entities = (r.entities || []).filter((e) => e && e.hidden !== true);
    return {
      room_id: r.room_id,
      name: r.name,
      glyph: glyphForRoom(),
      players_present: labels.length,
      active: labels.length > 0,
      player_labels: labels,
      exits: exits.map((x) => ({
        direction: x.direction,
        to_room_id: x.to_room_id,
        to_room_name: publicRooms[x.to_room_id]?.name,
        glyph: glyphForExit(),
      })),
      entities: entities.map((e) => ({
        label: e.label,
        entity_type: e.entity_type,
        glyph: glyphForEntity(e.entity_type, e.label),
      })),
    };
  });
  const lines = (input.lines || [])
    .filter((row) => row && row.line)
    .filter((row) => lineVisibleToOperator(row, input.operator_id))
    .slice(-40)
    .map((row) => ({
      at: row.at,
      handle: redactOperatorWatchText(row.handle).slice(0, 32),
      room_id: row.room_id,
      room_name: row.room_name,
      command: row.command,
      line: redactOperatorWatchText(row.line),
      glyph: row.glyph || glyphForProjection(),
    }))
    .reverse();
  return {
    operator_watch: OPERATOR_WATCH_PIN,
    world_id: input.world_id,
    cycle: input.cycle,
    sequence: input.sequence,
    operator_id: input.operator_id || null,
    note: "Operator theater for agent-controlled Players you minted or enrolled. Not public WATCH. Not world truth.",
    agents: actors,
    sites,
    lines,
  };
}

/** PIXEL sketch input from operator theater. Public rooms only; occupancy is this operator's agents. */
export function phosphorSnapshotFromOperatorWatch(data: {
  sequence?: number;
  sites?: OperatorWatchSite[];
  lines?: Array<{ room_id?: string }>;
}): {
  sequence: number;
  rooms: Array<{
    room_id: string;
    name: string;
    players_present: number;
    public_player_labels: string[];
    active: boolean;
    exits: OperatorWatchSite["exits"];
    entities: OperatorWatchSite["entities"];
  }>;
  recent_events: Array<{ sequence: number; room_id: string; tier: "NORMAL" }>;
} {
  const sequence = Number(data.sequence || 0);
  const rooms = (data.sites || []).map((s) => ({
    room_id: s.room_id,
    name: s.name,
    players_present: Number(s.players_present || 0),
    public_player_labels: Array.isArray(s.player_labels) ? s.player_labels : [],
    active: s.active === true || Number(s.players_present || 0) > 0,
    exits: s.exits || [],
    entities: s.entities || [],
  }));
  const recent_events = (data.lines || [])
    .filter((row) => row && row.room_id)
    .slice(0, 12)
    .map((row, i) => ({
      sequence: Math.max(0, sequence - i),
      room_id: String(row.room_id),
      tier: "NORMAL" as const,
    }));
  return { sequence, rooms, recent_events };
}
