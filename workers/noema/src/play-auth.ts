/**
 * Player email magic-link auth — separate from ADMIN sessions.
 * No admin allowlist; public play path.
 */

import {
  type AdminFetch,
  LoginThrottle,
  clientIp,
  loginRedirectOrigin,
  normalizeEmail,
} from "./admin-auth";
import { err, json } from "./auth";
import type { Env } from "./types";

export const GENERIC_PLAY_LOGIN_MESSAGE =
  "If that mailbox can play, a link is on the way.";

export const playLoginThrottle = new LoginThrottle();

export async function requestPlayMagicLink(
  env: Env,
  req: Request,
  body: { email?: string },
  opts?: { fetch?: AdminFetch; throttle?: LoginThrottle },
): Promise<Response> {
  const email = normalizeEmail(String(body.email || ""));
  if (!email) return err("INVALID_REQUEST", "email required", 400);

  const throttle = opts?.throttle || playLoginThrottle;
  const ip = clientIp(req);
  if (!throttle.hit(`ip:${ip}`) || !throttle.hit(`email:${email}`)) {
    return err("RATE_LIMITED", "too many login requests", 429, true);
  }

  const fetchImpl = opts?.fetch || (globalThis.fetch as AdminFetch);
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const origin = loginRedirectOrigin(env, req);
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
            email_redirect_to: `${origin}/play/callback`,
            should_create_user: true,
          },
        }),
      });
      if (!res.ok) console.error("play magic-link send failed");
    } catch {
      console.error("play magic-link send failed");
    }
  }

  return json({ ok: true, message: GENERIC_PLAY_LOGIN_MESSAGE });
}
