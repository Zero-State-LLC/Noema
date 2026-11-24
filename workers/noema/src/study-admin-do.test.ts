import { describe, expect, it } from "vitest";
import { StudyAdminDO, type StudyAdminDOState } from "./study-admin-do";

function makeMemoryState(): { state: StudyAdminDOState; map: Map<string, unknown> } {
  const map = new Map<string, unknown>();
  const state: StudyAdminDOState = {
    storage: {
      async get<T = unknown>(key: string): Promise<T | undefined> {
        return map.get(key) as T | undefined;
      },
      async put<T = unknown>(key: string, value: T): Promise<void> {
        map.set(key, structuredClone(value));
      },
    },
  };
  return { state, map };
}

describe("StudyAdminDO (ADR-0004)", () => {
  it("fails closed when STUDY_ADMIN_UI_ENABLED is unset or false and does not write storage", async () => {
    const { state, map } = makeMemoryState();
    const obj = new StudyAdminDO(state, { STUDY_ADMIN_UI_ENABLED: "false" });
    const res = await obj.fetch(
      new Request("https://noema.guru/api/admin/studies/study-alpha/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Noema-Admin-Actor": "admin-root",
          "X-Noema-Admin-Auth-Event": "auth-1",
        },
        body: JSON.stringify({ human_principal_id: "human-1" }),
      }),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("FEATURE_DISABLED");
    expect(map.size).toBe(0);
  });

  it("persists invites, grants, audit events, and ID sequence across DO recreation", async () => {
    const { state } = makeMemoryState();

    // Instance 1: issue and accept invite
    const do1 = new StudyAdminDO(state, { STUDY_ADMIN_UI_ENABLED: "true" });
    const issueRes = await do1.fetch(
      new Request("https://noema.guru/api/admin/studies/study-alpha/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Noema-Admin-Actor": "admin-root",
          "X-Noema-Admin-Auth-Event": "auth-100",
        },
        body: JSON.stringify({ human_principal_id: "human-alice" }),
      }),
    );
    expect(issueRes.status).toBe(201);
    const issued = (await issueRes.json()) as { ok: boolean; invite: { invite_id: string } };
    expect(issued.ok).toBe(true);

    const acceptRes = await do1.fetch(
      new Request(`https://noema.guru/api/study-admin/invites/${issued.invite.invite_id}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Noema-Human-Principal": "human-alice",
          "X-Noema-Auth-Event": "auth-101",
        },
      }),
    );
    expect(acceptRes.status).toBe(200);

    // Instance 2 (simulating eviction / fresh DO instance with same durable storage)
    const do2 = new StudyAdminDO(state, { STUDY_ADMIN_UI_ENABLED: "true" });
    const auditRes = await do2.fetch(
      new Request("https://noema.guru/api/admin/studies/study-alpha/audit", {
        headers: { "X-Noema-Admin-Auth-Event": "auth-102" },
      }),
    );
    expect(auditRes.status).toBe(200);
    const auditBody = (await auditRes.json()) as { ok: boolean; events: { event_type: string }[] };
    expect(auditBody.ok).toBe(true);
    expect(auditBody.events.map((e) => e.event_type)).toEqual(["invite_issued", "invite_accepted"]);

    // Issuing a new invite on do2 must not collide with prior invite_id
    const issue2Res = await do2.fetch(
      new Request("https://noema.guru/api/admin/studies/study-alpha/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Noema-Admin-Actor": "admin-root",
          "X-Noema-Admin-Auth-Event": "auth-103",
        },
        body: JSON.stringify({ human_principal_id: "human-bob" }),
      }),
    );
    expect(issue2Res.status).toBe(201);
    const issued2 = (await issue2Res.json()) as { invite: { invite_id: string } };
    expect(issued2.invite.invite_id).not.toBe(issued.invite.invite_id);
  });
});
