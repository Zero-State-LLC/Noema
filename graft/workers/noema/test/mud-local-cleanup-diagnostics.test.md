# workers/noema/test/mud-local-cleanup-diagnostics.test.ts

- Diagnostic · type · L6-L6 — type Diagnostic = { pid: number; process_group: number; stage: string; operation: string; signal: string | number | null; code?: string; errno?: number };
- Record · type · L7-L7 — type Record = { phase: string; pid: number; cleanup_diagnostics?: Diagnostic[] };
- absent · function · L9-L9 — absent = ()
- permission · function · L10-L10 — permission = ()
- record · function · L11-L11 — record = (): Record
- kill · function · L16-L19 — kill = (pid: number, signal: string | number)
- get · method · L69-L69 — get()
- get · method · L75-L75 — get()
