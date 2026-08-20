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
  | { kind: "room"; room_id?: string; field: "board" | "shout" | "institution_notice" | "trade_notice" | "rumor" }
  | { kind: "org"; org_id: string; field: "insignia" | "memorial" };

export type LaterTraceRumorClaim = {
  visibility?: string;
  subject_ref?: string;
  origin_claim_id?: string;
};

export type LaterTraceRumor = {
  claims?: Record<string, LaterTraceRumorClaim>;
};

export type LaterTraceOrg = {
  org_id: string;
  name: string;
  offices?: Record<string, { status?: string; display_name?: string }>;
};

export type LaterTraceInput = {
  room_id: string;
  entities?: Array<{ entity_id?: string; owner_id?: string; hidden?: boolean }>;
  rumor?: LaterTraceRumor | null;
  orgs?: LaterTraceOrg[];
};

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
    owner_id?: string;
  }>;
  board?: Array<{ text: string; cycle: number }>;
  shout?: { text: string; cycle: number };
  institution_notice?: { text: string; cycle: number; org_name?: string };
  trade_notice?: { text: string; cycle: number };
  public_rumor?: { contested?: boolean };
  org_marks?: Array<{ name: string }>;
  vacant_offices?: Array<{ org_name: string; office_name: string }>;
};

const MAX_TRACES = 3;

function publicOrgName(raw: string): string {
  return String(raw || "")
    .replace(/^org\./i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
}

/** Bind later Feature D families (rumor / insignia / memorial) to a room from canonical state. */
export function laterTraceInputs(input: LaterTraceInput): Pick<
  TraceRoom,
  "public_rumor" | "org_marks" | "vacant_offices"
> {
  const roomId = String(input.room_id || "");
  const ents = (input.entities || []).filter((e) => !e.hidden);
  const subjects = new Set(
    [roomId, ...ents.map((e) => String(e.entity_id || "")).filter(Boolean)].filter(Boolean),
  );
  const claims = Object.values(input.rumor?.claims || {}).filter(
    (c) => String(c.visibility || "").toUpperCase() === "PUBLIC" && c.subject_ref && subjects.has(c.subject_ref),
  );
  let public_rumor: { contested?: boolean } | undefined;
  if (claims.length) {
    const roots = new Set(claims.map((c) => c.origin_claim_id || "").filter(Boolean));
    public_rumor = { contested: roots.size >= 2 };
  }
  const orgIds = new Set(ents.map((e) => e.owner_id).filter((id): id is string => Boolean(id)));
  const org_marks: Array<{ name: string }> = [];
  const vacant_offices: Array<{ org_name: string; office_name: string }> = [];
  for (const org of input.orgs || []) {
    if (!orgIds.has(org.org_id)) continue;
    const name = publicOrgName(org.name || org.org_id);
    if (!name) continue;
    if (!org_marks.some((m) => m.name === name)) org_marks.push({ name });
    for (const office of Object.values(org.offices || {})) {
      if (String(office.status || "").toUpperCase() !== "VACANT") continue;
      const office_name = String(office.display_name || "").trim().slice(0, 48);
      if (!office_name) continue;
      vacant_offices.push({ org_name: name, office_name });
    }
  }
  return {
    ...(public_rumor ? { public_rumor } : {}),
    ...(org_marks.length ? { org_marks } : {}),
    ...(vacant_offices.length ? { vacant_offices } : {}),
  };
}

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

  if (room.public_rumor) {
    add("notice", "A public report concerns this site.", { kind: "room", field: "rumor" });
    if (room.public_rumor.contested) {
      add("notice", "Accounts of this differ.", { kind: "room", field: "rumor" });
    }
  }
  for (const mark of room.org_marks || []) {
    const name = publicOrgName(mark.name);
    if (!name) continue;
    add("notice", `Marks of ${name} remain here.`, { kind: "org", org_id: name, field: "insignia" });
  }
  for (const seat of room.vacant_offices || []) {
    const org_name = publicOrgName(seat.org_name);
    const office_name = String(seat.office_name || "").trim().slice(0, 48);
    if (!org_name || !office_name) continue;
    add("notice", `${office_name} of ${org_name} stands vacant.`, {
      kind: "org",
      org_id: org_name,
      field: "memorial",
    });
  }

  return out;
}
