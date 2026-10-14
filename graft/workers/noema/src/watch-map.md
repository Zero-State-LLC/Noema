# workers/noema/src/watch-map.ts

- WatchMapLayerId · type · L10-L18 — type WatchMapLayerId = | "base" | "activity" | "state" | "entity" | "event" | "narrative" | "health" | "delight";
- WatchMapLayerDef · type · L20-L26 — type WatchMapLayerDef = { id: WatchMapLayerId | string; z: number; label: string; toggle: boolean; glanceable: string; };
- registerWatchMapLayer · function · L44-L52 — function registerWatchMapLayer(def: WatchMapLayerDef): void
- unregisterWatchMapLayer · function · L54-L57 — function unregisterWatchMapLayer(id: string): void
- watchMapLayerCatalog · function · L59-L61 — function watchMapLayerCatalog(): WatchMapLayerDef[]
- WatchMapScarIn · type · L63-L68 — type WatchMapScarIn = { room_id?: string; strength: number; visibility: string; domain: string; };
- WatchMapHealthIn · type · L70-L72 — type WatchMapHealthIn = { reconstruction_fidelity?: number; };
- scarBand · function · L78-L83 — function scarBand(total: number): "faint" | "marked" | "deep" | null
- pressureBand · function · L85-L90 — function pressureBand(value: number): "low" | "moderate" | "high" | null
- buildWatchMap · function · L92-L211 — function buildWatchMap(opts: { live: Record<string, unknown>; scars?: WatchMapScarIn[]; harvest_pressure?: Record<string, number>; protocol_strength?: Record<string, number>; reconstructions?: Array<{ fidelity?: number; visibility?: string }>; health?: WatchMapHealthIn; }): Record<string, unknown>
