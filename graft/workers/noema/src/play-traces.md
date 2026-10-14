# workers/noema/src/play-traces.ts

- PlayTraceKind · type · L5-L5 — type PlayTraceKind = "scar" | "construction" | "notice";
- PlayTrace · type · L7-L11 — type PlayTrace = { kind: PlayTraceKind; text: string; visibility: "public"; };
- TraceSourceRef · type · L13-L16 — type TraceSourceRef = | { kind: "entity"; entity_id: string; field: "scar" | "in_progress" | "last_repair" | "unclaimed" } | { kind: "room"; room_id?: string; field: "board" | "shout" | "institution_notice" | "trade_notice" | "rumor" } | { kind: "org"; org_id: string; field: "insignia" | "memorial" };
- LaterTraceRumorClaim · type · L18-L22 — type LaterTraceRumorClaim = { visibility?: string; subject_ref?: string; origin_claim_id?: string; };
- LaterTraceRumor · type · L24-L26 — type LaterTraceRumor = { claims?: Record<string, LaterTraceRumorClaim>; };
- LaterTraceOrg · type · L28-L32 — type LaterTraceOrg = { org_id: string; name: string; offices?: Record<string, { status?: string; display_name?: string }>; };
- LaterTraceInput · type · L34-L39 — type LaterTraceInput = { room_id: string; entities?: Array<{ entity_id?: string; owner_id?: string; hidden?: boolean }>; rumor?: LaterTraceRumor | null; orgs?: LaterTraceOrg[]; };
- ProjectedTrace · type · L41-L43 — type ProjectedTrace = PlayTrace & { source_state_ref: TraceSourceRef; };
- TraceRoom · type · L45-L66 — type TraceRoom = { hidden?: boolean; entities?: Array<{ entity_id?: string; label?: string; entity_type?: string; scar?: boolean; hidden?: boolean; in_progress?: boolean; unclaimed?: boolean; last_repair_cycle?: number; last_repair_handle?: string; owner_id?: string; }>; board?: Array<{ text: string; cycle: number }>; shout?: { text: string; cycle: number }; institution_notice?: { text: string; cycle: number; org_name?: string }; trade_notice?: { text: string; cycle: number }; public_rumor?: { contested?: boolean }; org_marks?: Array<{ name: string }>; vacant_offices?: Array<{ org_name: string; office_name: string }>; };
- publicOrgName · function · L70-L77 — function publicOrgName(raw: string): string
- laterTraceInputs · function · L80-L117 — function laterTraceInputs(input: LaterTraceInput): Pick< TraceRoom, "public_rumor" | "org_marks" | "vacant_offices" >
- publicText · function · L119-L121 — function publicText(raw: string): string
- safePlateHandle · function · L123-L131 — function safePlateHandle(raw: string | undefined): string | null
- publicTraces · function · L134-L136 — function publicTraces(traces: ProjectedTrace[]): ObservationTrace[]
- projectRoomTraces · function · L139-L230 — function projectRoomTraces(room: TraceRoom | null | undefined): ProjectedTrace[]
- add · function · L143-L148 — add = (kind: PlayTraceKind, text: string, source_state_ref: TraceSourceRef)
- isScar · function · L151-L152 — isScar = (e: (typeof ents)[number])
