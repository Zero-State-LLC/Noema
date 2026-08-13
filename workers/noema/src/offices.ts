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
};

export type OfficePublic = {
  office_id: string;
  display_name: string;
  status: OfficeStatus;
  holder_player_id?: string;
  holder_handle?: string;
  authority_profile: OfficeProfile;
};

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
    }));
}

export function officeLines(offices: OfficePublic[]): string[] {
  if (!offices.length) return [];
  const rows = offices.map((o) => {
    const who = o.status === "VACANT" ? "vacant" : o.holder_handle || o.holder_player_id || "occupied";
    return `${o.display_name} — ${who}`;
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
