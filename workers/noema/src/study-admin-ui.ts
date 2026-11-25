/**
 * Feature-flagged server-rendered Study Admin UI (RFC-0131, ADR-0004).
 *
 * Fails closed with 404 FEATURE_DISABLED unless STUDY_ADMIN_UI_ENABLED === "true".
 * StudyAdmin grants are study-scoped and strictly distinct from Steward authority.
 */

import { isStudyAdminEnabled } from "./study-admin";

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function handleStudyAdminUiRequest(
  request: Request,
  envFlag: string | undefined,
): Response | null {
  const url = new URL(request.url);
  const isAdminPage = url.pathname === "/admin/studies";
  const inviteMatch = url.pathname.match(/^\/study-admin\/invites\/([^/]+)$/);
  if (!isAdminPage && !inviteMatch) return null;

  if (!isStudyAdminEnabled(envFlag)) {
    return new Response(
      JSON.stringify({
        ok: false,
        code: "FEATURE_DISABLED",
        message: "Study Admin UI is disabled.",
      }),
      { status: 404, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  if (request.method !== "GET") {
    return new Response(
      JSON.stringify({ ok: false, code: "METHOD_NOT_ALLOWED", message: "GET required." }),
      { status: 405, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  if (inviteMatch) {
    const inviteId = escapeHtml(decodeURIComponent(inviteMatch[1]));
    const acceptHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Accept StudyAdmin Invite — Noema</title>
</head>
<body>
  <main>
    <h1>Accept StudyAdmin Invite</h1>
    <p>Invite ID: <code>${inviteId}</code></p>
    <p>Accepting grants study-scoped <code>study-admin</code> authority only (never global Admin or Steward).</p>
    <form id="accept-invite-form" method="post" action="/api/study-admin/invites/${inviteId}/accept">
      <button type="submit">Accept Single-Use Invite</button>
    </form>
  </main>
</body>
</html>`;
    return new Response(acceptHtml, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Noema Study Admin (RFC-0131)</title>
</head>
<body>
  <main>
    <h1>Study Admin Delegation</h1>
    <p>StudyAdmin grants are study-scoped and do not confer global Admin or Steward authority.</p>
    <section id="issue-invite">
      <h2>Issue StudyAdmin Invite</h2>
      <form id="issue-invite-form" data-endpoint="/api/admin/studies/:studyId/invites">
        <label>Study ID <input name="study_id" required /></label>
        <label>Human Principal ID <input name="human_principal_id" required /></label>
        <button type="submit">Issue Invite</button>
      </form>
    </section>
    <section id="study-admin-endpoints">
      <h2>API Endpoints</h2>
      <ul>
        <li>POST <code>/api/admin/studies/:studyId/invites</code></li>
        <li>POST <code>/api/study-admin/invites/:inviteId/accept</code></li>
        <li>POST <code>/api/admin/studies/:studyId/invites/:inviteId/revoke</code></li>
        <li>POST <code>/api/admin/studies/:studyId/grants/:principalId/revoke</code></li>
        <li>GET <code>/api/admin/studies/:studyId/audit</code></li>
      </ul>
    </section>
  </main>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
