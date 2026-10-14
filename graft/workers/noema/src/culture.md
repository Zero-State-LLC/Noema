# workers/noema/src/culture.ts

- CultureRepair · type · L30-L30 — type CultureRepair = { event_id: string; actor_id: string; cycle: number };
- CultureSite · type · L32-L39 — type CultureSite = { repair_ids: string[]; accessors: string[]; repair_cycles?: number[]; last_observed_cycle?: number; /** Absent on sites persisted before GC9-S2; inheritance is then underivable. */ repairs?: CultureRepair[]; };
- CultureState · type · L41-L44 — type CultureState = { catalog_id: typeof CULTURE_CATALOG_ID; sites: Record<string, CultureSite>; };
- TraditionStatus · type · L46-L46 — type TraditionStatus = "UNKNOWN" | "PRACTICING" | "CUSTOM" | "TRADITION" | "DORMANT" | "REVIVED";
- PublicCultureRecon · type · L48-L55 — type PublicCultureRecon = { subject_ref: string; visibility: string; claim?: string; epistemic?: string; /** GC9-S2: who authored the account. Derives schism; never surfaced. */ author_id?: string; };
- CultureEvent · type · L57-L61 — type CultureEvent = { event_id: string; event_type: string; payload?: Record<string, unknown>; };
- emptyCulture · function · L63-L65 — function emptyCulture(): CultureState
- ensureCulture · function · L67-L82 — function ensureCulture(raw: CultureState | undefined | null): CultureState
- payloadEntityId · function · L84-L87 — function payloadEntityId(payload: Record<string, unknown> | undefined): string | null
- isRepairUpdate · function · L89-L93 — function isRepairUpdate(ev: CultureEvent): boolean
- applyCultureEvents · function · L95-L123 — function applyCultureEvents( state: CultureState | undefined | null, events: CultureEvent[], actingPlayerId: string, cycle = 0, ): CultureState
- traditionStatus · function · L125-L144 — function traditionStatus( site: CultureSite, worldCycle: number, publicRecons: PublicCultureRecon[], ): TraditionStatus
- playLineFor · function · L146-L152 — function playLineFor(status: TraditionStatus): string | null
- siteMarks · function · L155-L180 — function siteMarks( site: CultureSite, status: TraditionStatus, publicForSite: PublicCultureRecon[], ): { inherited: boolean; schism: boolean }
- cultureLines · function · L182-L212 — function cultureLines( state: CultureState | undefined | null, roomEntityIds: string[], playerId: string, worldCycle = 0, reconstructions: PublicCultureRecon[] = [], ): string[]
- publicCulturePulses · function · L214-L242 — function publicCulturePulses( state: CultureState | undefined | null, worldCycle: number, reconstructions: PublicCultureRecon[] = [], ): string[]
