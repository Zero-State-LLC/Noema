/**
 * GC9-S0 maintenance custom. Derived, not WorldState.
 * Authority: Noema-Specs docs/GC9-FIRST-SLICE.md / RFC-0013.
 */

export const CULTURE_CATALOG_ID = "culture-catalog/gc9-s0";
export const CUSTOM_THRESHOLD = 3;
export const CUSTOM_LINE = "This site has a maintenance custom.";

export type CultureSite = {
  repair_ids: string[];
  accessors: string[];
};

export type CultureState = {
  catalog_id: typeof CULTURE_CATALOG_ID;
  sites: Record<string, CultureSite>;
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
): CultureState {
  const next = ensureCulture(state);
  if (!actingPlayerId) return next;
  for (const ev of events) {
    const entityId = payloadEntityId(ev.payload);
    if (!entityId) continue;
    if (!next.sites[entityId]) next.sites[entityId] = { repair_ids: [], accessors: [] };
    const site = next.sites[entityId];
    if (ev.event_type === "INSPECT" || ev.event_type === "ENTITY_UPDATE") {
      if (!site.accessors.includes(actingPlayerId)) site.accessors.push(actingPlayerId);
    }
    if (!isRepairUpdate(ev)) continue;
    if (!ev.event_id || site.repair_ids.includes(ev.event_id)) continue;
    site.repair_ids.push(ev.event_id);
  }
  return next;
}

export function cultureLines(
  state: CultureState | undefined | null,
  roomEntityIds: string[],
  playerId: string,
): string[] {
  const snap = ensureCulture(state);
  for (const entityId of roomEntityIds) {
    const site = snap.sites[entityId];
    if (!site) continue;
    if (site.repair_ids.length < CUSTOM_THRESHOLD) continue;
    if (!site.accessors.includes(playerId)) continue;
    return [CUSTOM_LINE];
  }
  return [];
}
