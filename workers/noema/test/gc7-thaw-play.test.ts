import { describe, expect, it } from "vitest";
import { helpText } from "../src/actions";
import { CONFLICT_CATALOG_ID } from "../src/contest";

describe("GC7 PLAY thaw", () => {
  it("names CONTEST on help and lists aliases on help contest", () => {
    expect(CONFLICT_CATALOG_ID).toBe("conflict-catalog/gc7-thaw-play");
    expect(helpText()).toMatch(/\bCONTEST\b/);
    expect(helpText("contest")).toMatch(/contest <form>/);
    expect(helpText("contest")).toMatch(/\bdefend\b/);
    expect(helpText("contest")).toMatch(/\bwithdraw\b/);
    expect(helpText("contest")).toMatch(/information/);
    expect(helpText("contest")).toMatch(/No HP/);
    expect(helpText()).not.toMatch(/\bATTEST\b/);
    expect(helpText()).not.toMatch(/\bWED\b/);
    expect(helpText("contest")).not.toMatch(/\bATTEST\b|\bWED\b/);
  });
});
