# workers/noema/src/protocol-ws.ts

- ProtocolState · type · L11-L15 — type ProtocolState = { principal: PlayerPrincipal | null; adminToken: string; seal?: string | null; };
- Frame · type · L17-L26 — type Frame = { type?: string; request_id?: string; protocol?: string; world_id?: string; idempotency_key?: string; body?: Record<string, unknown>; command?: string; arguments?: Record<string, unknown>; };
- stripHumanPlayLine · function · L29-L36 — function stripHumanPlayLine(envelope: CommandEnvelope): CommandEnvelope
- protoErr · function · L38-L46 — function protoErr(requestId: string | undefined, code: string, message: string, statusHint = 400)
- protocolAuthMethods · function · L48-L50 — function protocolAuthMethods(env?: { NOEMA_ENV?: string }): string[]
- protocolHelloAck · function · L52-L70 — function protocolHelloAck( requestId: string | undefined, extra?: Record<string, unknown>, env?: { NOEMA_ENV?: string; DEFAULT_WORLD_ID?: string }, )
- protocolHello · function · L72-L86 — function protocolHello( body: Frame, env?: { NOEMA_ENV?: string; DEFAULT_WORLD_ID?: string }, ): Record<string, unknown>
- mintResumeToken · function · L88-L107 — async function mintResumeToken( env: Env, principal: PlayerPrincipal, seal?: string | null, ): Promise<string>
- principalFromResume · function · L109-L133 — async function principalFromResume( env: Env, token: string, ): Promise<{ principal: PlayerPrincipal; seal: string | null } | null>
- applyPlayerCommand · function · L135-L183 — async function applyPlayerCommand( env: Env, request: Request, principal: Principal, envelope: CommandEnvelope & { world_id?: string }, route: ( env: Env, worldId: string, principal: unknown, envelope: CommandEnvelope, opts?: { allow_bootstrap?: boolean }, ) => Promise<Response>, ): Promise<Response>
- commandFromFrame · function · L185-L203 — function commandFromFrame(msg: Frame): CommandEnvelope & { world_id?: string }
- handleProtocolFrame · function · L205-L324 — async function handleProtocolFrame( env: Env, request: Request, state: ProtocolState, msg: Frame, route: ( env: Env, worldId: string, principal: unknown, envelope: CommandEnvelope, opts?: { allow_bootstrap?: boolean }, ) => Promise<Response>, ): Promise<{ reply: Record<string, unknown>; state: ProtocolState }>
- acceptProtocolWebSocket · function · L326-L363 — function acceptProtocolWebSocket( request: Request, env: Env, route: ( env: Env, worldId: string, principal: unknown, envelope: CommandEnvelope, opts?: { allow_bootstrap?: boolean }, ) => Promise<Response>, ): Response
