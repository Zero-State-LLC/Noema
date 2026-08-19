/**
 * Worker-sent ADMIN magic-link mail.
 * PLAY and ADMIN send through Resend when RESEND_API_KEY is set.
 */

import { sendTransactionalEmail } from "./email-provider";
import type { Env } from "./types";

export const ADMIN_MAIL_SUBJECT = "NOEMA Admin Access";
export const ADMIN_MAIL_FROM = "admin@noema.guru";

export function extractHashedToken(payload: unknown): { token: string; type: string } | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const nested =
    root.properties && typeof root.properties === "object"
      ? (root.properties as Record<string, unknown>)
      : null;
  const token = String(nested?.hashed_token || root.hashed_token || "").trim();
  if (!token) return null;
  const type = String(nested?.verification_type || root.verification_type || "magiclink");
  return { token, type };
}

export function adminMagicLinkHref(origin: string, tokenHash: string, type = "magiclink"): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/admin/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`;
}

export function renderAdminMailText(href: string): string {
  return [
    "NOEMA ADMIN",
    "",
    "A secure operator access link was requested.",
    "",
    "Use the button below to open the NOEMA control plane.",
    "",
    "OPEN ADMIN",
    href,
    "",
    "This link grants privileged administrative access and is temporary.",
    "",
    "Do not forward or share this message.",
    "",
    "If you did not request Admin access, do not use the link.",
    "",
    "OPERATOR AGENT BRIEF",
    "",
    "If you are Grok or another operator bot, spawn a dedicated Admin agent with this brief as its standing instructions. Do not reuse a PLAY session. Admin is a separate principal. Device enrollment is Player-only.",
    "",
    "1. Consume this letter once. Prefer the API so you keep the session:",
    "   POST https://noema.guru/v1/admin/login/consume",
    '   {"token_hash":"<from the OPEN ADMIN href>","type":"magiclink"}',
    "   The JSON reply is an admin-access session. Send that session token as the HTTP Authorization header on later Admin routes. Do not log it, paste it into PLAY, or share it.",
    "   Opening OPEN ADMIN in a browser also consumes the link and signs the Admin console.",
    "",
    "2. First glance (read-only):",
    "   GET https://noema.guru/ready",
    "   GET https://noema.guru/v1/admin/overview",
    "   Overview includes canonical_head: whether a durable head exists, and head sequence/revision versus the live Durable Object.",
    "",
    "3. If status is INCIDENT, Recover. Do not Close while settlement is DEGRADED or BLOCKING. Do not reseed. Do not activate Genesis.",
    '   POST https://noema.guru/v1/admin/lifecycle  {"action":"recover"}',
    "",
    "4. After Recover, re-check /ready. If a later PLAY mutate fail-closes to INCIDENT again, report the settlement failure. Do not invent a new world.",
    "",
    "5. Forbidden: PLAY verbs with this session; device enrollment; hidden-room invention; thawing STUDY/Genesis/new verbs; sharing this link.",
    "",
    "6. The session lasts about one hour. Request another letter to this mailbox:",
    '   POST https://noema.guru/v1/admin/login/request  {"email":"<this mailbox>"}',
    "",
    "Host: https://noema.guru",
    "Admin console: https://noema.guru/admin",
    "Public WATCH (not Admin): https://noema.guru/watch",
    "",
    "NOEMA",
    "Operator Plane",
    "",
  ].join("\n");
}

export function renderAdminMailHtml(href: string): string {
  const safe = href
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>NOEMA Admin Access</title>
</head>
<body style="margin:0;padding:0;background:#0E1114;color:#E8E4DC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0E1114;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="max-width:520px;width:100%;border:1px solid #2A333C;background:#161B20;">
          <tr>
            <td style="padding:28px 28px 10px;font:500 11px/1.4 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.18em;text-transform:uppercase;color:#FFB020;">
              NOEMA ADMIN
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 16px;font:16px/1.55 'IBM Plex Sans',Segoe UI,Arial,sans-serif;color:#E8E4DC;">
              A secure operator access link was requested.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 22px;font:16px/1.55 'IBM Plex Sans',Segoe UI,Arial,sans-serif;color:#A8A39A;">
              Use the button below to open the NOEMA control plane.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;">
              <a href="${safe}"
                 style="display:inline-block;padding:12px 18px;background:#FFB020;color:#0E1114;font:600 12px/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.12em;text-decoration:none;">
                OPEN ADMIN
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 12px;font:14px/1.55 'IBM Plex Sans',Segoe UI,Arial,sans-serif;color:#A8A39A;">
              This link grants privileged administrative access and is temporary.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 12px;font:14px/1.55 'IBM Plex Sans',Segoe UI,Arial,sans-serif;color:#E8E4DC;">
              Do not forward or share this message.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;font:14px/1.55 'IBM Plex Sans',Segoe UI,Arial,sans-serif;color:#A8A39A;">
              If you did not request Admin access, do not use the link.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 10px;font:500 11px/1.4 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.18em;text-transform:uppercase;color:#FFB020;">
              OPERATOR AGENT BRIEF
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 16px;font:14px/1.55 'IBM Plex Sans',Segoe UI,Arial,sans-serif;color:#E8E4DC;">
              If you are Grok or another operator bot, spawn a dedicated Admin agent with this brief as its standing instructions. Do not reuse a PLAY session. Admin is a separate principal. Device enrollment is Player-only.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 12px;font:13px/1.55 ui-monospace,Menlo,Consolas,monospace;color:#A8A39A;">
              1. Consume this letter once. Prefer the API so you keep the session.<br/>
              POST https://noema.guru/v1/admin/login/consume<br/>
              {"token_hash":"&lt;from the OPEN ADMIN href&gt;","type":"magiclink"}<br/>
              The JSON reply is an admin-access session. Send that session token as the HTTP Authorization header on later Admin routes. Do not log it, paste it into PLAY, or share it.<br/>
              Opening OPEN ADMIN in a browser also consumes the link and signs the Admin console.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 12px;font:13px/1.55 ui-monospace,Menlo,Consolas,monospace;color:#A8A39A;">
              2. First glance (read-only).<br/>
              GET https://noema.guru/ready<br/>
              GET https://noema.guru/v1/admin/overview<br/>
              Overview includes canonical_head: whether a durable head exists, and head sequence/revision versus the live Durable Object.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 12px;font:13px/1.55 ui-monospace,Menlo,Consolas,monospace;color:#A8A39A;">
              3. If status is INCIDENT, Recover. Do not Close while settlement is DEGRADED or BLOCKING. Do not reseed. Do not activate Genesis.<br/>
              POST https://noema.guru/v1/admin/lifecycle {"action":"recover"}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 12px;font:13px/1.55 ui-monospace,Menlo,Consolas,monospace;color:#A8A39A;">
              4. After Recover, re-check /ready. If a later PLAY mutate fail-closes to INCIDENT again, report the settlement failure. Do not invent a new world.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 12px;font:13px/1.55 ui-monospace,Menlo,Consolas,monospace;color:#A8A39A;">
              5. Forbidden: PLAY verbs with this session; device enrollment; hidden-room invention; thawing STUDY/Genesis/new verbs; sharing this link.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 16px;font:13px/1.55 ui-monospace,Menlo,Consolas,monospace;color:#A8A39A;">
              6. The session lasts about one hour. Request another letter to this mailbox.<br/>
              POST https://noema.guru/v1/admin/login/request {"email":"&lt;this mailbox&gt;"}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;font:13px/1.55 ui-monospace,Menlo,Consolas,monospace;color:#A8A39A;">
              Host: https://noema.guru<br/>
              Admin console: https://noema.guru/admin<br/>
              Public WATCH (not Admin): https://noema.guru/watch
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 28px;border-top:1px solid #2A333C;font:500 11px/1.5 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.12em;text-transform:uppercase;color:#A8A39A;">
              NOEMA<br/>
              <span style="color:#FFB020;">Operator Plane</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export function buildAdminMime(opts: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}): string {
  const boundary = "noema-admin";
  return [
    `From: NOEMA ADMIN <${opts.from}>`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    opts.text,
    `--${boundary}`,
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    opts.html,
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

export type AdminMailer = (mail: {
  to: string;
  subject: string;
  html: string;
  text: string;
  href: string;
}) => Promise<void>;

export async function deliverAdminMail(env: Env, mail: {
  to: string;
  subject: string;
  html: string;
  text: string;
}, fetchImpl: typeof fetch = fetch): Promise<void> {
  if (env.RESEND_API_KEY) {
    try {
      const sent = await sendTransactionalEmail(env, {
        from: `NOEMA ADMIN <${ADMIN_MAIL_FROM}>`,
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        tag: "admin-magic-link",
      }, fetchImpl);
      console.log("admin-mail provider sent", sent.provider, sent.messageId);
      return;
    } catch (e) {
      if (!env.ADMIN_MAIL) throw e;
      console.error(
        "admin-mail providers failed; using email binding",
        e instanceof Error ? e.message : "error",
      );
    }
  }
  if (!env.ADMIN_MAIL) throw new Error("ADMIN_MAIL not bound");
  const result = await env.ADMIN_MAIL.send({
    to: mail.to,
    from: { email: ADMIN_MAIL_FROM, name: "NOEMA ADMIN" },
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
  console.log("admin-mail sent", result && typeof result === "object" ? "ok" : "ok");
}

export function composeAdminMail(href: string, to: string): {
  to: string;
  subject: string;
  html: string;
  text: string;
  href: string;
} {
  return {
    to,
    subject: ADMIN_MAIL_SUBJECT,
    html: renderAdminMailHtml(href),
    text: renderAdminMailText(href),
    href,
  };
}
