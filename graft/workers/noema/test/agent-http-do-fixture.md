# workers/noema/test/agent-http-do-fixture.ts

- fixtureWorld · function · L13-L28 — function fixtureWorld(): WorldRuntime
- harness · function · L30-L94 — function harness(initialWorld: WorldRuntime = fixtureWorld(), emptyActiveWorldId?: string, storedAtIsolate?: WorldRuntime)
- fetch · method · L42-L75 — async fetch(input: string | Request, init?: RequestInit)
- get · method · L58-L58 — async get(key: string)
- put · method · L59-L67 — async put(key: string | Record<string, unknown>, value?: unknown)
- hit · function · L79-L86 — async function hit(path: string, body?: Record<string, unknown>, token?: string, seal = ACCEPTED_SEALS[0], extraHeaders: Record<string, string> = {})
- command · function · L88-L89 — command = (token: string, command: string, args: Record<string, unknown> = {}, extra: Record<string, unknown> = {})
- agent · function · L90-L90 — agent = ()
