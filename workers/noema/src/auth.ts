import { JwtError, mintHs256, supabaseIssuer, supabaseJwksUrl, verifyHs256, verifyJwt } from "./jwt";
import type { ControllerType, Env, PlayerPrincipal } from "./types";

const DEFAULT_SCOPES = [
  "noema.player.read",
  "noema.world.observe",
  "noema.action.submit",
];

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
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function err(code: string, message: string, status = 401, retryable = false): Response {
  return json({ error: { code, message, retryable } }, status);
}

/** Resolve PlayerPrincipal from controller access token or Supabase human JWT. */
export async function resolvePrincipal(req: Request, env: Env): Promise<PlayerPrincipal | Response> {
  const token = bearer(req);
  if (!token) return err("NOT_AUTHORIZED", "Bearer token required");

  const signing = env.TOKEN_SIGNING_SECRET;
  if (!signing) return err("NOT_AUTHORIZED", "TOKEN_SIGNING_SECRET is not configured", 503);
  // Prefer Noema controller tokens
  try {
    const claims = await verifyHs256(token, signing);
    if (claims.typ === "access" && claims.player_id && claims.controller_id) {
      const scopes = Array.isArray(claims.scopes)
        ? (claims.scopes as string[])
        : DEFAULT_SCOPES;
      const ctype = String(claims.controller_type || "agent") as ControllerType;
      return {
        player_id: String(claims.player_id),
        agent_id: String(claims.agent_id || `agent.${claims.player_id}`),
        identity_id: claims.sub ? String(claims.sub) : undefined,
        session_id: sessionIdFromClaims(claims.sid),
        controller_id: String(claims.controller_id),
        controller_type: ctype === "human" || ctype === "hybrid" ? ctype : "agent",
        issued_by: claims.issued_by === "admin" ? "admin" : undefined,
        amr: claims.amr ? String(claims.amr) : undefined,
        scopes,
        protocol_version: env.NOEMA_PROTOCOL_VERSION || "1",
        authentication_context: "controller_token",
      };
    }
  } catch (e) {
    if (!(e instanceof JwtError)) throw e;
  }

  // Human Supabase JWT → ephemeral Player principal (never ADMIN).
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
      const handle = String(claims.email || sub).split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 32) || "player";
      return {
        player_id: `player.${sub.replace(/-/g, "").slice(0, 12)}`,
        agent_id: `agent.${handle}`,
        identity_id: sub,
        session_id: newId("sess"),
        controller_id: `ctrl.browser.${sub.slice(0, 8)}`,
        controller_type: "human",
        scopes: [...DEFAULT_SCOPES],
        protocol_version: env.NOEMA_PROTOCOL_VERSION || "1",
        authentication_context: "supabase_jwt",
      };
    } catch (e) {
      if (!(e instanceof JwtError)) throw e;
      return err("NOT_AUTHORIZED", `invalid token: ${e.message}`);
    }
  }

  // Local/dev only: issue a throwaway principal for Stage 0 demos
  if ((env.NOEMA_ENV || "local") === "local" || env.NOEMA_ENV === "test" || env.NOEMA_ENV === "dev") {
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
          controller_type: "human",
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
        player_id,
        agent_id: `agent.${handle}`,
        session_id: newId("sess"),
        controller_id,
        controller_type: "human",
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
  /** Seconds until expiry. Default 3600. Clamped 60 … 7 days. */
  expiresIn?: number;
  /** Set when minted by ADMIN plane (audit claim only). */
  issuedByAdmin?: boolean;
  playerId?: string;
  identityId?: string;
  amr?: string;
  /** Stable Controller id. Device enroll supplies this; do not take it from the client. */
  controllerId?: string;
};

/**
 * Mint a controller access token for a Player (human or agent Controller).
 * Production: only via ADMIN operator mint — not open dev-token.
 * Local/preview: also used by /v1/auth/dev-token.
 */
export async function mintControllerToken(
  env: Env,
  opts: MintControllerOptions,
): Promise<{
  access_token: string;
  player_id: string;
  controller_id: string;
  agent_id: string;
  controller_type: ControllerType;
  scopes: string[];
  expires_in: number;
  token_type: "bearer";
}> {
  const handle =
    (opts.handle || "player").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "player";
  const controllerType: ControllerType =
    opts.controllerType === "human" || opts.controllerType === "hybrid"
      ? opts.controllerType
      : "agent";
  const expires_in = Math.min(
    7 * 24 * 3600,
    Math.max(60, Math.floor(opts.expiresIn ?? 3600)),
  );
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
      : `ctrl.${controllerType}.${handle}`;
  const agent_id = `agent.${handle}`;
  const now = Math.floor(Date.now() / 1000);
  const sid = newId("sess");
  const claims: Record<string, unknown> = {
    typ: "access",
    player_id,
    agent_id,
    controller_id,
    controller_type: controllerType,
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
  const access_token = await mintHs256(claims, signing);
  return {
    access_token,
    player_id,
    controller_id,
    agent_id,
    controller_type: controllerType,
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
