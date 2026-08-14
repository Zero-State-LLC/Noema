import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const siteJs = readFileSync(resolve(__dirname, "../public/assets/site.js"), "utf8");

describe("marketing site.js", () => {
  it("does not assign loop-detail via unescaped innerHTML", () => {
    expect(siteJs).not.toMatch(/stageDetail\.innerHTML\s*=\s*"<strong>"\s*\+\s*s\.title/);
    expect(siteJs).toMatch(/strong\.textContent\s*=\s*s\.title/);
    expect(siteJs).toMatch(/span\.textContent\s*=\s*s\.body/);
  });
});
