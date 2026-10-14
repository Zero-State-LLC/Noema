# workers/noema/src/incident-recover.ts

- AdoptLiveHeadInput · type · L7-L14 — type AdoptLiveHeadInput = { settlement_id: string; writer_generation: string; genesis_id?: string | null; status: string; settlement_health: string; world: WorldRuntime; };
- IncidentRecoverOk · type · L16-L24 — type IncidentRecoverOk = { ok: true; world: WorldRuntime; status: "ACTIVE"; settlement: "HEALTHY"; revision: number; mode: "restore" | "adopt"; head_present: true; };
- IncidentRecoverErr · type · L26-L26 — type IncidentRecoverErr = { ok: false; code: string; message: string; http: number };
- runIncidentRecover · function · L34-L121 — async function runIncidentRecover( input: { status: WorldOpStatus; settlement: SettlementHealth; storedWorld: WorldRuntime | null | undefined; currentWorld: WorldRuntime; genesisId?: string | null; writerGeneration: string; settlementId?: string; }, deps: { getHead: (worldId: string) => Promise<WorldHead | null>; adoptLiveHead: (input: AdoptLiveHeadInput) => Promise<CanonicalCommit>; }, ): Promise<IncidentRecoverOk | IncidentRecoverErr>
