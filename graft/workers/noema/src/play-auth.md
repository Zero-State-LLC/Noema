# workers/noema/src/play-auth.ts

- playHandleFromEmail · function · L31-L37 — function playHandleFromEmail(email: string | null | undefined): string
- requestPlayMagicLink · function · L41-L136 — async function requestPlayMagicLink( env: Env, req: Request, body: { email?: string; next?: string; code?: string; connect_code?: string; auth_flow?: string }, opts?: { fetch?: AdminFetch; throttle?: LoginThrottle; sendPlay?: PlayMailer; mailFetch?: typeof fetch }, ): Promise<Response>
- consumePlayMagicLink · function · L138-L212 — async function consumePlayMagicLink( env: Env, body: { token_hash?: string; type?: string; code?: string }, opts?: { fetch?: AdminFetch }, ): Promise< | { access_token: string; identity_id: string; handle: string; controller_type: "human"; expires_in: number } | Response >
