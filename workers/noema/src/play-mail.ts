import { extractHashedToken } from "./admin-mail";
import { normalizeEmail } from "./admin-auth";

export const PLAY_MAIL_SUBJECT = "Enter NOEMA";
export const PLAY_MAIL_FROM = "NOEMA <play@noema.guru>";

export function playMagicLinkHref(origin: string, tokenHash: string, type = "magiclink"): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/play/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`;
}

export function renderPlayMailText(href: string): string {
  return [
    "NOEMA",
    "",
    "Your access link is ready.",
    "",
    "Use the button below to sign in and continue into the world.",
    "",
    "ENTER NOEMA",
    href,
    "",
    "This link is temporary and can only be used to authenticate your Player account.",
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
  <title>Enter NOEMA</title>
</head>
<body style="margin:0;padding:0;background:#070a10;color:#ebe6d8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#070a10;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="max-width:520px;width:100%;border:1px solid #2a3342;background:#0c1218;">
          <tr>
            <td style="padding:28px 28px 10px;font:500 11px/1.4 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.18em;text-transform:uppercase;color:#c4784a;">
              NOEMA
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 16px;font:16px/1.55 Georgia,'Times New Roman',serif;color:#ebe6d8;">
              Your access link is ready.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 22px;font:16px/1.55 Georgia,'Times New Roman',serif;color:#9b9587;">
              Use the button below to sign in and continue into the world.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;">
              <a href="${safe}"
                 style="display:inline-block;padding:12px 18px;background:#c4784a;color:#1a1008;font:600 12px/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.12em;text-decoration:none;">
                ENTER NOEMA
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 12px;font:14px/1.55 Georgia,serif;color:#9b9587;">
              This link is temporary and can only be used to authenticate your Player account.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;font:14px/1.55 Georgia,serif;color:#9b9587;">
              If you did not request this link, you can ignore this message.
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 28px;border-top:1px solid #2a3342;font:500 11px/1.5 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.12em;text-transform:uppercase;color:#8a8478;">
              NOEMA<br/>
              <span style="color:#c4784a;">Perihelion Reach</span>
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
