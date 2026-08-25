import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildCompatibilityEvidence } from "../src/compatibility-evidence";
import type { WorldRuntime } from "../src/world-actions";

function fixtureWorld(): WorldRuntime {
  const fixture = JSON.parse(
    readFileSync(decodeURIComponent(new URL("./fixtures/older-world-prod-shape-sanitized.json", import.meta.url).pathname), "utf8"),
  ) as { world: WorldRuntime };
  return fixture.world;
}

describe("production-shape compatibility evidence", () => {
  it("runs migration on a clone and returns aggregate evidence only", () => {
    const source = fixtureWorld();
    const before = structuredClone(source);
    const evidence = buildCompatibilityEvidence(source);

    expect(evidence).toMatchObject({
      pin: "do-compatibility-evidence/1",
      source_present: true,
      migration_ok: true,
      usable_before: true,
      usable_after: true,
    });
    expect(evidence.raw_node_count).toBeGreaterThan(0);
    expect(evidence.migrated_node_count).toBeGreaterThanOrEqual(evidence.raw_node_count);
    expect(evidence.added_node_count).toBe(evidence.migrated_node_count - evidence.raw_node_count);
    expect(evidence.subsystem_cardinality).toMatchObject({
      rooms: 2,
      players: 2,
      organizations: 1,
      trades: 1,
      agreements: 1,
      messages: 1,
    });
    expect(source).toEqual(before);

    const serialized = JSON.stringify(evidence);
    expect(serialized).not.toMatch(/agent-aloe|agent-birch|civic-repair|repair compact held/i);
    expect(Object.keys(evidence).sort()).toEqual([
      "added_node_count",
      "migrated_node_count",
      "migration_ok",
      "mismatch_count",
      "persisted_values_preserved",
      "pin",
      "raw_node_count",
      "source_present",
      "subsystem_cardinality",
      "usable_after",
      "usable_before",
    ]);
  });

  it("fails closed when no stored world exists", () => {
    expect(buildCompatibilityEvidence(undefined)).toMatchObject({
      source_present: false,
      migration_ok: false,
      usable_before: false,
      usable_after: false,
      raw_node_count: 0,
      migrated_node_count: 0,
    });
  });
});
