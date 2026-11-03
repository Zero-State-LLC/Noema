# workers/noema/test/agent-http-do-fixture.ts

- fixtureWorld · function · L13-L28 — function fixtureWorld(): WorldRuntime
- harness · function · L30-L96 — function harness(initialWorld: WorldRuntime = fixtureWorld(), emptyActiveWorldId?: string, storedAtIsolate?: WorldRuntime, publicTarget?: string)
- fetch · method · L44-L77 — async fetch(input: string | Request, init?: RequestInit)
- get · method · L60-L60 — async get(key: string)
- put · method · L61-L69 — async put(key: string | Record<string, unknown>, value?: unknown)
- acceptWebSocket · method · L70-L70 — acceptWebSocket(ws: WebSocket)
- hit · function · L81-L88 — async function hit(path: string, body?: Record<string, unknown>, token?: string, seal = ACCEPTED_SEALS[0], extraHeaders: Record<string, string> = {})
- command · function · L90-L91 — command = (token: string, command: string, args: Record<string, unknown> = {}, extra: Record<string, unknown> = {})
- agent · function · L92-L92 — agent = ()
