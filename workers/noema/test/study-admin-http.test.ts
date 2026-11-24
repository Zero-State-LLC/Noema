import { describe, expect, it } from "vitest";
import { StudyAdminStore } from "../src/study-admin";
import { handleStudyAdminRequest } from "../src/study-admin-http";

const ORIGIN = "https://noema.guru";
const T0 = Date.UTC(2026, 10, 24, 14, 0, 0);

describe("RFC-0131 Study Admin HTTP router", () => {
  it("returns 404 FEATURE_DISABLED when STUDY_ADMIN_UI_ENABLED is unset or false", async () => {
    const store = new StudyAdminStore();
    const req = new Request(`${ORIGIN}/api/admin/studies/s1/invites`, {
      method: "POST",
      headers: { Origin: ORIGIN, "Content-Type": "application/json" },
      body: JSON.stringify({ human_principal_id: "hp_1" }),
    });
    const res = await handleStudyAdminRequest(req, { store, envFlag: undefined });
    expect(res?.status).toBe(404);
    const body = (await res?.json()) as { code: string };
    expect(body.code).toBe("FEATURE_DISABLED");
  });

  it("rejects cross-origin CSRF and missing fresh Admin auth derivative", async () => {
    const store = new StudyAdminStore();
    const csrfReq = new Request(`${ORIGIN}/api/admin/studies/s1/invites`, {
      method: "POST",
      headers: {
        Origin: "https://evil.example",
        "X-Noema-Admin-Actor": "admin_1",
        "X-Noema-Admin-Auth-Event": "auth_1",
      },
      body: JSON.stringify({ human_principal_id: "hp_1" }),
    });
    const csrfRes = await handleStudyAdminRequest(csrfReq, { store, envFlag: "true" });
    expect(csrfRes?.status).toBe(403);

    const noAuthReq = new Request(`${ORIGIN}/api/admin/studies/s1/invites`, {
      method: "POST",
      headers: { Origin: ORIGIN, "Content-Type": "application/json" },
      body: JSON.stringify({ human_principal_id: "hp_1" }),
    });
    const noAuthRes = await handleStudyAdminRequest(noAuthReq, { store, envFlag: "true" });
    expect(noAuthRes?.status).toBe(401);
  });

  it("supports end-to-end invite -> accept -> revoke -> audit log over HTTP", async () => {
    const store = new StudyAdminStore();
    let now = T0;
    const ctx = { store, envFlag: "true", nowMs: () => now };

    const issueRes = await handleStudyAdminRequest(
      new Request(`${ORIGIN}/api/admin/studies/study_alpha/invites`, {
        method: "POST",
        headers: {
          Origin: ORIGIN,
          "Content-Type": "application/json",
          "X-Noema-Admin-Actor": "admin_1",
          "X-Noema-Admin-Auth-Event": "auth_evt_1",
        },
        body: JSON.stringify({ human_principal_id: "hp_42", ttl_days: 7 }),
      }),
      ctx,
    );
    expect(issueRes?.status).toBe(201);
    const issued = (await issueRes?.json()) as { invite: { invite_id: string } };

    now += 1000;
    const acceptRes = await handleStudyAdminRequest(
      new Request(`${ORIGIN}/api/study-admin/invites/${issued.invite.invite_id}/accept`, {
        method: "POST",
        headers: {
          Origin: ORIGIN,
          "X-Noema-Human-Principal": "hp_42",
          "X-Noema-Auth-Event": "auth_evt_2",
        },
      }),
      ctx,
    );
    expect(acceptRes?.status).toBe(200);

    now += 1000;
    const revokeRes = await handleStudyAdminRequest(
      new Request(`${ORIGIN}/api/admin/studies/study_alpha/grants/hp_42/revoke`, {
        method: "POST",
        headers: {
          Origin: ORIGIN,
          "X-Noema-Admin-Actor": "admin_1",
          "X-Noema-Admin-Auth-Event": "auth_evt_3",
        },
      }),
      ctx,
    );
    expect(revokeRes?.status).toBe(200);

    const auditRes = await handleStudyAdminRequest(
      new Request(`${ORIGIN}/api/admin/studies/study_alpha/audit`, {
        method: "GET",
        headers: { "X-Noema-Admin-Auth-Event": "auth_evt_4" },
      }),
      ctx,
    );
    expect(auditRes?.status).toBe(200);
    const audit = (await auditRes?.json()) as { events: Array<{ event_type: string }> };
    expect(audit.events.map((e) => e.event_type)).toEqual([
      "invite_issued",
      "invite_accepted",
      "grant_revoked",
    ]);
  });
});
