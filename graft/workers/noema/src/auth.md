# workers/noema/src/auth.ts

- newId · function · L15-L17 — function newId(prefix: string): string
- sessionIdFromClaims · function · L19-L23 — function sessionIdFromClaims(raw: unknown): string
- bearer · function · L25-L29 — function bearer(req: Request): string | null
- json · function · L31-L42 — function json(data: unknown, status = 200): Response
- err · function · L44-L46 — function err(code: string, message: string, status = 401, retryable = false): Response
- isExplicitLocalDev · function · L49-L52 — function isExplicitLocalDev(env: { NOEMA_ENV?: string }): boolean
- humanPrincipalFromClaims · function · L54-L91 — function humanPrincipalFromClaims( env: Env, claims: Record<string, unknown>, authentication_context: string, ): HumanPrincipal
- resolvePrincipal · function · L94-L213 — async function resolvePrincipal(req: Request, env: Env): Promise<Principal | Response>
- MintControllerOptions · type · L215-L229 — type MintControllerOptions = { handle: string; controllerType?: ControllerType; /** Seconds until expiry. Default 3600. Clamped 60 … 7d, or 30d when issuedByAdmin. */ expiresIn?: number; /** Set when minted by ADMIN plane (audit claim only). */ issuedByAdmin?: boolean; /** Opaque operator scope. Only stamped when issuedByAdmin is true. Never an email. */ operatorId?: string; playerId?: string; identityId?: string; amr?: string; /** Stable Controller id. Device enroll supplies this; do not take it from the client. */ controllerId?: string; };
- mintHumanPlatformToken · function · L237-L280 — async function mintHumanPlatformToken( env: Env, opts: { identityId: string; handle?: string; expiresIn?: number; amr?: string; }, ): Promise<{ access_token: string; identity_id: string; controller_type: "human"; scopes: string[]; expires_in: number; token_type: "bearer"; }>
- mintControllerToken · function · L282-L374 — async function mintControllerToken( env: Env, opts: MintControllerOptions, ): Promise<{ access_token: string; player_id: string; controller_id: string; agent_id: string; controller_type: ControllerType; identity_id?: string; scopes: string[]; expires_in: number; token_type: "bearer"; }>
- mintDevControllerToken · function · L377-L390 — async function mintDevControllerToken( env: Env, handle: string, controllerType: ControllerType = "agent", ): Promise<{ access_token: string; player_id: string; controller_id: string; agent_id: string; scopes: string[] }>
- requireScope · function · L392-L397 — function requireScope(principal: PlayerPrincipal, scope: string): Response | null
- denyNonAgentPlay · function · L402-L406 — function denyNonAgentPlay(principal: Principal): Response | null
- requireAgentPlayer · function · L409-L414 — function requireAgentPlayer(principal: Principal): PlayerPrincipal | Response
- requireLivePlayer · function · L430-L434 — function requireLivePlayer(principal: PlayerPrincipal): PlayerPrincipal | Response
