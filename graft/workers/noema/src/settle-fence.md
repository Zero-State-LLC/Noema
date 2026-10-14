# workers/noema/src/settle-fence.ts

- isContentionSettlementFail · function · L18-L20 — function isContentionSettlementFail(code: string): boolean
- FenceHead · type · L22-L30 — type FenceHead = { world_id: string; revision: number; ledger_head_event_id?: string | null; state_digest?: string | null; writer_generation?: string | null; sequence: number; cycle: number; };
- FenceCheck · type · L32-L32 — type FenceCheck = { ok: true } | { ok: false; code: typeof STALE_HEAD | typeof STALE_FENCE };
- checkExpectedHead · function · L34-L45 — function checkExpectedHead( expectedRevision: number, durable: FenceHead | null, expectedWriterGeneration?: string | null, ): FenceCheck
- nextRevision · function · L47-L49 — function nextRevision(durable: FenceHead | null): number
- CrashPoint · type · L51-L55 — type CrashPoint = | "before_write" | "during_write" | "after_commit_before_ack" | null;
- MemStore · type · L57-L61 — type MemStore = { head: FenceHead | null; events: Record<string, true>; committed: boolean; };
- settleBatch · function · L64-L87 — function settleBatch( store: MemStore, expectedRevision: number, eventIds: string[], next: Omit<FenceHead, "revision"> & { revision?: number }, crash: CrashPoint = null, ): { ok: true; head: FenceHead } | { ok: false; code: string }
- retrySettle · function · L89-L101 — function retrySettle( store: MemStore, expectedRevision: number, eventIds: string[], next: Omit<FenceHead, "revision"> & { revision?: number }, ): { ok: true; head: FenceHead } | { ok: false; code: string }
- restoreOrIncident · function · L103-L106 — function restoreOrIncident(head: FenceHead | null): { ok: true; head: FenceHead } | { ok: false; code: "INCIDENT" }
