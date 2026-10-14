# workers/noema/src/presentation/glyphs.ts

- GlyphId · type · L22-L36 — type GlyphId = | "loc" | "player" | "org" | "trade" | "danger" | "distress" | "rumor" | "unknown" | "comms" | "infra" | "resource" | "threshold" | "economy" | "event";
- GlyphMeta · type · L57-L65 — type GlyphMeta = { id: GlyphId; label: string; meaning: string; fallback: string; category: string; counterpart: string; d: string; };
- glyphMeta · function · L197-L199 — function glyphMeta(id: string): GlyphMeta
- glyphCatalog · function · L201-L208 — function glyphCatalog(): Record<GlyphId, Pick<GlyphMeta, "d" | "label" | "fallback" | "meaning" | "counterpart">>
- glyphForRoom · function · L210-L212 — function glyphForRoom(): GlyphId
- glyphForPlayer · function · L214-L216 — function glyphForPlayer(): GlyphId
- glyphForExit · function · L218-L220 — function glyphForExit(): GlyphId
- glyphForCommandVerb · function · L223-L237 — function glyphForCommandVerb(command?: string): GlyphId
- glyphForEntity · function · L239-L249 — function glyphForEntity(entity_type?: string, labelText?: string, condition?: number): GlyphId
- glyphForLine · function · L251-L261 — function glyphForLine(line: string): GlyphId
- glyphForProjection · function · L264-L304 — function glyphForProjection(projectionId?: string): GlyphId
- glyphEl · function · L306-L362 — function glyphEl(id: string): { className: string; setAttribute(name: string, value: string): void; append(...nodes: unknown[]): void; }
- setAttribute · method · L332-L332 — setAttribute()
- append · method · L333-L333 — append()
- legendHtml · function · L364-L400 — function legendHtml(): string
