import { JwtError, mintHs256, supabaseIssuer, supabaseJwksUrl, verifyHs256, verifyJwt } from "./jwt";
import { parseOperatorId } from "./ops";
import type { ControllerType, Env, HumanPrincipal, PlayerPrincipal, Principal } from "./types";
import { isAgentPlayerPrincipal, isHumanPrincipal } from "./types";
import { durableRevocationStore, isControllerRevoked } from "./controller-revocation";

const DEFAULT_SCOPES = [
  "noema.player.read",
  "noema.world.observe",
  "noema.action.submit",
];

const HUMAN_PLATFORM_SCOPES = ["noema.watch.read", "noema.controller.manage"];

function newId(prefix: string): string {
  return `${prefix}.${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function sessionIdFromClaims(raw: unknown): string {
  const sid = String(raw || "");
  if (/^sess\.[a-z0-9]{8,32}$/i.test(sid)) return sid;
  return newId("sess");
}

function bearer(req: Request): string | null {
  const h = req.headers.get("Authorization") || "";
  if (h.toLowerCase().startsWith("bearer ")) return h.slice(7).trim() || null;
  return req.headers.get("X-Noema-Access-Token");
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "strict-transport-security": "max-age=31536000; includeSubDomains",
    },
  });
}

export function err(code: string, message: string, status = 401, retryable = false): Response {
  return json({ error: { code, message, retryable } }, status);
}

/** Dev-token mint/resolve only when NOEMA_ENV is an explicit local/test/dev value. Missing env is fail-closed. */
export function isExplicitLocalDev(env: { NOEMA_ENV?: string }): boolean {
  const name = (env.NOEMA_ENV || "").toLowerCase();
  return name === "local" || name === "test" || name === "dev";
}

function humanPrincipalFromClaims(
  env: Env,
  claims: Record<string, unknown>,
  authentication_context: string,
): HumanPrincipal {
  const identity =
    String(claims.identity_id || claims.sub || claims.player_id || "").trim() || newId("id");
  return {
    kind: "human",
    identity_id: identity,
    account_id: claims.account_id ? String(claims.account_id) : undefined,
    session_id: sessionIdFromClaims(claims.sid),
    roles: ["spectator", "authorizer"],
    permissions: [...HUMAN_PLATFORM_SCOPES],
    scopes: Array.isArray(claims.scopes)
      ? (claims.scopes as string[]).filter((s) => s !== "noema.action.submit")
      : [...HUMAN_PLATFORM_SCOPES],
    amr: claims.amr ? String(claims.amr) : undefined,
    protocol_version: env.NOEMA_PROTOCOL_VERSION || "1",
    authentication_context,
    controller_type: String(claims.controller_type) === "hybrid" ? "hybrid" : "human",
  };
}

/** Resolve a platform or Agent Player principal. Human JWT MUST NOT yield a Player. RFC-0120. */
export async function resolvePrincipal(req: Request, env: Env): Promise<Principal | Response> {
  const token = bearer(req);
  if (!token) return err("NOT_AUTHORIZED", "Bearer token required");

  const signing = env.TOKEN_SIGNING_SECRET;
  if (!signing) return err("NOT_AUTHORIZED", "TOKEN_SIGNING_SECRET is not configured", 503);
  // Prefer Noema controller / platform tokens
  try {
    const claims = await verifyHs256(token, signing);
    if (claims.typ === "platform") {
      return humanPrincipalFromClaims(env, claims, "platform_token");
    }
    if (claims.typ === "access" && claims.controller_id) {
      const ctype = String(claims.controller_type || "");
      if (ctype === "human" || ctype === "hybrid") {
        return humanPrincipalFromClaims(env, claims, "controller_token");
      }
      if (ctype !== "agent" || !claims.player_id) {
        return err("NOT_AUTHORIZED", "agent Controller token required for Player resolution");
      }
      const allowed = new Set(DEFAULT_SCOPES);
      const scopes = (Array.isArray(claims.scopes) ? (claims.scopes as string[]) : DEFAULT_SCOPES).filter((s) =>
        allowed.has(s),
      );
      const principal: PlayerPrincipal = {
        kind: "agent_player",
        player_id: String(claims.player_id),
        agent_id: String(claims.agent_id || `agent.${claims.player_id}`),
        identity_id: claims.sub ? String(claims.sub) : undefined,
        session_id: sessionIdFromClaims(claims.sid),
        controller_id: String(claims.controller_id),
        controller_type: "agent",
        issued_by: claims.issued_by === "admin" ? "admin" : undefined,
        operator_id: parseOperatorId(claims.operator_id),
        amr: claims.amr ? String(claims.amr) : undefined,
        jti: claims.jti ? String(claims.jti) : undefined,
        scopes: scopes.length ? scopes : [...DEFAULT_SCOPES],
        protocol_version: env.NOEMA_PROTOCOL_VERSION || "1",
        authentication_context: "controller_token",
      };
      if (env.WORLD_DO) {
        try {
          if (await isControllerRevoked(durableRevocationStore(env), principal.controller_id, principal.jti)) {
            return err("NOT_AUTHORIZED", "controller revoked", 401);
          }
        } catch {
          return err("UNAVAILABLE", "revocation store unavailable", 503);
        }
      }
      return principal;
    }
  } catch (e) {
    if (!(e instanceof JwtError)) throw e;
  }

  // Human Supabase JWT → HumanPrincipal (never a Player).
  // HS256: legacy JWT secret. ES256: JWKS at {SUPABASE_URL}/auth/v1/.well-known/jwks.json
  const jwtSecret = env.SUPABASE_JWT_SECRET;
  const supabaseUrl = (env.SUPABASE_URL || "").replace(/\/$/, "");
  if (jwtSecret || supabaseUrl) {
    try {
      const claims = await verifyJwt(token, {
        hs256Secret: jwtSecret,
        jwksUrl: supabaseUrl ? supabaseJwksUrl(supabaseUrl) : undefined,
        audience: "authenticated",
        issuer: supabaseUrl ? supabaseIssuer(supabaseUrl) : undefined,
      });
      const sub = claims.sub ? String(claims.sub) : "";
      if (!sub) return err("NOT_AUTHORIZED", "Supabase token missing sub");
      return humanPrincipalFromClaims(
        env,
        { ...claims, identity_id: sub, sid: claims.sid, amr: claims.amr, controller_type: "human" },
        "supabase_jwt",
      );
    } catch (e) {
      if (!(e instanceof JwtError)) throw e;
      return err("NOT_AUTHORIZED", `invalid token: ${e.message}`);
    }
  }

  // Explicit local/test/dev only: throwaway principal for Stage 0 demos.
  // Missing, preview, and production modes fail closed (same gate as /v1/auth/dev-token mint).
  if (isExplicitLocalDev(env)) {
    if (token === "dev" || token.startsWith("dev:")) {
      const handle = token === "dev" ? "dev-player" : token.slice(4) || "dev-player";
      const now = Math.floor(Date.now() / 1000);
      const player_id = `player.${handle}`;
      const controller_id = `ctrl.dev.${handle}`;
      const access = await mintHs256(
        {
          typ: "access",
          player_id,
          agent_id: `agent.${handle}`,
          controller_id,
          controller_type: "agent",
          scopes: DEFAULT_SCOPES,
          iat: now,
          exp: now + 3600,
          jti: crypto.randomUUID().slice(0, 8),
        },
        signing,
      );
      // If they sent "dev", still resolve principal; mint is for clients that want a real token later
      void access;
      return {
        kind: "agent_player",
        player_id,
        agent_id: `agent.${handle}`,
        session_id: newId("sess"),
        controller_id,
        controller_type: "agent",
        scopes: [...DEFAULT_SCOPES],
        protocol_version: env.NOEMA_PROTOCOL_VERSION || "1",
        authentication_context: "dev_token",
      };
    }
  }

  return err("NOT_AUTHORIZED", "invalid or unsupported access token");
}

export type MintControllerOptions = {
  handle: string;
  controllerType?: ControllerType;
  /** Seconds until expiry. Default 3600. Clamped 60 … 7d, or 30d when issuedByAdmin. */
  expiresIn?: number;
  /** Set when minted by ADMIN plane (audit claim only). */
  issuedByAdmin?: boolean;
  /** Opaque operator scope. Only stamped when issuedByAdmin is true. Never an email. */
  operatorId?: string;
  playerId?: string;
  identityId?: string;
  amr?: string;
  /** Stable Controller id. Device enroll supplies this; do not take it from the client. */
  controllerId?: string;
};

/**
 * Mint a controller access token.
 * Agents inhabit. Human tokens are identity (watch / CONNECT approve) and cannot command.
 * Production inhabit mint: ADMIN operator mint — not open dev-token.
 * Local/preview: also used by /v1/auth/dev-token.
 */
export async function mintHumanPlatformToken(
  env: Env,
  opts: {
    identityId: string;
    handle?: string;
    expiresIn?: number;
    amr?: string;
  },
): Promise<{
  access_token: string;
  identity_id: string;
  controller_type: "human";
  scopes: string[];
  expires_in: number;
  token_type: "bearer";
}> {
  const signing = env.TOKEN_SIGNING_SECRET;
  if (!signing) throw new Error("TOKEN_SIGNING_SECRET is not configured");
  const expires_in = Math.min(7 * 24 * 3600, Math.max(60, Math.floor(opts.expiresIn ?? 86400)));
  const now = Math.floor(Date.now() / 1000);
  const identity_id = opts.identityId;
  const claims: Record<string, unknown> = {
    typ: "platform",
    identity_id,
    sub: identity_id,
    controller_type: "human",
    scopes: HUMAN_PLATFORM_SCOPES,
    sid: newId("sess"),
    iat: now,
    exp: now + expires_in,
    jti: crypto.randomUUID().slice(0, 8),
  };
  if (opts.amr) claims.amr = opts.amr;
  if (opts.handle) claims.handle = opts.handle;
  const access_token = await mintHs256(claims, signing);
  return {
    access_token,
    identity_id,
    controller_type: "human",
    scopes: [...HUMAN_PLATFORM_SCOPES],
    expires_in,
    token_type: "bearer",
  };
}

export async function mintControllerToken(
  env: Env,
  opts: MintControllerOptions,
): Promise<{
  access_token: string;
  player_id: string;
  controller_id: string;
  agent_id: string;
  controller_type: ControllerType;
  identity_id?: string;
  scopes: string[];
  expires_in: number;
  token_type: "bearer";
}> {
  const handle =
    (opts.handle || "player").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "player";
  const requestedType = opts.controllerType || "agent";

  // RFC-0120 P3 (AGENT-ONLY-PLAYER-IDENTITY-PACKETS.md): New production/live Controller
  // credentials for inhabit are agent-only. Live mint human/hybrid REJECT.
  // Human platform principals (WATCH/CONNECT) use mintHumanPlatformToken directly.
  // Isolated/dev fixtures may still use agent (or legacy for test compat).
  if ((requestedType === "human" || requestedType === "hybrid") && !isExplicitLocalDev(env)) {
    throw new Error("live Controller issuance is agent-only (RFC-0120 P3; see docs/RFC0120-LIVE-IDENTITY-CONTINUATION-PLAN.md)");
  }

  if (requestedType === "human" || requestedType === "hybrid") {
    const platform = await mintHumanPlatformToken(env, {
      identityId: opts.identityId || `id.${handle}`,
      handle,
      expiresIn: opts.expiresIn,
      amr: opts.amr,
    });
    return {
      access_token: platform.access_token,
      player_id: "",
      controller_id: "",
      agent_id: "",
      controller_type: "human",
      identity_id: platform.identity_id,
      scopes: platform.scopes,
      expires_in: platform.expires_in,
      token_type: "bearer",
    };
  }
  const maxAge = opts.issuedByAdmin ? 30 * 24 * 3600 : 7 * 24 * 3600;
  const expires_in = Math.min(maxAge, Math.max(60, Math.floor(opts.expiresIn ?? 3600)));
  const signing = env.TOKEN_SIGNING_SECRET;
  if (!signing) {
    throw new Error("TOKEN_SIGNING_SECRET is not configured");
  }
  const player_id = opts.playerId
    ? (opts.playerId.startsWith("player.") ? opts.playerId : `player.${opts.playerId}`)
    : `player.${handle}`;
  const controller_id =
    opts.controllerId && /^ctrl\.[a-z0-9._-]{3,64}$/i.test(opts.controllerId)
      ? opts.controllerId
      : `ctrl.agent.${handle}`;
  const agent_id = `agent.${handle}`;
  const now = Math.floor(Date.now() / 1000);
  const sid = newId("sess");
  const claims: Record<string, unknown> = {
    typ: "access",
    player_id,
    agent_id,
    controller_id,
    controller_type: "agent",
    scopes: DEFAULT_SCOPES,
    sid,
    iat: now,
    exp: now + expires_in,
    jti: crypto.randomUUID().slice(0, 8),
  };
  if (opts.identityId) {
    claims.identity_id = opts.identityId;
    claims.sub = opts.identityId;
  }
  if (opts.amr) claims.amr = opts.amr;
  if (opts.issuedByAdmin) claims.issued_by = "admin";
  const operatorId = opts.issuedByAdmin ? parseOperatorId(opts.operatorId) : undefined;
  if (operatorId) claims.operator_id = operatorId;
  const access_token = await mintHs256(claims, signing);
  return {
    access_token,
    player_id,
    controller_id,
    agent_id,
    controller_type: "agent",
    scopes: [...DEFAULT_SCOPES],
    expires_in,
    token_type: "bearer",
  };
}

/** @deprecated use mintControllerToken — kept for call-site clarity on dev path */
export async function mintDevControllerToken(
  env: Env,
  handle: string,
  controllerType: ControllerType = "agent",
): Promise<{ access_token: string; player_id: string; controller_id: string; agent_id: string; scopes: string[] }> {
  const m = await mintControllerToken(env, { handle, controllerType, issuedByAdmin: false });
  return {
    access_token: m.access_token,
    player_id: m.player_id,
    controller_id: m.controller_id,
    agent_id: m.agent_id,
    scopes: m.scopes,
  };
}

export function requireScope(principal: PlayerPrincipal, scope: string): Response | null {
  if (principal.scopes.length && !principal.scopes.includes(scope)) {
    return err("NOT_AUTHORIZED", `missing scope ${scope}`, 403);
  }
  return null;
}

/** Humans watch. Only agent Controllers inhabit / command the world. */
export const HUMAN_WATCH_MESSAGE = "Agents play this world. Humans watch.";

export function denyNonAgentPlay(principal: Principal): Response | null {
  if (isHumanPrincipal(principal)) return err("NOT_AUTHORIZED", HUMAN_WATCH_MESSAGE, 403);
  if (isAgentPlayerPrincipal(principal) && principal.controller_type === "agent") return null;
  return err("NOT_AUTHORIZED", HUMAN_WATCH_MESSAGE, 403);
}

/** Narrow to an Agent Player or return the inhabit refusal. */
export function requireAgentPlayer(principal: Principal): PlayerPrincipal | Response {
  const denied = denyNonAgentPlay(principal);
  if (denied) return denied;
  if (!isAgentPlayerPrincipal(principal)) return err("NOT_AUTHORIZED", HUMAN_WATCH_MESSAGE, 403);
  return principal;
}

/** Message for dead/retired/suspended players attempting inhabiting actions. */
export const PLAYER_DEAD_MESSAGE = "Player is dead, retired, or suspended and cannot perform inhabiting actions.";

/**
 * Require that the Agent Player is "live" (not dead/retired/suspended).
 *
 * DEPRECATED STRING HOOK: The string-based check has been removed/weakened.
 * Liveness is now primarily enforced in the WORLD_DO (/command handler)
 * by consulting the player ledger (world.players[player_id]).
 *
 * The gateway calls this for early belt-and-suspenders, but the authoritative
 * rejection (PLAYER_DEAD) comes from the DO when the player record is missing
 * or marked dead/retired/suspended.
 */
export function requireLivePlayer(principal: PlayerPrincipal): PlayerPrincipal | Response {
  // Pass-through: no string hook.
  // Real/dead checks live in world-do.ts and the conformance harness mock.
  return principal;
}
