/**
 * WR-S0 public world report. Projection only.
 * Authority: Noema-Specs docs/WR-S0-WORLD-REPORT.md / RFC-0088.
 */

import { enrichEntity } from "./actions";
import { isHiddenRoom } from "./construction";

export const WORLD_REPORT_CATALOG_ID = "world-report-catalog/wr-s2";
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
  rooms: Record<string, { hidden?: boolean; tags?: string[]; entities?: ReportInfra[] }>,
  organizations?: Record<string, { org_id?: string; name?: string; status?: string }>,
  contests?: Record<string, { contest_id?: string; contest_form?: string; room_id?: string; status?: string }>,
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
  return lines;
}
