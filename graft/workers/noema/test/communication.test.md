# workers/noema/test/communication.test.ts

- relay · function · L19-L25 — relay = (condition: number, extra: Partial<Parameters<typeof isRelayEntity>[0]> = {})
- principal · function · L77-L88 — function principal(id: string): PlayerPrincipal
- fixtureWorld · function · L90-L140 — function fixtureWorld(opts?: { condition?: number | null; includeRelay?: boolean }): WorldRuntime
- run · function · L142-L156 — async function run( w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, key?: string, )
- enterPair · function · L158-L166 — async function enterPair(w: WorldRuntime)
- leakBlob · function · L168-L170 — function leakBlob(r: { error?: { code?: string; message?: string } })
