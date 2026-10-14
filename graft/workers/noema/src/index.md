# workers/noema/src/index.ts

- html · function · L96-L109 — function html(body: string, status = 200, cache = "no-store"): Response
- publicText · function · L111-L122 — function publicText(body: string, contentType: string, cache = "public, max-age=300"): Response
- wantsHtml · function · L124-L127 — function wantsHtml(request: Request): boolean
- assetRequest · function · L129-L131 — function assetRequest(origin: string, assetPath: string, method: string): Request
- serveStatic · function · L133-L182 — async function serveStatic(request: Request, env: Env, path: string): Promise<Response>
- routeToWorld · function · L184-L203 — async function routeToWorld( env: Env, worldId: string, principal: unknown, envelope: CommandEnvelope, opts?: { allow_bootstrap?: boolean }, ): Promise<Response>
- scheduled · method · L206-L210 — async scheduled(_controller: unknown, env: Env): Promise<void>
- fetch · method · L212-L1098 — async fetch(request: Request, env: Env): Promise<Response>
- cors · function · L213-L213 — cors = (res: Response)
- blocked · function · L333-L345 — blocked = (world: unknown = {})
