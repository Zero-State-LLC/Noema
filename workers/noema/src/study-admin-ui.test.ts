import { describe, expect, it } from "vitest";
import { handleStudyAdminUiRequest } from "./study-admin-ui";

describe("Study Admin UI (/admin/studies & /study-admin/invites/:id, RFC-0131)", () => {
  it("fails closed with 404 FEATURE_DISABLED when flag is unset or false", async () => {
    for (const url of [
      "https://noema.guru/admin/studies",
      "https://noema.guru/study-admin/invites/inv_1",
    ]) {
      for (const flag of [undefined, "false", "0"]) {
        const res = handleStudyAdminUiRequest(new Request(url), flag);
        expect(res).not.toBeNull();
        expect(res!.status).toBe(404);
        const body = (await res!.json()) as { code: string };
        expect(body.code).toBe("FEATURE_DISABLED");
      }
    }
  });

  it("renders interactive Study Admin HTML when STUDY_ADMIN_UI_ENABLED is true", async () => {
    const res = handleStudyAdminUiRequest(new Request("https://noema.guru/admin/studies"), "true");
    expect(res).not.toBeNull();
    expect(res!.status).toBe(200);
    expect(res!.headers.get("Content-Type")).toContain("text/html");
    const text = await res!.text();
    expect(text).toContain("Study Admin Delegation");
    expect(text).toContain("issue-invite-form");
    expect(text).toContain("/api/admin/studies/:studyId/invites");
  });

  it("renders single-use invite acceptance page with escaped inviteId when enabled", async () => {
    const res = handleStudyAdminUiRequest(
      new Request("https://noema.guru/study-admin/invites/inv_42"),
      "true",
    );
    expect(res).not.toBeNull();
    expect(res!.status).toBe(200);
    const text = await res!.text();
    expect(text).toContain("Accept StudyAdmin Invite");
    expect(text).toContain("/api/study-admin/invites/inv_42/accept");
  });

  it("returns null for unrelated paths", () => {
    const res = handleStudyAdminUiRequest(new Request("https://noema.guru/play"), "true");
    expect(res).toBeNull();
  });
});
