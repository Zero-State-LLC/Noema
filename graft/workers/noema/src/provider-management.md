# workers/noema/src/provider-management.ts

- ProviderStatus · interface · L5-L10 — interface ProviderStatus
- projectRef · function · L12-L20 — function projectRef(url?: string): string | null
- safeMessage · function · L22-L24 — function safeMessage(value: unknown): string
- responseJson · function · L26-L28 — async function responseJson(res: Response): Promise<Record<string, unknown>>
- providerConfiguration · function · L30-L50 — function providerConfiguration(env: Env)
- verifyResend · function · L52-L79 — async function verifyResend(env: Env, fetchImpl: typeof fetch = fetch): Promise<ProviderStatus>
- verifySupabase · function · L81-L119 — async function verifySupabase(env: Env, fetchImpl: typeof fetch = fetch): Promise<ProviderStatus>
- providerOverview · function · L121-L132 — async function providerOverview(env: Env, fetchImpl: typeof fetch = fetch)
