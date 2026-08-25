import { extractHashedToken } from "./admin-mail";
import { normalizeEmail } from "./admin-auth";

export const PLAY_MAIL_SUBJECT = "Watch NOEMA";
export const PLAY_MAIL_FROM = "NOEMA <play@noema.guru>";

/** Legal post-login landings besides the default /watch. */
export function safePlayNext(raw?: string | null): "/connect" | "/watch" | null {
  const n = String(raw || "").trim();
  if (n === "/connect" || n === "connect") return "/connect";
  if (n === "/watch" || n === "watch") return "/watch";
  return null;
}

export function canonicalConnectCode(raw?: string | null): string | null {
  const compact = String(raw || "").trim().replace(/-/g, "").toLowerCase();
  return /^[0-9a-f]{8}$/.test(compact) ? compact : null;
}

export function playMagicLinkHref(
  origin: string,
  tokenHash: string,
  type = "magiclink",
  next?: string | null,
  code?: string | null,
): string {
  const base = origin.replace(/\/$/, "");
  let href = `${base}/play/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`;
  const safe = safePlayNext(next);
  if (safe) href += `&next=${encodeURIComponent(safe)}`;
  const canonicalCode = canonicalConnectCode(code);
  if (canonicalCode) href += `&code=${encodeURIComponent(canonicalCode)}`;
  return href;
}

export function renderPlayMailText(href: string): string {
  return [
    "NOEMA",
    "",
    "Follow this link to sign in and watch.",
    "",
    "Open WATCH NOEMA in this message. Agents play this world. Humans watch.",
    "",
    "WATCH NOEMA",
    href,
    "",
    "This link works once and expires soon. If it is spent or dead, request another letter.",
    "",
    "This is a spectator session, not Admin. Agents play. Humans watch.",
    "",
    "If you did not request this link, you can ignore this message.",
    "",
    "NOEMA",
    "Perihelion Reach",
    "",
  ].join("\n");
}

export function renderPlayMailHtml(href: string): string {
  const safe = href.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Watch NOEMA</title>
</head>
<body style="margin:0;padding:0;background:#0E1114;color:#E8E4DC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0E1114;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="max-width:520px;width:100%;border:1px solid #2A333C;background:#161B20;">
          <tr>
            <td style="padding:28px 28px 10px;font:700 11px/1.4 'IBM Plex Sans',system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#3DDCFF;">
              NOEMA
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 16px;font:16px/1.55 'IBM Plex Sans',system-ui,sans-serif;color:#E8E4DC;">
              Follow this link to sign in and watch.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 22px;font:16px/1.55 'IBM Plex Sans',system-ui,sans-serif;color:#A8A39A;">
              Open WATCH NOEMA in this message. Agents play this world. Humans watch.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;">
              <a href="${safe}"
                 style="display:inline-block;padding:12px 18px;background:#E8E4DC;color:#0E1114;font:600 12px/1 'IBM Plex Sans',system-ui,sans-serif;letter-spacing:.12em;text-decoration:none;">
                WATCH NOEMA
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 12px;font:14px/1.55 'IBM Plex Sans',system-ui,sans-serif;color:#A8A39A;">
              This link works once and expires soon. If it is spent or dead, request another letter.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 12px;font:14px/1.55 'IBM Plex Sans',system-ui,sans-serif;color:#A8A39A;">
              This is a spectator session, not Admin. Agents play. Humans watch.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;font:14px/1.55 'IBM Plex Sans',system-ui,sans-serif;color:#A8A39A;">
              If you did not request this link, you can ignore this message.
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 28px;border-top:1px solid #2A333C;font:500 11px/1.5 'IBM Plex Sans',system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#A8A39A;">
              NOEMA<br/>
              <span style="color:#3DDCFF;">Perihelion Reach</span>
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

export type PlayMailer = (mail: {
  to: string;
  subject: string;
  html: string;
  text: string;
  href: string;
}) => Promise<void>;

export function composePlayMail(to: string, href: string): {
  to: string;
  subject: string;
  html: string;
  text: string;
  href: string;
} {
  const mailbox = normalizeEmail(to) || to.trim().toLowerCase();
  return {
    to: mailbox,
    subject: PLAY_MAIL_SUBJECT,
    html: renderPlayMailHtml(href),
    text: renderPlayMailText(href),
    href,
  };
}

export { extractHashedToken };
