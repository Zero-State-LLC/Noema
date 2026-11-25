/**
 * Feature-flagged HTTP router for RFC-0131 Study Admin UI (ADR-0004).
 *
 * All routes return 404 FEATURE_DISABLED unless `envFlag === "true"`.
 * Enforces same-origin CSRF checks and fresh Admin-auth event derivatives.
 */

import { isStudyAdminEnabled, StudyAdminStore } from "./study-admin";

export interface StudyAdminHttpContext {
  store: StudyAdminStore;
  envFlag: string | undefined;
  nowMs?: () => number;
  acceptAttempts?: Map<string, number>;
}

const MAX_ACCEPT_ATTEMPTS_PER_INVITE = 10;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function checkSameOriginCsrf(req: Request, url: URL): Response | null {
  const origin = req.headers.get("Origin");
  if (origin && origin !== url.origin) {
    return jsonResponse(403, { ok: false, code: "CSRF_ORIGIN_MISMATCH", message: "Cross-origin request rejected." });
  }
  return null;
}

export async function handleStudyAdminRequest(req: Request, ctx: StudyAdminHttpContext): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;
  const isStudyAdminPath =
    path.startsWith("/api/admin/studies/") ||
    path.startsWith("/api/study-admin/invites/") ||
    path.startsWith("/api/study-admin/studies/");
  if (!isStudyAdminPath) return null;

  const enabled = isStudyAdminEnabled(ctx.envFlag);
  if (!enabled) {
    return jsonResponse(404, { ok: false, code: "FEATURE_DISABLED", message: "Study admin UI is disabled." });
  }

  const nowMs = ctx.nowMs ? ctx.nowMs() : Date.now();
  ctx.store.sweepExpiredInvites(nowMs);

  // Study-scoped read-only export readiness check (requires active StudyAdmin grant)
  const exportMatch = path.match(/^\/api\/study-admin\/studies\/([^/]+)\/export-ready$/);
  if (exportMatch && req.method === "GET") {
    const principalId = req.headers.get("X-Noema-Human-Principal") || "";
    const studyId = decodeURIComponent(exportMatch[1]);
    if (!principalId || !ctx.store.hasActiveGrant(studyId, principalId)) {
      return jsonResponse(403, {
        ok: false,
        code: "FORBIDDEN",
        message: "Active study-scoped StudyAdmin grant required.",
      });
    }
    return jsonResponse(200, {
      ok: true,
      study_id: studyId,
      role: "study-admin",
      export_ready: true,
    });
  }

  // Read-only audit log inspection
  const auditMatch = path.match(/^\/api\/admin\/studies\/([^/]+)\/audit$/);
  if (auditMatch && req.method === "GET") {
    const authEventId = req.headers.get("X-Noema-Admin-Auth-Event") || "";
    if (!authEventId) {
      return jsonResponse(401, { ok: false, code: "UNAUTHORIZED", message: "Fresh Admin auth event required." });
    }
    const studyId = decodeURIComponent(auditMatch[1]);
    const events = ctx.store.getAuditLog().filter((e) => e.study_id === studyId);
    return jsonResponse(200, { ok: true, study_id: studyId, events });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { ok: false, code: "METHOD_NOT_ALLOWED", message: "POST required." });
  }

  const csrfErr = checkSameOriginCsrf(req, url);
  if (csrfErr) return csrfErr;

  // POST /api/admin/studies/:studyId/invites
  const issueMatch = path.match(/^\/api\/admin\/studies\/([^/]+)\/invites$/);
  if (issueMatch) {
    const actorId = req.headers.get("X-Noema-Admin-Actor") || "";
    const authEventId = req.headers.get("X-Noema-Admin-Auth-Event") || "";
    if (!actorId || !authEventId) {
      return jsonResponse(401, { ok: false, code: "UNAUTHORIZED", message: "Fresh Admin auth event required." });
    }
    let payload: { human_principal_id?: string; ttl_days?: number } = {};
    try {
      payload = (await req.json()) as { human_principal_id?: string; ttl_days?: number };
    } catch {
      return jsonResponse(400, { ok: false, code: "INVALID_REQUEST", message: "Invalid JSON body." });
    }
    const res = ctx.store.issueInvite({
      enabled,
      actorId,
      authEventId,
      studyId: decodeURIComponent(issueMatch[1]),
      humanPrincipalId: payload.human_principal_id || "",
      ttlDays: payload.ttl_days,
      nowMs,
    });
    return jsonResponse(res.status, res);
  }

  // POST /api/study-admin/invites/:inviteId/accept
  const acceptMatch = path.match(/^\/api\/study-admin\/invites\/([^/]+)\/accept$/);
  if (acceptMatch) {
    const inviteId = decodeURIComponent(acceptMatch[1]);
    if (ctx.acceptAttempts) {
      const prev = ctx.acceptAttempts.get(inviteId) ?? 0;
      if (prev >= MAX_ACCEPT_ATTEMPTS_PER_INVITE) {
        return jsonResponse(429, {
          ok: false,
          code: "RATE_LIMITED",
          message: "Too many accept attempts for this invite.",
        });
      }
      ctx.acceptAttempts.set(inviteId, prev + 1);
    }
    const principalId = req.headers.get("X-Noema-Human-Principal") || "";
    const authEventId = req.headers.get("X-Noema-Auth-Event") || "";
    if (!principalId || !authEventId) {
      return jsonResponse(401, { ok: false, code: "UNAUTHORIZED", message: "HumanPrincipal auth required." });
    }
    const res = ctx.store.acceptInvite({
      enabled,
      inviteId: decodeURIComponent(acceptMatch[1]),
      humanPrincipalId: principalId,
      authEventId,
      nowMs,
    });
    return jsonResponse(res.status, res);
  }

  // POST /api/admin/studies/:studyId/invites/:inviteId/revoke
  const revokeInviteMatch = path.match(/^\/api\/admin\/studies\/([^/]+)\/invites\/([^/]+)\/revoke$/);
  if (revokeInviteMatch) {
    const actorId = req.headers.get("X-Noema-Admin-Actor") || "";
    const authEventId = req.headers.get("X-Noema-Admin-Auth-Event") || "";
    if (!actorId || !authEventId) {
      return jsonResponse(401, { ok: false, code: "UNAUTHORIZED", message: "Fresh Admin auth event required." });
    }
    const res = ctx.store.revokeInvite({
      enabled,
      actorId,
      authEventId,
      studyId: decodeURIComponent(revokeInviteMatch[1]),
      inviteId: decodeURIComponent(revokeInviteMatch[2]),
      nowMs,
    });
    return jsonResponse(res.status, res);
  }

  // POST /api/admin/studies/:studyId/grants/:principalId/revoke
  const revokeGrantMatch = path.match(/^\/api\/admin\/studies\/([^/]+)\/grants\/([^/]+)\/revoke$/);
  if (revokeGrantMatch) {
    const actorId = req.headers.get("X-Noema-Admin-Actor") || "";
    const authEventId = req.headers.get("X-Noema-Admin-Auth-Event") || "";
    if (!actorId || !authEventId) {
      return jsonResponse(401, { ok: false, code: "UNAUTHORIZED", message: "Fresh Admin auth event required." });
    }
    const res = ctx.store.revokeGrant({
      enabled,
      actorId,
      authEventId,
      studyId: decodeURIComponent(revokeGrantMatch[1]),
      humanPrincipalId: decodeURIComponent(revokeGrantMatch[2]),
      nowMs,
    });
    return jsonResponse(res.status, res);
  }

  return jsonResponse(404, { ok: false, code: "NOT_FOUND", message: "Unknown study-admin route." });
}
