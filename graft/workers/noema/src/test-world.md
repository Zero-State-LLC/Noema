# workers/noema/src/test-world.ts

- WorldAdmission · type · L9-L11 — type WorldAdmission = | { ok: true; world_id: string } | { ok: false; code: "WORLD_FORBIDDEN"; message: string };
- deny · function · L13-L15 — function deny(message: string): WorldAdmission
- isAdmittedTestWorldId · function · L17-L19 — function isAdmittedTestWorldId(worldId: string): boolean
- isolatedLedgerEventId · function · L22-L33 — function isolatedLedgerEventId(worldId: string, sequence: number): string
- withIsolatedBootstrapEvent · function · L40-L53 — function withIsolatedBootstrapEvent< T extends { event_id: string; event_type: string; sequence: number; payload?: Record<string, unknown> }, >(events: T[], worldId: string, genesisId?: string | null): T[]
- admitTestWorldId · function · L59-L82 — function admitTestWorldId(raw: unknown, defaultWorldId?: string): WorldAdmission
- resolveLoadWorldId · function · L85-L92 — function resolveLoadWorldId( requestedWorldId: string | null | undefined, defaultWorldId: string | undefined, ): string
- lifecycleRequestedWorldId · function · L95-L98 — function lifecycleRequestedWorldId(raw: unknown): string | null
- RecoverBind · type · L100-L102 — type RecoverBind = | { ok: true; world_id: string } | { ok: false; code: "WORLD_FORBIDDEN"; message: string };
- recoverBoundWorldId · function · L105-L123 — function recoverBoundWorldId( requested: string | null | undefined, storedWorldId: string | null | undefined, currentWorldId: string | null | undefined, ): RecoverBind
