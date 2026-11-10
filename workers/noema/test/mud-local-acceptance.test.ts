import { describe, expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath, URL } from "node:url";
// Native ESM CLI helpers can be imported without executing the runner.
import { admitArgs, localConfig, childEnvironment, redact } from "../scripts/mud-local-acceptance.mjs";

// Generated Worker types augment ProcessEnv with required Worker bindings.
// These import/admission-only Node children intentionally receive none of them.
const importOnlyEnv = { PATH: "/usr/bin:/bin" } as unknown as NodeJS.ProcessEnv;
const root = "/isolated/worker";
const run = "/isolated/artifacts/mud-local-owned";
const runId = "0123456789abcdef";

describe("MUD local acceptance admission", () => {
  it("requires an artifact parent or the explicit scratch default", () => {
    expect(() => admitArgs([], {})).toThrow(/JCODE_SCRATCH_DIR/);
    expect(admitArgs([], { JCODE_SCRATCH_DIR: run })).toEqual({ artifactsRoot: run });
    expect(admitArgs(["--artifacts", run], { JCODE_SCRATCH_DIR: "/ignored" })).toEqual({ artifactsRoot: run });
    expect(admitArgs(["--help"], {})).toEqual({ help: true });
  });

  it.each([
    ["--artifacts"], ["--artifacts", "--help"], ["--artifacts", "relative"],
    ["--artifacts", "https://example.invalid"], ["--artifacts", "/bad\npath"],
    ["--artifacts", run, "--artifacts", run], ["--help", "--artifacts", run],
    ["--base", "https://example.invalid"], ["--base-url", "http://127.0.0.1:8787"],
    ["--world", "world-01"], ["--env", "production"], ["--secrets", "/credentials"],
    ["--config", "/production.toml"], ["--remote"], ["--deploy"], ["--port", "8787"],
    ["--artifacts=/isolated"], ["http://127.0.0.1:8787"],
  ])("rejects unsupported or malformed arguments: %j", (...args: string[]) => {
    expect(() => admitArgs(args, { JCODE_SCRATCH_DIR: run })).toThrow();
  });

  it("does not use ambient target options as defaults", () => {
    expect(() => admitArgs([], { BASE: "https://example.invalid", DEFAULT_WORLD_ID: "world-01", NOEMA_ENV: "production" })).toThrow();
  });
});

describe("MUD local config and child binding allowlists", () => {
  it("keeps namespace stable across restart and isolates different runs", () => {
    const first = localConfig(root, runId);
    expect(first).toEqual(localConfig(root, runId));
    expect(first.name).not.toBe(localConfig(root, "fedcba9876543210").name);
    expect(first.vars).toEqual({ NOEMA_ENV: "local", NOEMA_PROTOCOL_VERSION: "1", DEFAULT_WORLD_ID: `test.hosted-canonical.mud-${runId}` });
    expect(first.main).toBe(`${root}/src/index.ts`);
    expect(first.durable_objects).toEqual({ bindings: [{ name: "WORLD_DO", class_name: "NoemaWorldDO" }] });
    expect(first.migrations).toEqual([{ tag: "v1", new_classes: ["NoemaWorldDO"] }]);
    expect(Object.keys(first).sort()).toEqual(["name", "main", "compatibility_date", "compatibility_flags", "vars", "durable_objects", "migrations"].sort());
    expect(JSON.stringify(first)).not.toMatch(/SUPABASE|account_id|routes|services|ADMIN_|production|world-01|remote/);
  });

  it.each(["world-01", "../production", "short", "0123456789abcdef\n", "0123456789ABCDEF"])("rejects unsafe generated identifier %s", (id) => {
    expect(() => localConfig(root, id)).toThrow();
  });

  it("never inherits ambient credentials, dotenv flags, proxies, Node injection or Wrangler auth", () => {
    const ambient = {
      CLOUDFLARE_API_TOKEN: "PROD_TOKEN_SENTINEL", CLOUDFLARE_ACCOUNT_ID: "PROD_ACCOUNT_SENTINEL",
      SUPABASE_URL: "https://production.invalid", SUPABASE_SERVICE_ROLE_KEY: "PROD_ROLE_SENTINEL",
      SUPABASE_JWT_SECRET: "PROD_JWT_SENTINEL", TOKEN_SIGNING_SECRET: "PROD_SIGNING_SENTINEL",
      NODE_OPTIONS: "--import=/injected.mjs", HTTP_PROXY: "https://proxy.invalid", HTTPS_PROXY: "https://proxy.invalid",
      WRANGLER_CONFIG: "/production.toml", HOME: "/ambient/home", PATH: "/ambient/bin",
      CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "true", NOEMA_ENV: "production",
    };
    for (const [key, value] of Object.entries(ambient)) vi.stubEnv(key, value);
    try {
      const env = childEnvironment(run, "/runtime/bin/node");
      expect(env.PATH).toBe("/runtime/bin:/usr/bin:/bin");
      expect(env.HOME).toBe(`${run}/home`);
      expect(env.XDG_CONFIG_HOME).toBe(`${run}/home/.config`);
      expect(env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV).toBe("false");
      expect(env.WRANGLER_SEND_METRICS).toBe("false");
      expect(env.WRANGLER_WRITE_LOGS).toBe("false");
      for (const [key, value] of Object.entries(ambient)) expect((env as Record<string, string>)[key]).not.toBe(value);
      expect(Object.keys(env).sort()).toEqual(["PATH", "HOME", "XDG_CONFIG_HOME", "TMPDIR", "CI", "WRANGLER_SEND_METRICS", "WRANGLER_LOG", "WRANGLER_WRITE_LOGS", "WRANGLER_LOG_SANITIZE", "CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV"].sort());
    } finally { vi.unstubAllEnvs(); }
  });

  it("redacts local signing values and bearer/JWT credentials from bounded artifacts", () => {
    const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJsb2NhbCJ9.c2lnbmF0dXJl";
    const result = redact(`signing=OWN_LOCAL_SIGNING Bearer plain-token jwt=${token}`, ["OWN_LOCAL_SIGNING"]);
    expect(result).not.toContain("OWN_LOCAL_SIGNING");
    expect(result).not.toContain("plain-token");
    expect(result).not.toContain(token);
    expect(result).toContain("[REDACTED");
  });

  it("imports in a clean native Node process without executing the CLI", () => {
    const moduleUrl = new URL("../scripts/mud-local-acceptance.mjs", import.meta.url);
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(moduleUrl.href)}); console.log('IMPORT_ONLY')`], {
      env: importOnlyEnv, encoding: "utf8", timeout: 5_000,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("IMPORT_ONLY\n");
    expect(result.stderr).toBe("");
  });

  it("fails unknown CLI options before starting workerd or making artifacts", () => {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("../scripts/mud-local-acceptance.mjs", import.meta.url)), "--base", "https://example.invalid"], {
      env: importOnlyEnv, encoding: "utf8", timeout: 5_000,
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Only one --artifacts DIR");
  });
});
