import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../src/watch-stage-client.js"),
  "utf8",
);

function fnBody(name: string): string {
  const at = src.indexOf("function " + name + "(");
  expect(at).toBeGreaterThan(-1);
  const end = src.indexOf("\n  }\n", at);
  return src.slice(at, end === -1 ? src.length : end);
}

describe("D6 route travel re-homing across a rebuild", () => {
  it("detaches travellers in clearWorld instead of dropping them", () => {
    const clear = fnBody("clearWorld");
    expect(clear).toContain("detachTravels()");
    expect(clear).not.toContain("dropTravels()");
  });

  it("re-homes travellers when update() rebuilds the scene", () => {
    expect(fnBody("update")).toContain("rehomeTravels(");
  });

  it("drops a re-homed traveller once STAGE_TRAVEL_MS has elapsed", () => {
    const rehome = fnBody("rehomeTravels");
    expect(rehome).toContain("STAGE_TRAVEL_MS");
    expect(rehome).toContain("MeshStandardMaterial");
  });

  it("starts travels with the ids the rebuild needs", () => {
    const start = fnBody("startTravel");
    expect(start).toContain("handle:");
    expect(start).toContain("fromId:");
    expect(start).toContain("toId:");
  });
});
