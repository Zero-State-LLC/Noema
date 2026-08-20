/** Read-only PLAY traces from existing world residue. No new events. */

import type { ObservationTrace } from "./types";

export type PlayTraceKind = "scar" | "construction" | "notice";

export type PlayTrace = {
  kind: PlayTraceKind;
  text: string;
  visibility: "public";
};

export type TraceSourceRef =
  | { kind: "entity"; entity_id: string; field: "scar" | "in_progress" | "last_repair" | "unclaimed" }
  | { kind: "room"; room_id?: string; field: "board" | "shout" | "institution_notice" | "trade_notice" };

export type ProjectedTrace = PlayTrace & {
  source_state_ref: TraceSourceRef;
};

export type TraceRoom = {
  hidden?: boolean;
  entities?: Array<{
    entity_id?: string;
    label?: string;
    entity_type?: string;
    scar?: boolean;
    hidden?: boolean;
    in_progress?: boolean;
    unclaimed?: boolean;
    last_repair_cycle?: number;
    last_repair_handle?: string;
  }>;
  board?: Array<{ text: string; cycle: number }>;
  shout?: { text: string; cycle: number };
  institution_notice?: { text: string; cycle: number; org_name?: string };
  trade_notice?: { text: string; cycle: number };
};

const MAX_TRACES = 3;

function publicText(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 160);
}

export function safePlateHandle(raw: string | undefined): string | null {
  const h = String(raw || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 32);
  if (!h) return null;
  if (/(?:player|entity|ctrl)\./i.test(h)) return null;
  return h;
}

/** Strip internal provenance. Public Observation.location.traces shape. */
export function publicTraces(traces: ProjectedTrace[]): ObservationTrace[] {
  return traces.map(({ kind, text, visibility }) => ({ kind, text, visibility }));
}

/** Project current public residue. Stale when source state is gone. */
export function projectRoomTraces(room: TraceRoom | null | undefined): ProjectedTrace[] {
  if (!room || room.hidden) return [];
  const out: ProjectedTrace[] = [];
  const seen = new Set<string>();
  const add = (kind: PlayTraceKind, text: string, source_state_ref: TraceSourceRef) => {
    const t = publicText(text);
    if (!t || seen.has(t) || out.length >= MAX_TRACES) return;
    seen.add(t);
    out.push({ kind, text: t, visibility: "public", source_state_ref });
  };

  const ents = (room.entities || []).filter((e) => !e.hidden && String(e.label || "").trim());
  const isScar = (e: (typeof ents)[number]) =>
    e.scar === true || String(e.entity_type || "").toUpperCase() === "RUIN";
  const scars = ents
    .filter(isScar)
    .sort((a, b) => String(a.label).localeCompare(String(b.label)));
  for (const e of scars) {
    add("scar", `A scar remains (${e.label}).`, {
      kind: "entity",
      entity_id: String(e.entity_id || ""),
      field: "scar",
    });
  }

  const plates = ents
    .filter((e) => e.last_repair_cycle != null && safePlateHandle(e.last_repair_handle) && e.entity_id)
    .sort((a, b) => String(a.label).localeCompare(String(b.label)));
  for (const e of plates) {
    const handle = safePlateHandle(e.last_repair_handle);
    if (!handle) continue;
    add("construction", `A maintenance plate names ${handle} as the last repairer.`, {
      kind: "entity",
      entity_id: String(e.entity_id),
      field: "last_repair",
    });
  }

  const works = ents
    .filter((e) => e.in_progress === true)
    .sort((a, b) => String(a.label).localeCompare(String(b.label)));
  for (const e of works) {
    add("construction", `Work is unfinished (${e.label}).`, {
      kind: "entity",
      entity_id: String(e.entity_id || ""),
      field: "in_progress",
    });
  }

  const abandoned = ents
    .filter((e) => e.unclaimed === true && !isScar(e))
    .sort((a, b) => String(a.label).localeCompare(String(b.label)));
  for (const e of abandoned) {
    add("construction", `The ${String(e.label).replace(/-/g, " ")} is unclaimed.`, {
      kind: "entity",
      entity_id: String(e.entity_id || ""),
      field: "unclaimed",
    });
  }

  const board = room.board && room.board.length ? room.board[room.board.length - 1] : undefined;
  if (board?.text) add("notice", board.text, { kind: "room", field: "board" });
  if (room.shout?.text) add("notice", room.shout.text, { kind: "room", field: "shout" });
  if (room.institution_notice?.text) {
    add("notice", room.institution_notice.text, { kind: "room", field: "institution_notice" });
  }
  if (room.trade_notice?.text) add("notice", room.trade_notice.text, { kind: "room", field: "trade_notice" });

  return out;
}
