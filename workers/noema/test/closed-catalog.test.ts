import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const HERE = new URL(".", import.meta.url).pathname;
const SRC = join(HERE, "../src");
const SPECS = join(HERE, "../../../../Noema-Specs/specs");

/**
 * "Closed catalogs — expand event types only via RFC" is an architecture
 * constraint (SPEC-FREEZE-CORE-LOOP §5.8), and nothing enforced it across the
 * repo boundary. This does: every event type the Worker emits must appear in
 * `event-types.json` (0.1) or `event-types.0.2.json` (0.2).
 *
 * Checked when Noema-Specs is checked out beside this repo, skipped when it is
 * not — the GC4-S8 fixtures pattern.
 */

/** Literal event types passed to pushEvent(), including through a ternary. */
function emittedEventTypes(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  for (const file of readdirSync(SRC).filter((f) => f.endsWith(".ts"))) {
    const text = readFileSync(join(SRC, file), "utf8");
    for (const call of text.matchAll(/pushEvent\(([^,]{0,200}?),/gs)) {
      for (const lit of call[1].matchAll(/"([A-Z_]{3,40})"/g)) {
        const list = found.get(lit[1]) || [];
        if (!list.includes(file)) list.push(file);
        found.set(lit[1], list);
      }
    }
  }
  return found;
}

function catalog(file: string): Set<string> {
  const doc = JSON.parse(readFileSync(join(SPECS, file), "utf8")) as {
    "x-noema-event-types": { eventType: string }[];
  };
  return new Set(doc["x-noema-event-types"].map((r) => r.eventType));
}

/**
 * Emitted, publicly projected as "…withdrew a trade", and in neither catalog.
 * Present in the Worker since 2026-08-12 and never in the offline Python
 * runtime. `docs/GC4-S2-INSTITUTION-ACTIONS.md` calls it "existing" alongside
 * the three catalogued TRADE_* types, so the likeliest reading is a catalog
 * omission rather than a rogue addition — but the catalog is the closure
 * authority, and adding a type to it is an RFC decision, not a test's.
 *
 * Raised on the Specs side. Listed here so a NEW uncatalogued type fails
 * instead of hiding behind this one.
 */
const KNOWN_UNCATALOGUED = ["TRADE_CANCELLED"];

describe("closed event catalog conformance", () => {
  const have = existsSync(join(SPECS, "event-types.json"));

  it("finds the Worker's emitted event types", () => {
    const emitted = emittedEventTypes();
    expect(emitted.size).toBeGreaterThan(20);
    expect(emitted.has("ENTITY_UPDATE")).toBe(true);
    // The ternary form must be picked up, or the check silently under-reports.
    expect(emitted.has("TRADE_CANCELLED")).toBe(true);
    expect(emitted.has("TRADE_REJECTED")).toBe(true);
  });

  it.skipIf(!have)("emits no event type outside the closed catalog", () => {
    const allowed = new Set([...catalog("event-types.json"), ...catalog("event-types.0.2.json")]);
    const offenders = [...emittedEventTypes().keys()]
      .filter((t) => !allowed.has(t))
      .filter((t) => !KNOWN_UNCATALOGUED.includes(t))
      .sort();
    expect(offenders).toEqual([]);
  });

  it.skipIf(!have)("still has exactly one known gap, and it is the documented one", () => {
    const allowed = new Set([...catalog("event-types.json"), ...catalog("event-types.0.2.json")]);
    const gaps = [...emittedEventTypes().keys()].filter((t) => !allowed.has(t)).sort();
    // Fails if the Specs side closes the gap, which is the point — the
    // exception should not outlive the decision that justifies it.
    expect(gaps).toEqual([...KNOWN_UNCATALOGUED].sort());
  });

  it.skipIf(!have)("pins the catalog sizes the Specs validator asserts", () => {
    expect(catalog("event-types.json").size).toBe(24);
    expect(catalog("event-types.0.2.json").size).toBe(31);
  });
});
