/**
 * The cross-repo guard has to be guarded too: its whole value is that it
 * behaves differently in CI, and that difference is exactly what a green local
 * run cannot show.
 */
import { afterEach, describe, expect, it } from "vitest";
import { haveSpecsArtifacts } from "./specs-checkout";

const CI = process.env.CI;
afterEach(() => {
  if (CI === undefined) delete process.env.CI;
  else process.env.CI = CI;
});

describe("cross-repo artifact guard", () => {
  it("reports present artifacts either way", () => {
    process.env.CI = "true";
    expect(haveSpecsArtifacts(__filename)).toBe(true);
    delete process.env.CI;
    expect(haveSpecsArtifacts(__filename)).toBe(true);
  });

  it("skips locally when an artifact is missing", () => {
    delete process.env.CI;
    expect(haveSpecsArtifacts("/nonexistent/noema-specs/fixture.json")).toBe(false);
  });

  it("fails in CI instead of skipping, and names the artifact and the likely cause", () => {
    process.env.CI = "true";
    expect(() => haveSpecsArtifacts("/nonexistent/noema-specs/fixture.json")).toThrow(
      /artifact missing in CI: \/nonexistent\/noema-specs\/fixture\.json/,
    );
    expect(() => haveSpecsArtifacts("/nonexistent/x.json")).toThrow(/advance the pin/);
  });

  it("names every missing artifact, not just the first", () => {
    process.env.CI = "true";
    expect(() => haveSpecsArtifacts("/nonexistent/a.json", "/nonexistent/b.json")).toThrow(
      /a\.json, \/nonexistent\/b\.json/,
    );
  });
});
