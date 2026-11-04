# workers/noema/test/acceptance-733-runner-fixture.test.ts

- rand · function · L25-L25 — rand = ()
- Row · type · L27-L27 — type Row = Record<string, unknown>;
- json · function · L28-L28 — json = (body: unknown, status = 200)
- fakeSupabase · function · L31-L71 — function fakeSupabase()
- handler · function · L36-L69 — handler = async (url: string, init: RequestInit = {})
- Rig · type · L73-L73 — type Rig = Awaited<ReturnType<typeof rig>>;
- rig · function · L75-L154 — async function rig(opts: { isolated?: string; afterRunnerRequest?: (h: ReturnType<typeof harness>, requestId: string) => Promise<void> } = {})
- emit · function · L125-L125 — emit = (type: string, e: unknown)
- accept · method · L128-L128 — accept()
- addEventListener · method · L128-L128 — addEventListener(type: string, fn: (evt: { data: string }) => void)
- send · method · L129-L129 — send(message: string)
- constructor · method · L134-L137 — constructor(body: BodyInit | null, init?: ResponseInit & { webSocket?: unknown })
- close · method · L144-L144 — close()
- readSection · function · L152-L152 — readSection = (name: string)
- falseChecks · function · L156-L156 — falseChecks = (section: { checks: Record<string, boolean> })
