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

  // Read-only audit log inspection (supports pagination & CSV/JSON export)
  const auditMatch = path.match(/^\/api\/admin\/studies\/([^/]+)\/audit$/);
  if (auditMatch && req.method === "GET") {
    const authEventId = req.headers.get("X-Noema-Admin-Auth-Event") || "";
    if (!authEventId) {
      return jsonResponse(401, { ok: false, code: "UNAUTHORIZED", message: "Fresh Admin auth event required." });
    }
    const studyId = decodeURIComponent(auditMatch[1]);
    const allEvents = ctx.store.getAuditLog().filter((e) => e.study_id === studyId);
    const offset = Math.max(0, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0);
    const rawLimit = Number.parseInt(url.searchParams.get("limit") || "100", 10);
    const limit = Math.min(500, Math.max(1, Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 100));
    const events = allEvents.slice(offset, offset + limit);

    if (url.searchParams.get("format") === "csv") {
      const header = "event_id,event_type,actor_id,study_id,target_human_principal_id,auth_event_id,occurred_at_ms";
      const neutralizeCsv = (v: unknown): string => {
        const s = String(v);
        const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
        return `"${safe.replace(/"/g, '""')}"`;
      };
      const rows = events.map((e) =>
        [e.event_id, e.event_type, e.actor_id, e.study_id, e.target_human_principal_id, e.auth_event_id, e.occurred_at_ms]
          .map(neutralizeCsv)
          .join(","),
      );
      return new Response([header, ...rows].join("\n") + "\n", {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    return jsonResponse(200, {
      ok: true,
      study_id: studyId,
      total: allEvents.length,
      offset,
      limit,
      events,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { ok: false, code: "METHOD_NOT_ALLOWED", message: "POST required." });
  }

  const csrfErr = checkSameOriginCsrf(req, url);
  if (csrfErr) return csrfErr;

async function parseRequestBody(
  req: Request,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false }> {
  const ct = (req.headers.get("Content-Type") || "").toLowerCase();
  if (ct.includes("application/x-www-form-urlencoded")) {
    try {
      const text = await req.text();
      const params = new URLSearchParams(text);
      const data: Record<string, unknown> = {};
      for (const [k, v] of params.entries()) {
        data[k] = v;
      }
      return { ok: true, data };
    } catch {
      return { ok: false };
    }
  }
  try {
    const parsed = (await req.json()) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false };
    }
    return { ok: true, data: parsed as Record<string, unknown> };
  } catch {
    return { ok: false };
  }
}

  // POST /api/admin/studies/:studyId/invites
  const issueMatch = path.match(/^\/api\/admin\/studies\/([^/]+)\/invites$/);
  if (issueMatch) {
    const actorId = req.headers.get("X-Noema-Admin-Actor") || "";
    const authEventId = req.headers.get("X-Noema-Admin-Auth-Event") || "";
    if (!actorId || !authEventId) {
      return jsonResponse(401, { ok: false, code: "UNAUTHORIZED", message: "Fresh Admin auth event required." });
    }
    const parsed = await parseRequestBody(req);
    if (!parsed.ok) {
      return jsonResponse(400, { ok: false, code: "INVALID_REQUEST", message: "Invalid JSON or form body." });
    }
    const rawTtl = parsed.data.ttl_days;
    const ttlDays =
      typeof rawTtl === "number"
        ? rawTtl
        : typeof rawTtl === "string" && rawTtl.trim() !== ""
          ? Number(rawTtl)
          : undefined;
    const res = ctx.store.issueInvite({
      enabled,
      actorId,
      authEventId,
      studyId: decodeURIComponent(issueMatch[1]),
      humanPrincipalId: typeof parsed.data.human_principal_id === "string" ? parsed.data.human_principal_id : "",
      ttlDays: Number.isFinite(ttlDays) ? ttlDays : undefined,
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
