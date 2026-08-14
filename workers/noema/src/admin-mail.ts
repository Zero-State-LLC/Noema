/**
 * Worker-sent ADMIN magic-link mail.
 * PLAY uses Resend when RESEND_API_KEY is set.
 */

import { sendResendEmail } from "./resend";
import type { Env } from "./types";

const OPERATOR_INBOX = "zer0state@zer0state.com";

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
<body style="margin:0;padding:0;background:#070a10;color:#ebe6d8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#070a10;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="max-width:520px;width:100%;border:1px solid #2a3342;background:#0c1218;">
          <tr>
            <td style="padding:28px 28px 10px;font:500 11px/1.4 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.18em;text-transform:uppercase;color:#c4784a;">
              NOEMA ADMIN
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 16px;font:16px/1.55 Georgia,'Times New Roman',serif;color:#ebe6d8;">
              A secure operator access link was requested.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 22px;font:16px/1.55 Georgia,'Times New Roman',serif;color:#9b9587;">
              Use the button below to open the NOEMA control plane.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;">
              <a href="${safe}"
                 style="display:inline-block;padding:12px 18px;background:#c4784a;color:#1a1008;font:600 12px/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.12em;text-decoration:none;">
                OPEN ADMIN
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 12px;font:14px/1.55 Georgia,serif;color:#9b9587;">
              This link grants privileged administrative access and is temporary.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 12px;font:14px/1.55 Georgia,serif;color:#ebe6d8;">
              Do not forward or share this message.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;font:14px/1.55 Georgia,serif;color:#9b9587;">
              If you did not request Admin access, do not use the link.
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 28px;border-top:1px solid #2a3342;font:500 11px/1.5 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.12em;text-transform:uppercase;color:#8a8478;">
              NOEMA<br/>
              <span style="color:#c4784a;">Operator Plane</span>
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
}): Promise<void> {
  if (env.RESEND_API_KEY) {
    await sendResendEmail(env, {
      from: `NOEMA ADMIN <${ADMIN_MAIL_FROM}>`,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    return;
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

export function composeAdminMail(href: string): {
  to: string;
  subject: string;
  html: string;
  text: string;
  href: string;
} {
  return {
    to: OPERATOR_INBOX,
    subject: ADMIN_MAIL_SUBJECT,
    html: renderAdminMailHtml(href),
    text: renderAdminMailText(href),
    href,
  };
}
