# workers/noema/test/watch-reconstruction-projection.test.ts

- ReconstructionInput · type · L13-L13 — type ReconstructionInput = NonNullable<Parameters<typeof buildWatchLive>[0]["reconstructions"]>[number];
- storedWatch · function · L36-L64 — function storedWatch(records: ReconstructionInput[], producedState?: Record<string, unknown>)
- get · method · L52-L52 — async get(key: string)
- put · method · L53-L53 — async put(key: string, value: unknown)
- act · function · L106-L111 — async function act(command: string, args: Record<string, unknown> = {})
- snapshot · function · L112-L120 — async function snapshot()
