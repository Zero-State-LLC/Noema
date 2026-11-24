# workers/noema/test/player-tempo.test.ts

- principal · function · L31-L43 — function principal(id: string): PlayerPrincipal
- fixtureWorld · function · L45-L81 — function fixtureWorld(worldId = "test.hosted-canonical.tempo"): WorldRuntime
- run · function · L83-L100 — async function run( w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, now = CLOCK, settle: () => Promise<boolean> = async () => true, extra: Partial<CommandEnvelope> = {}, )
- enterThenPin · function · L102-L115 — async function enterThenPin( w: WorldRuntime, players: PlayerPrincipal[], mode: "OBSERVED_LIVE" | "FAST_TEST" | "STEP_TEST" = "FAST_TEST", now = CLOCK, )
- fingerprintWorld · function · L117-L135 — function fingerprintWorld(w: WorldRuntime)
- play · function · L322-L341 — async function play(order: Array<"nacre" | "vesper">)
- localCanonicalTempoInputs · function · L772-L795 — function localCanonicalTempoInputs()
- localCanonicalTempoWorld · function · L797-L801 — async function localCanonicalTempoWorld()
- admitLocalCanonicalInputs · function · L803-L815 — function admitLocalCanonicalInputs( w: WorldRuntime, inputs: Array<{ principal: PlayerPrincipal; envelope: CommandEnvelope }>, )
- resolveLocalCanonicalTempo · function · L817-L847 — async function resolveLocalCanonicalTempo(w: WorldRuntime)
