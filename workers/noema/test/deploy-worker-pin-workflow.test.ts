/**
 * Pins the production deploy+pin workflow as dispatch-only with an explicit ACK.
 * Merging the workflow must not deploy.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../../..");
const DEPLOY = readFileSync(join(ROOT, ".github/workflows/deploy-worker-pin-pr.yml"), "utf8");
const PIN_CURRENCY = readFileSync(join(ROOT, ".github/workflows/pin-currency.yml"), "utf8");
const REQUIRED_ACK = "I_ACKNOWLEDGE_PRODUCTION_DEPLOY_AND_PIN";

describe("deploy-worker-pin-pr workflow", () => {
  it("is workflow_dispatch only and requires the production ACK", () => {
    expect(DEPLOY).toContain("workflow_dispatch:");
    expect(DEPLOY).toContain(`acknowledge:`);
    expect(DEPLOY).toContain(REQUIRED_ACK);
    expect(DEPLOY).toMatch(/inputs:\n {6}acknowledge:/);
    expect(DEPLOY).not.toMatch(/^on:\n(?:.*\n)* {2}push:/m);
    expect(DEPLOY).not.toMatch(/^on:\n(?:.*\n)* {2}pull_request:/m);
    expect(DEPLOY).toContain("Merging this workflow does not deploy");
  });

  it("refuses frozen PLAY and only then runs production deploy + pin PR", () => {
    expect(DEPLOY).toContain("Refuse frozen first world as PLAY default");
    expect(DEPLOY).toContain("world-01");
    expect(DEPLOY).toContain("world.perihelion-reach-3");
    expect(DEPLOY).toContain("npm run deploy");
    expect(DEPLOY).toContain("gh pr create --base main");
    expect(DEPLOY).not.toContain("gh pr merge");
    expect(DEPLOY).not.toMatch(/git push(?: --force-with-lease)? origin main\b/);
    expect(DEPLOY.indexOf("Refuse missing production-deploy acknowledgement")).toBeLessThan(
      DEPLOY.indexOf("npm run deploy"),
    );
    expect(DEPLOY.indexOf("Refuse frozen first world as PLAY default")).toBeLessThan(
      DEPLOY.indexOf("npm run deploy"),
    );
  });
});

describe("pin-currency PR gate", () => {
  it("only gates spec-compat.json edits", () => {
    expect(PIN_CURRENCY).toContain("pull_request:");
    expect(PIN_CURRENCY).toContain("spec-compat.json");
    expect(PIN_CURRENCY).toMatch(/paths:\n {6}- "spec-compat.json"/);
  });
});
