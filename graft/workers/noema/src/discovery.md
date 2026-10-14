# workers/noema/src/discovery.ts

- ArchiveClaim · type · L11-L11 — type ArchiveClaim = (typeof ARCHIVE_CLAIMS)[number];
- DiscoveryState · type · L13-L17 — type DiscoveryState = { catalog_id: typeof DISCOVERY_CATALOG_ID; archives: Record<string, ArchiveClaim>; inspects: Record<string, ArchiveClaim>; };
- emptyDiscovery · function · L19-L21 — function emptyDiscovery(): DiscoveryState
- ensureDiscovery · function · L23-L30 — function ensureDiscovery(raw: DiscoveryState | undefined | null): DiscoveryState
- isArchiveClaim · function · L32-L34 — function isArchiveClaim(raw: unknown): raw is ArchiveClaim
- explicitArchiveRecord · function · L37-L47 — function explicitArchiveRecord(entity: { entity_type?: string; archive_subject_entity_id?: string; archive_claim?: string; }): { subject_entity_id: string; claim: ArchiveClaim } | null
- creditArchive · function · L49-L58 — function creditArchive( state: DiscoveryState | undefined, subjectEntityId: string, claim: ArchiveClaim, ): DiscoveryState
- creditInspect · function · L60-L69 — function creditInspect( state: DiscoveryState | undefined, subjectEntityId: string, observation: ArchiveClaim, ): DiscoveryState
- applyInspectEvidence · function · L71-L84 — function applyInspectEvidence( state: DiscoveryState | undefined, entity: { entity_id: string; entity_type?: string; archive_subject_entity_id?: string; archive_claim?: string; }, ): DiscoveryState
- discoveryLines · function · L86-L94 — function discoveryLines(state: DiscoveryState | undefined | null): string[]
