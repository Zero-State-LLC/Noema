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
 * RFC-0127 (Specs `bc30fae7`) catalogued TRADE_CANCELLED on event-catalog/0.2.
 * The Worker has emitted it since 2026-08-12; WATCH already projects
 * "…withdrew a trade". Chamber 0.1 stays 24 types and does not include it.
 *
 * There is no exception list. A new uncatalogued emit fails the scan.
 */

/**
 * Catalogued types the Worker never emits. Four are explicable:
 * BUDGET_EXCEEDED and MOVE_REJECTED are refusal codes passed to fail(), not
 * ledger events; SITUATION_INJECTED and NOISE_APPLIED belong to the offline
 * research spine.
 *
 * CRIME_DETECTED is not. The hosted world carries every consumer of it — a
 * MAJOR WATCH tier, a redacted public projection, a glyph, danger-evidence
 * credit in social-memory, a world-report section — and no producer. RFC-0002
 * §Detection requires witness, sensor, investigation, or self-report, and the
 * Worker implements none, so the event cannot occur. Crime is specified,
 * consumed, and unproduced.
 *
 * Pinned so that wiring it fails here, which is the signal to revisit the
 * RFC-0002 row in docs/RFC-RUNTIME-AUDIT-2026-08-23.md rather than leaving it
 * stale.
 */
const NEVER_EMITTED = [
  "BUDGET_EXCEEDED",
  "CRIME_DETECTED",
  "MOVE_REJECTED",
  "NOISE_APPLIED",
  "SITUATION_INJECTED",
];

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
    const offenders = [...emittedEventTypes().keys()].filter((t) => !allowed.has(t)).sort();
    expect(offenders).toEqual([]);
  });

  it.skipIf(!have)("catalogues the TRADE_CANCELLED emit on 0.2", () => {
    const c01 = catalog("event-types.json");
    const c02 = catalog("event-types.0.2.json");
    expect(c01.has("TRADE_CANCELLED")).toBe(false);
    expect(c02.has("TRADE_CANCELLED")).toBe(true);
    const allowed = new Set([...c01, ...c02]);
    const gaps = [...emittedEventTypes().keys()].filter((t) => !allowed.has(t)).sort();
    expect(gaps).toEqual([]);
  });

  it.skipIf(!have)("still emits none of the catalogued types it has never emitted", () => {
    const emitted = emittedEventTypes();
    const allowed = new Set([...catalog("event-types.json"), ...catalog("event-types.0.2.json")]);
    const unemitted = [...allowed].filter((t) => !emitted.has(t)).sort();
    expect(unemitted).toEqual([...NEVER_EMITTED].sort());
  });

  it("consumes CRIME_DETECTED without producing it", () => {
    const consumers = readdirSync(SRC)
      .filter((f) => f.endsWith(".ts"))
      .filter((f) => readFileSync(join(SRC, f), "utf8").includes("CRIME_DETECTED"));
    // Several files read it — WATCH projection, social memory, world reports.
    expect(consumers.length).toBeGreaterThanOrEqual(3);
    // None emits it.
    expect(emittedEventTypes().has("CRIME_DETECTED")).toBe(false);
  });

  it.skipIf(!have)("implements 0.2, and spec-compat says so for the hosted half", () => {
    const compat = JSON.parse(readFileSync(join(HERE, "../../../spec-compat.json"), "utf8")) as {
      versions: { event_catalog: string };
      hosted_runtime: { event_catalog?: string };
    };
    // One field cannot describe two runtimes. versions.event_catalog is the
    // offline Python pin, whose REDUCERS registry is exactly the 24 types of
    // 0.1; hosted_runtime.event_catalog is this Worker.
    expect(compat.versions.event_catalog).toBe("event-catalog/0.1");
    expect(compat.hosted_runtime.event_catalog).toBe("event-catalog/0.2");

    const c01 = catalog("event-types.json");
    const emitted = [...emittedEventTypes().keys()];
    const beyond01 = emitted.filter((t) => !c01.has(t)).sort();
    // Authorized by RFC-0002, RFC-0101, and RFC-0127. TRADE_CANCELLED is on
    // 0.2 and still absent from Chamber 0.1.
    expect(beyond01).toEqual([
      "ACCESS_RESTRICTED",
      "AGREEMENT_BROKEN",
      "AGREEMENT_FORMED",
      "CONTEST_DECLARED",
      "CONTEST_RESOLVED",
      "INFRASTRUCTURE_DISRUPTED",
      "TRADE_CANCELLED",
    ]);
  });

  it.skipIf(!have)("pins the catalog sizes the Specs validator asserts", () => {
    expect(catalog("event-types.json").size).toBe(24);
    expect(catalog("event-types.0.2.json").size).toBe(32);
  });
});
