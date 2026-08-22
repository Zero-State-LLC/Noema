/**
 * GC9-S0 maintenance custom + GC9-S1 tradition. Derived, not WorldState.
 * Authority: Noema-Specs RFC-0013 / RFC-0025.
 */

export const CULTURE_CATALOG_ID = "culture-catalog/gc9-s0";
export const CUSTOM_THRESHOLD = 3;
export const TRADITION_MIN_CYCLES = 3;
export const TRADITION_MIN_ACCESSORS = 2;
export const TRADITION_MIN_PUBLIC_RECONS = 2;
export const DORMANT_GAP_CYCLES = 8;
export const CUSTOM_LINE = "This site has a maintenance custom.";
export const TRADITION_LINE = "This site has a maintenance tradition.";
export const DORMANT_LINE = "This site's maintenance tradition is dormant.";
export const REVIVED_LINE = "This site's maintenance tradition has been revived.";
export const COMPETING_LINE = "Accounts of this site differ.";
export const WATCH_TRADITION_PULSE = "A maintenance custom has become widely observed.";
export const WATCH_CONTESTED_PULSE = "A public account is contested.";

/** GC9-S2 (RFC-0125). Derived marks on a live tradition. No new verbs or events. */
export const ORIGINATOR_REPAIRS = 3;
export const SCHISM_MIN_PUBLIC_CLAIMS = 2;
export const SCHISM_MIN_PRACTITIONER_AUTHORS = 2;
export const INHERITED_LINE = "This site's maintenance tradition has outlived its founders.";
export const SCHISM_LINE = "Practitioners of this site keep rival accounts.";
export const WATCH_INHERITED_PULSE = "A practice has outlived its founders.";
export const WATCH_SCHISM_PULSE = "Practice at a site has divided.";

/** GC9-S2: per-repair attribution, in ledger order. */
export type CultureRepair = { event_id: string; actor_id: string; cycle: number };

export type CultureSite = {
  repair_ids: string[];
  accessors: string[];
  repair_cycles?: number[];
  last_observed_cycle?: number;
  /** Absent on sites persisted before GC9-S2; inheritance is then underivable. */
  repairs?: CultureRepair[];
};

export type CultureState = {
  catalog_id: typeof CULTURE_CATALOG_ID;
  sites: Record<string, CultureSite>;
};

export type TraditionStatus = "UNKNOWN" | "PRACTICING" | "CUSTOM" | "TRADITION" | "DORMANT" | "REVIVED";

export type PublicCultureRecon = {
  subject_ref: string;
  visibility: string;
  claim?: string;
  epistemic?: string;
  /** GC9-S2: who authored the account. Derives schism; never surfaced. */
  author_id?: string;
};

export type CultureEvent = {
  event_id: string;
  event_type: string;
  payload?: Record<string, unknown>;
};

export function emptyCulture(): CultureState {
  return { catalog_id: CULTURE_CATALOG_ID, sites: {} };
}

export function ensureCulture(raw: CultureState | undefined | null): CultureState {
  if (!raw || raw.catalog_id !== CULTURE_CATALOG_ID) return emptyCulture();
  const sites: Record<string, CultureSite> = {};
  for (const [id, site] of Object.entries(raw.sites || {})) {
    sites[id] = {
      repair_ids: [...(site?.repair_ids || [])],
      accessors: [...(site?.accessors || [])],
      repair_cycles: [...(site?.repair_cycles || [])],
      last_observed_cycle: site?.last_observed_cycle,
      // Dropping this on rebuild would silently un-inherit every tradition,
      // the same way losing deep_time once wiped scars across DO reloads.
      repairs: [...(site?.repairs || [])],
    };
  }
  return { catalog_id: CULTURE_CATALOG_ID, sites };
}

function payloadEntityId(payload: Record<string, unknown> | undefined): string | null {
  const id = payload?.entity_id;
  return typeof id === "string" && id.length ? id : null;
}

function isRepairUpdate(ev: CultureEvent): boolean {
  if (ev.event_type !== "ENTITY_UPDATE") return false;
  const p = ev.payload || {};
  return p.operation === "REPAIR";
}

export function applyCultureEvents(
  state: CultureState | undefined | null,
  events: CultureEvent[],
  actingPlayerId: string,
  cycle = 0,
): CultureState {
  const next = ensureCulture(state);
  if (!actingPlayerId) return next;
  for (const ev of events) {
    const entityId = payloadEntityId(ev.payload);
    if (!entityId) continue;
    if (!next.sites[entityId]) {
      next.sites[entityId] = { repair_ids: [], accessors: [], repair_cycles: [], repairs: [] };
    }
    const site = next.sites[entityId];
    if (ev.event_type === "INSPECT" || ev.event_type === "ENTITY_UPDATE") {
      if (!site.accessors.includes(actingPlayerId)) site.accessors.push(actingPlayerId);
      site.last_observed_cycle = Math.max(site.last_observed_cycle ?? 0, cycle);
    }
    if (!isRepairUpdate(ev)) continue;
    if (!ev.event_id || site.repair_ids.includes(ev.event_id)) continue;
    site.repair_ids.push(ev.event_id);
    site.repair_cycles = site.repair_cycles || [];
    if (!site.repair_cycles.includes(cycle)) site.repair_cycles.push(cycle);
    site.repairs = site.repairs || [];
    site.repairs.push({ event_id: ev.event_id, actor_id: actingPlayerId, cycle });
  }
  return next;
}

export function traditionStatus(
  site: CultureSite,
  worldCycle: number,
  publicRecons: PublicCultureRecon[],
): TraditionStatus {
  const n = site.repair_ids.length;
  if (n <= 0) return "UNKNOWN";
  if (n < CUSTOM_THRESHOLD) return "PRACTICING";
  const cycles = new Set(site.repair_cycles || []);
  const accessors = site.accessors || [];
  const tradition =
    (cycles.size >= TRADITION_MIN_CYCLES && accessors.length >= TRADITION_MIN_ACCESSORS) ||
    publicRecons.length >= TRADITION_MIN_PUBLIC_RECONS;
  if (!tradition) return "CUSTOM";
  const last = site.last_observed_cycle ?? Math.max(0, ...(site.repair_cycles || []));
  if (worldCycle - last >= DORMANT_GAP_CYCLES) return "DORMANT";
  const observed = [...(site.repair_cycles || [])].sort((a, b) => a - b);
  const hasGap = observed.some((c, i) => i > 0 && c - observed[i - 1] >= DORMANT_GAP_CYCLES);
  return hasGap ? "REVIVED" : "TRADITION";
}

function playLineFor(status: TraditionStatus): string | null {
  if (status === "CUSTOM") return CUSTOM_LINE;
  if (status === "TRADITION") return TRADITION_LINE;
  if (status === "DORMANT") return DORMANT_LINE;
  if (status === "REVIVED") return REVIVED_LINE;
  return null;
}

/** RFC-0125 §Decision. Marks only ever attach to a live tradition. */
export function siteMarks(
  site: CultureSite,
  status: TraditionStatus,
  publicForSite: PublicCultureRecon[],
): { inherited: boolean; schism: boolean } {
  if (status !== "TRADITION" && status !== "REVIVED") return { inherited: false, schism: false };
  const repairs = site.repairs || [];
  const originators = new Set(repairs.slice(0, ORIGINATOR_REPAIRS).map((r) => r.actor_id));
  const originatorCycles = repairs.filter((r) => originators.has(r.actor_id)).map((r) => r.cycle);
  const lastOriginator = originatorCycles.length ? Math.max(...originatorCycles) : -1;
  // A co-practitioner is not an heir: the successor repair must land strictly
  // after the founders stopped.
  const inherited = repairs.some((r) => !originators.has(r.actor_id) && r.cycle > lastOriginator);

  const practitioners = new Set(repairs.map((r) => r.actor_id));
  const held = publicForSite
    .filter((r) => r.author_id && r.claim && practitioners.has(r.author_id))
    .map((r) => ({ author: String(r.author_id), claim: String(r.claim) }));
  const claims = new Set(publicForSite.map((r) => r.claim).filter(Boolean));
  let schism = held.some((a, i) =>
    held.slice(i + 1).some((b) => a.author !== b.author && a.claim !== b.claim),
  );
  if (claims.size < SCHISM_MIN_PUBLIC_CLAIMS) schism = false;
  if (new Set(held.map((h) => h.author)).size < SCHISM_MIN_PRACTITIONER_AUTHORS) schism = false;
  return { inherited, schism };
}

export function cultureLines(
  state: CultureState | undefined | null,
  roomEntityIds: string[],
  playerId: string,
  worldCycle = 0,
  reconstructions: PublicCultureRecon[] = [],
): string[] {
  const snap = ensureCulture(state);
  for (const entityId of roomEntityIds) {
    const site = snap.sites[entityId];
    if (!site) continue;
    if (!site.accessors.includes(playerId)) continue;
    const publicForSite = reconstructions.filter(
      (r) => r.subject_ref === entityId && r.visibility === "PUBLIC",
    );
    const status = traditionStatus(site, worldCycle, publicForSite);
    const line = playLineFor(status);
    if (!line) continue;
    const out = [line];
    const claims = new Set(publicForSite.map((r) => r.claim).filter(Boolean));
    if (claims.size >= 2 && (status === "TRADITION" || status === "REVIVED" || status === "CUSTOM")) {
      out.push(COMPETING_LINE);
    }
    // Fixed order: GC9-S1 lines, then the GC9-S2 marks. Replay compares arrays.
    const marks = siteMarks(site, status, publicForSite);
    if (marks.inherited) out.push(INHERITED_LINE);
    if (marks.schism) out.push(SCHISM_LINE);
    return out;
  }
  return [];
}

export function publicCulturePulses(
  state: CultureState | undefined | null,
  worldCycle: number,
  reconstructions: PublicCultureRecon[] = [],
): string[] {
  const snap = ensureCulture(state);
  const pulses: string[] = [];
  let tradition = false;
  let inherited = false;
  let schism = false;
  for (const [entityId, site] of Object.entries(snap.sites)) {
    const publicForSite = reconstructions.filter(
      (r) => r.subject_ref === entityId && r.visibility === "PUBLIC",
    );
    const status = traditionStatus(site, worldCycle, publicForSite);
    if (status === "TRADITION" || status === "REVIVED") tradition = true;
    const marks = siteMarks(site, status, publicForSite);
    if (marks.inherited) inherited = true;
    if (marks.schism) schism = true;
  }
  if (tradition) pulses.push(WATCH_TRADITION_PULSE);
  if (reconstructions.some((r) => r.visibility === "PUBLIC" && r.epistemic === "CONTESTED")) {
    pulses.push(WATCH_CONTESTED_PULSE);
  }
  // Aggregate only: names no site and no agent (RFC-0125 §Visibility).
  if (inherited) pulses.push(WATCH_INHERITED_PULSE);
  if (schism) pulses.push(WATCH_SCHISM_PULSE);
  return pulses;
}
