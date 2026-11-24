/**
 * Dedicated Durable Object (`StudyAdminDO`) for RFC-0131 Study Admin UI (ADR-0004).
 *
 * Provides single-writer linearizability for single-use invite acceptance,
 * superseding pending re-invites, and append-only audit logging, completely
 * isolated from the live world Durable Object.
 */

import { StudyAdminStore } from "./study-admin";
import { handleStudyAdminRequest } from "./study-admin-http";

export interface StudyAdminDOEnv {
  STUDY_ADMIN_UI_ENABLED?: string;
}

export class StudyAdminDO {
  private readonly store = new StudyAdminStore();
  private readonly env: StudyAdminDOEnv;

  constructor(_state: unknown, env: StudyAdminDOEnv) {
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const res = await handleStudyAdminRequest(request, {
      store: this.store,
      envFlag: this.env.STUDY_ADMIN_UI_ENABLED,
    });
    if (res) return res;
    return new Response(
      JSON.stringify({ ok: false, code: "NOT_FOUND", message: "Unknown StudyAdminDO route." }),
      { status: 404, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }
}
