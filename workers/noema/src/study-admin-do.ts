/**
 * Dedicated Durable Object (`StudyAdminDO`) for RFC-0131 Study Admin UI (ADR-0004).
 *
 * Provides single-writer linearizability and durable storage persistence for
 * single-use invite acceptance, superseding pending re-invites, and append-only
 * audit logging, completely isolated from the live world Durable Object.
 */

import { StudyAdminStore, type StudyAdminSnapshot } from "./study-admin";
import { handleStudyAdminRequest } from "./study-admin-http";

const STORAGE_KEY = "study_admin_state_v1";

export interface StudyAdminDOStorage {
  get<T = unknown>(key: string): Promise<T | undefined>;
  put<T = unknown>(key: string, value: T): Promise<void>;
}

export interface StudyAdminDOState {
  storage: StudyAdminDOStorage;
}

export interface StudyAdminDOEnv {
  STUDY_ADMIN_UI_ENABLED?: string;
}

export class StudyAdminDO {
  private readonly store = new StudyAdminStore();
  private readonly state: StudyAdminDOState;
  private readonly env: StudyAdminDOEnv;
  private hydrated = false;

  constructor(state: StudyAdminDOState, env: StudyAdminDOEnv) {
    this.state = state;
    this.env = env;
  }

  private async ensureHydrated(): Promise<void> {
    if (this.hydrated) return;
    const snapshot = await this.state.storage.get<StudyAdminSnapshot>(STORAGE_KEY);
    this.store.hydrate(snapshot);
    this.hydrated = true;
  }

  async fetch(request: Request): Promise<Response> {
    await this.ensureHydrated();
    const res = await handleStudyAdminRequest(request, {
      store: this.store,
      envFlag: this.env.STUDY_ADMIN_UI_ENABLED,
    });
    if (res) {
      if (request.method !== "GET" && request.method !== "HEAD" && res.ok) {
        await this.state.storage.put(STORAGE_KEY, this.store.serialize());
      }
      return res;
    }
    return new Response(
      JSON.stringify({ ok: false, code: "NOT_FOUND", message: "Unknown StudyAdminDO route." }),
      { status: 404, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }
}
