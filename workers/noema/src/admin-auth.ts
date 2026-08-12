/**
 * ADMIN control plane auth — separate from Player sessions.
 * Specs: PLATFORM.md · AUTH-AND-IDENTITY.md · GENESIS.md
 * Admin privilege is never inherited by a Player session.
 */

import { err, json } from "./auth";
import { JwtError, mintHs256, verifyHs256 } from "./jwt";
import type { AdminPrincipal, Env } from "./types";

const ADMIN_SCOPES = ["noema.world.admin", "noema.simulation.admin"];

function bearer(req: Request): string | null {
  const h = req.headers.get("Authorization") || "";
  if (h.toLowerCase().startsWith("bearer ")) return h.slice(7).trim() || null;
  return req.headers.get("X-Noema-Admin-Token");
}

function signingSecret(env: Env): string {
  return env.TOKEN_SIGNING_SECRET || "dev-token-secret-change-me";
}

/** Operator token gate. Returns null if admin is not configured. */
export function adminTokenConfigured(env: Env): boolean {
  return Boolean(env.ADMIN_OPERATOR_TOKEN && env.ADMIN_OPERATOR_TOKEN.length >= 8);
}

export async function mintAdminSession(
  env: Env,
  operatorToken: string,
): Promise<{ access_token: string; session_id: string; role: "ADMIN"; expires_in: number } | Response> {
  if (!adminTokenConfigured(env)) {
    return err("NOT_CONFIGURED", "ADMIN_OPERATOR_TOKEN not set on this host", 503);
  }
  // Constant-time-ish compare
  const expected = env.ADMIN_OPERATOR_TOKEN!;
  if (operatorToken.length !== expected.length) {
    return err("NOT_AUTHORIZED", "invalid operator token", 401);
  }
  let ok = 0;
  for (let i = 0; i < expected.length; i++) {
    ok |= operatorToken.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (ok !== 0) return err("NOT_AUTHORIZED", "invalid operator token", 401);

  const session_id = `asess.${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const now = Math.floor(Date.now() / 1000);
  const expires_in = 3600;
  const access_token = await mintHs256(
    {
      typ: "admin-access",
      role: "ADMIN",
      session_id,
      scopes: ADMIN_SCOPES,
      iat: now,
      exp: now + expires_in,
      jti: crypto.randomUUID(),
    },
    signingSecret(env),
  );
  return { access_token, session_id, role: "ADMIN", expires_in };
}

export async function resolveAdmin(req: Request, env: Env): Promise<AdminPrincipal | Response> {
  const token = bearer(req);
  if (!token) return err("NOT_AUTHORIZED", "ADMIN bearer token required", 401);

  try {
    const claims = await verifyHs256(token, signingSecret(env));
    if (claims.typ !== "admin-access" || claims.role !== "ADMIN") {
      return err("NOT_AUTHORIZED", "not an ADMIN session — use operator login", 403);
    }
    const scopes = Array.isArray(claims.scopes) ? (claims.scopes as string[]) : ADMIN_SCOPES;
    if (!scopes.includes("noema.world.admin")) {
      return err("NOT_AUTHORIZED", "missing noema.world.admin scope", 403);
    }
    return {
      role: "ADMIN",
      session_id: String(claims.session_id || "asess.unknown"),
      scopes,
      authentication_context: "operator_token",
    };
  } catch (e) {
    if (e instanceof JwtError) return err("NOT_AUTHORIZED", e.message, 401);
    throw e;
  }
}

export { json, err };
