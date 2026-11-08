# workers/noema/test/rate-limit.test.ts

- durableNs · function · L39-L46 — function durableNs(handler: (url: string, init?: RequestInit) => Promise<Response>): DurableObjectNamespace
- MemoryStorage · class · L81-L115 — class MemoryStorage
- get · method · L86-L88 — async get<T>(key: string): Promise<T | undefined>
- put · method · L89-L91 — async put(key: string, value: unknown): Promise<void>
- delete · method · L92-L98 — async delete(keys: string | string[]): Promise<number | boolean>
- list · method · L99-L104 — async list(opts: { prefix?: string; startAfter?: string; limit?: number } = {}): Promise<Map<string, unknown>>
- getAlarm · method · L105-L107 — async getAlarm(): Promise<number | null>
- setAlarm · method · L108-L111 — async setAlarm(at: number): Promise<void>
- deleteAlarm · method · L112-L114 — async deleteAlarm(): Promise<void>
- limiter · function · L118-L140 — function limiter()
- fire · function · L132-L138 — async function fire(): Promise<void>
- isolate · function · L143-L143 — isolate = ()
