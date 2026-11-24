import { describe, expect, it } from "vitest";
import { isStudyAdminEnabled, StudyAdminStore } from "../src/study-admin";

const T0 = Date.UTC(2026, 10, 24, 5, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

describe("RFC-0131 StudyAdminStore", () => {
  it("defaults feature flag to disabled and refuses operations when off", () => {
    expect(isStudyAdminEnabled(undefined)).toBe(false);
    expect(isStudyAdminEnabled("false")).toBe(false);
    expect(isStudyAdminEnabled("true")).toBe(true);

    const store = new StudyAdminStore();
    const res = store.issueInvite({
      enabled: false,
      actorId: "admin_1",
      authEventId: "auth_1",
      studyId: "study_1",
      humanPrincipalId: "hp_1",
      nowMs: T0,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("FEATURE_DISABLED");
  });

  it("enforces TTL bounds, single-use accept, principal mismatch, and idempotent re-invite", () => {
    const store = new StudyAdminStore();
    const badTtl = store.issueInvite({
      enabled: true,
      actorId: "admin_1",
      authEventId: "auth_1",
      studyId: "study_1",
      humanPrincipalId: "hp_1",
      ttlDays: 15,
      nowMs: T0,
    });
    expect(badTtl.ok).toBe(false);

    const issued = store.issueInvite({
      enabled: true,
      actorId: "admin_1",
      authEventId: "auth_1",
      studyId: "study_1",
      humanPrincipalId: "hp_1",
      nowMs: T0,
    });
    expect(issued.ok).toBe(true);
    if (!issued.ok || !issued.invite) return;

    const wrongPrincipal = store.acceptInvite({
      enabled: true,
      inviteId: issued.invite.invite_id,
      humanPrincipalId: "hp_other",
      authEventId: "auth_2",
      nowMs: T0 + 1000,
    });
    expect(wrongPrincipal.ok).toBe(false);
    if (!wrongPrincipal.ok) expect(wrongPrincipal.code).toBe("FORBIDDEN");

    const accepted = store.acceptInvite({
      enabled: true,
      inviteId: issued.invite.invite_id,
      humanPrincipalId: "hp_1",
      authEventId: "auth_3",
      nowMs: T0 + 2000,
    });
    expect(accepted.ok).toBe(true);
    if (accepted.ok) expect(accepted.grant.role).toBe("study-admin");

    // Single-use: second accept fails
    const replay = store.acceptInvite({
      enabled: true,
      inviteId: issued.invite.invite_id,
      humanPrincipalId: "hp_1",
      authEventId: "auth_4",
      nowMs: T0 + 3000,
    });
    expect(replay.ok).toBe(false);

    // Idempotent re-invite for already-active study-admin
    const reinvite = store.issueInvite({
      enabled: true,
      actorId: "admin_1",
      authEventId: "auth_5",
      studyId: "study_1",
      humanPrincipalId: "hp_1",
      nowMs: T0 + 4000,
    });
    expect(reinvite.ok).toBe(true);
    if (reinvite.ok) {
      expect(reinvite.status).toBe(200);
      expect(reinvite.code).toBe("ALREADY_ACTIVE");
    }
  });

  it("supersedes pending invites, enforces expiry, and preserves append-only audit on revocation", () => {
    const store = new StudyAdminStore();
    const inv1 = store.issueInvite({
      enabled: true,
      actorId: "admin_1",
      authEventId: "auth_1",
      studyId: "study_1",
      humanPrincipalId: "hp_2",
      ttlDays: 7,
      nowMs: T0,
    });
    const inv2 = store.issueInvite({
      enabled: true,
      actorId: "admin_1",
      authEventId: "auth_2",
      studyId: "study_1",
      humanPrincipalId: "hp_2",
      ttlDays: 7,
      nowMs: T0 + 1000,
    });
    expect(inv1.ok && inv2.ok).toBe(true);
    if (!inv1.ok || !inv1.invite || !inv2.ok || !inv2.invite) return;

    // Superseded invite rejected
    const oldAccept = store.acceptInvite({
      enabled: true,
      inviteId: inv1.invite.invite_id,
      humanPrincipalId: "hp_2",
      authEventId: "auth_3",
      nowMs: T0 + 2000,
    });
    expect(oldAccept.ok).toBe(false);
    if (!oldAccept.ok) expect(oldAccept.code).toBe("INVITE_REVOKED");

    // Expired invite rejected
    const expiredAccept = store.acceptInvite({
      enabled: true,
      inviteId: inv2.invite.invite_id,
      humanPrincipalId: "hp_2",
      authEventId: "auth_4",
      nowMs: T0 + 8 * DAY,
    });
    expect(expiredAccept.ok).toBe(false);
    if (!expiredAccept.ok) expect(expiredAccept.code).toBe("INVITE_EXPIRED");

    // Issue, accept, then revoke active grant -> audit log preserved
    const inv3 = store.issueInvite({
      enabled: true,
      actorId: "admin_1",
      authEventId: "auth_5",
      studyId: "study_1",
      humanPrincipalId: "hp_3",
      nowMs: T0 + 9 * DAY,
    });
    if (!inv3.ok || !inv3.invite) return;
    store.acceptInvite({
      enabled: true,
      inviteId: inv3.invite.invite_id,
      humanPrincipalId: "hp_3",
      authEventId: "auth_6",
      nowMs: T0 + 9 * DAY + 1000,
    });
    const rev = store.revokeGrant({
      enabled: true,
      actorId: "admin_1",
      authEventId: "auth_7",
      studyId: "study_1",
      humanPrincipalId: "hp_3",
      nowMs: T0 + 9 * DAY + 2000,
    });
    expect(rev.ok).toBe(true);
    expect(store.getGrant("study_1", "hp_3")?.status).toBe("revoked");
    expect(store.getAuditLog().map((e) => e.event_type)).toContain("grant_revoked");
  });
});
