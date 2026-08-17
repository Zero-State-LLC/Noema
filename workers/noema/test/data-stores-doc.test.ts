import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const DOC = readFileSync(join(ROOT, "docs/DATA-STORES.md"), "utf8");

describe("DATA-STORES.md", () => {
  it("names required tables, RPCs, isolation, ownership, and deferrals", () => {
    expect(DOC).toMatch(/## Required tables/);
    expect(DOC).toMatch(/## RPCs/);
    expect(DOC).toMatch(/## Isolation rules/);
    expect(DOC).toMatch(/## Ownership/);
    expect(DOC).toMatch(/## Deferred tables/);
    expect(DOC).toContain("noema_world_heads");
    expect(DOC).toContain("noema_commit_canonical_settlement");
    expect(DOC).toContain("p_allow_bootstrap=false");
    expect(DOC).toContain("noema_adopt_live_world_head");
    expect(DOC).toContain("genesis.ef578f4ffceeccd0");
    expect(DOC).toContain("WORLD TRUTH");
    expect(DOC).toContain("Admin ≠ Player");
    expect(DOC).toContain("inspect-settlement.mjs");
    expect(DOC).toContain("revision 160");
    expect(DOC).toContain("sha256:f163f");
    expect(DOC).toMatch(/Do \*\*not\*\* apply the four disk files/);
    expect(DOC).not.toMatch(/Genesis reseed/);
  });
});
