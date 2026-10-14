# workers/noema/test/conformance/harness.ts

- DoCall · type · L12-L12 — type DoCall = { op: string; name?: string; url?: string; body?: Record<string, unknown> | null };
- worldDoCalls · function · L14-L16 — function worldDoCalls(calls: DoCall[]): DoCall[]
- mockWorldDo · function · L18-L160 — function mockWorldDo(calls: DoCall[], watchBody?: Record<string, unknown>, deadPlayers: Set<string> = new Set())
- idFromName · method · L23-L26 — idFromName(name: string)
- get · method · L27-L158 — get(id: { name: string })
- env · function · L164-L184 — function env( calls: DoCall[], defaultWorldId = "world-01", watchBody?: Record<string, unknown>, deadPlayerIds: string[] = [], ): Env
- envWithDeadPlayers · function · L187-L189 — function envWithDeadPlayers(calls: DoCall[], deadPlayerIds: string[] = [], defaultWorldId = "world-01")
- playerToken · function · L191-L194 — async function playerToken(calls: DoCall[] = [])
- humanToken · function · L196-L199 — async function humanToken(calls: DoCall[] = [])
- adminToken · function · L201-L205 — async function adminToken(calls: DoCall[] = [])
- hit · function · L207-L226 — async function hit( path: string, init: { method?: string; body?: unknown; headers?: Record<string, string> }, calls: DoCall[], defaultWorldId?: string, watchBody?: Record<string, unknown>, deadPlayerIds: string[] = [], )
- hitWatchLive · function · L228-L234 — async function hitWatchLive( calls: DoCall[], init: { method?: string } = {}, watchBody?: Record<string, unknown>, )
