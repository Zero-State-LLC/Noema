/**
 * GC4-S1 named institutional offices. Persistent seats on an Organization.
 * Authority: Noema-Specs docs/GC4-S1-OFFICES.md / RFC-0023.
 * Not a membership role. Not ROLE_* events.
 */

export const OFFICE_CATALOG_ID = "office-catalog/gc4-s1";

export const OFFICE_PROFILES = [
  "PUBLISH_NOTICE",
  "OPERATE_RESOURCE_ACCOUNT",
  "ACCESS_RESTRICTED_ARCHIVE",
  "GRANT_ACCESS",
  "OPERATE_NAMED_ASSET",
] as const;

export type OfficeProfile = (typeof OFFICE_PROFILES)[number];
export const HOSTED_ACT_PROFILES: readonly OfficeProfile[] = ["PUBLISH_NOTICE"];
export const TRADE_PROFILE: OfficeProfile = "OPERATE_RESOURCE_ACCOUNT";
export const REPAIR_PROFILE: OfficeProfile = "OPERATE_NAMED_ASSET";
export const ACCESS_PROFILE: OfficeProfile = "GRANT_ACCESS";
export const OFFICE_REQUIRED_TRACKS = ["engineer", "broker"] as const;
export type OfficeRequiredTrack = (typeof OFFICE_REQUIRED_TRACKS)[number];

export type Treasury = {
  attention: number;
  compute: number;
  energy: number;
  influence: number;
  storage: number;
};

export function emptyTreasury(): Treasury {
  return { attention: 0, compute: 0, energy: 0, influence: 0, storage: 0 };
}

export function ensureTreasury(org: { treasury?: Treasury }): Treasury {
  if (!org.treasury) org.treasury = emptyTreasury();
  return org.treasury;
}

export type OfficeStatus = "VACANT" | "OCCUPIED" | "RETIRED";

export type OfficeRecord = {
  office_id: string;
  institution_id: string;
  display_name: string;
  status: OfficeStatus;
  holder_player_id?: string;
  authority_profile: OfficeProfile;
  created_cycle: number;
  retired_cycle?: number;
  history: Array<{ cycle: number; holder_player_id: string | null; kind: "ASSIGNED" | "VACATED" | "RETIRED" }>;
  succession?: import("./succession").SuccessionRule;
  /** Listed objects this grant covers. Absent/empty = whole profile universe. */
  object_set?: string[];
  /** GC1-S5. Absent = any member. engineer|broker only. */
  requires_track?: OfficeRequiredTrack;
  /** GC4-S5 CONSENSUS consents. Vacant office only. */
  consents?: import("./succession").OfficeConsent[];
};

export type OfficePublic = {
  office_id: string;
  display_name: string;
  status: OfficeStatus;
  holder_player_id?: string;
  holder_handle?: string;
  authority_profile: OfficeProfile;
  successor_handle?: string;
};

export function sanitizeIdList(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (!id || id.length > 64) continue;
    if (!/^[a-z0-9][a-z0-9._:-]{0,63}$/i.test(id)) continue;
    if (!out.includes(id)) out.push(id);
    if (out.length >= 16) break;
  }
  return out.length ? out : undefined;
}

export function sanitizePrecedence(
  raw: unknown,
): string[] | "append" | "lead" | undefined {
  if (raw === "append" || raw === "lead") return raw;
  if (typeof raw === "string" && (raw === "append" || raw === "lead")) return raw;
  return sanitizeIdList(raw);
}

export function applyPublishedPrecedence(
  org: { office_precedence?: string[] },
  officeId: string,
  spec: string[] | "append" | "lead" | undefined,
): void {
  if (!spec) return;
  if (spec === "append") {
    const cur = org.office_precedence || [];
    if (!cur.includes(officeId)) org.office_precedence = [...cur, officeId];
    return;
  }
  if (spec === "lead") {
    const cur = (org.office_precedence || []).filter((id) => id !== officeId);
    org.office_precedence = [officeId, ...cur];
    return;
  }
  org.office_precedence = spec.map((id) => (id === "self" || id === "$new" ? officeId : id));
}

export function parseRequiresTrack(raw: unknown): OfficeRequiredTrack | null | undefined {
  if (raw == null) return undefined;
  const v = String(raw)
    .trim()
    .toLowerCase()
    .replace(/^track\./, "")
    .replace(/\.01$/, "");
  if (!v) return undefined;
  return (OFFICE_REQUIRED_TRACKS as readonly string[]).includes(v) ? (v as OfficeRequiredTrack) : null;
}

export function parseOfficeProfile(raw: string | undefined | null): OfficeProfile | null {
  const v = String(raw || "").trim().toUpperCase();
  return (OFFICE_PROFILES as readonly string[]).includes(v) ? (v as OfficeProfile) : null;
}

export function allocateOfficeId(orgId: string, displayName: string): string {
  const slug = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "seat";
  const orgSlug = orgId.replace(/^org\./, "").replace(/[^a-z0-9.-]+/gi, "").slice(0, 24) || "org";
  const hex = Math.random().toString(16).slice(2, 10);
  return `office.${orgSlug}.${slug}.${hex}`;
}

export function publicOffices(
  offices: Record<string, OfficeRecord> | undefined,
  names: Record<string, string | undefined>,
): OfficePublic[] {
  return Object.values(offices || {})
    .filter((o) => o.status !== "RETIRED")
    .sort((a, b) => a.display_name.localeCompare(b.display_name) || a.office_id.localeCompare(b.office_id))
    .map((o) => ({
      office_id: o.office_id,
      display_name: o.display_name,
      status: o.status,
      holder_player_id: o.holder_player_id,
      holder_handle: o.holder_player_id
        ? names[o.holder_player_id] || o.holder_player_id.replace(/^player\./, "")
        : undefined,
      authority_profile: o.authority_profile,
      successor_handle: o.succession?.successors?.[0]
        ? names[o.succession.successors[0]] || o.succession.successors[0].replace(/^player\./, "")
        : undefined,
    }));
}

export function officeLines(offices: OfficePublic[]): string[] {
  if (!offices.length) return [];
  const rows = offices.map((o) => {
    const who = o.status === "VACANT" ? "vacant" : o.holder_handle || o.holder_player_id || "occupied";
    const designated = o.successor_handle ? `; designated successor — ${o.successor_handle}` : "";
    return `${o.display_name} — ${who}${designated}`;
  });
  return [`Offices: ${rows.join("; ")}`];
}

export function findOffice(
  orgs: Record<string, { offices?: Record<string, OfficeRecord> }> | undefined,
  officeId: string,
): { org_id: string; office: OfficeRecord } | null {
  if (!orgs || !officeId) return null;
  for (const [org_id, org] of Object.entries(orgs)) {
    const office = org.offices?.[officeId];
    if (office) return { org_id, office };
  }
  return null;
}

export function officeClaimsObject(office: OfficeRecord, objectId: string): boolean {
  const set = office.object_set;
  if (!set || !set.length) return true;
  return set.includes(objectId);
}

/**
 * Specs INSTITUTIONAL-AUTHORITY office conflict-precedence.
 * Published office_precedence or strict-subset object_set; else fail closed.
 */
export function resolveOfficeConflict(
  org: { office_precedence?: string[]; offices?: Record<string, OfficeRecord> } | undefined,
  actingOfficeId: string,
  objectId: string,
): { ok: true } | { ok: false; code: "AUTHORITY_CONFLICT" | "FORBIDDEN"; message: string } {
  const acting = org?.offices?.[actingOfficeId];
  if (!acting || acting.status !== "OCCUPIED") {
    return { ok: false, code: "FORBIDDEN", message: "You do not hold that office." };
  }
  if (acting.object_set?.length && !acting.object_set.includes(objectId)) {
    return { ok: false, code: "FORBIDDEN", message: "That object is not in this office's listed set." };
  }
  const rivals = Object.values(org?.offices || {}).filter(
    (o) =>
      o.office_id !== acting.office_id &&
      o.status === "OCCUPIED" &&
      o.authority_profile === acting.authority_profile &&
      officeClaimsObject(o, objectId),
  );
  if (!rivals.length) return { ok: true };

  const order = (org?.office_precedence || []).filter(Boolean);
  for (const rival of rivals) {
    const ai = order.indexOf(acting.office_id);
    const ri = order.indexOf(rival.office_id);
    if (ai >= 0 && ri >= 0) {
      if (ai < ri) continue;
      return {
        ok: false,
        code: "AUTHORITY_CONFLICT",
        message: "Another office has precedence over this object.",
      };
    }
    const aSet = acting.object_set;
    const rSet = rival.object_set;
    if (aSet?.length && rSet?.length) {
      const aOnly = aSet.filter((x) => !rSet.includes(x));
      const rOnly = rSet.filter((x) => !aSet.includes(x));
      if (aOnly.length === 0 && rOnly.length > 0) continue;
      if (rOnly.length === 0 && aOnly.length > 0) {
        return {
          ok: false,
          code: "AUTHORITY_CONFLICT",
          message: "A more specific office controls this object.",
        };
      }
    }
    return {
      ok: false,
      code: "AUTHORITY_CONFLICT",
      message: "Overlapping offices have no published precedence.",
    };
  }
  return { ok: true };
}

export function occupiedOfficesFor(
  org: { offices?: Record<string, OfficeRecord> } | undefined,
  playerId: string,
  profile: OfficeProfile,
): OfficeRecord[] {
  return Object.values(org?.offices || {}).filter(
    (o) => o.status === "OCCUPIED" && o.holder_player_id === playerId && o.authority_profile === profile,
  );
}

export function resolveInstitutionGrant(
  orgs: Record<string, { org_id?: string; status?: string; offices?: Record<string, OfficeRecord> }> | undefined,
  playerId: string,
  actingFor: string | undefined,
  officeId: string | undefined,
  profile: OfficeProfile,
):
  | { ok: true; org_id: string; office: OfficeRecord }
  | { ok: false; code: "NOT_FOUND" | "FORBIDDEN"; message: string } {
  const orgId = String(actingFor || "").trim();
  if (!orgId) return { ok: false, code: "FORBIDDEN", message: "Name the institution you act for." };
  const org = orgs?.[orgId];
  if (!org || org.status !== "ACTIVE") {
    return { ok: false, code: "NOT_FOUND", message: "That institution is not known here." };
  }
  if (officeId) {
    const office = org.offices?.[officeId];
    if (!office) return { ok: false, code: "NOT_FOUND", message: "Office not found." };
    if (office.status !== "OCCUPIED" || office.holder_player_id !== playerId) {
      return { ok: false, code: "FORBIDDEN", message: "You do not hold that office." };
    }
    if (office.authority_profile !== profile) {
      return { ok: false, code: "FORBIDDEN", message: "That office cannot do this." };
    }
    return { ok: true, org_id: orgId, office };
  }
  const matches = occupiedOfficesFor(org, playerId, profile);
  if (!matches.length) {
    return { ok: false, code: "FORBIDDEN", message: "You do not hold that institutional authority." };
  }
  if (matches.length > 1) {
    return { ok: false, code: "FORBIDDEN", message: "Name which office you are using." };
  }
  return { ok: true, org_id: orgId, office: matches[0] };
}

export function assetInInstitutionScope(
  entity: { owner_id?: string; entity_type?: string },
  orgId: string,
  actorId: string,
): boolean {
  const owner = entity.owner_id;
  if (owner && owner.startsWith("org.") && owner !== orgId) return false;
  if (owner && owner !== orgId && owner !== actorId) return false;
  const type = (entity.entity_type || "").toUpperCase();
  return type === "INFRASTRUCTURE" || type === "RUIN";
}

export function vacateHolderOffices(
  org: { offices?: Record<string, OfficeRecord> },
  playerId: string,
  cycle: number,
): OfficeRecord[] {
  const changed: OfficeRecord[] = [];
  for (const office of Object.values(org.offices || {})) {
    if (office.status === "OCCUPIED" && office.holder_player_id === playerId) {
      office.history.push({ cycle, holder_player_id: playerId, kind: "VACATED" });
      office.holder_player_id = undefined;
      office.status = "VACANT";
      changed.push(office);
    }
  }
  return changed;
}
