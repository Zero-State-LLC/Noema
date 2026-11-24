import { spawn, spawnSync } from "node:child_process";
import { createServer, type Server, type RequestListener } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { main } from "../scripts/hosted-g5-probe.mjs";
import { buildWatchLive } from "../src/watch-live";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const world_id = "test.hosted-canonical.g5-control";
// Explicit nonsecret environment, also satisfying the Worker's required Env fields.
const cleanEnv: NodeJS.ProcessEnv = {
  PATH: process.env.PATH || "",
  NOEMA_ENV: "production",
  NOEMA_PROTOCOL_VERSION: "1",
  DEFAULT_WORLD_ID: "world.perihelion-reach-3",
  BASE: "http://127.0.0.1:1",
  WORLD_ID: world_id,
  PLAYER_TOKEN: "synthetic-player",
  ADMIN_TOKEN: "synthetic-admin",
  SEAL: "synthetic-seal",
  G5_WAIT_MS: "0",
};
const live = { world_id, freshness: "live", watch_live: "watch-live/1.0", sequence: 1, cycle: 0 };
const pin = { ok: true, world_id, player_tempo: {} };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const servers: Server[] = [];
afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => {
    server.closeAllConnections();
    server.close(() => resolve());
  })));
});
async function loopback(handler: RequestListener) {
  const server = createServer(handler);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("missing local address");
  return `http://127.0.0.1:${address.port}`;
}
async function cli(env: NodeJS.ProcessEnv) {
  return await new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/hosted-g5-probe.mjs"], { cwd: root, env });
    let stdout = "", stderr = "";
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("CLI deadline")); }, 8000);
    child.stdout.on("data", (data) => { stdout += data; });
    child.stderr.on("data", (data) => { stderr += data; });
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
  });
}

describe("#777 G5 admission and raw observations, not hosted proof", () => {
  it("real CLI refuses absent configuration without terminating test worker", () => {
    const result = spawnSync(process.execPath, ["scripts/hosted-g5-probe.mjs"], {
      cwd: root,
      env: { PATH: cleanEnv.PATH, NOEMA_ENV: cleanEnv.NOEMA_ENV, NOEMA_PROTOCOL_VERSION: cleanEnv.NOEMA_PROTOCOL_VERSION, DEFAULT_WORLD_ID: cleanEnv.DEFAULT_WORLD_ID },
      encoding: "utf8", timeout: 8000,
    });
    expect(result.status).toBe(2);
    expect(JSON.parse(result.stdout)).toMatchObject({ status: "NOT_COMPUTABLE", hibernated: "not_run" });
  });

  it("real CLI refuses each missing or blank required variable before loopback contact", async () => {
    let calls = 0;
    const BASE = await loopback((_req, res) => { calls++; res.end("{}"); });
    for (const key of ["BASE", "WORLD_ID", "PLAYER_TOKEN", "ADMIN_TOKEN", "SEAL"]) {
      for (const value of [undefined, "   "]) {
        const env: NodeJS.ProcessEnv = { ...cleanEnv, BASE, [key]: value };
        const result = await cli(env);
        expect(result.code).toBe(2);
        expect(JSON.parse(result.stdout).status).toBe("NOT_COMPUTABLE");
      }
    }
    expect(calls).toBe(0);
  });

  it.each(["https://noema.guru", "https://noema.guru.", "http://localhost/a/..", "https://x.noema.guru", "https://www.noema.guru", "ftp://localhost", "not-a-url", "http://synthetic-player:synthetic-seal@localhost", "http://localhost/path", "http://localhost?x=synthetic-seal", "http://localhost#secret"])("refuses unsafe origin %s without transport or secret output", async (BASE) => {
    const transport = vi.fn();
    const result = await main({ env: { ...cleanEnv, BASE }, transport });
    expect(result.code).toBe(2);
    expect(transport).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("synthetic-seal");
  });

  it.each(["world-01", "world.perihelion-reach", "ordinary", "test.hosted-canonical."])("refuses unisolated world %s", async (WORLD_ID) => {
    const transport = vi.fn();
    expect((await main({ env: { ...cleanEnv, WORLD_ID }, transport })).code).toBe(2);
    expect(transport).not.toHaveBeenCalled();
  });

  it.each([{ WS_URL: "ws://invalid.invalid" }, { WS_URL: "" }, { G5_HIBERNATION_WAIT_MS: "0" }])("refuses unsupported configuration before any contact: %j", async (option) => {
    const transport = vi.fn();
    expect((await main({ env: { ...cleanEnv, ...option }, transport })).code).toBe(2);
    expect(transport).not.toHaveBeenCalled();
  });

  it.each(["-1", "60001", "Infinity", "NaN", "1.5", ""])("refuses invalid wait %s", async (G5_WAIT_MS) => {
    const transport = vi.fn();
    expect((await main({ env: { ...cleanEnv, G5_WAIT_MS }, transport })).code).toBe(2);
    expect(transport).not.toHaveBeenCalled();
  });

  it.each([{ world_id: "wrong" }, { freshness: "stale" }, { watch_live: "wrong" }, { sequence: -1 }, { cycle: 0.5 }, { sequence: Number.MAX_SAFE_INTEGER + 1 }, { cycle: null }])("synthetic pre/after WATCH validation %j", async (patch) => {
    for (const after of [false, true]) {
      const transport = vi.fn().mockResolvedValueOnce(response(after ? live : { ...live, ...patch }));
      if (after) transport.mockResolvedValueOnce(response(pin)).mockResolvedValueOnce(response({ ...live, ...patch }));
      const sleep = vi.fn();
      expect((await main({ env: cleanEnv, transport, sleep })).code).toBe(2);
      expect(transport).toHaveBeenCalledTimes(after ? 3 : 1);
      expect(sleep).toHaveBeenCalledTimes(after ? 1 : 0);
    }
  });

  it.each([{ body: pin, status: 403 }, { body: { ...pin, ok: false }, status: 200 }, { body: { ...pin, world_id: "wrong" }, status: 200 }, { body: { ...pin, player_tempo: null }, status: 200 }, { body: { ...pin, player_tempo: [] }, status: 200 }])("synthetic rejected pin stops before wait or further mutation %j", async ({ body, status }) => {
    const transport = vi.fn().mockResolvedValueOnce(response(live)).mockResolvedValueOnce(response(body, status));
    const sleep = vi.fn();
    expect((await main({ env: cleanEnv, transport, sleep })).code).toBe(2);
    expect(transport).toHaveBeenCalledTimes(2);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("synthetic counter growth never proves alarms, eviction or hibernation", async () => {
    const transport = vi.fn().mockResolvedValueOnce(response(live)).mockResolvedValueOnce(response(pin)).mockResolvedValueOnce(response({ ...live, sequence: 2 }));
    const result = await main({ env: cleanEnv, transport, sleep: vi.fn() });
    expect(result).toMatchObject({ code: 0, report: { status: "RAW_OBSERVATIONS_ONLY", watch_advanced: true, alarm: "not_observed", alarm_after_evict: "not_run", hibernated: "not_run" } });
    expect(result.report.alarm_reason).toContain("Causal attribution unavailable");
    expect(transport).toHaveBeenCalledTimes(3);
    expect(transport.mock.calls.every(([, init]) => init.redirect === "error")).toBe(true);
  });

  it("accepts the actual public WATCH projection schema, not a fabricated pin field", async () => {
    const before = buildWatchLive({ world_id, cycle: 0, sequence: 1, rooms: {}, players: [], events: [] });
    const after = buildWatchLive({ world_id, cycle: 1, sequence: 2, rooms: {}, players: [], events: [] });
    expect(before).not.toHaveProperty("pin");
    const transport = vi.fn().mockResolvedValueOnce(response(before)).mockResolvedValueOnce(response(pin)).mockResolvedValueOnce(response(after));
    const result = await main({ env: cleanEnv, transport, sleep: vi.fn() });
    expect(result).toMatchObject({ code: 0, report: { status: "RAW_OBSERVATIONS_ONLY", watch_advanced: true, alarm: "not_observed" } });
    expect(transport).toHaveBeenCalledTimes(3);
  });

  it("real CLI reports only raw observations after a synthetic loopback pin", async () => {
    const calls: Array<{ method: string; path: string; body: string; authorization?: string; seal?: string; admin?: string }> = [];
    let reads = 0;
    const BASE = await loopback((req, res) => {
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => {
        calls.push({ method: req.method || "", path: req.url || "", body,
          authorization: req.headers.authorization, seal: String(req.headers["x-noema-seal"] || ""), admin: String(req.headers["x-noema-admin-token"] || "") });
        res.end(JSON.stringify(req.method === "POST" ? pin : { ...live, sequence: ++reads }));
      });
    });
    const result = await cli({ ...cleanEnv, BASE });
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ status: "RAW_OBSERVATIONS_ONLY", world_id, watch_advanced: true, alarm: "not_observed", alarm_after_evict: "not_run", hibernated: "not_run" });
    expect(calls.map(({ method, path }) => `${method} ${path}`)).toEqual(["GET /v1/watch/live", "POST /v1/operator/test-world/tempo-pin", "GET /v1/watch/live"]);
    expect(calls[1]).toMatchObject({ body: JSON.stringify({ world_id }), authorization: "Bearer synthetic-player", seal: "synthetic-seal", admin: "synthetic-admin" });
    expect(calls[0].authorization).toBeUndefined();
    expect(result.stdout).not.toContain("synthetic-");
    expect(result.stderr).toBe("");
  });

  it("real CLI stops after a synthetic loopback rejected pin without after-read or eviction", async () => {
    const calls: string[] = [];
    const BASE = await loopback((req, res) => {
      calls.push(`${req.method} ${req.url}`);
      res.end(JSON.stringify(req.method === "POST" ? { ...pin, ok: false } : live));
    });
    const result = await cli({ ...cleanEnv, BASE });
    expect(result.code).toBe(2);
    expect(JSON.parse(result.stdout)).toMatchObject({ status: "NOT_COMPUTABLE", alarm: "not_observed", alarm_after_evict: "not_run", hibernated: "not_run" });
    expect(calls).toEqual(["GET /v1/watch/live", "POST /v1/operator/test-world/tempo-pin"]);
  });

  it("real CLI admission matrix never reaches loopback sentinel", async () => {
    let calls = 0;
    const BASE = await loopback((_req, res) => { calls++; res.end("{}"); });
    const options = [
      { BASE: `${BASE}/path` }, { BASE: `${BASE}?synthetic-seal` },
      { BASE: `${BASE}#synthetic-seal` },
      { BASE: BASE.replace("http://", "http://synthetic-player:synthetic-seal@") },
      { BASE: "https://noema.guru" }, { BASE: "https://sub.noema.guru" },
      { BASE: "ftp://127.0.0.1" }, { BASE: "malformed" },
      { WORLD_ID: "world-01" }, { WORLD_ID: "world.perihelion-reach" },
      { WS_URL: "ws://invalid.invalid" }, { G5_HIBERNATION_WAIT_MS: "0" },
    ];
    for (const option of options) {
      const result = await cli({ ...cleanEnv, BASE, ...option });
      expect(result.code).toBe(2);
      expect(JSON.parse(result.stdout).status).toBe("NOT_COMPUTABLE");
      expect(result.stdout).not.toContain("synthetic-seal");
    }
    expect(calls).toBe(0);
  }, 10000);

  it("real CLI loopback wrong WATCH target cannot pin", async () => {
    const methods: string[] = [];
    const BASE = await loopback((req, res) => { methods.push(req.method || ""); res.end(JSON.stringify({ ...live, world_id: "wrong" })); });
    const result = await cli({ ...cleanEnv, BASE });
    expect(result.code).toBe(2);
    expect(methods).toEqual(["GET"]);
  });

  it.each(["redirect", "oversize", "timeout"])("real CLI bounds %s transport (not runtime evidence)", async (mode) => {
    let calls = 0;
    const BASE = await loopback((_req, res) => {
      calls++;
      if (mode === "redirect") { res.writeHead(302, { location: "/redirect-target" }); res.end(); }
      if (mode === "oversize") { res.write(" ".repeat(65537)); res.end(); }
      // timeout deliberately leaves response pending, teardown closes all sockets.
    });
    const result = await cli({ ...cleanEnv, BASE });
    expect(result.code).toBe(2);
    expect(JSON.parse(result.stdout).status).toBe("NOT_COMPUTABLE");
    expect(calls).toBe(1);
    expect(result.stderr).toBe("");
  }, 10000);

  it("redacts synthetic transport errors", async () => {
    const result = await main({ env: cleanEnv, transport: vi.fn().mockRejectedValue(new Error("synthetic-player synthetic-admin synthetic-seal")) });
    expect(result.code).toBe(2);
    expect(JSON.stringify(result)).not.toContain("synthetic-");
  });
});
