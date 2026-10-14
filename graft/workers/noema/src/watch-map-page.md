# workers/noema/src/watch-map-page.ts

- MapNodePaint · type · L57-L63 — type MapNodePaint = { name?: string; public_player_labels?: unknown; players_present?: unknown; scar_band?: unknown; pressure_band?: unknown; };
- mapOccupantLabels · function · L65-L78 — function mapOccupantLabels(n?: MapNodePaint | null): string[]
- mapOccupantCaption · function · L80-L94 — function mapOccupantCaption(n?: MapNodePaint | null): string
- mapNodeMetaLine · function · L96-L103 — function mapNodeMetaLine(n?: MapNodePaint | null): string
- mapHealthPairs · function · L105-L117 — function mapHealthPairs(h?: { scar_band?: unknown; reconstruction_fidelity?: unknown; players_present?: unknown; } | null): Array<[string, string]>
- mapLayerHideable · function · L120-L123 — function mapLayerHideable(id?: string | null): boolean
- watchMapInlineSource · function · L136-L144 — function watchMapInlineSource(): string
- mapStageHtml · function · L146-L170 — function mapStageHtml(visible = false): string
