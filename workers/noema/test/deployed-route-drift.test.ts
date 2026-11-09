import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { classifyProbe, diffRoutes, extractRoutes, isProbeable, summarize } from "../scripts/deployed-route-drift.mjs";

function runIsolatedRouteDrift(addedRoute?: string) {
  const workerDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const fixture = mkdtempSync(join(tmpdir(), "noema-route-drift-"));
  try {
    // Reuse an existing commit; never commit or edit the contributor's checkout.
    const clone = spawnSync("git", ["clone", "--shared", "--no-checkout", resolve(workerDir, "../.."), fixture], { encoding: "utf8", timeout: 10000 });
    expect(clone.status, clone.stderr).toBe(0);
    const router = spawnSync("git", ["show", "HEAD:workers/noema/src/index.ts"], { cwd: fixture, encoding: "utf8", timeout: 10000 });
    expect(router.status, router.stderr).toBe(0);
    const fixtureWorker = join(fixture, "workers/noema");
    mkdirSync(join(fixtureWorker, "src"), { recursive: true });
    mkdirSync(join(fixtureWorker, "scripts"), { recursive: true });
    const addition = addedRoute
      ? `\nfunction fixtureRoute(request: Request, path: string) { if (request.method === "POST" && path === ${JSON.stringify(addedRoute)}) return new Response("fixture"); }\n`
      : "";
    writeFileSync(join(fixtureWorker, "src/index.ts"), router.stdout + addition);
    copyFileSync(join(workerDir, "scripts/deployed-route-drift.mjs"), join(fixtureWorker, "scripts/deployed-route-drift.mjs"));
    return spawnSync(process.execPath, ["scripts/deployed-route-drift.mjs", "--live-ref", "HEAD"], { cwd: fixtureWorker, encoding: "utf8", timeout: 10000 });
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

/**
 * #571 showed the enrollment repairs were merged and not live using one hand-run
 * probe pair: an added route 404s while a deployed control 401s. That reasoning
 * lived in a PR body. This is the same reasoning as code.
 */
describe("deployed-route drift", () => {
  it("runs from the Worker package directory shown by its usage", () => {
    const run = runIsolatedRouteDrift();
    expect(run.status, run.stderr).toBe(0);
    expect(run.stdout).toContain("routes added since the live build: (none)");
  });

  it("reports an uncommitted added route from an isolated Worker fixture", () => {
    const run = runIsolatedRouteDrift("/v1/fixture/route-drift-control");
    expect(run.status, run.stderr).toBe(0);
    expect(run.stdout).toContain("routes added since the live build: POST /v1/fixture/route-drift-control");
    expect(run.stdout).not.toContain("routes added since the live build: (none)");
  });

  it("extracts routes with their method, and marks path-only routes ANY", () => {
    const src = `
      if (request.method === "GET" && path === "/health") return ok();
      if (request.method === "POST" && path === "/v1/auth/device/review/approve") return a();
      if (path === "/memo") return memo();
    `;
    expect(extractRoutes(src)).toEqual([
      "ANY /memo",
      "GET /health",
      "POST /v1/auth/device/review/approve",
    ]);
  });

  it("only probes GET, because the real method would mutate production", () => {
    // The bug this fixes: the first real run reported two live POST routes as
    // ABSENT, because a POST-only route probed with GET falls through the
    // router to 404 — indistinguishable from missing. 27 of 50 routes are POST.
    //
    // The naive repair is worse than the bug. Sending the real method would
    // POST to /v1/auth/device/review/approve against production, which could
    // approve a live device enrollment. A drift detector must never mutate the
    // thing it measures.
    expect(isProbeable("GET /health")).toBe(true);
    expect(isProbeable("ANY /memo")).toBe(true);
    expect(isProbeable("POST /v1/auth/device/review/approve")).toBe(false);
    expect(isProbeable("DELETE /x")).toBe(false);
  });

  it("known limitation: a route-shaped string inside a literal is matched too", () => {
    // A regex over source cannot exclude occurrences inside string literals
    // without parsing, and this asserts the real behaviour rather than a
    // property the extractor does not hold.
    //
    // The fail-direction is the safe one. A phantom route probes 404 → ABSENT →
    // "NOT PUBLISHED", so the error is a visible false alarm, never a false
    // all-clear. If index.ts ever contains such a string the report says so out
    // loud, which is the moment to reach for a parser.
    const src = `const notARoute = 'path === "/decoy"';`;
    expect(extractRoutes(src)).toEqual(["ANY /decoy"]);
  });

  it("reports routes added since the live build, and any removed", () => {
    const live = `path === "/health"\npath === "/ready"`;
    const main = `path === "/health"\nrequest.method === "POST" && path === "/v1/auth/device/review/approve"`;
    expect(diffRoutes(live, main)).toEqual({
      added: ["POST /v1/auth/device/review/approve"],
      removed: ["ANY /ready"],
    });
  });

  it("reads 404 as absent and every other status as deployed-and-rejecting", () => {
    // The load-bearing distinction from #571: /v1/auth/device/review → 404
    // (router fell through) versus /v1/auth/device/preview → 401 (handler ran
    // and rejected a missing token). A rejection proves presence.
    expect(classifyProbe(404)).toBe("ABSENT");
    expect(classifyProbe(401)).toBe("PRESENT");
    expect(classifyProbe(400)).toBe("PRESENT");
    expect(classifyProbe(405)).toBe("PRESENT");
    expect(classifyProbe(200)).toBe("PRESENT");
  });

  it("treats an unreachable origin as undetermined, never as absent", () => {
    // Same asymmetry the freshness monitors use: unreachable is indeterminate,
    // reachable-and-wrong is drift. A network blip must not read as "not live".
    expect(classifyProbe(null)).toBe("UNDETERMINED");
    expect(classifyProbe(undefined)).toBe("UNDETERMINED");
    expect(summarize([{ route: "/x", verdict: "UNDETERMINED" }]).published).toBe(false);
  });

  it("calls a publish complete only when every PROBED route answers", () => {
    expect(summarize([{ route: "GET /a", verdict: "PRESENT" }, { route: "GET /b", verdict: "PRESENT" }]).published).toBe(true);
    expect(summarize([{ route: "GET /a", verdict: "PRESENT" }, { route: "GET /b", verdict: "ABSENT" }]).published).toBe(false);
    // No added routes is not evidence of a publish.
    expect(summarize([]).published).toBe(false);
    // Unprobeable routes do not block the verdict, but they are reported so
    // partial coverage is visible instead of implied...
    const mixed = summarize([
      { route: "GET /a", verdict: "PRESENT" },
      { route: "POST /b", verdict: "UNPROBEABLE" },
    ]);
    expect(mixed.published).toBe(true);
    expect(mixed.unprobeable).toEqual(["POST /b"]);
    // ...and a run that probed nothing is never "published", however many
    // unprobeable routes it saw.
    expect(summarize([{ route: "POST /b", verdict: "UNPROBEABLE" }]).published).toBe(false);
  });
});
