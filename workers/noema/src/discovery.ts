/* Authority: Noema-Specs WORLD-SERVICES.md + WORLD-SERVICES-AGENT-CONTRACT.md (World Services in UI/observations) */
/**
 * GC6-S0 archive vs live INSPECT. Derived, not WorldState.
 * Authority: Noema-Specs RFC-0010 / RFC-0015 / docs/GC6-FIRST-SLICE.md.
 * Silent unless an ARTIFACT already has both explicit claim fields.
 */

export const DISCOVERY_CATALOG_ID = "discovery-catalog/gc6-s0";
export const CONFLICT_LINE = "The archive and the live site do not agree.";
export const ARCHIVE_CLAIMS = ["DESTROYED", "OPERATING"] as const;

export type ArchiveClaim = (typeof ARCHIVE_CLAIMS)[number];

export type DiscoveryState = {
  catalog_id: typeof DISCOVERY_CATALOG_ID;
  archives: Record<string, ArchiveClaim>;
  inspects: Record<string, ArchiveClaim>;
};

export function emptyDiscovery(): DiscoveryState {
  return { catalog_id: DISCOVERY_CATALOG_ID, archives: {}, inspects: {} };
}

export function ensureDiscovery(raw: DiscoveryState | undefined | null): DiscoveryState {
  if (!raw || raw.catalog_id !== DISCOVERY_CATALOG_ID) return emptyDiscovery();
  return {
    catalog_id: DISCOVERY_CATALOG_ID,
    archives: { ...(raw.archives || {}) },
    inspects: { ...(raw.inspects || {}) },
  };
}

export function isArchiveClaim(raw: unknown): raw is ArchiveClaim {
  return raw === "DESTROYED" || raw === "OPERATING";
}

/** Explicit fields only. Never parse label, description, or services. */
export function explicitArchiveRecord(entity: {
  entity_type?: string;
  archive_subject_entity_id?: string;
  archive_claim?: string;
}): { subject_entity_id: string; claim: ArchiveClaim } | null {
  if ((entity.entity_type || "").toUpperCase() !== "ARTIFACT") return null;
  const subject = entity.archive_subject_entity_id;
  if (typeof subject !== "string" || !subject) return null;
  if (!isArchiveClaim(entity.archive_claim)) return null;
  return { subject_entity_id: subject, claim: entity.archive_claim };
}

export function creditArchive(
  state: DiscoveryState | undefined,
  subjectEntityId: string,
  claim: ArchiveClaim,
): DiscoveryState {
  const next = ensureDiscovery(state);
  if (!subjectEntityId || !isArchiveClaim(claim)) return next;
  next.archives[subjectEntityId] = claim;
  return next;
}

export function creditInspect(
  state: DiscoveryState | undefined,
  subjectEntityId: string,
  observation: ArchiveClaim,
): DiscoveryState {
  const next = ensureDiscovery(state);
  if (!subjectEntityId || !isArchiveClaim(observation)) return next;
  next.inspects[subjectEntityId] = observation;
  return next;
}

export function applyInspectEvidence(
  state: DiscoveryState | undefined,
  entity: {
    entity_id: string;
    entity_type?: string;
    archive_subject_entity_id?: string;
    archive_claim?: string;
  },
): DiscoveryState {
  let next = creditInspect(state, entity.entity_id, "OPERATING");
  const archive = explicitArchiveRecord(entity);
  if (archive) next = creditArchive(next, archive.subject_entity_id, archive.claim);
  return next;
}

export function discoveryLines(state: DiscoveryState | undefined | null): string[] {
  const snap = ensureDiscovery(state);
  for (const [subject, claim] of Object.entries(snap.archives)) {
    const observation = snap.inspects[subject];
    if (!observation) continue;
    if (claim !== observation) return [CONFLICT_LINE];
  }
  return [];
}
