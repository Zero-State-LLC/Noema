/**
 * WR-S0..S4 public world report. Projection only.
 * Authority: Noema-Specs docs/WR-S4-CRIME-REPORT.md / RFC-0094.
 */

import { enrichEntity } from "./actions";
import { isHiddenRoom } from "./construction";

export const WORLD_REPORT_CATALOG_ID = "world-report-catalog/wr-s4";
/** WR-S0. Last public report rebuilds when committed cycle is a multiple of this. */
export const REPORT_EVERY_CYCLES = 5;

export function shouldWriteWorldReport(cycle: number): boolean {
  return cycle >= REPORT_EVERY_CYCLES && cycle % REPORT_EVERY_CYCLES === 0;
}

export type ReportInfra = {
  entity_id: string;
  label: string;
  entity_type: string;
  condition?: number;
  in_progress?: boolean;
  hidden?: boolean;
  scar?: boolean;
};

export function publicReportLines(
  rooms: Record<string, { name?: string; hidden?: boolean; tags?: string[]; entities?: ReportInfra[] }>,
  organizations?: Record<string, { org_id?: string; name?: string; status?: string }>,
  contests?: Record<string, { contest_id?: string; contest_form?: string; room_id?: string; status?: string }>,
  restrictions?: Array<{
    restriction_id?: string;
    scope?: string;
    room_id?: string;
    exit_id?: string;
    expires_cycle?: number;
  }>,
  cycle?: number,
  social?: Array<{
    event_id?: string;
    event_type?: string;
    payload?: Record<string, unknown>;
  }>,
): string[] {
  const lines: string[] = [];
  const roomIds = Object.keys(rooms || {}).sort();
  for (const roomId of roomIds) {
    const room = rooms[roomId];
    if (isHiddenRoom(room)) continue;
    const ents = [...(room.entities || [])].sort((a, b) => a.entity_id.localeCompare(b.entity_id));
    for (const raw of ents) {
      const e = enrichEntity(raw);
      if (e.hidden) continue;
      if ((e.entity_type || "").toUpperCase() !== "INFRASTRUCTURE") continue;
      if (e.in_progress === true || e.scar === true) continue;
      const cond = typeof e.condition === "number" ? e.condition : 70;
      const label = (e.label || e.entity_id).replace(/-/g, " ");
      lines.push(`${label} condition ${cond}.`);
    }
  }
  const orgs = Object.values(organizations || {})
    .filter((o) => o.status === "ACTIVE" && o.name)
    .sort((a, b) => String(a.org_id || a.name).localeCompare(String(b.org_id || b.name)));
  for (const org of orgs) {
    lines.push(`${org.name} stands.`);
  }
  const open = Object.values(contests || {})
    .filter((c) => {
      if (c.status !== "OPEN" || !c.contest_form || !c.room_id) return false;
      const room = rooms[c.room_id];
      return Boolean(room) && !isHiddenRoom(room);
    })
    .sort((a, b) => String(a.contest_id || "").localeCompare(String(b.contest_id || "")));
  for (const c of open) {
    const form = String(c.contest_form).replace(/_/g, " ").toLowerCase();
    lines.push(`${form} is contested.`);
  }
  const now = typeof cycle === "number" ? cycle : 0;
  const live = [...(restrictions || [])]
    .filter((r) => {
      if (r.expires_cycle != null && now > r.expires_cycle) return false;
      if (!r.room_id) return false;
      const room = rooms[r.room_id];
      return Boolean(room) && !isHiddenRoom(room);
    })
    .sort((a, b) => String(a.restriction_id || "").localeCompare(String(b.restriction_id || "")));
  for (const r of live) {
    const room = rooms[r.room_id!];
    const place = room.name || r.room_id;
    if (r.scope === "EXIT" && r.exit_id) {
      lines.push(`${place} ${r.exit_id} is restricted.`);
    } else {
      lines.push(`${place} is restricted.`);
    }
  }
  const crimes = [...(social || [])]
    .filter((ev) => {
      if (ev.event_type !== "CRIME_DETECTED") return false;
      const p = ev.payload || {};
      if (typeof p.category !== "string" || typeof p.room_id !== "string") return false;
      const flags = Array.isArray(p.flags) ? p.flags.map(String) : [];
      const pub = p.visibility === "PUBLIC" || flags.includes("PUBLIC_HISTORY");
      if (!pub) return false;
      const room = rooms[p.room_id];
      return Boolean(room) && !isHiddenRoom(room);
    })
    .sort((a, b) =>
      String(a.payload?.detection_id || a.event_id || "").localeCompare(
        String(b.payload?.detection_id || b.event_id || ""),
      ),
    );
  for (const ev of crimes) {
    const category = String(ev.payload?.category || "")
      .replace(/_/g, " ")
      .toLowerCase();
    if (category) lines.push(`${category} is detected.`);
  }
  return lines;
}
