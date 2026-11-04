# workers/noema/test/acceptance-733.test.ts

- jsonRes · function · L145-L147 — function jsonRes(body: unknown, status = 200)
- obs · function · L150-L157 — function obs(name: string, exit: string, consequence: string, entities: Array<Record<string, unknown>>, traces: unknown[] = [])
- fakeHosted · function · L159-L235 — function fakeHosted(opts: { seedStatus?: number; calls?: string[]; prodVersion?: () => string } = {})
- handler · function · L165-L233 — handler = async (url: string, init: RequestInit = {})
- mkEnv · function · L237-L244 — function mkEnv(opts: { mode?: number; supabaseUrl?: string } = {})
- mkCtx · function · L246-L270 — function mkCtx(h: ReturnType<typeof fakeHosted>, e: ReturnType<typeof mkEnv>, extra: { execCalls?: Array<{ cmd: string; args: string[]; env?: Record<string, string | undefined> }>; secretsSeen?: string[] } = {})
- readState · function · L272-L272 — readState = (e: ReturnType<typeof mkEnv>)
- deployed · function · L274-L282 — async function deployed(opts: Parameters<typeof fakeHosted>[0] = {})
