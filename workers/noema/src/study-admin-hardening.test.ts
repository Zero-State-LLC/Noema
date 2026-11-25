import { describe, expect, it } from "vitest";
import { StudyAdminStore } from "./study-admin";
import { handleStudyAdminRequest } from "./study-admin-http";

describe("Study Admin hardening (Wave 3: expiry sweep, rate limit, study-scoped export)", () => {
  it("sweeps expired pending invites cleanly", () => {
    const store = new StudyAdminStore();
    const t0 = 1_700_000_000_000;
    const issued = store.issueInvite({
      enabled: true,
      actorId: "admin-1",
      authEventId: "evt-1",
      studyId: "study-1",
      humanPrincipalId: "human-1",
      ttlDays: 1,
      nowMs: t0,
    });
    expect(issued.ok).toBe(true);
    expect(store.sweepExpiredInvites(t0 + 1000)).toBe(0);
    expect(store.sweepExpiredInvites(t0 + 2 * 24 * 60 * 60 * 1000)).toBe(1);
  });

  it("rate-limits invite accept attempts with 429 RATE_LIMITED after 10 attempts", async () => {
    const store = new StudyAdminStore();
    const attempts = new Map<string, number>();
    let lastStatus = 0;
    for (let i = 0; i < 11; i += 1) {
      const res = await handleStudyAdminRequest(
        new Request("https://noema.guru/api/study-admin/invites/inv_missing/accept", {
          method: "POST",
          headers: {
            "X-Noema-Human-Principal": "human-1",
            "X-Noema-Auth-Event": `auth-${i}`,
          },
        }),
        { store, envFlag: "true", acceptAttempts: attempts },
      );
      lastStatus = res!.status;
    }
    expect(lastStatus).toBe(429);
  });

  it("gates /api/study-admin/studies/:studyId/export-ready strictly by active StudyAdmin grant", async () => {
    const store = new StudyAdminStore();
    const t0 = 1_700_000_000_000;

    // Denied before grant
    const before = await handleStudyAdminRequest(
      new Request("https://noema.guru/api/study-admin/studies/study-1/export-ready", {
        headers: { "X-Noema-Human-Principal": "human-alice" },
      }),
      { store, envFlag: "true", nowMs: () => t0 },
    );
    expect(before!.status).toBe(403);

    // Issue + accept invite for study-1
    const issued = store.issueInvite({
      enabled: true,
      actorId: "admin-1",
      authEventId: "evt-1",
      studyId: "study-1",
      humanPrincipalId: "human-alice",
      nowMs: t0,
    });
    expect(issued.ok).toBe(true);
    if (issued.ok && issued.invite) {
      store.acceptInvite({
        enabled: true,
        inviteId: issued.invite.invite_id,
        humanPrincipalId: "human-alice",
        authEventId: "evt-2",
        nowMs: t0 + 1000,
      });
    }

    // Allowed for study-1, still denied for study-2
    const okRes = await handleStudyAdminRequest(
      new Request("https://noema.guru/api/study-admin/studies/study-1/export-ready", {
        headers: { "X-Noema-Human-Principal": "human-alice" },
      }),
      { store, envFlag: "true", nowMs: () => t0 + 2000 },
    );
    expect(okRes!.status).toBe(200);

    const otherStudy = await handleStudyAdminRequest(
      new Request("https://noema.guru/api/study-admin/studies/study-2/export-ready", {
        headers: { "X-Noema-Human-Principal": "human-alice" },
      }),
      { store, envFlag: "true", nowMs: () => t0 + 2000 },
    );
    expect(otherStudy!.status).toBe(403);
  });
});
