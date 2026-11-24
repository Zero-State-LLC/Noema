import { describe, expect, it } from "vitest";
import { handleStudyAdminUiRequest } from "./study-admin-ui";

describe("Study Admin UI (/admin/studies, RFC-0131)", () => {
  it("fails closed with 404 FEATURE_DISABLED when flag is unset or false", async () => {
    for (const flag of [undefined, "false", "0"]) {
      const res = handleStudyAdminUiRequest(new Request("https://noema.guru/admin/studies"), flag);
      expect(res).not.toBeNull();
      expect(res!.status).toBe(404);
      const body = (await res!.json()) as { code: string };
      expect(body.code).toBe("FEATURE_DISABLED");
    }
  });

  it("renders Study Admin HTML when STUDY_ADMIN_UI_ENABLED is true", async () => {
    const res = handleStudyAdminUiRequest(new Request("https://noema.guru/admin/studies"), "true");
    expect(res).not.toBeNull();
    expect(res!.status).toBe(200);
    expect(res!.headers.get("Content-Type")).toContain("text/html");
    const text = await res!.text();
    expect(text).toContain("Study Admin Delegation");
    expect(text).toContain("/api/admin/studies/:studyId/invites");
  });

  it("returns null for unrelated paths", () => {
    const res = handleStudyAdminUiRequest(new Request("https://noema.guru/play"), "true");
    expect(res).toBeNull();
  });
});
