import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { openApiAvailable, openApiRpcPresent } from "../scripts/settlement-chain.mjs";

const SRC = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../scripts/inspect-settlement.mjs"),
  "utf8",
);

describe("inspect-settlement.mjs", () => {
  it("does not POST to settlement RPC paths", () => {
    expect(SRC).not.toMatch(/\/rest\/v1\/rpc\/noema_commit_canonical_settlement/);
    expect(SRC).not.toMatch(/\/rest\/v1\/rpc\/noema_adopt_live_world_head/);
    expect(SRC).not.toMatch(/method:\s*["']POST["']/);
    expect(SRC).toMatch(/application\/openapi\+json/);
    expect(SRC).toMatch(/openapi_unavailable/);
  });

  it("treats missing OpenAPI as unavailable and never invents RPC presence", () => {
    expect(openApiAvailable(404, { paths: {} })).toBe(false);
    expect(openApiAvailable(200, { parse_error: true, bytes: 12 })).toBe(false);
    expect(openApiAvailable(200, { swagger: "2.0" })).toBe(false);
    expect(openApiAvailable(200, { paths: {} })).toBe(true);
    expect(openApiRpcPresent({ paths: { "/rpc/noema_commit_canonical_settlement": {} } }, "noema_commit_canonical_settlement")).toBe(true);
    expect(openApiRpcPresent({ paths: { "/rpc/other": {} } }, "noema_adopt_live_world_head")).toBe(false);
  });
});
