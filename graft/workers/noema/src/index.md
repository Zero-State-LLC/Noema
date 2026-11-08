# workers/noema/src/index.ts

- html · function · L102-L115 — function html(body: string, status = 200, cache = "no-store"): Response
- publicText · function · L117-L128 — function publicText(body: string, contentType: string, cache = "public, max-age=300"): Response
- wantsHtml · function · L130-L133 — function wantsHtml(request: Request): boolean
- assetRequest · function · L135-L137 — function assetRequest(origin: string, assetPath: string, method: string): Request
- serveStatic · function · L139-L190 — async function serveStatic(request: Request, env: Env, path: string): Promise<Response>
- routeToWorld · function · L192-L211 — async function routeToWorld( env: Env, worldId: string, principal: unknown, envelope: CommandEnvelope, opts?: { allow_bootstrap?: boolean }, ): Promise<Response>
- scheduled · method · L214-L218 — async scheduled(_controller: unknown, env: Env): Promise<void>
- fetch · method · L220-L1172 — async fetch(request: Request, env: Env): Promise<Response>
- cors · function · L221-L221 — cors = (res: Response)
- blocked · function · L344-L356 — blocked = (world: unknown = {})
