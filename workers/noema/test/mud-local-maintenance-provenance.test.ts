import { describe, expect, it } from "vitest";
import { assertLatestMaintenancePlate } from "../scripts/mud-local-acceptance.mjs";

const latest = "A maintenance plate names witness as the last repairer.";
const old = "A maintenance plate names builder as the last repairer.";
const trace = (text: string) => ({ kind: "construction", text });

describe("local maintenance provenance assertion", () => {
  it("accepts exactly one latest plate alongside unrelated traces", () => {
    expect(() => assertLatestMaintenancePlate([trace(latest), trace("A relay stands here.")], latest, old)).not.toThrow();
  });
  it.each([
    ["missing", []],
    ["stale only", [trace(old)]],
    ["duplicate latest", [trace(latest), trace(latest)]],
    ["stale alongside latest", [trace(latest), trace(old)]],
  ])("rejects %s provenance", (_name, traces) => {
    expect(() => assertLatestMaintenancePlate(traces, latest, old)).toThrow();
  });
});
