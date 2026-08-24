import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const HERE = new URL(".", import.meta.url).pathname;
const ROOT = join(HERE, "../../..");
const DOCS = join(ROOT, "docs");
const COMPAT = JSON.parse(readFileSync(join(ROOT, "spec-compat.json"), "utf8")) as {
  hosted_live: { official_client: string };
  frozen_release: { official_client: string };
};

/**
 * `noema-client==0.1.x` was restated in five places across four documents, so a
 * client release cost a four-file PR and the copies drifted between them.
 *
 * Prose restatements are gone — they point at `hosted_live.official_client`
 * instead. One literal survives on purpose: PARTNER-OPERATOR gives an operator a
 * `pipx install` line, and stripping the version there would silently install
 * whatever is latest, which is the opposite of a pin. That copy is kept and
 * checked here.
 *
 * Historical amendments are exempt. A dated record of what was pinned that day
 * is evidence, and rewriting it to match today would destroy the thing it exists
 * to preserve.
 *
 * The exemption matches `historical)` — the closing paren of a label such as
 * "(hosted_live publish, historical)" — and not the bare word. A current
 * amendment that merely *mentions* historical blocks further down the line is
 * not itself historical, and a looser match silently exempted exactly that.
 */
const HISTORICAL = /historical\)/i;

function currentClientPins(): { file: string; line: number; text: string; version: string }[] {
  const out: { file: string; line: number; text: string; version: string }[] = [];
  for (const file of readdirSync(DOCS).filter((f) => f.endsWith(".md"))) {
    const lines = readFileSync(join(DOCS, file), "utf8").split("\n");
    lines.forEach((text, i) => {
      const m = text.match(/noema-client==(\d+\.\d+\.\d+)/);
      if (!m || HISTORICAL.test(text)) return;
      out.push({ file, line: i + 1, text: text.trim(), version: m[1] });
    });
  }
  return out;
}

describe("official client pin is stated once and copied under guard", () => {
  it("pins a version in spec-compat for both the live and frozen releases", () => {
    expect(COMPAT.hosted_live.official_client).toMatch(/^noema-client==\d+\.\d+\.\d+$/);
    expect(COMPAT.frozen_release.official_client).toMatch(/^noema-client==\d+\.\d+\.\d+$/);
  });

  it("every current restatement in docs/ matches hosted_live.official_client", () => {
    const live = COMPAT.hosted_live.official_client.split("==")[1];
    for (const hit of currentClientPins()) {
      expect(
        hit.version,
        `${hit.file}:${hit.line} says ${hit.version}, hosted_live says ${live}\n  ${hit.text}`,
      ).toBe(live);
    }
  });

  it("keeps the operator install line, and only that one", () => {
    const files = [...new Set(currentClientPins().map((h) => h.file))].sort();
    // If this grows, the new copy needs a reason as good as the operator's.
    expect(files).toEqual(["PARTNER-OPERATOR.md"]);
  });
});
