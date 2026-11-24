# workers/noema/src/watch-map-page.ts

- MapNodePaint · type · L7-L13 — type MapNodePaint = { name?: string; public_player_labels?: unknown; players_present?: unknown; scar_band?: unknown; pressure_band?: unknown; };
- mapOccupantLabels · function · L15-L28 — function mapOccupantLabels(n?: MapNodePaint | null): string[]
- mapOccupantCaption · function · L30-L44 — function mapOccupantCaption(n?: MapNodePaint | null): string
- mapNodeMetaLine · function · L46-L53 — function mapNodeMetaLine(n?: MapNodePaint | null): string
- mapHealthPairs · function · L55-L67 — function mapHealthPairs(h?: { scar_band?: unknown; reconstruction_fidelity?: unknown; players_present?: unknown; } | null): Array<[string, string]>
- mapLayerHideable · function · L70-L73 — function mapLayerHideable(id?: string | null): boolean
- watchMapInlineSource · function · L86-L94 — function watchMapInlineSource(): string
