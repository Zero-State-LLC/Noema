import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";

import {
  pullRequestBody,
  runCli,
  updateHostedLivePin,
  validatePinEqualsLive,
} from "../scripts/worker-pin-pr.mjs";

const SOURCE = "0123456789abcdef0123456789abcdef01234567";

function compat() {
  return {
    schema_version: "noema-runtime-spec-compat/1.0",
    hosted_live: {
      world_id: "world.perihelion-reach-3",
      worker_version_id: "old-worker",
      specs_git: "26d840b13f789f2264c056bc6a97534e1977650d",
      note: "old note",
    },
  };
}

function live(worker = "new-worker") {
  return {
    product: "noema",
    stage: "0",
    env: "production",
    protocol_version: "1",
    world_id: "world.perihelion-reach-3",
    worker_version_id: worker,
    deployed_at: "2026-08-25T00:00:00.000Z",
  };
}

describe("worker pin PR generator", () => {
  test("updates only after live evidence and records source commit plus deployment timestamp", () => {
    const result = updateHostedLivePin(compat(), {
      live: live(),
      sourceCommit: SOURCE,
      fetchedAt: "2026-08-25T00:01:00.000Z",
      evidenceUrl: "https://noema.guru/version",
    });

    expect(result.previousWorkerVersionId).toBe("old-worker");
    expect(result.compat.hosted_live.worker_version_id).toBe("new-worker");
    expect(result.compat.hosted_live.source_commit).toBe(SOURCE);
    expect(result.compat.hosted_live.deployed_at).toBe("2026-08-25T00:00:00.000Z");
    expect(result.compat.hosted_live.version_evidence).toMatchObject({
      url: "https://noema.guru/version",
      fetched_at: "2026-08-25T00:01:00.000Z",
      worker_version_id: "new-worker",
      source_commit: SOURCE,
      env: "production",
    });
    expect(result.compat.hosted_live.specs_git).toBe("26d840b13f789f2264c056bc6a97534e1977650d");
    expect(result.compat.hosted_live.note).toContain("READ from GET /version after successful production deployment");
    expect(() => validatePinEqualsLive(result.compat, live())).not.toThrow();
  });

  test("rejects live/pin mismatch", () => {
    expect(() => validatePinEqualsLive(compat(), live("other-worker"))).toThrow(
      /does not match live \/version/,
    );
  });

  test("rejects missing live deployment timestamp and invalid source commit", () => {
    expect(() => updateHostedLivePin(compat(), { live: { worker_version_id: "new" }, sourceCommit: SOURCE })).toThrow(
      /missing deployed_at/,
    );
    expect(() => updateHostedLivePin(compat(), { live: live(), sourceCommit: "main" })).toThrow(
      /source commit/,
    );
  });

  test("CLI generates spec-compat edit, validates it, and writes review-preserving PR body", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "noema-pin-"));
    const compatPath = path.join(dir, "spec-compat.json");
    const livePath = path.join(dir, "live-version.json");
    const bodyPath = path.join(dir, "body.md");
    fs.writeFileSync(compatPath, `${JSON.stringify(compat(), null, 2)}\n`);
    fs.writeFileSync(livePath, `${JSON.stringify(live(), null, 2)}\n`);

    runCli([
      "generate",
      "--compat",
      compatPath,
      "--live",
      livePath,
      "--source-commit",
      SOURCE,
      "--fetched-at",
      "2026-08-25T00:01:00.000Z",
      "--body-output",
      bodyPath,
    ]);
    runCli(["validate", "--compat", compatPath, "--live", livePath]);

    const updated = JSON.parse(fs.readFileSync(compatPath, "utf8"));
    expect(updated.hosted_live.worker_version_id).toBe("new-worker");
    const body = fs.readFileSync(bodyPath, "utf8");
    expect(body).toContain("generated only after `npm run deploy` completed successfully");
    expect(body).toContain("CODEOWNERS review protection is preserved");
    expect(pullRequestBody(updateHostedLivePin(compat(), { live: live(), sourceCommit: SOURCE }))).toContain(
      "Closes #554",
    );
  });
});
