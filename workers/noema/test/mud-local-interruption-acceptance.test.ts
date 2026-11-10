import { afterEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { createServer, type RequestListener, type Server } from "node:http";
import { fileURLToPath, URL } from "node:url";
import { admitArgs, assertInterruptedExit, assertInterruptionReceipt, assertLocalHealth, assertNoCredentials, probeHealth, validateOwnership } from "../scripts/mud-local-interruption-acceptance.mjs";

// Synthetic guard/observer controls only. The real npm/workerd smoke is a separate command.
const observer = "a".repeat(32);
const npmPid = 2_000_001;
const ownership = () => ({ observer, runner_pid: 2_000_002, run_id: "0123456789abcdef",
  world_id: "test.hosted-canonical.mud-0123456789abcdef", port: 31001, inspector_port: 31002,
  processes: [{ phase: "initial", pid: 2_000_003 }] });
const receipt = () => ({ local_only: true, run_id: ownership().run_id, world_id: ownership().world_id,
  port: 31001, inspector_port: 31002, status: "failed", error: "Interrupted by SIGTERM",
  processes: [{ phase: "initial", pid: 2_000_003, cleaned_up: true }],
  cleanup: { owned_process_groups_stopped: true, loopback_port_closed: true,
    inspector_port_closed: true, local_signing_file_removed: true } });

describe("synthetic interruption CLI admission, no process targets accepted", () => {
  it("accepts only an absolute artifacts parent or scratch default and standalone help", () => {
    expect(admitArgs(["--artifacts", "/isolated/smoke"], {})).toEqual({ artifactsRoot: "/isolated/smoke" });
    expect(admitArgs([], { JCODE_SCRATCH_DIR: "/isolated/default" })).toEqual({ artifactsRoot: "/isolated/default" });
    expect(admitArgs(["--help"], {})).toEqual({ help: true });
  });
  for (const args of [[], ["--artifacts"], ["--artifacts", "relative"], ["--artifacts", "/a\nb"],
    ["--artifacts", "/a", "--artifacts", "/b"], ["--help", "--artifacts", "/a"],
    ["--base", "https://production.invalid"], ["--pid", "1"], ["--receipt", "/existing/receipt.json"],
    ["--world", "world-01"], ["--remote"], ["--config", "/production/config"], ["--timeout", "0"]]) {
    it(`rejects caller options ${JSON.stringify(args)}`, () => { expect(() => admitArgs(args, {})).toThrow(); });
  }
  it("is import-safe and prints help without spawning npm or creating artifacts", () => {
    const path = fileURLToPath(new URL("../scripts/mud-local-interruption-acceptance.mjs", import.meta.url));
    const env = { PATH: "/usr/bin:/bin" } as unknown as NodeJS.ProcessEnv;
    const imported = spawnSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(new URL("../scripts/mud-local-interruption-acceptance.mjs", import.meta.url).href)})`], { env, encoding: "utf8", timeout: 5000 });
    expect(imported.status).toBe(0);
    expect(imported.stdout).toBe("");
    expect(imported.stderr).toBe("");
    const help = spawnSync(process.execPath, [path, "--help"], { env, encoding: "utf8", timeout: 5000 });
    expect(help.status).toBe(0);
    expect(help.stdout).toContain("Actual LOCAL npm CLI interruption only");
    const rejected = spawnSync(process.execPath, [path, "--pid", "1"], { env, encoding: "utf8", timeout: 5000 });
    expect(rejected.status).not.toBe(0);
    expect(rejected.stdout).toBe("");
  });
});

describe("synthetic ownership authentication, never supplied receipt kill authority", () => {
  it("accepts invocation-bound metadata and strips unexpected fields", () => {
    expect(validateOwnership({ ...ownership(), supplied_pid: 1 }, observer, npmPid)).toEqual(ownership());
    const next = ownership();
    next.processes.push({ phase: "retained-storage restart", pid: 2_000_004 });
    expect(validateOwnership(next, observer, npmPid)).toEqual(next);
  });
  const mutations: Array<[string, (value: ReturnType<typeof ownership>) => void]> = [
    ["wrong nonce", v => { v.observer = "b".repeat(32); }],
    ["wrong world", v => { v.world_id = "world-01"; }],
    ["invalid run identity", v => { v.run_id = "../existing"; }],
    ["caller self PID", v => { v.runner_pid = process.pid; }],
    ["npm PID as runner", v => { v.runner_pid = npmPid; }],
    ["negative process group", v => { v.processes[0].pid = -1; }],
    ["init process group", v => { v.processes[0].pid = 1; }],
    ["runner PID as group", v => { v.processes[0].pid = v.runner_pid; }],
    ["npm PID as detached group", v => { v.processes[0].pid = npmPid; }],
    ["observer PID as detached group", v => { v.processes[0].pid = process.pid; }],
    ["noninteger process", v => { v.processes[0].pid = 2.5; }],
    ["out of OS PID range", v => { v.processes[0].pid = 0x80000000; }],
    ["empty group list", v => { v.processes = []; }],
    ["unexpected phase", v => { v.processes[0].phase = "production"; }],
    ["duplicate detached group", v => { v.processes.push({ phase: "retained-storage restart", pid: v.processes[0].pid }); }],
    ["out of range port", v => { v.port = 65536; }],
    ["noninteger port", v => { v.port = 3.5; }],
    ["shared inspector port", v => { v.inspector_port = v.port; }],
  ];
  for (const [label, mutate] of mutations) it(`rejects ${label}`, () => {
    const value = ownership(); mutate(value);
    expect(() => validateOwnership(value, observer, npmPid)).toThrow();
  });
  it("rejects a preexisting receipt, missing metadata or invalid observer capability", () => {
    expect(() => validateOwnership(receipt(), observer, npmPid)).toThrow();
    expect(() => validateOwnership(undefined, observer, npmPid)).toThrow();
    expect(() => validateOwnership(ownership(), "caller-token", npmPid)).toThrow();
  });
});

describe("synthetic negative interruption receipt controls, not runtime acceptance", () => {
  it("accepts only exact interrupted receipt bound to attested process and ports", () => {
    expect(() => assertInterruptionReceipt(receipt(), ownership())).not.toThrow();
  });
  for (const key of ["local_only", "run_id", "world_id", "port", "inspector_port", "status", "error"]) {
    it(`rejects altered ${key} including normal success or unrelated failure`, () => {
      const value = { ...receipt(), [key]: key === "status" ? "passed" : "wrong" };
      expect(() => assertInterruptionReceipt(value, ownership())).toThrow();
    });
  }
  for (const key of Object.keys(receipt().cleanup)) {
    it(`rejects claimed incomplete cleanup ${key}`, () => {
      const value = receipt();
      value.cleanup[key as keyof typeof value.cleanup] = false;
      expect(() => assertInterruptionReceipt(value, ownership())).toThrow();
    });
  }
  it("rejects missing, unrelated or not-cleaned process evidence", () => {
    for (const processes of [[], [{ phase: "initial", pid: 3, cleaned_up: true }],
      [{ phase: "initial", pid: 2_000_003, cleaned_up: false }]]) {
      expect(() => assertInterruptionReceipt({ ...receipt(), processes }, ownership())).toThrow();
    }
  });
  it("rejects successful exit, missing exit and externally killed npm as substitutes", () => {
    expect(() => assertInterruptedExit({ code: 1, signal: null })).not.toThrow();
    for (const exit of [undefined, { code: 0, signal: null }, { code: null, signal: "SIGKILL" }, { code: 1, signal: "SIGTERM" }]) {
      expect(() => assertInterruptedExit(exit)).toThrow();
    }
  });
  it("rejects wrong environment/world or absent health even when HTTP transport succeeds", () => {
    expect(() => assertLocalHealth({ env: "local", world_id: ownership().world_id }, ownership().world_id)).not.toThrow();
    for (const health of [undefined, { env: "production", world_id: ownership().world_id }, { env: "local", world_id: "world-01" }]) {
      expect(() => assertLocalHealth(health, ownership().world_id)).toThrow();
    }
  });
  it("rejects raw JWTs, bearer tokens and ambient sentinels", () => {
    for (const text of ["eyJheader.payload.signature", "Bearer raw-secret", "AMBIENT_PRODUCTION_SIGNING_SENTINEL"]) {
      expect(() => assertNoCredentials(text)).toThrow();
    }
    expect(() => assertNoCredentials("Bearer [REDACTED] [REDACTED_JWT]")).not.toThrow();
  });
});

describe("synthetic fixed-loopback health observer transport controls", () => {
  let server: Server | undefined;
  afterEach(async () => {
    if (server) {
      server.closeAllConnections();
      await new Promise<void>(resolve => server!.close(() => resolve()));
      server = undefined;
    }
  });
  async function serve(handler: RequestListener) {
    server = createServer(handler);
    await new Promise<void>(resolve => server!.listen(0, "127.0.0.1", resolve));
    return (server.address() as { port: number }).port;
  }
  it("uses actual GET /health loopback transport, not a caller URL", async () => {
    const port = await serve((req, res) => {
      expect(req.url).toBe("/health"); expect(req.method).toBe("GET");
      res.end(JSON.stringify({ env: "local", world_id: ownership().world_id }));
    });
    await expect(probeHealth(port, new AbortController().signal)).resolves.toEqual({ env: "local", world_id: ownership().world_id });
    expect(() => probeHealth("https://production.invalid", new AbortController().signal)).toThrow();
  });
  it("does not follow redirects", async () => {
    const port = await serve((_, res) => { res.writeHead(302, { location: "https://production.invalid" }); res.end(); });
    await expect(probeHealth(port, new AbortController().signal)).rejects.toThrow("HTTP status");
  });
  it("bounds oversized and invalid JSON bodies", async () => {
    const port = await serve((_, res) => { res.end("x".repeat(8193)); });
    await expect(probeHealth(port, new AbortController().signal)).rejects.toThrow();
  });
  it("rejects small malformed JSON without hanging", async () => {
    const port = await serve((_, res) => { res.end("not-json"); });
    await expect(probeHealth(port, new AbortController().signal)).rejects.toThrow();
  });
  it("has a finite hard deadline even when the response never arrives", async () => {
    const port = await serve(() => {});
    await expect(probeHealth(port, new AbortController().signal)).rejects.toThrow("deadline");
  });
  it("honors observer interruption during a pending probe", async () => {
    const port = await serve(() => {});
    const controller = new AbortController();
    const pending = probeHealth(port, controller.signal);
    controller.abort(new Error("Observer interrupted by SIGTERM"));
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});
