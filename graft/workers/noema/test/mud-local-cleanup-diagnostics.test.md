# workers/noema/test/mud-local-cleanup-diagnostics.test.ts

- Diagnostic · type · L6-L6 — type Diagnostic = { pid: number; process_group: number; stage: string; operation: string; signal: string | number | null; code?: string; errno?: number };
- Record · type · L7-L7 — type Record = { phase: string; pid: number; cleanup_diagnostics?: Diagnostic[]; cleanup_reap_waits?: number };
- absent · function · L9-L9 — absent = ()
- permission · function · L10-L10 — permission = ()
- record · function · L11-L11 — record = (): Record
- stopSynthetic · function · L13-L14 — stopSynthetic = (child: { pid: number }, entry: Record, io: { kill: (pid: number, signal: string | number) => void; wait?: (ms: number) => Promise<void> })
- kill · function · L19-L22 — kill = (pid: number, signal: string | number)
- get · method · L72-L72 — get()
- get · method · L78-L78 — get()
