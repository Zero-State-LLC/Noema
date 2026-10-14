# workers/noema/test/player-tempo.test.ts

- principal · function · L29-L41 — function principal(id: string): PlayerPrincipal
- fixtureWorld · function · L43-L79 — function fixtureWorld(worldId = "test.hosted-canonical.tempo"): WorldRuntime
- run · function · L81-L98 — async function run( w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, now = CLOCK, settle: () => Promise<boolean> = async () => true, extra: Partial<CommandEnvelope> = {}, )
- enterThenPin · function · L100-L113 — async function enterThenPin( w: WorldRuntime, players: PlayerPrincipal[], mode: "OBSERVED_LIVE" | "FAST_TEST" | "STEP_TEST" = "FAST_TEST", now = CLOCK, )
- fingerprintWorld · function · L115-L133 — function fingerprintWorld(w: WorldRuntime)
- play · function · L320-L339 — async function play(order: Array<"nacre" | "vesper">)
