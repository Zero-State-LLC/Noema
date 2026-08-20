/**
 * Human platform magic-link — WATCH/CONNECT identity, not inhabit.
 * No admin allowlist. Separate from ADMIN sessions.
 */

import {
  type AdminFetch,
  LoginThrottle,
  clientIp,
  loginRedirectOrigin,
  normalizeEmail,
} from "./admin-auth";
import { err, json, mintHumanPlatformToken } from "./auth";
import { allowLoginThrottled } from "./rate-limit";
import {
  composePlayMail,
  extractHashedToken,
  PLAY_MAIL_FROM,
  playMagicLinkHref,
  safePlayNext,
  type PlayMailer,
} from "./play-mail";
import { sendTransactionalEmail } from "./email-provider";
import type { Env } from "./types";

export const GENERIC_PLAY_LOGIN_MESSAGE =
  "If that mailbox can play, a link is on the way.";

export function playHandleFromEmail(email: string | null | undefined): string {
  const raw = String(email || "")
    .split("@")[0]
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 32);
  return raw.length >= 2 ? raw : "player";
}

export const playLoginThrottle = new LoginThrottle();

export async function requestPlayMagicLink(
  env: Env,
  req: Request,
  body: { email?: string; next?: string },
  opts?: { fetch?: AdminFetch; throttle?: LoginThrottle; sendPlay?: PlayMailer; mailFetch?: typeof fetch },
): Promise<Response> {
  const email = normalizeEmail(String(body.email || ""));
  if (!email) return err("INVALID_REQUEST", "email required", 400);
  const next = safePlayNext(body.next);

  const throttle = opts?.throttle || playLoginThrottle;
  const ip = clientIp(req);
  if (!(await allowLoginThrottled(throttle, env, ip, email))) {
    return err("RATE_LIMITED", "too many login requests", 429, true);
  }

  const fetchImpl = opts?.fetch || (globalThis.fetch as AdminFetch);
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const origin = loginRedirectOrigin(env, req);
      const callback = next ? `${origin}/play/callback?next=${encodeURIComponent(next)}` : `${origin}/play/callback`;
      const canProvider = Boolean(opts?.sendPlay || env.RESEND_API_KEY);
      let sent = false;
      if (canProvider) {
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
            options: { redirect_to: callback },
          }),
        });
        const payload = await res.json().catch(() => ({}));
        const extracted = extractHashedToken(payload);
        if (res.ok && extracted) {
          const href = playMagicLinkHref(origin, extracted.token, extracted.type, next);
          const mail = composePlayMail(email, href);
          const send =
            opts?.sendPlay ||
            ((m) =>
              sendTransactionalEmail(env, {
                from: PLAY_MAIL_FROM,
                to: m.to,
                subject: m.subject,
                html: m.html,
                text: m.text,
                tag: "play-magic-link",
              }, opts?.mailFetch).then(() => undefined));
          try {
            await send(mail);
            sent = true;
          } catch (e) {
            console.error("play provider delivery failed", e instanceof Error ? e.message : "error");
          }
        } else {
          console.error("play generate_link failed", res.status);
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
              email_redirect_to: callback,
              should_create_user: true,
            },
          }),
        });
        if (!res.ok) console.error("play magic-link send failed");
      }
    } catch {
      console.error("play magic-link send failed");
    }
  }

  return json({ ok: true, message: GENERIC_PLAY_LOGIN_MESSAGE });
}

export async function consumePlayMagicLink(
  env: Env,
  body: { token_hash?: string; type?: string; code?: string },
  opts?: { fetch?: AdminFetch },
): Promise<
  | { access_token: string; identity_id: string; handle: string; controller_type: "human"; expires_in: number }
  | Response
> {
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
      return err("NOT_AUTHORIZED", "invalid play token", 401);
    }
    return err("UPSTREAM", "auth provider rejected the link", 502);
  }

  const payload = (await upstream.json().catch(() => ({}))) as {
    user?: { id?: string; sub?: string; email?: string };
    email?: string;
    sub?: string;
  };
  const id = String(payload.user?.id || payload.user?.sub || payload.sub || "").trim();
  if (!id) return err("NOT_AUTHORIZED", "invalid play token", 401);

  const email = normalizeEmail(String(payload.user?.email || payload.email || ""));
  const handle = playHandleFromEmail(email);

  const minted = await mintHumanPlatformToken(env, {
    identityId: id,
    handle,
    expiresIn: 86400,
    amr: "email_magic_link",
  });

  return {
    access_token: minted.access_token,
    identity_id: minted.identity_id,
    handle,
    controller_type: "human",
    expires_in: minted.expires_in,
  };
}
