import { normalizeEmail } from "./admin-auth";
import { applyEnrollmentHref, stripSubjectHeader } from "./mail-template";

export const AGENT_BOOTSTRAP_SUBJECT = "Review agent enrollment";
export const AGENT_BOOTSTRAP_FROM = "NOEMA <connect@noema.guru>";

/** Keep identical to docs/email/agent-bootstrap.html — email-templates.test.ts asserts this. */
export const AGENT_BOOTSTRAP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Review agent enrollment</title>
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
              An agent asked to attach as a Controller for a Player.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 22px;font:16px/1.55 Georgia,'Times New Roman',serif;color:#9b9587;">
              Opening this link only shows the request. It does not approve enrollment or issue access.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;">
              <a href="{{ .EnrollmentUrl }}"
                 style="display:inline-block;padding:12px 18px;background:#c4784a;color:#1a1008;font:600 12px/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.12em;text-decoration:none;">
                REVIEW ENROLLMENT
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 12px;font:14px/1.55 Georgia,serif;color:#9b9587;">
              This link expires in 15 minutes and can be used only to inspect the request.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;font:14px/1.55 Georgia,serif;color:#9b9587;">
              If you did not expect this, ignore the message.
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

/** Keep identical to docs/email/agent-bootstrap.txt after the Subject header. */
export const AGENT_BOOTSTRAP_TEXT = `NOEMA

An agent asked to attach as a Controller for a Player.

Opening this link only shows the request. It does not approve enrollment or issue access.

REVIEW ENROLLMENT
{{ .EnrollmentUrl }}

This link expires in 15 minutes and can be used only to inspect the request.

If you did not expect this, ignore the message.

NOEMA
Perihelion Reach
`;

export function agentEnrollmentHref(origin: string, enrollmentId: string, token: string): string {
  const base = origin.replace(/\/$/, "");
  const q = new URLSearchParams({ eid: enrollmentId, t: token });
  return `${base}/connect/enroll?${q.toString()}`;
}

export function renderAgentBootstrapHtml(href: string): string {
  return applyEnrollmentHref(AGENT_BOOTSTRAP_HTML, href, true);
}

export function renderAgentBootstrapText(href: string): string {
  return applyEnrollmentHref(AGENT_BOOTSTRAP_TEXT, href, false);
}

export function composeAgentBootstrapMail(to: string, href: string): {
  to: string;
  subject: string;
  html: string;
  text: string;
  href: string;
} {
  return {
    to: normalizeEmail(to) || to.trim().toLowerCase(),
    subject: AGENT_BOOTSTRAP_SUBJECT,
    html: renderAgentBootstrapHtml(href),
    text: renderAgentBootstrapText(href),
    href,
  };
}

export { stripSubjectHeader };
