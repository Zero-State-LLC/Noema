# workers/noema/test/operator-test-world-seed.test.ts

- enteredWorld · function · L25-L32 — async function enteredWorld(worldId: string): Promise<WorldRuntime>
- retainedWorldWith · function · L34-L38 — async function retainedWorldWith(aliases: Record<string, string>): Promise<WorldRuntime>
- seedHarnessWith · function · L40-L40 — seedHarnessWith = (stored: WorldRuntime)
- seedHarness · function · L42-L54 — async function seedHarness(opts: { entered?: boolean; worldId?: string; isolated?: string; stored?: WorldRuntime } = {})
- seed · function · L50-L52 — seed = (body: Record<string, unknown>, o: { agent?: string | null; admin?: string | null } = {})
- aliasesOf · function · L56-L57 — aliasesOf = async (h: Awaited<ReturnType<typeof seedHarness>>["h"], worldId = TARGET)
- Ctx · type · L90-L90 — type Ctx = Awaited<ReturnType<typeof seedHarness>>;
- seedCalls · function · L122-L122 — seedCalls = ()
