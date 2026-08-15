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
import { err, json, mintControllerToken } from "./auth";
import {
  composePlayMail,
  extractHashedToken,
  PLAY_MAIL_FROM,
  playMagicLinkHref,
  type PlayMailer,
} from "./play-mail";
import { sendPostmarkEmail } from "./postmark";
import type { Env } from "./types";

export const GENERIC_PLAY_LOGIN_MESSAGE =
  "If that mailbox can play, a link is on the way.";

export const playLoginThrottle = new LoginThrottle();

export async function requestPlayMagicLink(
  env: Env,
  req: Request,
  body: { email?: string },
  opts?: { fetch?: AdminFetch; throttle?: LoginThrottle; sendPlay?: PlayMailer; mailFetch?: typeof fetch },
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
      const canPostmark = Boolean(opts?.sendPlay || env.POSTMARK_SERVER_TOKEN);
      let sent = false;
      if (canPostmark) {
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
            options: { redirect_to: `${origin}/play/callback` },
          }),
        });
        const payload = await res.json().catch(() => ({}));
        const extracted = extractHashedToken(payload);
        if (res.ok && extracted) {
          const href = playMagicLinkHref(origin, extracted.token, extracted.type);
          const mail = composePlayMail(email, href);
          const send =
            opts?.sendPlay ||
            ((m) =>
              sendPostmarkEmail(env, {
                from: PLAY_MAIL_FROM,
                to: m.to,
                subject: m.subject,
                html: m.html,
                text: m.text,
                tag: "play-magic-link",
              }, opts?.mailFetch));
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
              email_redirect_to: `${origin}/play/callback`,
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
  | { access_token: string; player_id: string; controller_type: "human"; expires_in: number }
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
  const handle = email ? email.split("@")[0] : "player";
  const compact = id.replace(/-/g, "").slice(0, 12);

  const minted = await mintControllerToken(env, {
    handle,
    controllerType: "human",
    expiresIn: 86400,
    playerId: `player.${compact}`,
    identityId: id,
    amr: "email_magic_link",
  });

  return {
    access_token: minted.access_token,
    player_id: minted.player_id,
    controller_type: "human",
    expires_in: minted.expires_in,
  };
}
