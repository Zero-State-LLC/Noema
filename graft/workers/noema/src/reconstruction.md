# workers/noema/src/reconstruction.ts

- ReconstructionKind · type · L13-L13 — type ReconstructionKind = (typeof HOSTED_EVIDENCE_KINDS)[number];
- ReconstructionVisibility · type · L14-L14 — type ReconstructionVisibility = "PRIVATE" | "INSTITUTIONAL" | "PUBLIC";
- ReconstructionStatus · type · L15-L15 — type ReconstructionStatus = "RECORDED" | "SUPERSEDED";
- ReconstructionEpistemic · type · L16-L16 — type ReconstructionEpistemic = "OPEN" | "CONTESTED";
- ReconstructionEvidence · type · L18-L24 — type ReconstructionEvidence = { kind: ReconstructionKind; subject_ref: string; source_entity_id: string; label?: ArchiveClaim; cycle: number; };
- ReconstructionRecord · type · L26-L40 — type ReconstructionRecord = { reconstruction_id: string; author_player_id: string; subject_ref: string; claim: string; evidence_refs: ReconstructionEvidence[]; created_cycle: number; supersedes_reconstruction_id?: string; status: ReconstructionStatus; visibility: ReconstructionVisibility; epistemic: ReconstructionEpistemic; org_id?: string; /** Deep Time: fidelity vs evidence fragments. Not ledger rewrite. */ fidelity?: number; };
- allocateReconstructionId · function · L42-L45 — function allocateReconstructionId(seq?: number, cycle?: number, subject?: string): string
- parseVisibility · function · L47-L52 — function parseVisibility(raw: string | undefined | null): ReconstructionVisibility
- parseEvidenceKind · function · L54-L59 — function parseEvidenceKind(raw: string | undefined | null): ReconstructionKind | null
- evidenceAccessible · function · L61-L73 — function evidenceAccessible( discovery: DiscoveryState | undefined, kind: ReconstructionKind, subject: string, ): ArchiveClaim | null
- epistemicFromEvidence · function · L75-L80 — function epistemicFromEvidence(refs: ReconstructionEvidence[]): ReconstructionEpistemic
- visibleTo · function · L82-L91 — function visibleTo( rec: ReconstructionRecord, playerId: string, orgRole: string | null, ): boolean
- controllerContentionLabels · function · L98-L111 — function controllerContentionLabels( refs: ReconstructionEvidence[], ): string[]
- reconstructionLines · function · L113-L140 — function reconstructionLines( recs: ReconstructionRecord[], names: Record<string, string | undefined>, ): string[]
