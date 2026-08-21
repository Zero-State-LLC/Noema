import { describe, expect, it } from "vitest";
import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  classifyAdminMaterial,
  loadOperatorEnv,
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

  it("does not load group/world-readable operator secret files", () => {
    const dir = mkdtempSync(join(tmpdir(), "noema-operator-env-"));
    const path = join(dir, "operator.env");
    writeFileSync(path, "NOEMA_PERMISSION_TEST_TOKEN=too-open-token\n");
    chmodSync(path, 0o644);

    const previous = process.env.NOEMA_OPERATOR_ENV;
    process.env.NOEMA_OPERATOR_ENV = path;
    try {
      const loaded = loadOperatorEnv(dir);
      expect((loaded.values as Record<string, string>).NOEMA_PERMISSION_TEST_TOKEN).toBeUndefined();
      expect(loaded.loaded.some((entry) => entry.path === path)).toBe(false);
      expect(loaded.rejected).toEqual([
        { path, mode: 0o644, reason: "operator secret file must be owner-readable only (chmod 600)" },
      ]);
    } finally {
      if (previous === undefined) delete process.env.NOEMA_OPERATOR_ENV;
      else process.env.NOEMA_OPERATOR_ENV = previous;
    }
  });
});
