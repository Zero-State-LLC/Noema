# workers/noema/src/governance.ts

- AppointmentMechanism · type · L23-L23 — type AppointmentMechanism = (typeof APPOINTMENT_MECHANISMS)[number];
- GovernanceRule · type · L25-L38 — type GovernanceRule = { rule_id: string; org_id: string; published: boolean; decision: { offices: string[]; quorum: number }; appointment: { mechanism: AppointmentMechanism }; jurisdiction: { objects?: string[]; rooms?: string[]; members?: string[] }; enforcement: { operation: string }; /** Absent on_vacancy/on_deadlock is undefined authority. Written REFUSE is defined. */ failure: { on_vacancy?: "REFUSE" | "SUCCEED_THEN_DECIDE"; on_deadlock?: "REFUSE"; on_expiry?: "REFUSE" | "LAPSE" }; evidence: { record: "PUBLIC_NOTICE" | "ORG_RECORD" }; published_by?: string; published_cycle?: number; };
- GovernanceRefusal · type · L40-L48 — type GovernanceRefusal = | "unpublished" | "not_deciding_office" | "quorum_short" | "out_of_jurisdiction" | "unknown_enforcement" | "undefined_failure" | "vacancy_refused" | "authority_conflict";
- GovernanceDecision · type · L62-L64 — type GovernanceDecision = | { ok: true; operation: string } | { ok: false; reason: GovernanceRefusal; message: string };
- refuse · function · L66-L68 — function refuse(reason: GovernanceRefusal): GovernanceDecision
- parseAppointmentMechanism · function · L70-L73 — function parseAppointmentMechanism(raw: unknown): AppointmentMechanism | null
- jurisdictionSet · function · L76-L79 — function jurisdictionSet(rule: GovernanceRule): string[]
- evaluateGovernanceDecision · function · L85-L130 — function evaluateGovernanceDecision(input: { rule: GovernanceRule | undefined; org?: { office_precedence?: string[]; offices?: Record<string, OfficeRecord> }; actingOffices: string[]; vacantOffices?: string[]; concurring: number; target: { object_id?: string; room_id?: string; member_id?: string }; knownOperations: string[]; }): GovernanceDecision
- governanceLines · function · L136-L147 — function governanceLines( rule: GovernanceRule | undefined, offices: Array<{ office_id: string; display_name: string }>, isMember: boolean, ): string[]
- GovernanceDecisionRecord · type · L149-L156 — type GovernanceDecisionRecord = { rule_id: string; decided_by: string; decided_cycle: number; operation: string; target: string; concurring: number; };
- parseGovernanceRule · function · L162-L227 — function parseGovernanceRule( raw: unknown, orgId: string, offices: Record<string, { office_id: string }> | undefined, ): { ok: true; rule: GovernanceRule } | { ok: false; message: string }
- list · function · L181-L181 — list = (v: unknown)
