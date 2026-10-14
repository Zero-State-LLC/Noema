# workers/noema/test/agent-http-do-fixture.ts

- fixtureWorld · function · L13-L28 — function fixtureWorld(): WorldRuntime
- harness · function · L30-L84 — function harness(initialWorld: WorldRuntime = fixtureWorld())
- fetch · method · L41-L66 — async fetch(input: string | Request, init?: RequestInit)
- get · method · L54-L54 — async get(key: string)
- put · method · L55-L58 — async put(key: string | Record<string, unknown>, value?: unknown)
- hit · function · L70-L77 — async function hit(path: string, body?: Record<string, unknown>, token?: string, seal = ACCEPTED_SEALS[0])
- command · function · L79-L80 — command = (token: string, command: string, args: Record<string, unknown> = {}, extra: Record<string, unknown> = {})
- agent · function · L81-L81 — agent = ()
