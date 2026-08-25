import { describe, expect, it } from "vitest";
import { classifyProbe, diffRoutes, extractRoutes, summarize } from "../scripts/deployed-route-drift.mjs";

/**
 * #571 showed the enrollment repairs were merged and not live using one hand-run
 * probe pair: an added route 404s while a deployed control 401s. That reasoning
 * lived in a PR body. This is the same reasoning as code.
 */
describe("deployed-route drift", () => {
  it("extracts route literals, deduplicated and sorted", () => {
    const src = `
      if (request.method === "GET" && path === "/health") return ok();
      if (path === "/v1/auth/device/review") return review();
      if (path === "/health") return ok();
    `;
    expect(extractRoutes(src)).toEqual(["/health", "/v1/auth/device/review"]);
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
    expect(extractRoutes(src)).toEqual(["/decoy"]);
  });

  it("reports routes added since the live build, and any removed", () => {
    const live = `path === "/health"\npath === "/ready"`;
    const main = `path === "/health"\npath === "/v1/auth/device/review"`;
    expect(diffRoutes(live, main)).toEqual({
      added: ["/v1/auth/device/review"],
      removed: ["/ready"],
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

  it("calls a publish complete only when every added route answers", () => {
    expect(summarize([{ route: "/a", verdict: "PRESENT" }, { route: "/b", verdict: "PRESENT" }]).published).toBe(true);
    expect(summarize([{ route: "/a", verdict: "PRESENT" }, { route: "/b", verdict: "ABSENT" }]).published).toBe(false);
    // No added routes is not evidence of a publish.
    expect(summarize([]).published).toBe(false);
  });
});
