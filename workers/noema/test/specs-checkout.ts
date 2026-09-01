import { existsSync } from "node:fs";

/**
 * Cross-repo guard: skip locally, fail loudly in CI.
 *
 * Several suites read fixtures from Noema-Specs checked out beside this repo
 * and guard themselves with `skipIf(!have)` so a bare clone still runs. That is
 * right locally and wrong in CI, where the artifact is supposed to be there:
 * a missing one turns the suite green while checking nothing.
 *
 * This is not hypothetical. Noema CI clones Noema-Specs pinned to
 * `spec-compat.json` `specs.commit`, not main. When RFC-0129 landed in Specs,
 * that pin still named a commit from before it, so the RFC-0129 conformance
 * fixtures did not exist in the CI checkout and its whole suite would have
 * skipped — passing while proving nothing (Noema #608). The same trap is open
 * to every cross-repo suite whenever the pin lags an artifact it needs.
 *
 * In CI a missing artifact now names itself and the likely cause. Locally the
 * skip is preserved, so a bare clone still runs the suite.
 */
export function haveSpecsArtifacts(...paths: string[]): boolean {
  const missing = paths.filter((p) => !existsSync(p));
  if (missing.length === 0) return true;
  if (process.env.CI) {
    throw new Error(
      [
        `Noema-Specs artifact missing in CI: ${missing.join(", ")}.`,
        "CI clones Noema-Specs at spec-compat.json `specs.commit`, not main.",
        "If the artifact landed in Specs after that commit, advance the pin;",
        "otherwise fix the path. Skipping here would pass while checking nothing.",
      ].join(" "),
    );
  }
  return false;
}
