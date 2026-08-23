/**
 * ADMIN control plane auth — separate from Player sessions.
 * Specs: PLATFORM.md · AUTH-AND-IDENTITY.md · GENESIS.md
 * Admin privilege is never inherited by a Player session.
 */

import {
  type AdminMailer,
  composeAdminMail,
  deliverAdminMail,
  adminMagicLinkHref,
  extractHashedToken,
} from "./admin-mail";
import { err, json } from "./auth";
import { hasTransactionalProvider } from "./email-provider";
import { JwtError, mintHs256, verifyHs256 } from "./jwt";
import { parseOperatorId, SHARED_TOKEN_OPERATOR_ID } from "./ops";
import { SlidingWindowThrottle, allowLoginThrottled } from "./rate-limit";
import type { AdminPrincipal, Env } from "./types";

const ADMIN_SCOPES = ["noema.world.admin", "noema.simulation.admin"];

function bearer(req: Request): string | null {
  const h = req.headers.get("Authorization") || "";
  if (h.toLowerCase().startsWith("bearer ")) return h.slice(7).trim() || null;
  return req.headers.get("X-Noema-Admin-Token");
}

function signingSecret(env: Env): string {
  const secret = env.TOKEN_SIGNING_SECRET;
  if (!secret) throw new Error("TOKEN_SIGNING_SECRET is not configured");
  return secret;
}

/** Operator token gate. Returns null if admin is not configured. */
export function adminTokenConfigured(env: Env): boolean {
  return Boolean(env.ADMIN_OPERATOR_TOKEN && env.ADMIN_OPERATOR_TOKEN.length >= 8);
}

/** Opaque per-mailbox operator id. Never put the email on the JWT. */
export async function operatorIdForEmail(email: string): Promise<string> {
  const bytes = new TextEncoder().encode(email.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `op.mail.${hex.slice(0, 16)}`;
}

function operatorIdFromClaims(
  claims: Record<string, unknown>,
  amr: AdminPrincipal["authentication_context"],
): string {
  return parseOperatorId(claims.operator_id) || (amr === "email_magic_link" ? "op.legacy" : SHARED_TOKEN_OPERATOR_ID);
}

async function mintAdminAccess(
  env: Env,
  amr: "operator_token" | "email_magic_link",
  operatorId: string,
): Promise<{ access_token: string; session_id: string; role: "ADMIN"; expires_in: number } | Response> {
  let signing: string;
  try {
    signing = signingSecret(env);
  } catch {
    return err("NOT_AUTHORIZED", "TOKEN_SIGNING_SECRET is not configured", 503);
  }
  const session_id = `asess.${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const now = Math.floor(Date.now() / 1000);
  const expires_in = 3600;
  const access_token = await mintHs256(
    {
      typ: "admin-access",
      role: "ADMIN",
      session_id,
      scopes: ADMIN_SCOPES,
      amr,
      operator_id: operatorId,
      iat: now,
      exp: now + expires_in,
      jti: crypto.randomUUID(),
    },
    signing,
  );
  return { access_token, session_id, role: "ADMIN", expires_in };
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

  return mintAdminAccess(env, "operator_token", SHARED_TOKEN_OPERATOR_ID);
}

async function adminFromSignedToken(token: string, env: Env): Promise<AdminPrincipal | Response> {
  let signing: string;
  try {
    signing = signingSecret(env);
  } catch {
    return err("NOT_AUTHORIZED", "TOKEN_SIGNING_SECRET is not configured", 503);
  }
  try {
    const claims = await verifyHs256(token, signing);
    if (claims.typ !== "admin-access" || claims.role !== "ADMIN") {
      return err("NOT_AUTHORIZED", "not an ADMIN session — use operator login", 403);
    }
    const scopes = Array.isArray(claims.scopes) ? (claims.scopes as string[]) : ADMIN_SCOPES;
    if (!scopes.includes("noema.world.admin")) {
      return err("NOT_AUTHORIZED", "missing noema.world.admin scope", 403);
    }
    const amr = claims.amr === "email_magic_link" ? "email_magic_link" : "operator_token";
    return {
      role: "ADMIN",
      session_id: String(claims.session_id || "asess.unknown"),
      scopes,
      authentication_context: amr,
      operator_id: operatorIdFromClaims(claims, amr),
    };
  } catch (e) {
    if (e instanceof JwtError) return err("NOT_AUTHORIZED", e.message, 401);
    throw e;
  }
}

export async function resolveAdmin(req: Request, env: Env): Promise<AdminPrincipal | Response> {
  const token = bearer(req);
  if (!token) return err("NOT_AUTHORIZED", "ADMIN bearer token required", 401);
  return adminFromSignedToken(token, env);
}

/** Dual-auth operator path: signed admin JWT from X-Noema-Admin-Token only. */
export async function resolveSignedAdminHeader(req: Request, env: Env): Promise<AdminPrincipal | Response> {
  const token = (req.headers.get("X-Noema-Admin-Token") || "").trim();
  if (!token) return err("NOT_AUTHORIZED", "X-Noema-Admin-Token required", 401);
  return adminFromSignedToken(token, env);
}

export const GENERIC_LOGIN_MESSAGE =
  "If that mailbox is authorized, a link is on the way.";

/** Human operator mailbox. Always allowed; secret may add extras. */
export const ADMIN_OPERATOR_EMAIL = "zer0state@zer0state.com";

/** Dedicated Admin-agent mailbox. Always allowed so consume cannot depend on the secret alone. */
export const ADMIN_AGENT_OPERATOR_EMAIL = "boof@agentmail.to";

/** Partner operator mailbox (Prabu). Admin control-plane only — never a Player. */
export const ADMIN_PARTNER_OPERATOR_EMAIL = "prabu.openclaw@gmail.com";

export const LOCKED_ADMIN_EMAILS = [
  ADMIN_OPERATOR_EMAIL,
  ADMIN_AGENT_OPERATOR_EMAIL,
  ADMIN_PARTNER_OPERATOR_EMAIL,
] as const;

export function parseAllowlist(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.includes("@"));
}

export function adminAllowlist(env: Env): string[] {
  const extra = parseAllowlist(env.ADMIN_ALLOWLIST_EMAILS);
  const locked = LOCKED_ADMIN_EMAILS.map((email) => email.toLowerCase());
  return Array.from(new Set([...locked, ...extra]));
}

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email || !email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
    return null;
  }
  return email;
}

export function clientIp(req: Request): string {
  return req.headers.get("CF-Connecting-IP")?.trim() || "0.0.0.0";
}

export class LoginThrottle extends SlidingWindowThrottle {
  constructor(limit = 5, windowMs = 3_600_000) {
    super(limit, windowMs);
  }
}

export type AdminFetch = (input: string, init?: RequestInit) => Promise<Response>;

export const adminLoginThrottle = new LoginThrottle();

export function loginRedirectOrigin(env: Env, req: Request): string {
  if ((env.NOEMA_ENV || "").toLowerCase() === "production") return "https://noema.guru";
  try {
    return new URL(req.url).origin;
  } catch {
    return "http://127.0.0.1:8787";
  }
}

export async function requestAdminMagicLink(
  env: Env,
  req: Request,
  body: { email?: string },
  opts?: { fetch?: AdminFetch; throttle?: LoginThrottle; sendAdmin?: AdminMailer; mailFetch?: typeof fetch },
): Promise<Response> {
  const email = normalizeEmail(String(body.email || ""));
  if (!email) return err("INVALID_REQUEST", "email required", 400);

  const throttle = opts?.throttle || adminLoginThrottle;
  const ip = clientIp(req);
  if (!(await allowLoginThrottled(throttle, env, ip, email))) {
    return err("RATE_LIMITED", "too many login requests", 429, true);
  }

  const allow = adminAllowlist(env);
  const fetchImpl = opts?.fetch || (globalThis.fetch as AdminFetch);
  if (allow.includes(email) && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const origin = loginRedirectOrigin(env, req);
      const canWorkerSend = Boolean(opts?.sendAdmin || hasTransactionalProvider(env) || env.ADMIN_MAIL);
      let sent = false;
      if (canWorkerSend) {
        const res = await fetchImpl(`${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/admin/generate_link`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            type: "magiclink",
            email,
            options: { redirect_to: `${origin}/admin/callback` },
          }),
        });
        const payload = await res.json().catch(() => ({}));
        const extracted = extractHashedToken(payload);
        console.log(
          "admin-mail generate_link",
          res.status,
          extracted ? "token=yes" : "token=no",
          payload && typeof payload === "object" ? Object.keys(payload as object).join(",") : "",
        );
        if (res.ok && extracted) {
          const href = adminMagicLinkHref(origin, extracted.token, extracted.type);
          const mail = composeAdminMail(href, email);
          const send = opts?.sendAdmin || ((m) => deliverAdminMail(env, m, opts?.mailFetch));
          try {
            await send(mail);
            sent = true;
          } catch (e) {
            console.error("admin provider delivery failed", e instanceof Error ? e.message : "error");
          }
        } else {
          console.error("admin generate_link failed", res.status);
        }
      }
      if (!sent) {
        const res = await fetchImpl(`${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/otp`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            email,
            create_user: true,
            options: {
              email_redirect_to: `${origin}/admin/callback`,
              should_create_user: true,
            },
          }),
        });
        if (!res.ok) console.error("admin magic-link send failed", res.status);
      }
    } catch (e) {
      console.error("admin magic-link send failed", e instanceof Error ? e.message : "error");
    }
  }

  return json({ ok: true, message: GENERIC_LOGIN_MESSAGE });
}

export async function consumeAdminMagicLink(
  env: Env,
  body: { token_hash?: string; type?: string; code?: string },
  opts?: { fetch?: AdminFetch },
): Promise<{ access_token: string; session_id: string; role: "ADMIN"; expires_in: number } | Response> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return err("NOT_CONFIGURED", "Supabase auth is not configured", 503);
  }
  const token_hash = (body.token_hash || "").trim();
  const code = (body.code || "").trim();
  if (!token_hash && !code) return err("INVALID_REQUEST", "token_hash or code required", 400);

  const fetchImpl = opts?.fetch || (globalThis.fetch as AdminFetch);
  const base = env.SUPABASE_URL.replace(/\/$/, "");
  const headers = {
    "content-type": "application/json",
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };

  let upstream: Response;
  try {
    if (token_hash) {
      const typ = body.type === "email" ? "email" : "magiclink";
      upstream = await fetchImpl(`${base}/auth/v1/verify`, {
        method: "POST",
        headers,
        body: JSON.stringify({ type: typ, token_hash }),
      });
    } else {
      upstream = await fetchImpl(`${base}/auth/v1/token?grant_type=authorization_code`, {
        method: "POST",
        headers,
        body: JSON.stringify({ auth_code: code, code }),
      });
    }
  } catch {
    return err("UPSTREAM", "auth provider unavailable", 502);
  }
  if (!upstream.ok) {
    if (upstream.status >= 400 && upstream.status <= 499) {
      return err("NOT_AUTHORIZED", "invalid operator token", 401);
    }
    return err("UPSTREAM", "auth provider rejected the link", 502);
  }

  const payload = (await upstream.json().catch(() => ({}))) as {
    user?: { email?: string };
    email?: string;
  };
  const email = normalizeEmail(String(payload.user?.email || payload.email || ""));
  if (!email) return err("NOT_AUTHORIZED", "invalid operator token", 401);
  if (!adminAllowlist(env).includes(email)) {
    return err("NOT_AUTHORIZED", "invalid operator token", 401);
  }
  return mintAdminAccess(env, "email_magic_link", await operatorIdForEmail(email));
}

export { json, err };
