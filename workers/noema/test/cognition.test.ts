import { describe, expect, it } from "vitest";
import { hasPrivateCognition } from "../src/cognition";

describe("hasPrivateCognition", () => {
  it("rejects nested list payloads that used to bypass the dict-only walker", () => {
    expect(hasPrivateCognition({ items: [{ prompt: "secret" }] })).toBe(true);
    expect(hasPrivateCognition({ a: { b: { c: { api_key: "sk" } } } })).toBe(true);
    expect(hasPrivateCognition({ arguments: { note: "ok" } })).toBe(false);
  });
});
