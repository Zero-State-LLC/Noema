/**
 * WATCH Real-Time Mapping — derived projection watch-map/1.0
 * Spec: Noema-Specs docs/WATCH-REAL-TIME-MAPPING.md
 * Complements lightweight theater (watch-live/1.0). Never world truth. Never a writer.
 * GC3: no image_score / reputation_summary / second_order.
 */

export const WATCH_MAP_PIN = "watch-map/1.0";

export type WatchMapLayerId =
  | "base"
  | "activity"
  | "state"
  | "entity"
  | "event"
  | "narrative"
  | "health"
  | "delight";

export type WatchMapLayerDef = {
  id: WatchMapLayerId | string;
  z: number;
  label: string;
  toggle: boolean;
  glanceable: string;
};

/** Extension point 5.1 — register additional layers without rewriting the core set. */
export const WATCH_MAP_LAYERS: WatchMapLayerDef[] = [
  { id: "base", z: 0, label: "Base Map", toggle: true, glanceable: "rooms and exits" },
  { id: "activity", z: 1, label: "Activity", toggle: true, glanceable: "who is here" },
  { id: "state", z: 2, label: "State overlays", toggle: true, glanceable: "pressure and scars" },
  { id: "entity", z: 3, label: "Entities", toggle: true, glanceable: "sites and residue" },
  { id: "event", z: 4, label: "Events", toggle: true, glanceable: "consequence river" },
  { id: "narrative", z: 5, label: "Narrative", toggle: true, glanceable: "what just happened" },
  { id: "health", z: 6, label: "Health", toggle: true, glanceable: "velocity and scars" },
  { id: "delight", z: 7, label: "Delight", toggle: true, glanceable: "moments" },
];

const extraLayers: WatchMapLayerDef[] = [];

/** §5.1: id-validated, dedup-by-id (re-register replaces). Worker isolates are
 *  reused across requests — an append-only global grew per registration. */
export function registerWatchMapLayer(def: WatchMapLayerDef): void {
  const id = String(def?.id || "").trim();
  if (!id) return;
  const core = WATCH_MAP_LAYERS.some((l) => l.id === id);
  if (core) return; // core set is fixed; extensions cannot shadow it
  const at = extraLayers.findIndex((l) => l.id === id);
  if (at >= 0) extraLayers[at] = { ...def, id };
  else extraLayers.push({ ...def, id });
}

export function unregisterWatchMapLayer(id: string): void {
  const at = extraLayers.findIndex((l) => l.id === id);
  if (at >= 0) extraLayers.splice(at, 1);
}

export function watchMapLayerCatalog(): WatchMapLayerDef[] {
  return [...WATCH_MAP_LAYERS, ...extraLayers].sort((a, b) => a.z - b.z);
}

export type WatchMapScarIn = {
  room_id?: string;
  strength: number;
  visibility: string;
  domain: string;
};

export type WatchMapHealthIn = {
  reconstruction_fidelity?: number;
};

/** Public scars below this floor are not public elsewhere (deep-time publicScarsForRoom). */
const SCAR_PUBLIC_FLOOR = 0.05;

/** WATCH-LIGHTWEIGHT-SPECTATOR §7: bands, never raw counters/amounts, on the public door. */
export function scarBand(total: number): "faint" | "marked" | "deep" | null {
  if (!(total >= SCAR_PUBLIC_FLOOR)) return null;
  if (total < 0.2) return "faint";
  if (total < 0.6) return "marked";
  return "deep";
}

export function pressureBand(value: number): "low" | "moderate" | "high" | null {
  if (!(value > 0)) return null;
  if (value <= 5) return "low";
  if (value <= 15) return "moderate";
  return "high";
}

export function buildWatchMap(opts: {
  live: Record<string, unknown>;
  scars?: WatchMapScarIn[];
  harvest_pressure?: Record<string, number>;
  protocol_strength?: Record<string, number>;
  reconstructions?: Array<{ fidelity?: number; visibility?: string }>;
  health?: WatchMapHealthIn;
}): Record<string, unknown> {
  const live = opts.live || {};
  const rooms = Array.isArray(live.rooms) ? (live.rooms as Array<Record<string, unknown>>) : [];
  const events = Array.isArray(live.recent_events) ? (live.recent_events as Array<Record<string, unknown>>) : [];
  const narrative = live.narrative && typeof live.narrative === "object" ? (live.narrative as Record<string, unknown>) : {};
  const publicScars = (opts.scars || []).filter(
    (s) => s.visibility === "public" && s.strength >= SCAR_PUBLIC_FLOOR,
  );
  const scarByRoom: Record<string, number> = {};
  for (const s of publicScars) {
    if (!s.room_id) continue;
    scarByRoom[s.room_id] = (scarByRoom[s.room_id] || 0) + s.strength;
  }
  const pressure = opts.harvest_pressure || {};
  const protocol = opts.protocol_strength || {};

  const nodes = rooms.map((r, i) => {
    const room_id = String(r.room_id || "");
    const present = Number(r.players_present || 0);
    const col = i % 4;
    const row = Math.floor(i / 4);
    const occupant_labels = Array.isArray(r.public_player_labels)
      ? (r.public_player_labels as unknown[])
          .map((h) => String(h || "").trim())
          .filter((h) => {
            if (!h) return false;
            const n = h.toLowerCase();
            const roomName = String(r.name || "").trim().toLowerCase();
            const slug = room_id.replace(/^room\./, "").toLowerCase();
            if (n.startsWith("room.")) return false;
            if (roomName && n === roomName) return false;
            if (n === room_id.toLowerCase() || n === slug) return false;
            return true;
          })
      : [];
    return {
      room_id,
      name: r.name,
      x: col,
      y: row,
      players_present: present,
      public_player_labels: occupant_labels,
      // §7: bands only. Raw strengths/counters never reach the public wire.
      scar_band: scarBand(scarByRoom[room_id] || 0),
      pressure_band: pressureBand(pressure[room_id] || 0),
      protocol_band: pressureBand(protocol[room_id] || 0),
      entity_count: r.entity_count || 0,
      active: Boolean(r.active),
    };
  });
  // §7 "No secret rooms": derived overlays are scoped to the rooms the public
  // snapshot already exposes — never to the raw source maps, which may carry
  // hidden-room keys (harvest_pressure covers every room ever harvested).
  const stateByPublicRoom: Record<string, { scar_band: string | null; pressure_band: string | null }> = {};
  for (const n of nodes) {
    if (!n.room_id) continue;
    if (n.scar_band || n.pressure_band) {
      stateByPublicRoom[n.room_id] = { scar_band: n.scar_band, pressure_band: n.pressure_band };
    }
  }

  const publicFid = (opts.reconstructions || [])
    .filter((r) => r.visibility === "PUBLIC" || r.visibility === "public")
    .map((r) => Number(r.fidelity || 0));
  const reconstruction_fidelity =
    opts.health?.reconstruction_fidelity ??
    (publicFid.length ? publicFid.reduce((a, b) => a + b, 0) / publicFid.length : 0);
  const scar_activity = publicScars.reduce((a, s) => a + s.strength, 0);

  // §7 "No research metrics": path-dependence, cascading-risk, and velocity
  // scalars are EWM/research telemetry and stay off the public door. Bands and
  // public ratios only.
  const health = {
    players_present: live.players_present || 0,
    cycle: live.cycle || 0,
    scar_band: scarBand(scar_activity),
    reconstruction_fidelity: Math.round(reconstruction_fidelity * 100) / 100,
  };

  const river = events.slice(0, 12).map((e) => ({
    sequence: e.sequence,
    cycle: e.cycle,
    tier: e.tier,
    icon: e.glyph || e.projection_id || "event",
    line: e.line,
    consequence: e.consequence || e.detail || null,
    room_id: e.room_id || null,
  }));

  const now = (narrative.now && typeof narrative.now === "object" ? narrative.now : events[0]) as Record<string, unknown> | undefined;
  const highlight = now
    ? { line: now.line, room_id: now.room_id || null, tier: now.tier || "NORMAL" }
    : null;

  return {
    watch_map: WATCH_MAP_PIN,
    projection: "public-map",
    world_id: live.world_id,
    cycle: live.cycle,
    sequence: live.sequence,
    freshness: live.freshness,
    layers: watchMapLayerCatalog(),
    base: { rooms: nodes },
    activity: { occupied: nodes.filter((n) => n.players_present > 0).map((n) => n.room_id) },
    state: { rooms: stateByPublicRoom },
    entity: { nodes: nodes.map((n) => ({ room_id: n.room_id, entity_count: n.entity_count, scar_band: n.scar_band })) },
    event: { river },
    narrative: { highlight },
    health,
    delight: { moments: highlight ? [highlight] : [] },
    note: "Mapping projection is never world truth. Lightweight /watch remains the default theater.",
  };
}
