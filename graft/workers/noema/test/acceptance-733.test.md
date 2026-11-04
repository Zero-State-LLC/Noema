# workers/noema/test/acceptance-733.test.ts

- jsonRes · function · L145-L147 — function jsonRes(body: unknown, status = 200)
- fakeHosted · function · L149-L226 — function fakeHosted(opts: { seedStatus?: number; calls?: string[]; prodVersion?: () => string } = {})
- handler · function · L155-L224 — handler = async (url: string, init: RequestInit = {})
- mkEnv · function · L228-L235 — function mkEnv(opts: { mode?: number; supabaseUrl?: string } = {})
- mkCtx · function · L237-L261 — function mkCtx(h: ReturnType<typeof fakeHosted>, e: ReturnType<typeof mkEnv>, extra: { execCalls?: Array<{ cmd: string; args: string[]; env?: Record<string, string | undefined> }>; secretsSeen?: string[] } = {})
- readState · function · L263-L263 — readState = (e: ReturnType<typeof mkEnv>)
- deployed · function · L265-L273 — async function deployed(opts: Parameters<typeof fakeHosted>[0] = {})
