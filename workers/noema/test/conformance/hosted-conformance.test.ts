import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const matrix = JSON.parse(readFileSync(join(here, "hosted-matrix.json"), "utf8")) as {
  target: string;
  admitted_world_prefix: string;
  forbidden_world_ids: string[];
  note: string;
  cases: Array<{
    id: string;
    title: string;
    mode: string;
    status: string;
    phase: string;
    test: string | null;
    reason?: string;
  }>;
};

const REQUIRED = Array.from({ length: 26 }, (_, i) => `C${String(i + 1).padStart(2, "0")}`);

describe("hosted C01–C26 matrix", () => {
  it("lists every Chamber case once and never targets Perihelion", () => {
    expect(matrix.target).toBe("isolated");
    expect(matrix.admitted_world_prefix).toBe("test.hosted-canonical.");
    expect(matrix.forbidden_world_ids).toContain("world.perihelion-reach");
    expect(matrix.forbidden_world_ids).toContain("world-01");
    expect(matrix.note.toLowerCase()).toContain("perihelion is not a conformance target");
    expect(matrix.cases.map((c) => c.id)).toEqual(REQUIRED);
    expect(JSON.stringify(matrix.cases)).not.toMatch(/world\.perihelion-reach/);
  });

  it("marks C14 C16 C17 skip with a reason; behavioral rows are pending or pass", () => {
    for (const c of matrix.cases) {
      if (c.mode === "skip") {
        expect(c.status).toBe("skip");
        expect(String(c.reason || "").length).toBeGreaterThan(8);
        expect(["C14", "C16", "C17"]).toContain(c.id);
      } else {
        expect(c.mode).toBe("behavioral");
        expect(["pending", "pass"]).toContain(c.status);
        if (c.status === "pass") expect(String(c.test || "")).toMatch(/\.test\.ts$/);
        if (c.status === "pending") expect(c.test).toBeNull();
      }
    }
  });
});
