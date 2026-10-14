# workers/noema/src/cors.ts

- normalizePath · function · L17-L19 — function normalizePath(pathname: string): string
- isPublicReadPath · function · L21-L34 — function isPublicReadPath(path: string): boolean
- isAllowedOrigin · function · L36-L45 — function isAllowedOrigin(origin: string, env?: { NOEMA_ENV?: string }): boolean
- allowOriginValue · function · L47-L58 — function allowOriginValue( request: Request, env?: { NOEMA_ENV?: string }, ): string | null
- applyCors · function · L60-L69 — function applyCors(res: Response, request: Request, env?: { NOEMA_ENV?: string }): Response
