# workers/noema/test/test-world.test.ts

- DoCall · type · L22-L27 — type DoCall = { op: string; name?: string; body?: Record<string, unknown> | null; headers?: Record<string, string>; };
- worldCalls · function · L29-L31 — function worldCalls(calls: DoCall[])
- mockWorldDo · function · L33-L64 — function mockWorldDo(calls: DoCall[])
- idFromName · method · L35-L38 — idFromName(name: string)
- get · method · L39-L62 — get(id: { name: string })
- env · function · L66-L75 — function env(calls: DoCall[], defaultWorldId = "world-01"): Env
- playerToken · function · L77-L80 — async function playerToken()
- adminToken · function · L82-L86 — async function adminToken()
- hit · function · L88-L106 — async function hit( path: string, body: Record<string, unknown>, headers: Record<string, string>, calls: DoCall[], defaultWorldId?: string, )
- setup · function · L285-L287 — setup = (calls: DoCall[], overrides: Partial<Env> = {})
- send · function · L288-L291 — send = (calls: DoCall[], bindings: Env, body: Record<string, unknown>, headers: Record<string, string> = {})
