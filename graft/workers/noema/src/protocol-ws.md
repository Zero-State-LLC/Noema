# workers/noema/src/protocol-ws.ts

- ProtocolState · type · L12-L16 — type ProtocolState = { principal: PlayerPrincipal | null; adminToken: string; seal?: string | null; };
- Frame · type · L18-L27 — type Frame = { type?: string; request_id?: string; protocol?: string; world_id?: string; idempotency_key?: string; body?: Record<string, unknown>; command?: string; arguments?: Record<string, unknown>; };
- stripHumanPlayLine · function · L30-L37 — function stripHumanPlayLine(envelope: CommandEnvelope): CommandEnvelope
- protoErr · function · L39-L47 — function protoErr(requestId: string | undefined, code: string, message: string, statusHint = 400)
- protocolAuthMethods · function · L49-L51 — function protocolAuthMethods(env?: { NOEMA_ENV?: string }): string[]
- protocolHelloAck · function · L53-L71 — function protocolHelloAck( requestId: string | undefined, extra?: Record<string, unknown>, env?: { NOEMA_ENV?: string; DEFAULT_WORLD_ID?: string }, )
- protocolHello · function · L73-L87 — function protocolHello( body: Frame, env?: { NOEMA_ENV?: string; DEFAULT_WORLD_ID?: string }, ): Record<string, unknown>
- mintResumeToken · function · L89-L108 — async function mintResumeToken( env: Env, principal: PlayerPrincipal, seal?: string | null, ): Promise<string>
- principalFromResume · function · L110-L134 — async function principalFromResume( env: Env, token: string, ): Promise<{ principal: PlayerPrincipal; seal: string | null } | null>
- applyPlayerCommand · function · L136-L184 — async function applyPlayerCommand( env: Env, request: Request, principal: Principal, envelope: CommandEnvelope & { world_id?: string }, route: ( env: Env, worldId: string, principal: unknown, envelope: CommandEnvelope, opts?: { allow_bootstrap?: boolean }, ) => Promise<Response>, ): Promise<Response>
- commandFromFrame · function · L186-L204 — function commandFromFrame(msg: Frame): CommandEnvelope & { world_id?: string }
- handleProtocolFrame · function · L206-L333 — async function handleProtocolFrame( env: Env, request: Request, state: ProtocolState, msg: Frame, route: ( env: Env, worldId: string, principal: unknown, envelope: CommandEnvelope, opts?: { allow_bootstrap?: boolean }, ) => Promise<Response>, ): Promise<{ reply: Record<string, unknown>; state: ProtocolState }>
- acceptProtocolWebSocket · function · L335-L372 — function acceptProtocolWebSocket( request: Request, env: Env, route: ( env: Env, worldId: string, principal: unknown, envelope: CommandEnvelope, opts?: { allow_bootstrap?: boolean }, ) => Promise<Response>, ): Response
