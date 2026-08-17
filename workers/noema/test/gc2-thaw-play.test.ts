import { describe, expect, it } from "vitest";
import { helpText } from "../src/actions";

describe("GC2 PLAY thaw", () => {
  it("names BUILD on help and lists aliases on help build", () => {
    expect(helpText()).toMatch(/\bBUILD\b/);
    expect(helpText("build")).toMatch(/construct/);
    expect(helpText("build")).toMatch(/dismantle/);
    expect(helpText("build")).toMatch(/upgrade/);
    expect(helpText("build")).toMatch(/share/);
    expect(helpText()).not.toMatch(/\bATTEST\b/);
    expect(helpText()).not.toMatch(/\bWED\b/);
    expect(helpText("build")).not.toMatch(/\bATTEST\b|\bWED\b/);
  });
});
