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

  it("supports audit pagination and CSV export on GET /api/admin/studies/:studyId/audit", async () => {
    const store = new StudyAdminStore();
    const t0 = 1_700_000_000_000;
    store.issueInvite({
      enabled: true,
      actorId: "admin-1",
      authEventId: "evt-1",
      studyId: "study-1",
      humanPrincipalId: "human-1",
      nowMs: t0,
    });
    store.issueInvite({
      enabled: true,
      actorId: "admin-1",
      authEventId: "evt-2",
      studyId: "study-1",
      humanPrincipalId: "human-2",
      nowMs: t0 + 1000,
    });

    const page = await handleStudyAdminRequest(
      new Request("https://noema.guru/api/admin/studies/study-1/audit?limit=1&offset=1", {
        headers: { "X-Noema-Admin-Auth-Event": "evt-3" },
      }),
      { store, envFlag: "true", nowMs: () => t0 + 2000 },
    );
    expect(page!.status).toBe(200);
    const body = (await page!.json()) as { total: number; events: unknown[] };
    expect(body.total).toBe(2);
    expect(body.events.length).toBe(1);

    const csvRes = await handleStudyAdminRequest(
      new Request("https://noema.guru/api/admin/studies/study-1/audit?format=csv", {
        headers: { "X-Noema-Admin-Auth-Event": "evt-4" },
      }),
      { store, envFlag: "true", nowMs: () => t0 + 2000 },
    );
    expect(csvRes!.status).toBe(200);
    expect(csvRes!.headers.get("Content-Type")).toContain("text/csv");
    const csvText = await csvRes!.text();
    expect(csvText).toContain("event_id,event_type,actor_id");
    expect(csvText).toContain("invite_issued");
  });

  it("accepts application/x-www-form-urlencoded POST bodies on invite issue", async () => {
    const store = new StudyAdminStore();
    const res = await handleStudyAdminRequest(
      new Request("https://noema.guru/api/admin/studies/study-form/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: "https://noema.guru",
          "X-Noema-Admin-Actor": "admin-1",
          "X-Noema-Admin-Auth-Event": "evt-form-1",
        },
        body: "human_principal_id=human-form-alice&ttl_days=7",
      }),
      { store, envFlag: "true", nowMs: () => 1_700_000_000_000 },
    );
    expect(res!.status).toBe(201);
    const body = (await res!.json()) as { ok: boolean; invite: { human_principal_id: string } };
    expect(body.ok).toBe(true);
    expect(body.invite.human_principal_id).toBe("human-form-alice");
  });

  it("persists acceptAttempts across serialize/hydrate for durable rate limiting", () => {
    const store1 = new StudyAdminStore();
    store1.acceptAttempts.set("inv_1", 5);
    const snap = store1.serialize();

    const store2 = new StudyAdminStore();
    store2.hydrate(snap);
    expect(store2.acceptAttempts.get("inv_1")).toBe(5);
  });
});
