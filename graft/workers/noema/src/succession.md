# workers/noema/src/succession.ts

- SuccessionRuleId · type · L15-L15 — type SuccessionRuleId = typeof RULE_MEMBER_ORDER | typeof RULE_INHERITED;
- SuccessionRule · type · L17-L22 — type SuccessionRule = { successors?: string[]; rule_id?: SuccessionRuleId; designated_by: string; designated_cycle: number; };
- OrgLike · type · L24-L27 — type OrgLike = { status?: string; members?: Array<{ agent_id: string }>; };
- parseSuccessorList · function · L29-L40 — function parseSuccessorList(raw: unknown, fallback?: string): string[]
- eligibleSuccessor · function · L42-L58 — function eligibleSuccessor( successors: string[] | undefined, org: OrgLike, players: Record<string, unknown> | undefined, departedId: string, extra?: (id: string) => boolean, ): string | null
- parseSuccessionRuleId · function · L60-L68 — function parseSuccessionRuleId(raw: unknown): SuccessionRuleId | null
- eligibleMemberOrder · function · L70-L85 — function eligibleMemberOrder( org: OrgLike, players: Record<string, unknown> | undefined, departedId: string, extra?: (id: string) => boolean, ): string | null
- activateOfficeSuccession · function · L87-L108 — function activateOfficeSuccession( office: OfficeRecord, org: OrgLike, players: Record<string, unknown> | undefined, departedId: string, cycle: number, extra?: (id: string) => boolean, ): { holder_player_id: string } | null
- OfficeConsent · type · L110-L110 — type OfficeConsent = { member_id: string; candidate_id: string };
- consensusThreshold · function · L112-L115 — function consensusThreshold(memberCount: number): number
- recordConsent · function · L117-L124 — function recordConsent( consents: OfficeConsent[] | undefined, memberId: string, candidateId: string, ): OfficeConsent[]
- consentWinner · function · L126-L140 — function consentWinner( consents: OfficeConsent[] | undefined, memberIds: string[], ): string | null
- activateEmergencySuccession · function · L142-L155 — function activateEmergencySuccession( scope: EmergencyScope, org: OrgLike, players: Record<string, unknown> | undefined, departedId: string, cycle: number, ): { holder_player_id: string } | null
