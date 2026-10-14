# workers/noema/test/test-world.test.ts

- DoCall · type · L21-L26 — type DoCall = { op: string; name?: string; body?: Record<string, unknown> | null; headers?: Record<string, string>; };
- worldCalls · function · L28-L30 — function worldCalls(calls: DoCall[])
- mockWorldDo · function · L32-L62 — function mockWorldDo(calls: DoCall[])
- idFromName · method · L34-L37 — idFromName(name: string)
- get · method · L38-L60 — get(id: { name: string })
- env · function · L64-L73 — function env(calls: DoCall[], defaultWorldId = "world-01"): Env
- playerToken · function · L75-L78 — async function playerToken()
- adminToken · function · L80-L84 — async function adminToken()
- hit · function · L86-L104 — async function hit( path: string, body: Record<string, unknown>, headers: Record<string, string>, calls: DoCall[], defaultWorldId?: string, )
