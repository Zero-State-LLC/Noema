import { JwtError, mintHs256, verifyHs256 } from "./jwt";
import type { ControllerType, Env, PlayerPrincipal } from "./types";

const DEFAULT_SCOPES = [
  "noema.player.read",
  "noema.world.observe",
  "noema.action.submit",
];

function newId(prefix: string): string {
  return `${prefix}.${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
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

export function err(code: string, message: string, status = 401): Response {
  return json({ error: { code, message, retryable: false } }, status);
}

/** Resolve PlayerPrincipal from controller access token or Supabase human JWT. */
export async function resolvePrincipal(req: Request, env: Env): Promise<PlayerPrincipal | Response> {
  const token = bearer(req);
  if (!token) return err("NOT_AUTHORIZED", "Bearer token required");

  const signing = env.TOKEN_SIGNING_SECRET || "dev-token-secret-change-me";
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
        session_id: newId("sess"),
        controller_id: String(claims.controller_id),
        controller_type: ctype === "human" || ctype === "hybrid" ? ctype : "agent",
        scopes,
        protocol_version: env.NOEMA_PROTOCOL_VERSION || "1",
        authentication_context: "controller_token",
      };
    }
  } catch (e) {
    if (!(e instanceof JwtError)) throw e;
  }

  // Human Supabase JWT → ephemeral principal (full bind is Python/Supabase path)
  const jwtSecret = env.SUPABASE_JWT_SECRET;
  if (jwtSecret) {
    try {
      let claims: Record<string, unknown>;
      try {
        claims = await verifyHs256(token, jwtSecret, { audience: "authenticated" });
      } catch {
        claims = await verifyHs256(token, jwtSecret);
      }
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

/** Mint a Stage-0 controller access token (local/dev helper). */
export async function mintDevControllerToken(
  env: Env,
  handle: string,
  controllerType: ControllerType = "agent",
): Promise<{ access_token: string; player_id: string; controller_id: string; agent_id: string; scopes: string[] }> {
  const signing = env.TOKEN_SIGNING_SECRET || "dev-token-secret-change-me";
  const player_id = `player.${handle}`;
  const controller_id = `ctrl.${controllerType}.${handle}`;
  const agent_id = `agent.${handle}`;
  const now = Math.floor(Date.now() / 1000);
  const access_token = await mintHs256(
    {
      typ: "access",
      player_id,
      agent_id,
      controller_id,
      controller_type: controllerType,
      scopes: DEFAULT_SCOPES,
      iat: now,
      exp: now + 3600,
      jti: crypto.randomUUID().slice(0, 8),
    },
    signing,
  );
  return { access_token, player_id, controller_id, agent_id, scopes: [...DEFAULT_SCOPES] };
}

export function requireScope(principal: PlayerPrincipal, scope: string): Response | null {
  if (principal.scopes.length && !principal.scopes.includes(scope)) {
    return err("NOT_AUTHORIZED", `missing scope ${scope}`, 403);
  }
  return null;
}
