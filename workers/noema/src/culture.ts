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

export type CultureSite = {
  repair_ids: string[];
  accessors: string[];
  repair_cycles?: number[];
  last_observed_cycle?: number;
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
      next.sites[entityId] = { repair_ids: [], accessors: [], repair_cycles: [] };
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
  for (const [entityId, site] of Object.entries(snap.sites)) {
    const publicForSite = reconstructions.filter(
      (r) => r.subject_ref === entityId && r.visibility === "PUBLIC",
    );
    const status = traditionStatus(site, worldCycle, publicForSite);
    if (status === "TRADITION" || status === "REVIVED") tradition = true;
  }
  if (tradition) pulses.push(WATCH_TRADITION_PULSE);
  if (reconstructions.some((r) => r.visibility === "PUBLIC" && r.epistemic === "CONTESTED")) {
    pulses.push(WATCH_CONTESTED_PULSE);
  }
  return pulses;
}
