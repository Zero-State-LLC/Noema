/**
 * Feature-flagged server-rendered Study Admin UI (RFC-0131, ADR-0004).
 *
 * Fails closed with 404 FEATURE_DISABLED unless STUDY_ADMIN_UI_ENABLED === "true".
 * StudyAdmin grants are study-scoped and strictly distinct from Steward authority.
 */

import { isStudyAdminEnabled } from "./study-admin";

export function handleStudyAdminUiRequest(
  request: Request,
  envFlag: string | undefined,
): Response | null {
  const url = new URL(request.url);
  if (url.pathname !== "/admin/studies") return null;

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
    <section id="study-admin-endpoints">
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
