/**
 * GC4-S4 designated institutional succession.
 * Authority: Noema-Specs docs/GC4-S4-SUCCESSION.md / RFC-0031.
 * No implicit jump. No identity / ownership / controller transfer.
 */

import type { EmergencyScope } from "./emergency";
import type { OfficeRecord } from "./offices";

export const MAX_SUCCESSORS = 2;
export const WATCH_SUCCESSION_PULSE = "A designated successor has taken an institution office.";

export type SuccessionRule = {
  successors: string[];
  designated_by: string;
  designated_cycle: number;
};

type OrgLike = {
  status?: string;
  members?: Array<{ agent_id: string }>;
};

export function parseSuccessorList(raw: unknown, fallback?: string): string[] {
  const out: string[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const id = String(item || "").trim();
      if (id && !out.includes(id)) out.push(id);
    }
  }
  const extra = String(fallback || "").trim();
  if (extra && !out.includes(extra)) out.push(extra);
  return out.slice(0, MAX_SUCCESSORS);
}

export function eligibleSuccessor(
  successors: string[] | undefined,
  org: OrgLike,
  players: Record<string, unknown> | undefined,
  departedId: string,
): string | null {
  if (org.status !== "ACTIVE") return null;
  for (const id of successors || []) {
    if (!id || id === departedId) continue;
    if (!players?.[id]) continue;
    if (!(org.members || []).some((m) => m.agent_id === id)) continue;
    return id;
  }
  return null;
}

export function activateOfficeSuccession(
  office: OfficeRecord,
  org: OrgLike,
  players: Record<string, unknown> | undefined,
  departedId: string,
  cycle: number,
): { holder_player_id: string } | null {
  if (office.status !== "VACANT") return null;
  const id = eligibleSuccessor(office.succession?.successors, org, players, departedId);
  if (!id) return null;
  office.holder_player_id = id;
  office.status = "OCCUPIED";
  office.history.push({ cycle, holder_player_id: id, kind: "ASSIGNED" });
  return { holder_player_id: id };
}

export function activateEmergencySuccession(
  scope: EmergencyScope,
  org: OrgLike,
  players: Record<string, unknown> | undefined,
  departedId: string,
  cycle: number,
): { holder_player_id: string } | null {
  if (scope.status !== "ACTIVE" || scope.holder_player_id !== departedId) return null;
  if (cycle >= scope.end_cycle) return null;
  const id = eligibleSuccessor(scope.succession?.successors, org, players, departedId);
  if (!id) return null;
  scope.holder_player_id = id;
  return { holder_player_id: id };
}
