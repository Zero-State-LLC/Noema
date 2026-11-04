# workers/noema/test/agent-http-do-fixture.ts

- fixtureWorld · function · L13-L28 — function fixtureWorld(): WorldRuntime
- harness · function · L30-L114 — function harness(initialWorld: WorldRuntime = fixtureWorld(), emptyActiveWorldId?: string, storedAtIsolate?: WorldRuntime, publicTarget?: string)
- fetch · method · L45-L81 — async fetch(input: string | Request, init?: RequestInit)
- get · method · L61-L61 — async get(key: string)
- put · method · L62-L70 — async put(key: string | Record<string, unknown>, value?: unknown)
- setAlarm · method · L71-L71 — async setAlarm(at: number)
- deleteAlarm · method · L72-L72 — async deleteAlarm()
- getAlarm · method · L73-L73 — async getAlarm()
- acceptWebSocket · method · L74-L74 — acceptWebSocket(ws: WebSocket)
- hit · function · L85-L92 — async function hit(path: string, body?: Record<string, unknown>, token?: string, seal = ACCEPTED_SEALS[0], extraHeaders: Record<string, string> = {})
- command · function · L94-L95 — command = (token: string, command: string, args: Record<string, unknown> = {}, extra: Record<string, unknown> = {})
- agent · function · L96-L96 — agent = ()
