/** Read-only PLAY traces from existing world residue. No new events. */

export type PlayTraceKind = "scar" | "construction" | "notice";

export type PlayTrace = {
  kind: PlayTraceKind;
  text: string;
  visibility: "public";
};

export type TraceRoom = {
  hidden?: boolean;
  entities?: Array<{
    label?: string;
    scar?: boolean;
    hidden?: boolean;
    in_progress?: boolean;
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

/** Project current public residue. Stale when source state is gone. */
export function projectRoomTraces(room: TraceRoom | null | undefined): PlayTrace[] {
  if (!room || room.hidden) return [];
  const out: PlayTrace[] = [];
  const seen = new Set<string>();
  const add = (kind: PlayTraceKind, text: string) => {
    const t = publicText(text);
    if (!t || seen.has(t) || out.length >= MAX_TRACES) return;
    seen.add(t);
    out.push({ kind, text: t, visibility: "public" });
  };

  const ents = (room.entities || []).filter((e) => !e.hidden && String(e.label || "").trim());
  const scars = ents.filter((e) => e.scar === true).sort((a, b) => String(a.label).localeCompare(String(b.label)));
  for (const e of scars) add("scar", `A scar remains (${e.label}).`);

  const works = ents.filter((e) => e.in_progress === true).sort((a, b) => String(a.label).localeCompare(String(b.label)));
  for (const e of works) add("construction", `Work is unfinished (${e.label}).`);

  const board = room.board && room.board.length ? room.board[room.board.length - 1] : undefined;
  if (board?.text) add("notice", board.text);
  if (room.shout?.text) add("notice", room.shout.text);
  if (room.institution_notice?.text) add("notice", room.institution_notice.text);
  if (room.trade_notice?.text) add("notice", room.trade_notice.text);

  return out;
}
