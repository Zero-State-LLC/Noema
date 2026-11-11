import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("#777 hosted G5 probe", () => {
  it("exits NOT_COMPUTABLE when no isolated base is configured", () => {
    const result = spawnSync(process.execPath, ["scripts/hosted-g5-probe.mjs"], {
      cwd: root,
      env: { PATH: process.env.PATH || "" },
      encoding: "utf8",
    });
    expect(result.status).toBe(2);
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: "NOT_COMPUTABLE",
      alarm: "not_run",
      hibernated: "not_run",
    });
  });
});
