# workers/noema/test/rate-limit.test.ts

- durableNs · function · L61-L68 — function durableNs(handler: (url: string, init?: RequestInit) => Promise<Response>): DurableObjectNamespace
- MemoryStorage · class · L103-L137 — class MemoryStorage
- get · method · L108-L110 — async get<T>(key: string): Promise<T | undefined>
- put · method · L111-L113 — async put(key: string, value: unknown): Promise<void>
- delete · method · L114-L120 — async delete(keys: string | string[]): Promise<number | boolean>
- list · method · L121-L126 — async list(opts: { prefix?: string; startAfter?: string; limit?: number } = {}): Promise<Map<string, unknown>>
- getAlarm · method · L127-L129 — async getAlarm(): Promise<number | null>
- setAlarm · method · L130-L133 — async setAlarm(at: number): Promise<void>
- deleteAlarm · method · L134-L136 — async deleteAlarm(): Promise<void>
- limiter · function · L140-L162 — function limiter()
- fire · function · L154-L160 — async function fire(): Promise<void>
- isolate · function · L165-L165 — isolate = ()
