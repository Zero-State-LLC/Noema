import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  admitConformanceBase,
  admitConformanceWorld,
  DEFAULT_TEST_WORLD,
} from "../../scripts/hosted-conformance.mjs";

const script = join(dirname(fileURLToPath(import.meta.url)), "../../scripts/hosted-conformance.mjs");

function run(env: Record<string, string>) {
  return spawnSync(process.execPath, [script], {
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
}

describe("hosted conformance script guards", () => {
  it("refuses a missing BASE and never defaults to noema.guru", () => {
    expect(admitConformanceBase("").ok).toBe(false);
    expect(admitConformanceBase("https://noema.guru").ok).toBe(false);
    expect(admitConformanceBase("https://www.noema.guru/").ok).toBe(false);
    expect(admitConformanceBase("https://noema-gateway.zer0state-noema.workers.dev").ok).toBe(true);
    expect(admitConformanceBase("http://127.0.0.1:8787").ok).toBe(true);
  });

  it("admits only test.hosted-canonical.* and denies Perihelion", () => {
    expect(admitConformanceWorld("").world_id).toBe(DEFAULT_TEST_WORLD);
    expect(admitConformanceWorld("test.hosted-canonical.ci-smoke").ok).toBe(true);
    expect(admitConformanceWorld("world.perihelion-reach").ok).toBe(false);
    expect(admitConformanceWorld("world-01").ok).toBe(false);
  });

  it("CLI exits 2 on production door or Perihelion world", () => {
    const guru = run({ BASE: "https://noema.guru" });
    expect(guru.status).toBe(2);
    expect(guru.stderr).toMatch(/refusing production door/i);

    const peri = run({
      BASE: "http://127.0.0.1:8787",
      WORLD_ID: "world.perihelion-reach",
    });
    expect(peri.status).toBe(2);
    expect(peri.stderr).toMatch(/not admitted/i);
  });
});
