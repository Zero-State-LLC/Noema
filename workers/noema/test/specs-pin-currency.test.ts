import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { haveSpecsArtifacts } from "./specs-checkout";

const HERE = new URL(".", import.meta.url).pathname;
const COMPAT = JSON.parse(readFileSync(join(HERE, "../../../spec-compat.json"), "utf8")) as {
  specs: { commit: string; ref: string };
  hosted_live: { specs_git: string };
};
const SPECS_REPO = join(HERE, "../../../../Noema-Specs");

function inSpecs(args: string[]): string {
  return execFileSync("git", ["-C", SPECS_REPO, ...args], { encoding: "utf8" }).trim();
}

/**
 * `specs.commit` sat thirteen days behind `hosted_live.specs_git` and nothing
 * noticed, because nothing reads it — `ops/manifest.py` prefers `pin_label` and
 * only falls back to the commit, so the fallback never fires.
 *
 * The two pins mean different things. `specs.commit` is the Specs commit this
 * repository is aligned to; `hosted_live.specs_git` is the one the live Worker
 * build implements. They legitimately differ whenever Specs moves without a
 * publish — but only in one direction. A repository cannot be aligned to
 * something older than what it shipped.
 *
 * Checked when Noema-Specs is checked out beside this repo, skipped when it is
 * not, same as the GC4-S8 fixtures.
 */
describe("cross-repo Specs pin currency", () => {
  const have = haveSpecsArtifacts(join(SPECS_REPO, ".git"));

  it("declares both pins", () => {
    expect(COMPAT.specs.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(COMPAT.hosted_live.specs_git).toMatch(/^[0-9a-f]{40}$/);
  });

  it.skipIf(!have)("names commits that exist in Noema-Specs", () => {
    for (const sha of [COMPAT.specs.commit, COMPAT.hosted_live.specs_git]) {
      expect(inSpecs(["cat-file", "-t", sha])).toBe("commit");
    }
  });

  it.skipIf(!have)("is never older than the pin of the build it shipped", () => {
    const repoPin = COMPAT.specs.commit;
    const buildPin = COMPAT.hosted_live.specs_git;
    if (repoPin === buildPin) return;
    // Behind means: the repo pin is an ancestor of the build pin.
    let behind = false;
    try {
      execFileSync("git", ["-C", SPECS_REPO, "merge-base", "--is-ancestor", repoPin, buildPin]);
      behind = true;
    } catch {
      behind = false;
    }
    expect(behind, `specs.commit ${repoPin.slice(0, 8)} is behind hosted_live.specs_git ${buildPin.slice(0, 8)}`).toBe(false);
  });
});
