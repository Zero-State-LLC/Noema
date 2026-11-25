/**
 * Feature-flagged RFC-0131 Study Admin service (v1 single-role `study-admin`).
 *
 * Implements Noema-Specs:
 * - specify/study-admin-ui/contracts-draft/api-proposal/INVITE-LIFECYCLE-CONTRACT.md
 * - specify/study-admin-ui/contracts-draft/api-proposal/WIRE-STORAGE-SECURITY-CONTRACT.md
 *
 * Default disabled (`STUDY_ADMIN_UI_ENABLED !== "true"`). Grants are strictly
 * study-scoped and never confer global Admin privileges.
 */

export type StudyAdminRole = "study-admin";
export type InviteStatus = "pending" | "accepted" | "revoked" | "superseded" | "expired";
export type GrantStatus = "active" | "revoked";
export type AuditEventType =
  | "invite_issued"
  | "invite_superseded"
  | "invite_accepted"
  | "invite_revoked"
  | "grant_revoked";

export interface StudyAdminInvite {
  invite_id: string;
  study_id: string;
  human_principal_id: string;
  role: StudyAdminRole;
  status: InviteStatus;
  issued_by_auth_event_id: string;
  created_at_ms: number;
  expires_at_ms: number;
  resolved_at_ms: number | null;
}

export interface StudyAdminGrant {
  study_id: string;
  human_principal_id: string;
  role: StudyAdminRole;
  status: GrantStatus;
  granted_at_ms: number;
  revoked_at_ms: number | null;
}

export interface StudyAdminAuditEvent {
  event_id: string;
  event_type: AuditEventType;
  actor_id: string;
  study_id: string;
  target_human_principal_id: string;
  auth_event_id: string;
  occurred_at_ms: number;
}

export interface StudyAdminError {
  ok: false;
  status: number;
  code: "FEATURE_DISABLED" | "INVALID_REQUEST" | "FORBIDDEN" | "NOT_FOUND" | "INVITE_EXPIRED" | "INVITE_REVOKED";
  message: string;
}

export type StudyAdminResult<T> = ({ ok: true; status: number } & T) | StudyAdminError;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isStudyAdminEnabled(envFlag: string | undefined): boolean {
  return envFlag === "true";
}

export interface StudyAdminSnapshot {
  invites: [string, StudyAdminInvite][];
  grants: [string, StudyAdminGrant][];
  audit: StudyAdminAuditEvent[];
  seq: number;
}

export class StudyAdminStore {
  private invites = new Map<string, StudyAdminInvite>();
  private grants = new Map<string, StudyAdminGrant>();
  private audit: StudyAdminAuditEvent[] = [];
  private seq = 0;

  serialize(): StudyAdminSnapshot {
    return {
      invites: Array.from(this.invites.entries()),
      grants: Array.from(this.grants.entries()),
      audit: [...this.audit],
      seq: this.seq,
    };
  }

  hydrate(snapshot: StudyAdminSnapshot | undefined): void {
    if (!snapshot) return;
    this.invites = new Map(snapshot.invites ?? []);
    this.grants = new Map(snapshot.grants ?? []);
    this.audit = [...(snapshot.audit ?? [])];
    this.seq = typeof snapshot.seq === "number" ? snapshot.seq : 0;
  }

  private nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}_${this.seq}`;
  }

  private grantKey(studyId: string, principalId: string): string {
    return `${studyId}::${principalId}`;
  }

  private recordAudit(
    eventType: AuditEventType,
    actorId: string,
    studyId: string,
    targetPrincipalId: string,
    authEventId: string,
    nowMs: number,
  ): void {
    this.audit.push({
      event_id: this.nextId("evt"),
      event_type: eventType,
      actor_id: actorId,
      study_id: studyId,
      target_human_principal_id: targetPrincipalId,
      auth_event_id: authEventId,
      occurred_at_ms: nowMs,
    });
  }

  getAuditLog(): readonly StudyAdminAuditEvent[] {
    return this.audit;
  }

  getGrant(studyId: string, principalId: string): StudyAdminGrant | undefined {
    return this.grants.get(this.grantKey(studyId, principalId));
  }

  issueInvite(params: {
    enabled: boolean;
    actorId: string;
    authEventId: string;
    studyId: string;
    humanPrincipalId: string;
    ttlDays?: number;
    nowMs: number;
  }): StudyAdminResult<{ code: "CREATED" | "ALREADY_ACTIVE"; invite?: StudyAdminInvite; grant?: StudyAdminGrant }> {
    if (!params.enabled) {
      return { ok: false, status: 404, code: "FEATURE_DISABLED", message: "Study admin UI is disabled." };
    }
    if (!params.authEventId || !params.studyId || !params.humanPrincipalId) {
      return { ok: false, status: 400, code: "INVALID_REQUEST", message: "Missing required fields." };
    }
    const ttlDays = params.ttlDays ?? 7;
    if (!Number.isInteger(ttlDays) || ttlDays < 1 || ttlDays > 14) {
      return { ok: false, status: 400, code: "INVALID_REQUEST", message: "ttl_days must be an integer 1..14." };
    }

    const existingGrant = this.grants.get(this.grantKey(params.studyId, params.humanPrincipalId));
    if (existingGrant && existingGrant.status === "active") {
      return { ok: true, status: 200, code: "ALREADY_ACTIVE", grant: existingGrant };
    }

    for (const inv of this.invites.values()) {
      if (
        inv.study_id === params.studyId &&
        inv.human_principal_id === params.humanPrincipalId &&
        inv.status === "pending"
      ) {
        inv.status = "superseded";
        inv.resolved_at_ms = params.nowMs;
        this.recordAudit(
          "invite_superseded",
          params.actorId,
          params.studyId,
          params.humanPrincipalId,
          params.authEventId,
          params.nowMs,
        );
      }
    }

    const invite: StudyAdminInvite = {
      invite_id: this.nextId("inv"),
      study_id: params.studyId,
      human_principal_id: params.humanPrincipalId,
      role: "study-admin",
      status: "pending",
      issued_by_auth_event_id: params.authEventId,
      created_at_ms: params.nowMs,
      expires_at_ms: params.nowMs + ttlDays * DAY_MS,
      resolved_at_ms: null,
    };
    this.invites.set(invite.invite_id, invite);
    this.recordAudit(
      "invite_issued",
      params.actorId,
      params.studyId,
      params.humanPrincipalId,
      params.authEventId,
      params.nowMs,
    );
    return { ok: true, status: 201, code: "CREATED", invite };
  }

  acceptInvite(params: {
    enabled: boolean;
    inviteId: string;
    humanPrincipalId: string;
    authEventId: string;
    nowMs: number;
  }): StudyAdminResult<{ grant: StudyAdminGrant }> {
    if (!params.enabled) {
      return { ok: false, status: 404, code: "FEATURE_DISABLED", message: "Study admin UI is disabled." };
    }
    const inv = this.invites.get(params.inviteId);
    if (!inv) {
      return { ok: false, status: 404, code: "NOT_FOUND", message: "Invite not found." };
    }
    if (inv.human_principal_id !== params.humanPrincipalId) {
      return { ok: false, status: 403, code: "FORBIDDEN", message: "Principal mismatch." };
    }
    if (inv.status === "revoked" || inv.status === "superseded" || inv.status === "accepted") {
      return { ok: false, status: 410, code: "INVITE_REVOKED", message: `Invite is ${inv.status}.` };
    }
    if (params.nowMs >= inv.expires_at_ms) {
      inv.status = "expired";
      inv.resolved_at_ms = params.nowMs;
      return { ok: false, status: 410, code: "INVITE_EXPIRED", message: "Invite has expired." };
    }

    inv.status = "accepted";
    inv.resolved_at_ms = params.nowMs;
    const grant: StudyAdminGrant = {
      study_id: inv.study_id,
      human_principal_id: inv.human_principal_id,
      role: "study-admin",
      status: "active",
      granted_at_ms: params.nowMs,
      revoked_at_ms: null,
    };
    this.grants.set(this.grantKey(inv.study_id, inv.human_principal_id), grant);
    this.recordAudit(
      "invite_accepted",
      params.humanPrincipalId,
      inv.study_id,
      inv.human_principal_id,
      params.authEventId,
      params.nowMs,
    );
    return { ok: true, status: 200, grant };
  }

  revokeInvite(params: {
    enabled: boolean;
    actorId: string;
    authEventId: string;
    studyId: string;
    inviteId: string;
    nowMs: number;
  }): StudyAdminResult<{ invite: StudyAdminInvite }> {
    if (!params.enabled) {
      return { ok: false, status: 404, code: "FEATURE_DISABLED", message: "Study admin UI is disabled." };
    }
    const inv = this.invites.get(params.inviteId);
    if (!inv || inv.study_id !== params.studyId) {
      return { ok: false, status: 404, code: "NOT_FOUND", message: "Invite not found." };
    }
    inv.status = "revoked";
    inv.resolved_at_ms = params.nowMs;
    this.recordAudit(
      "invite_revoked",
      params.actorId,
      inv.study_id,
      inv.human_principal_id,
      params.authEventId,
      params.nowMs,
    );
    return { ok: true, status: 200, invite: inv };
  }

  revokeGrant(params: {
    enabled: boolean;
    actorId: string;
    authEventId: string;
    studyId: string;
    humanPrincipalId: string;
    nowMs: number;
  }): StudyAdminResult<{ grant: StudyAdminGrant }> {
    if (!params.enabled) {
      return { ok: false, status: 404, code: "FEATURE_DISABLED", message: "Study admin UI is disabled." };
    }
    const grant = this.grants.get(this.grantKey(params.studyId, params.humanPrincipalId));
    if (!grant) {
      return { ok: false, status: 404, code: "NOT_FOUND", message: "Grant not found." };
    }
    grant.status = "revoked";
    grant.revoked_at_ms = params.nowMs;
    this.recordAudit(
      "grant_revoked",
      params.actorId,
      params.studyId,
      params.humanPrincipalId,
      params.authEventId,
      params.nowMs,
    );
    return { ok: true, status: 200, grant };
  }

  /** Sweep pending invites whose TTL has elapsed, marking them expired cleanly. */
  sweepExpiredInvites(nowMs: number): number {
    let swept = 0;
    for (const inv of this.invites.values()) {
      if (inv.status === "pending" && inv.expires_at_ms <= nowMs) {
        inv.status = "expired";
        inv.resolved_at_ms = nowMs;
        swept += 1;
      }
    }
    return swept;
  }

  /** Check whether a HumanPrincipal holds an active study-scoped StudyAdmin grant. */
  hasActiveGrant(studyId: string, humanPrincipalId: string): boolean {
    const grant = this.grants.get(this.grantKey(studyId, humanPrincipalId));
    return grant?.status === "active";
  }
}
