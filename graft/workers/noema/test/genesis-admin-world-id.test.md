# workers/noema/test/genesis-admin-world-id.test.ts

- DoCall · type · L64-L70 — type DoCall = { op: string; name?: string; url?: string; body?: Record<string, unknown> | null; headers?: Record<string, string>; };
- mockWorldDo · function · L72-L106 — function mockWorldDo(calls: DoCall[])
- idFromName · method · L74-L77 — idFromName(name: string)
- get · method · L78-L104 — get(id: { name: string })
- env · function · L108-L117 — function env(calls: DoCall[], noemaEnv = "local", defaultWorldId = "world-01"): Env
- adminToken · function · L119-L123 — async function adminToken(noemaEnv = "local")
- adminPost · function · L125-L138 — async function adminPost( path: string, body: Record<string, unknown>, calls: DoCall[], noemaEnv = "local", )
- memoryState · function · L268-L284 — function memoryState(initial: Record<string, unknown> = {}): DurableObjectState
- get · method · L272-L274 — async get(key: string)
- put · method · L275-L281 — async put(keyOrEntries: string | Record<string, unknown>, value?: unknown)
- stubPreview · function · L286-L322 — function stubPreview(overrides: Record<string, unknown> = {})
- doEnv · function · L324-L330 — function doEnv(): Env
