import { describe, expect, it } from "vitest";
import {
  classifyAdminMaterial,
  parseOperatorEnv,
  resolveAdminMaterial,
} from "../scripts/operator-env.mjs";

describe("operator-env", () => {
  it("parses KEY=value and ignores comments", () => {
    const got = parseOperatorEnv("# hi\nADMIN_OPERATOR_TOKEN=sekrit-value\nEMPTY=\nBAD line\n");
    expect(got).toEqual({ ADMIN_OPERATOR_TOKEN: "sekrit-value" });
  });

  it("classifies JWT vs operator secret", () => {
    expect(classifyAdminMaterial("aaa.bbb.ccc").kind).toBe("admin_jwt");
    expect(classifyAdminMaterial("operator-token-ok").kind).toBe("operator_secret");
    expect(classifyAdminMaterial("").ok).toBe(false);
  });

  it("prefers env over file and never requires printing", () => {
    const file = { ADMIN_OPERATOR_TOKEN: "from-file-token" };
    const env = { ADMIN_TOKEN: "from-env-token-ok" };
    const got = resolveAdminMaterial(env, file);
    expect(got.present).toBe(true);
    expect(got.source).toBe("env.ADMIN_TOKEN");
    expect(got.kind).toBe("operator_secret");
    const fileOnly = resolveAdminMaterial({}, file);
    expect(fileOnly.source).toBe("file.ADMIN_OPERATOR_TOKEN");
    expect(resolveAdminMaterial({}, {}).present).toBe(false);
  });
});
