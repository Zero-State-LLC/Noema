import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { haveSpecsArtifacts } from "./specs-checkout";

const HERE = new URL(".", import.meta.url).pathname;
const SRC = join(HERE, "../src");
const SPECS = join(HERE, "../../../../Noema-Specs/specs");

/**
 * Every GC slice ships a machine-readable catalog pinning the numbers and the
 * player-facing copy the runtime is supposed to use. There are 140 such
 * behavioural contracts in Specs; the runtimes read 19, and all 19 belong to the
 * offline research spine. The Worker — which implements the game slices — reads
 * none of them.
 *
 * It agrees with them anyway: 44 of 47 catalog-pinned player-facing strings
 * appear verbatim in Worker source. That agreement is currently a coincidence
 * maintained by hand, and an amendment on either side breaks it silently. This
 * makes it checked.
 *
 * Runs when Noema-Specs is checked out beside this repo, which CI now does.
 */
const GAME_CATALOG =
  /(gc\d+-s|wr-s|diplomacy-catalog|access-policy-catalog|office-catalog|orientation-catalog|reconstruction-catalog)/;
const COPY_FIELD = /(_line|_pulse)$/;

function workerSource(): string {
  const read = (dir: string): string =>
    readdirSync(dir, { withFileTypes: true })
      .map((e) => (e.isDirectory() ? read(join(dir, e.name)) : e.name.endsWith(".ts") ? readFileSync(join(dir, e.name), "utf8") : ""))
      .join("\n");
  return read(SRC);
}

type Finding = { catalog: string; field: string; value: string };

function copyStrings(): Finding[] {
  const out: Finding[] = [];
  // Nested too: several catalogs put lines inside arrays of reason objects, and
  // a top-level-only scan silently checks two thirds of them.
  const walk = (node: unknown, file: string, path: string): void => {
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, file, `${path}[${i}]`));
    } else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) walk(v, file, `${path}.${k}`);
    } else if (typeof node === "string" && node.length > 12) {
      const leaf = path.split(".").pop()!.replace(/\[\d+\]$/, "");
      if (COPY_FIELD.test(leaf)) out.push({ catalog: file, field: path.replace(/^\./, ""), value: node });
    }
  };
  for (const file of readdirSync(SPECS).filter((f) => f.endsWith(".json") && GAME_CATALOG.test(f))) {
    walk(JSON.parse(readFileSync(join(SPECS, file), "utf8")), file, "");
  }
  return out;
}

/**
 * `{name}` in a catalog is `${name}` in a template literal. Compare on the
 * literal segments either side of a placeholder rather than the whole string, or
 * every templated line reads as missing and the check becomes noise.
 */
function presentInWorker(src: string, value: string): boolean {
  if (src.includes(value)) return true;
  const segments = value.split(/\{[a-z_]+\}/i).map((s) => s.trim()).filter((s) => s.length > 6);
  return segments.length > 0 && segments.every((s) => src.includes(s));
}

/**
 * GC3-S7 says PLAY **MAY** add this line — `docs/GC3-S7-PREFERRED.md`. Not
 * emitting it is conformant. Listed so the check stays honest about what it is
 * not asserting, rather than quietly loosening the rule for everyone.
 */
const OPTIONAL = new Set(["social-memory-catalog.gc3-s7.json:prefer_line"]);

describe("game-slice catalogs agree with the Worker", () => {
  const have = haveSpecsArtifacts(SPECS);

  it.skipIf(!have)("finds catalogs and copy to check", () => {
    const found = copyStrings();
    expect(found.length).toBeGreaterThanOrEqual(40);
    expect(found.some((f) => f.catalog.startsWith("culture-catalog.gc9-s2"))).toBe(true);
  });

  it.skipIf(!have)("uses every mandatory catalog-pinned line and pulse", () => {
    const src = workerSource();
    const missing = copyStrings()
      .filter((f) => !OPTIONAL.has(`${f.catalog}:${f.field}`))
      .filter((f) => !presentInWorker(src, f.value))
      .map((f) => `${f.catalog} ${f.field}: ${JSON.stringify(f.value)}`);
    expect(missing).toEqual([]);
  });

  it.skipIf(!have)("adds no verbs or events, as every slice catalog claims", () => {
    const offenders: string[] = [];
    for (const file of readdirSync(SPECS).filter((f) => f.endsWith(".json") && GAME_CATALOG.test(f))) {
      const doc = JSON.parse(readFileSync(join(SPECS, file), "utf8")) as {
        new_verbs?: unknown;
        new_events?: unknown;
      };
      for (const key of ["new_verbs", "new_events"] as const) {
        const v = doc[key];
        if (Array.isArray(v) && v.length > 0) offenders.push(`${file} ${key}=${JSON.stringify(v)}`);
      }
    }
    // Not a Worker assertion — a claim the catalogs make about themselves. If a
    // slice ever declares one, the closed-catalog and verb checks must be told.
    expect(offenders).toEqual([]);
  });
});
