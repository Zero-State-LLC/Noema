/** Agent Protocol v1 WebSocket. Same Player principal as HTTP. */

import { mintHs256, verifyHs256 } from "./jwt";
import { err, json, requireScope, resolvePrincipal, isExplicitLocalDev, requireAgentPlayer, requireLivePlayer } from "./auth";
import { resolveSignedAdminHeader } from "./admin-auth";
import { hasPrivateCognition } from "./cognition";
import { resolvePlayWorld } from "./command-world";
import { SEAL_HEADER, checkLiveAgentSeal, parseSeal, sealHelloFields } from "./seal";
import type { CommandEnvelope, Env, PlayerPrincipal, Principal } from "./types";

export type ProtocolState = {
  principal: PlayerPrincipal | null;
  adminToken: string;
  seal?: string | null;
};

type Frame = {
  type?: string;
  request_id?: string;
  protocol?: string;
  world_id?: string;
  idempotency_key?: string;
  body?: Record<string, unknown>;
  command?: string;
  arguments?: Record<string, unknown>;
};

/** Hosted inhabit is structured commands only. Parser `arguments.line` is Chamber/test tooling. */
export function stripHumanPlayLine(envelope: CommandEnvelope): CommandEnvelope {
  const args = envelope.arguments;
  if (!args || typeof args.line !== "string") return envelope;
  const next = { ...args };
  delete next.line;
  delete next._macro_step;
  return { ...envelope, arguments: next };
}

function protoErr(requestId: string | undefined, code: string, message: string, statusHint = 400) {
  return {
    protocol: "agent-protocol/v1",
    type: "ERROR",
    request_id: requestId,
    error: { code, message, retryable: false },
    _status: statusHint,
  };
}

export function protocolAuthMethods(env?: { NOEMA_ENV?: string }): string[] {
  return isExplicitLocalDev(env || {}) ? ["controller-token", "dev"] : ["controller-token"];
}

export function protocolHelloAck(
  requestId: string | undefined,
  extra?: Record<string, unknown>,
  env?: { NOEMA_ENV?: string; DEFAULT_WORLD_ID?: string },
) {
  return {
    protocol: "agent-protocol/v1",
    type: "HELLO_ACK",
    request_id: requestId,
    body: {
      selected_protocol: "agent-protocol/v1",
      auth_methods: protocolAuthMethods(env),
      transports: ["websocket", "http"],
      websocket_uri: "/protocol/v1/ws",
      stage: "0",
      ...(extra || {}),
    },
  };
}

export function protocolHello(
  body: Frame,
  env?: { NOEMA_ENV?: string; DEFAULT_WORLD_ID?: string },
): Record<string, unknown> {
  const offeredRaw = body.body?.supported_protocols;
  const offered = Array.isArray(offeredRaw) ? offeredRaw.map((p) => String(p)) : [];
  if (offered.length && !offered.includes("agent-protocol/v1")) {
    return protoErr(body.request_id, "NO_COMPATIBLE_PROTOCOL", "No mutually supported protocol/schema set");
  }
  const extra: Record<string, unknown> = {
    ...sealHelloFields(String(body.world_id || body.body?.world_id || ""), env?.DEFAULT_WORLD_ID),
  };
  if (body.body?.resume_token) extra.resume_offered = true;
  return protocolHelloAck(body.request_id, extra, env);
}

export async function mintResumeToken(
  env: Env,
  principal: PlayerPrincipal,
  seal?: string | null,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return mintHs256(
    {
      typ: "resume",
      player_id: principal.player_id,
      controller_id: principal.controller_id,
      controller_type: principal.controller_type,
      seal: seal || "",
      sid: principal.session_id,
      iat: now,
      exp: now + 3600,
    },
    env.TOKEN_SIGNING_SECRET!,
  );
}

export async function principalFromResume(
  env: Env,
  token: string,
): Promise<{ principal: PlayerPrincipal; seal: string | null } | null> {
  try {
    const claims = await verifyHs256(token, env.TOKEN_SIGNING_SECRET!);
    if (claims.typ !== "resume" || !claims.player_id || !claims.controller_id) return null;
    const ctype = String(claims.controller_type || "");
    if (ctype !== "agent") return null;
    const principal = {
      kind: "agent_player" as const,
      player_id: String(claims.player_id),
      agent_id: `agent.${String(claims.player_id).replace(/^player\./, "")}`,
      controller_id: String(claims.controller_id),
      controller_type: "agent" as const,
      session_id: String(claims.sid || "sess.resume"),
      scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
      protocol_version: "1",
      authentication_context: "resume",
    };
    return { principal, seal: parseSeal(claims.seal) };
  } catch {
    return null;
  }
}

export async function applyPlayerCommand(
  env: Env,
  request: Request,
  principal: Principal,
  envelope: CommandEnvelope & { world_id?: string },
  route: (
    env: Env,
    worldId: string,
    principal: unknown,
    envelope: CommandEnvelope,
    opts?: { allow_bootstrap?: boolean },
  ) => Promise<Response>,
): Promise<Response> {
  const agentOrDenied = requireAgentPlayer(principal);
  if (agentOrDenied instanceof Response) return agentOrDenied;
  const agent = agentOrDenied;
  const liveOrDenied = requireLivePlayer(agent);
  if (liveOrDenied instanceof Response) return liveOrDenied;
  const liveAgent = liveOrDenied;
  if (!envelope.command || !envelope.request_id) {
    return err("INVALID_REQUEST", "command and request_id required", 400);
  }
  if (hasPrivateCognition(envelope)) {
    return err("INVALID_REQUEST", "private cognition fields are not accepted", 400);
  }
  envelope = stripHumanPlayLine(envelope);
  const cmd = String(envelope.command).toUpperCase();
  if (cmd === "OBSERVE" || cmd === "LOOK") {
    const denied = requireScope(liveAgent, "noema.world.observe");
    if (denied) return denied;
  } else {
    const denied = requireScope(liveAgent, "noema.action.submit");
    if (denied) return denied;
  }
  const target = resolvePlayWorld(envelope.world_id, env.DEFAULT_WORLD_ID);
  if (target.kind === "deny") return err(target.code, target.message, 403);
  const sealed = checkLiveAgentSeal({
    controllerType: liveAgent.controller_type,
    worldKind: target.kind,
    presented: parseSeal(request.headers.get(SEAL_HEADER)),
  });
  if (!sealed.ok) return err(sealed.code, sealed.message, 401);
  if (target.kind === "isolated") {
    const admin = await resolveSignedAdminHeader(request, env);
    if (admin instanceof Response) return admin;
    return route(env, target.world_id, liveAgent, envelope, { allow_bootstrap: true });
  }
  return route(env, target.world_id, liveAgent, envelope);
}

function commandFromFrame(msg: Frame): CommandEnvelope & { world_id?: string } {
  const action = msg.body?.action;
  const verb =
    (typeof action === "object" && action && "verb" in action ? String((action as { verb?: string }).verb) : "") ||
    (typeof msg.body?.command === "string" ? String(msg.body.command) : "") ||
    (msg.command ? String(msg.command) : "") ||
    String(msg.type || "");
  const params =
    (typeof action === "object" && action && "parameters" in action
      ? ((action as { parameters?: Record<string, unknown> }).parameters || {})
      : (msg.body?.arguments as Record<string, unknown> | undefined) || msg.arguments || {});
  return {
    request_id: String(msg.request_id || `req.${crypto.randomUUID().slice(0, 8)}`),
    idempotency_key: msg.idempotency_key || String(msg.body?.idempotency_key || ""),
    command: verb.toUpperCase() === "ACT" ? "LOOK" : verb.toUpperCase(),
    arguments: params,
    world_id: String(msg.world_id || msg.body?.world_id || "") || undefined,
  };
}

export async function handleProtocolFrame(
  env: Env,
  request: Request,
  state: ProtocolState,
  msg: Frame,
  route: (
    env: Env,
    worldId: string,
    principal: unknown,
    envelope: CommandEnvelope,
    opts?: { allow_bootstrap?: boolean },
  ) => Promise<Response>,
): Promise<{ reply: Record<string, unknown>; state: ProtocolState }> {
  const type = String(msg.type || "").toUpperCase();
  if (type === "HELLO") {
    const resume = String(msg.body?.resume_token || "");
    if (resume) {
      const restored = await principalFromResume(env, resume);
      if (restored) state = { ...state, principal: restored.principal, seal: restored.seal };
    }
    return { reply: protocolHello(msg, env), state };
  }
  if (type === "AUTH") {
    const token = String(msg.body?.access_token || msg.body?.token || "");
    if (!token) return { reply: protoErr(msg.request_id, "NOT_AUTHORIZED", "access_token required", 401), state };
    const fake = new Request(request.url, { headers: { Authorization: `Bearer ${token}` } });
    const principal = await resolvePrincipal(fake, env);
    if (principal instanceof Response) {
      const body = (await principal.json().catch(() => ({}))) as { error?: { code?: string; message?: string } };
      return {
        reply: protoErr(msg.request_id, body.error?.code || "NOT_AUTHORIZED", body.error?.message || "auth failed", 401),
        state,
      };
    }
    const agent = requireAgentPlayer(principal);
    if (agent instanceof Response) {
      const body = (await agent.json().catch(() => ({}))) as { error?: { code?: string; message?: string } };
      return {
        reply: protoErr(msg.request_id, body.error?.code || "NOT_AUTHORIZED", body.error?.message || "Agents play this world. Humans watch.", 403),
        state,
      };
    }
    const liveCheck = requireLivePlayer(agent);
    if (liveCheck instanceof Response) {
      const body = (await liveCheck.json().catch(() => ({}))) as { error?: { code?: string; message?: string } };
      return {
        reply: protoErr(msg.request_id, body.error?.code || "PLAYER_DEAD", body.error?.message || "Player is dead or retired.", 403),
        state,
      };
    }
    const worldKind = resolvePlayWorld(msg.world_id || msg.body?.world_id, env.DEFAULT_WORLD_ID).kind;
    const sealed = checkLiveAgentSeal({
      controllerType: agent.controller_type,
      worldKind,
      presented: parseSeal(msg.body?.prompt_version_hash || msg.body?.prompt_version),
    });
    if (!sealed.ok) return { reply: protoErr(msg.request_id, sealed.code, sealed.message, 401), state };
    state = {
      principal: agent,
      adminToken: String(msg.body?.admin_token || state.adminToken || ""),
      seal: sealed.seal,
    };
    const resume_token = await mintResumeToken(env, agent, sealed.seal);
    return {
      reply: {
        protocol: "agent-protocol/v1",
        type: "AUTH_ACK",
        request_id: msg.request_id,
        agent_id: agent.agent_id,
        body: {
          session_id: agent.session_id,
          player_id: agent.player_id,
          controller_id: agent.controller_id,
          agent_id: agent.agent_id,
          scopes: agent.scopes,
          resume_token,
        },
      },
      state,
    };
  }
  if (type === "PING") {
    return { reply: { protocol: "agent-protocol/v1", type: "PONG", request_id: msg.request_id, body: {} }, state };
  }
  if (type === "REGISTER") {
    return { reply: { protocol: "agent-protocol/v1", type: "REGISTER_ACK", request_id: msg.request_id, body: { ok: true } }, state };
  }
  if (type === "DISCONNECT") {
    return { reply: { protocol: "agent-protocol/v1", type: "DISCONNECT_ACK", request_id: msg.request_id, body: { ok: true } }, state };
  }
  if (!state.principal) {
    return { reply: protoErr(msg.request_id, "NOT_AUTHORIZED", "AUTH required", 401), state };
  }
  if (hasPrivateCognition(msg)) {
    return { reply: protoErr(msg.request_id, "PRIVATE_COGNITION_FORBIDDEN", "private cognition fields are not accepted", 400), state };
  }
  const envelope = commandFromFrame(msg);
  const headers: Record<string, string> = { Authorization: "Bearer session" };
  if (state.adminToken) headers["X-Noema-Admin-Token"] = state.adminToken;
  if (state.seal) headers[SEAL_HEADER] = state.seal;
  const synth = new Request(request.url, { headers });
  const res = await applyPlayerCommand(env, synth, state.principal, envelope, route);
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const error = (data.error || {}) as { code?: string; message?: string };
    return {
      reply: protoErr(msg.request_id, error.code || "ACT_FAILED", error.message || res.statusText, res.status),
      state,
    };
  }
  return {
    reply: {
      protocol: "agent-protocol/v1",
      type: type === "OBSERVE" ? "OBSERVE" : "ACT_RESULT",
      request_id: msg.request_id,
      body: { ...data, observation: data.observation },
    },
    state,
  };
}

export function acceptProtocolWebSocket(
  request: Request,
  env: Env,
  route: (
    env: Env,
    worldId: string,
    principal: unknown,
    envelope: CommandEnvelope,
    opts?: { allow_bootstrap?: boolean },
  ) => Promise<Response>,
): Response {
  if (request.headers.get("Upgrade") !== "websocket") {
    return json({ error: { code: "UPGRADE_REQUIRED", message: "Upgrade: websocket required" } }, 426);
  }
  const pair = new WebSocketPair();
  const server = pair[1];
  server.accept();
  let state: ProtocolState = { principal: null, adminToken: "", seal: null };
  server.addEventListener("message", (evt: MessageEvent) => {
    void (async () => {
      try {
        let msg: Frame;
        try {
          msg = JSON.parse(String(evt.data || "{}")) as Frame;
        } catch {
          server.send(JSON.stringify(protoErr(undefined, "INVALID_SCHEMA", "frame must be JSON")));
          return;
        }
        const out = await handleProtocolFrame(env, request, state, msg, route);
        state = out.state;
        server.send(JSON.stringify(out.reply));
      } catch {
        server.send(JSON.stringify(protoErr(undefined, "INTERNAL", "protocol frame failed", 500)));
      }
    })();
  });
  return new Response(null, { status: 101, webSocket: pair[0] });
}
