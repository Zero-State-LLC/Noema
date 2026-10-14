# workers/noema/src/orientation.ts

- Situation · type · L8-L11 — type Situation = { place: string; strain?: string; };
- LiveEntity · type · L13-L18 — type LiveEntity = { label?: string; condition?: number; harvestable?: boolean; stock_amount?: number; };
- entityLabel · function · L26-L28 — function entityLabel(e: LiveEntity): string
- liveStrainLine · function · L34-L48 — function liveStrainLine( condition?: string, entities?: LiveEntity[], reportLines?: string[], ): string | undefined
- situationFromLive · function · L50-L62 — function situationFromLive(input: { name?: string; condition?: string; entities?: LiveEntity[]; report_lines?: string[]; }): Situation | undefined
