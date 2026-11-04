import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { admitTestWorldId } from "../src/test-world";
import {
  admitAcceptanceEnv,
  admitBaseUrl,
  admitWorkerName,
  admitWorlds,
  assertConfigSafe,
  buildDeployArgs,
  loadAcceptanceEnv,
  main,
  redact,
  redactDeep,
  runIdFromDate,
} from "../scripts/acceptance-733.mjs";

const PROD_REF = "dezykkherxlaysxyvgbs";
const RUN = "20261104t120000z";
const WORKER = `noema-733-acc-${RUN}`;
const BASE = `https://${WORKER}.zer0state-noema.workers.dev`;
const DEFAULT_WORLD = `test.hosted-canonical.733-default-${RUN}`;
const ISO_WORLD = `test.hosted-canonical.733-acc-${RUN}`;
const SENT = `PRIVATE_733_ACC_SENTINEL_${RUN}`;
const SB_URL = "https://acceptanceprojectref.supabase.co";
const SB_KEY = "sb-service-role-FAKE-KEY-VALUE";
const PROD_V = "11111111-1111-4111-8111-111111111111";
const ACC_V = "22222222-2222-4222-8222-222222222222";
const ADMIN_JWT = "eyJhbGciOiJIUzI1NiJ9.fakeadminpayload.fakeadminsig";

describe("acceptance-733 fail-closed guards", () => {
  it("admits only noema-733-acc-<utc> worker names", () => {
    expect(admitWorkerName(WORKER).ok).toBe(true);
    for (const bad of ["noema-gateway", "noema-733-acc-", "noema-733-acc-20261104T120000Z", "noema-733-acc-2026110412000z",
      `${WORKER}-x`, `x${WORKER}`, "noema-733-acceptance-20261102", "", "noema-rollback-rehearsal-555"]) {
      expect(admitWorkerName(bad).ok, bad).toBe(false);
    }
  });

  it("admits only the exact workers.dev base for the run worker", () => {
    expect(admitBaseUrl(BASE).ok).toBe(true);
    for (const bad of ["https://noema.guru", "https://www.noema.guru", "https://noema-gateway.zer0state-noema.workers.dev",
      `${BASE}/`, `${BASE}/x`, `http://${WORKER}.zer0state-noema.workers.dev`, `${BASE}.evil.com`,
      `https://evil.com/${WORKER}.zer0state-noema.workers.dev`, `https://${WORKER}.other.workers.dev`, ""]) {
      expect(admitBaseUrl(bad).ok, bad).toBe(false);
    }
  });

  it("applies the admitTestWorldId rule and keeps worlds distinct (parity)", () => {
    expect(admitWorlds({ defaultWorld: DEFAULT_WORLD, isolatedWorld: ISO_WORLD }).ok).toBe(true);
    const samples = ["world-01", "world.perihelion-reach-3", "world.perihelion", "test.hosted-canonical.", "test.hosted-canonical..x",
      "test.hosted-canonical.x.", "test.hosted-canonical.UPPER-ok", `test.hosted-canonical.${"a".repeat(49)}`, "test.other.x", "",
      DEFAULT_WORLD, ISO_WORLD, "test.hosted-canonical.a b"];
    for (const w of samples) {
      const mine = admitWorlds({ defaultWorld: "test.hosted-canonical.other-default", isolatedWorld: w }).ok;
      const src = admitTestWorldId(w, "test.hosted-canonical.other-default").ok;
      expect(mine, w).toBe(src);
    }
    expect(admitWorlds({ defaultWorld: ISO_WORLD, isolatedWorld: ISO_WORLD }).ok).toBe(false);
    expect(admitWorlds({ defaultWorld: "world-01", isolatedWorld: ISO_WORLD }).ok).toBe(false);
    expect(admitWorlds({ defaultWorld: "world.perihelion-reach-3", isolatedWorld: ISO_WORLD }).ok).toBe(false);
    expect(admitWorlds({ defaultWorld: DEFAULT_WORLD, isolatedWorld: "world.perihelion-reach-3" }).ok).toBe(false);
  });

  it("refuses any config or var that would not be NOEMA_ENV=test, and any routes/crons", () => {
    const ok = '{ // c\n "vars": {"NOEMA_ENV":"test"}, "workers_dev": true }';
    expect(assertConfigSafe(ok).ok).toBe(true);
    expect(assertConfigSafe('{"vars":{"NOEMA_ENV":"production"}}').ok).toBe(false);
    expect(assertConfigSafe('{"vars":{}}').ok).toBe(false);
    expect(assertConfigSafe('{"vars":{"NOEMA_ENV":"test"},"routes":[{"pattern":"x"}]}').ok).toBe(false);
    expect(assertConfigSafe('{"vars":{"NOEMA_ENV":"test"},"triggers":{"crons":["* * * * *"]}}').ok).toBe(false);
    expect(assertConfigSafe('{"vars":{"NOEMA_ENV":"test"},"route":"noema.guru/*"}').ok).toBe(false);
    expect(assertConfigSafe(ok, ["NOEMA_ENV:production"]).ok).toBe(false);
    expect(assertConfigSafe(ok, ["NOEMA_ENV:test"]).ok).toBe(true);
  });

  it("refuses an acceptance.env that targets the production Supabase project", () => {
    expect(admitAcceptanceEnv({ SUPABASE_URL: SB_URL, SUPABASE_SERVICE_ROLE_KEY: SB_KEY }).ok).toBe(true);
    expect(admitAcceptanceEnv({ SUPABASE_URL: `https://${PROD_REF}.supabase.co`, SUPABASE_SERVICE_ROLE_KEY: SB_KEY }).ok).toBe(false);
    expect(admitAcceptanceEnv({ SUPABASE_URL: `https://x.supabase.co/?r=${PROD_REF}`, SUPABASE_SERVICE_ROLE_KEY: SB_KEY }).ok).toBe(false);
    expect(admitAcceptanceEnv({ SUPABASE_URL: SB_URL }).ok).toBe(false);
    expect(admitAcceptanceEnv({ SUPABASE_SERVICE_ROLE_KEY: SB_KEY }).ok).toBe(false);
    expect(admitAcceptanceEnv({ SUPABASE_URL: "http://evil.example", SUPABASE_SERVICE_ROLE_KEY: SB_KEY }).ok).toBe(false);
  });

  it("loads acceptance.env only when mode is 600", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "acc-env-"));
    const file = path.join(dir, "acceptance.env");
    fs.writeFileSync(file, `SUPABASE_URL=${SB_URL}\nSUPABASE_SERVICE_ROLE_KEY=${SB_KEY}\n`, { mode: 0o644 });
    fs.chmodSync(file, 0o644);
    expect(loadAcceptanceEnv(file).ok).toBe(false);
    fs.chmodSync(file, 0o600);
    const loaded = loadAcceptanceEnv(file) as { ok: boolean; values: Record<string, string> };
    expect(loaded.ok).toBe(true);
    expect(loaded.values.SUPABASE_URL).toBe(SB_URL);
    expect(loadAcceptanceEnv(path.join(dir, "missing.env")).ok).toBe(false);
  });

  it("builds the exact deploy argv with a secrets file and no routes", () => {
    const args = buildDeployArgs({ worker: WORKER, defaultWorld: DEFAULT_WORLD, isolatedWorld: ISO_WORLD, secretsFile: "/tmp/s.json" });
    expect(args).toEqual(["wrangler", "deploy", "--config", "wrangler.acceptance.jsonc", "--name", WORKER,
      "--var", "NOEMA_ENV:test", "--var", "NOEMA_PROTOCOL_VERSION:1",
      "--var", `DEFAULT_WORLD_ID:${DEFAULT_WORLD}`, "--var", `ISOLATED_WATCH_WORLD_ID:${ISO_WORLD}`,
      "--secrets-file", "/tmp/s.json"]);
    expect(() => buildDeployArgs({ worker: "noema-gateway", defaultWorld: DEFAULT_WORLD, isolatedWorld: ISO_WORLD, secretsFile: "/x" })).toThrow();
    expect(() => buildDeployArgs({ worker: WORKER, defaultWorld: "world-01", isolatedWorld: ISO_WORLD, secretsFile: "/x" })).toThrow();
  });

  it("builds run ids from UTC dates", () => {
    expect(runIdFromDate(new Date("2026-11-04T12:00:00Z"))).toBe(RUN);
  });
});

describe("acceptance-733 redaction", () => {
  const uuid = "9978ab0f-e8f6-40c6-9254-d6ffc4c5f2fb";
  it("strips JWTs, bearer tokens, service-role keys, long hex/uuid ids and supabase URLs", () => {
    const s = [
      "tok eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.c2ln",
      "Authorization: Bearer abcDEF123_-token",
      "key sb_secret_AbCdEf0123456789",
      `hex ${"ab".repeat(20)}`,
      `uuid ${uuid}`,
      "url https://abcdefghijklmnopqrst.supabase.co/rest/v1/x",
      `ref ${PROD_REF}`,
    ].join("\n");
    const r = redact(s);
    for (const frag of ["eyJhbGci", "abcDEF123_-token", "sb_secret_", "abab", uuid, "supabase.co", PROD_REF]) {
      expect(r, frag).not.toContain(frag);
    }
    expect(r).toContain("[redacted");
  });

  it("redactDeep keeps allow-listed version ids but redacts the same uuid elsewhere", () => {
    const out = redactDeep({ worker_version_id: uuid, instance: uuid, nested: [{ note: `Bearer zzz${uuid}` }] }, ["worker_version_id"]);
    expect(out.worker_version_id).toBe(uuid);
    expect(JSON.stringify(out)).not.toContain(`"instance":"${uuid}"`);
    expect(JSON.stringify(out.nested)).not.toContain("zzz");
  });
});

// ---------------------------------------------------------------- fake world

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

/** Mirrors the real Observation shape (play_text headings, structured actions); see acceptance-733-runner-fixture.test.ts. */
function obs(name: string, exit: string, consequence: string, entities: Array<Record<string, unknown>>, traces: unknown[] = []) {
  const here = entities.length ? `HERE\n${entities.map((e) => e.label).join("\n")}\n` : "";
  return {
    location: { name, exits: [{ direction: exit }], entities, traces }, consequence,
    play_text: `${name}\nA room.\n${here}EXITS\n${exit}\nSTATUS\nEnergy 80\nHAPPENED\n${consequence}`,
    available_actions: ["LOOK", "MOVE"], affordances: [{ action: "LOOK", verb: "LOOK", cmd: "look" }],
  };
}

function fakeHosted(opts: { seedStatus?: number; calls?: string[]; prodVersion?: () => string } = {}) {
  const head = { revision: 1, sequence: 0 };
  const events: Array<{ event_type: string; payload: Record<string, unknown> }> = [];
  let left = false;
  let evicted = false;
  const seen: Array<{ url: string; method: string }> = [];
  const handler = async (url: string, init: RequestInit = {}) => {
    const u = new URL(url);
    const method = init.method || "GET";
    seen.push({ url, method });
    opts.calls?.push(`${method} ${u.host}${u.pathname}`);
    const headers = (init.headers || {}) as Record<string, string>;
    const body = init.body ? JSON.parse(String(init.body)) : {};
    if (u.host === "noema-gateway.zer0state-noema.workers.dev" && u.pathname === "/version") {
      return jsonRes({ worker_version_id: (opts.prodVersion ?? (() => PROD_V))(), env: "production" });
    }
    if (u.host === "acceptanceprojectref.supabase.co") {
      if (method !== "GET") return jsonRes({ error: "read-only" }, 405);
      if (u.pathname.endsWith("noema_world_heads")) return jsonRes([{ world_id: ISO_WORLD, ...head }]);
      if (u.pathname.endsWith("noema_settled_events")) return jsonRes(events.map((e, i) => ({ sequence: i, ...e })));
      if (u.pathname.endsWith("noema_canonical_settlements")) return jsonRes(events.map((e, i) => ({ revision: i + 1, settlement_id: `s${i}` })));
    }
    if (u.host !== `${WORKER}.zer0state-noema.workers.dev`) return jsonRes({ error: "unexpected host" }, 599);
    switch (u.pathname) {
      case "/version": return jsonRes({ worker_version_id: ACC_V, env: "test", world_id: DEFAULT_WORLD });
      case "/ready": return jsonRes({ ready: true });
      case "/v1/admin/session": return jsonRes({ access_token: ADMIN_JWT });
      case "/v1/admin/controller-token": return jsonRes({ access_token: `eyJhbGciOiJIUzI1NiJ9.agent-${body.handle}.sig` });
      case "/v1/admin/tempo": return jsonRes({ error: { code: "FORBIDDEN" } }, 403);
      case "/v1/command": return body.world_id === ISO_WORLD && headers["X-Noema-Admin-Token"]
        ? (/^alias /.test(String(body.command)) ? jsonRes({ error: { code: "INVALID_REQUEST" } }, 400) : jsonRes({ ok: true, request_id: body.request_id }))
        : jsonRes({ error: { code: "SEAL_REQUIRED" } }, 401);
      case "/v1/operator/test-world/seed": {
        if (!headers["X-Noema-Admin-Token"]) return jsonRes({ error: {} }, 401);
        return opts.seedStatus && opts.seedStatus !== 200 ? jsonRes({ error: { code: "NOT_FOUND" } }, opts.seedStatus)
          : jsonRes({ ok: true, world_id: body.world_id, alias_count: Object.keys(body.aliases).length });
      }
      case "/v1/operator/test-world/instance": {
        if (body.action === "evict") { evicted = true; return jsonRes({ error: "reset" }, 500); }
        return jsonRes({ ok: true, instance_id: evicted ? "inst-bbbb" : "inst-aaaa" });
      }
      case "/v1/watch/live":
        return jsonRes({ rooms: [{ traces: left ? [{ kind: "construction", text: "A maintenance plate names Sable as the last repairer.", visibility: "public" }] : [] }] });
      case "/v1/operator/test-world/command": {
        const auth = headers.authorization || headers.Authorization || "";
        const who = auth.includes("agent-acc-b") ? "b" : "a";
        const args = body.arguments || {};
        const text = JSON.stringify(body);
        if (/;|^alias /.test(String(body.command))) {
          return jsonRes({ ok: false, error: { code: "INVALID_REQUEST", message: "text carriers are not accepted" } }, 400);
        }
        if (body.command === "MOVE") {
          head.revision += 1; head.sequence += 1; events.push({ event_type: "MOVE", payload: {} });
          return jsonRes({ ok: true, request_id: body.request_id, events: [{ type: "MOVE" }], observation: obs("Hall", "west", "You arrive at Hall.", []) });
        }
        if (body.command === "COMMIT") {
          head.revision += 1; head.sequence += 1; events.push({ event_type: "ENTITY_UPDATE", payload: args.operation === "HARVEST" ? { operation: "HARVEST", entity_id: args.entity_id } : { operation: "REPAIR", entity_id: "entity.relay-7" } });
          return jsonRes({ ok: true, request_id: body.request_id, events: [{ type: "ENTITY_UPDATE" }] });
        }
        if (body.command === "LEAVE_WORLD") {
          left = true; head.revision += 1; head.sequence += 1; events.push({ event_type: "AGENT_LEFT_WORLD", payload: {} });
          return jsonRes({ ok: true, request_id: body.request_id });
        }
        if (body.command === "LOOK" || body.command === "ENTER_WORLD" || body.command === "JOIN") {
          const traces = who === "b" && left ? [{ kind: "construction", text: "A maintenance plate names Sable as the last repairer.", visibility: "public" }] : [];
          return jsonRes({
            ok: true, request_id: body.request_id,
            observation: obs("Anchor", "east", "You take in Anchor.", [{ entity_id: "entity.relay-7", label: "scarred-conduit", repairable: true }, { entity_id: "entity.acceptance-source", label: "parts-cache", harvestable: true }], traces),
          });
        }
        return jsonRes({ ok: true, request_id: body.request_id, echo_len: text.length });
      }
    }
    return jsonRes({ error: "unrouted " + u.pathname }, 404);
  };
  return { handler, head, events, seen };
}

function mkEnv(opts: { mode?: number; supabaseUrl?: string } = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "acc-home-"));
  const envFile = path.join(home, "acceptance.env");
  fs.writeFileSync(envFile, `SUPABASE_URL=${opts.supabaseUrl ?? SB_URL}\nSUPABASE_SERVICE_ROLE_KEY=${SB_KEY}\n`);
  fs.chmodSync(envFile, opts.mode ?? 0o600);
  const runsDir = path.join(home, "runs");
  return { home, envFile, runsDir };
}

function mkCtx(h: ReturnType<typeof fakeHosted>, e: ReturnType<typeof mkEnv>, extra: { execCalls?: Array<{ cmd: string; args: string[]; env?: Record<string, string | undefined> }>; secretsSeen?: string[]; dirty?: boolean; gitFails?: boolean; proc?: unknown; tmpdir?: string } = {}) {
  const out: string[] = [];
  const err: string[] = [];
  const ctx = {
    env: { NOEMA_ACCEPTANCE_ENV: e.envFile, NOEMA_ACCEPTANCE_RUNS: e.runsDir, HOME: e.home } as Record<string, string>,
    fetch: (url: string, init?: RequestInit) => h.handler(String(url), init),
    exec: (cmd: string, args: string[], opts: { env?: Record<string, string | undefined> } = {}) => {
      extra.execCalls?.push({ cmd, args, env: opts.env });
      const i = args.indexOf("--secrets-file");
      if (i >= 0) {
        const file = args[i + 1];
        extra.secretsSeen?.push(`${(fs.statSync(file).mode & 0o777).toString(8)}:${fs.readFileSync(file, "utf8")}`);
      }
      if (args[1] === "deploy") return { status: 0, stdout: `Deployed ${BASE}\nCurrent Version ID: ${ACC_V}\n`, stderr: "" };
      if (cmd === "git" && args[0] === "status") {
        if (extra.gitFails) return { status: 128, stdout: "", stderr: "fatal" };
        return { status: 0, stdout: extra.dirty ? " M workers/noema/src/x.ts\n" : "", stderr: "" };
      }
      if (cmd === "git") return { status: 0, stdout: "4fc76251abcdef\n", stderr: "" };
      return { status: 0, stdout: "", stderr: "" };
    },
    ...(extra.proc ? { proc: extra.proc } : {}),
    ...(extra.tmpdir ? { tmpdir: extra.tmpdir } : {}),
    now: () => new Date("2026-11-04T12:00:00Z"),
    sleep: async () => {},
    out: (s: string) => out.push(String(s)),
    err: (s: string) => err.push(String(s)),
    randomHex: (n: number) => "ab12cd34".repeat(Math.ceil(n / 4)).slice(0, n * 2),
  };
  return { ctx, out, err };
}

const readState = (e: ReturnType<typeof mkEnv>) => JSON.parse(fs.readFileSync(path.join(e.runsDir, `${RUN}.json`), "utf8"));

async function deployed(opts: Parameters<typeof fakeHosted>[0] = {}) {
  const h = fakeHosted(opts);
  const e = mkEnv();
  const execCalls: Array<{ cmd: string; args: string[]; env?: Record<string, string | undefined> }> = [];
  const secretsSeen: string[] = [];
  const c = mkCtx(h, e, { execCalls, secretsSeen });
  expect(await main(["deploy"], c.ctx)).toBe(0);
  return { h, e, c, execCalls, secretsSeen };
}

describe("acceptance-733 plan", () => {
  it("prints the action list with no network, process, or credential access", async () => {
    const h = fakeHosted();
    const e = mkEnv({ mode: 0o644 }); // would be refused if plan touched credentials
    const execCalls: Array<{ cmd: string; args: string[] }> = [];
    const c = mkCtx(h, e, { execCalls });
    expect(await main(["plan"], c.ctx)).toBe(0);
    expect(execCalls).toEqual([]);
    expect(h.seen).toEqual([]);
    const text = c.out.join("\n");
    for (const w of ["deploy", "g1", "g2", "g3-urls", "r0", "receipt", "teardown", "noema-733-acc-", "wrangler.acceptance.jsonc"]) {
      expect(text).toContain(w);
    }
    expect(fs.existsSync(e.runsDir)).toBe(false);
  });
});

describe("acceptance-733 deploy", () => {
  it("deploys with the exact flags, ephemeral 0600 secrets, cleanup, 0600 run state, production control", async () => {
    const { e, c, execCalls, secretsSeen } = await deployed();
    const deploy = execCalls.find((x) => x.args[1] === "deploy")!;
    expect(deploy.cmd).toBe("npx");
    expect(deploy.args.slice(0, 6)).toEqual(["wrangler", "deploy", "--config", "wrangler.acceptance.jsonc", "--name", WORKER]);
    expect(deploy.args).toContain(`ISOLATED_WATCH_WORLD_ID:${ISO_WORLD}`);
    expect(deploy.env && "CLOUDFLARE_API_TOKEN" in deploy.env ? deploy.env.CLOUDFLARE_API_TOKEN : undefined).toBeUndefined();
    const secretsFile = deploy.args[deploy.args.indexOf("--secrets-file") + 1];
    expect(fs.existsSync(secretsFile)).toBe(false);
    expect(secretsSeen).toHaveLength(1);
    expect(secretsSeen[0].startsWith("600:")).toBe(true);
    const sec = JSON.parse(secretsSeen[0].slice(4));
    expect(Object.keys(sec).sort()).toEqual(["ADMIN_OPERATOR_TOKEN", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_URL", "TOKEN_SIGNING_SECRET"]);
    expect(sec.SUPABASE_URL).toBe(SB_URL);
    expect(sec.ADMIN_OPERATOR_TOKEN.length).toBeGreaterThanOrEqual(32);
    const stateFile = path.join(e.runsDir, `${RUN}.json`);
    expect(fs.statSync(stateFile).mode & 0o777).toBe(0o600);
    const st = readState(e);
    expect(st).toMatchObject({ worker: WORKER, base: BASE, default_world: DEFAULT_WORLD, isolated_world: ISO_WORLD, version: ACC_V });
    expect(st.production.before).toBe(PROD_V);
    expect(c.out.join("\n")).not.toContain(sec.ADMIN_OPERATOR_TOKEN);
    expect(c.out.join("\n")).not.toContain(SB_KEY);
  });

  it("removes the ephemeral secrets file even when wrangler fails", async () => {
    const h = fakeHosted();
    const e = mkEnv();
    const c = mkCtx(h, e);
    let secretsFile = "";
    c.ctx.exec = (_cmd: string, args: string[]) => {
      secretsFile = args[args.indexOf("--secrets-file") + 1];
      expect(fs.existsSync(secretsFile)).toBe(true);
      return { status: 1, stdout: "", stderr: "boom" };
    };
    expect(await main(["deploy"], c.ctx)).not.toBe(0);
    expect(secretsFile).not.toBe("");
    expect(fs.existsSync(secretsFile)).toBe(false);
  });

  it("refuses a group/world-readable acceptance.env and a production Supabase ref before any call", async () => {
    for (const bad of [mkEnv({ mode: 0o644 }), mkEnv({ supabaseUrl: `https://${PROD_REF}.supabase.co` })]) {
      const h = fakeHosted();
      const execCalls: Array<{ cmd: string; args: string[] }> = [];
      const c = mkCtx(h, bad, { execCalls });
      expect(await main(["deploy"], c.ctx)).not.toBe(0);
      expect(execCalls).toEqual([]);
      expect(h.seen).toEqual([]);
      expect(c.err.join("\n")).not.toContain(SB_KEY);
    }
  });
});

describe("acceptance-733 g1", () => {
  it("passes against a conforming fake and records only booleans (no tokens, no sentinel leak)", async () => {
    const { e, c } = await deployed();
    expect(await main(["g1", "--run", RUN], c.ctx)).toBe(0);
    const g1 = readState(e).sections.g1_isolation;
    expect(g1.passed).toBe(true);
    for (const k of ["seed_ok", "structured_join_canonical", "structured_move_canonical", "text_line_stripped_canonical",
      "text_command_refused", "macro_step_stripped_canonical", "command_endpoint_structured_join_canonical", "command_endpoint_text_refused", "refusals_left_head_unchanged", "move_advanced_head", "agent_tempo_refused"]) {
      expect(g1.checks[k], k).toBe(true);
    }
    const dump = JSON.stringify(readState(e).sections) + c.out.join("\n");
    expect(dump).not.toContain("eyJ");
    expect(dump).not.toContain(SB_KEY);
  });

  it("stops the phase and records false when the seed route is unavailable", async () => {
    const { e, c, h } = await deployed({ seedStatus: 404 });
    expect(await main(["g1", "--run", RUN], c.ctx)).not.toBe(0);
    const g1 = readState(e).sections.g1_isolation;
    expect(g1.passed).toBe(false);
    expect(g1.checks.seed_ok).toBe(false);
    expect(g1.checks.structured_join_canonical).toBeUndefined();
    expect(h.seen.every((s) => s.url.includes(WORKER) || s.url.includes("supabase.co") || s.url.includes("noema-gateway"))).toBe(true);
  });

  it("never sends a non-GET request to Supabase", async () => {
    const { h, c } = await deployed();
    await main(["g1", "--run", RUN], c.ctx);
    await main(["g2", "--run", RUN], c.ctx);
    expect(h.seen.filter((s) => s.url.includes("supabase.co")).every((s) => s.method === "GET")).toBe(true);
  });
});

describe("acceptance-733 g2 / r0 / g3-urls", () => {
  it("g2 proves second-principal trace readback after reset", async () => {
    const { e, c } = await deployed();
    expect(await main(["g2", "--run", RUN], c.ctx)).toBe(0);
    const g2 = readState(e).sections.g2_s3_readback;
    expect(g2.passed).toBe(true);
    for (const k of ["repairable_entity_found", "repair_committed_in_sql", "leave_committed_in_sql", "probe_ids_equal_before_evict",
      "instance_id_changed_after_evict", "same_worker_version_after_evict", "second_principal_sees_construction_trace",
      "trace_count_within_3", "no_hidden_refs", "watch_live_shows_trace"]) {
      expect(g2.checks[k], k).toBe(true);
    }
    expect(g2.ac17_stale_trace).toBe("not_covered");
    expect(JSON.stringify(g2)).not.toContain("inst-");
  });

  it("r0 checks the A3 room stack fields and MOVE orientation", async () => {
    const { e, c } = await deployed();
    expect(await main(["r0", "--run", RUN], c.ctx)).toBe(0);
    const r0 = readState(e).sections.r0_presentation;
    expect(r0.passed).toBe(true);
    for (const f of ["WHERE", "HERE", "EXITS", "STATUS", "HAPPENED", "AVAILABLE_ACTIONS"]) expect(r0.checks[`field_${f}`], f).toBe(true);
    expect(r0.checks.move_orientation_present).toBe(true);
  });

  it("g3-urls prints the public pages and viewports without calling the network", async () => {
    const { e, c, h } = await deployed();
    const before = h.seen.length;
    expect(await main(["g3-urls", "--run", RUN], c.ctx)).toBe(0);
    expect(h.seen.length).toBe(before);
    const text = c.out.join("\n");
    for (const frag of [`${BASE}/watch?mode=text`, `${BASE}/watch?mode=pixel`, `${BASE}/watch?mode=map`, `${BASE}/`, "360", "1440", SENT]) {
      expect(text, frag).toContain(frag);
    }
    void e;
  });
});

describe("acceptance-733 receipt and teardown", () => {
  it("writes a redacted noema-733-hosted-gates/1 receipt, production unchanged, no tokens", async () => {
    const { e, c } = await deployed();
    await main(["g1", "--run", RUN], c.ctx);
    c.out.length = 0;
    expect(await main(["receipt", "--run", RUN], c.ctx)).toBe(0);
    const receipt = JSON.parse(c.out.join("\n"));
    expect(receipt.schema).toBe("noema-733-hosted-gates/1");
    for (const k of ["g1_isolation", "g2_s3_readback", "g3_watch_home", "r0_presentation", "c9_checklist", "teardown"]) {
      expect(receipt, k).toHaveProperty(k);
    }
    expect(receipt.worker).toBe(WORKER);
    expect(receipt.worker_version).toBe(ACC_V);
    expect(receipt.no_production_routes).toBe(true);
    expect(receipt.production_worker_version_control).toMatchObject({ unchanged: true });
    const flat = c.out.join("\n");
    expect(flat).not.toContain("eyJ");
    expect(flat).not.toContain(SB_URL);
    expect(flat).not.toContain(readState(e).admin_operator_token);
    expect(flat).not.toContain(PROD_REF);
  });

  it("flags production version drift in the receipt", async () => {
    let v = PROD_V;
    const { c } = await deployed({ prodVersion: () => v });
    v = "33333333-3333-4333-8333-333333333333";
    c.out.length = 0;
    await main(["receipt", "--run", RUN], c.ctx);
    expect(JSON.parse(c.out.join("\n")).production_worker_version_control.unchanged).toBe(false);
  });

  it("teardown deletes only the guarded worker and scrubs stored secrets", async () => {
    const { e, c, execCalls } = await deployed();
    execCalls.length = 0;
    expect(await main(["teardown", "--run", RUN], c.ctx)).toBe(0);
    const del = execCalls.find((x) => x.args[1] === "delete")!;
    expect(del.cmd).toBe("npx");
    expect(del.args).toEqual(["wrangler", "delete", "--config", "wrangler.acceptance.jsonc", "--name", WORKER, "--force"]);
    const st = readState(e);
    expect(st.admin_operator_token).toBeUndefined();
    expect(st.sections.teardown).toMatchObject({ deleted: true, secrets_scrubbed: true });
  });

  it("teardown refuses a tampered run state naming a non-conforming worker", async () => {
    const { e, c, execCalls } = await deployed();
    const file = path.join(e.runsDir, `${RUN}.json`);
    const st = readState(e);
    st.worker = "noema-gateway";
    fs.writeFileSync(file, JSON.stringify(st), { mode: 0o600 });
    execCalls.length = 0;
    expect(await main(["teardown", "--run", RUN], c.ctx)).not.toBe(0);
    expect(execCalls).toEqual([]);
  });
});


// ---------------------------------------------------------------- review hardening (#733 advisories)

type ExecCall = { cmd: string; args: string[]; env?: Record<string, string | undefined> };

describe("acceptance-733 run-state identity (advisory 1)", () => {
  it("refuses every state-loading subcommand when the worker name is valid but differs from the run id", async () => {
    const { e, c, execCalls, h } = await deployed();
    const other = "20261104t120001z";
    const file = path.join(e.runsDir, `${RUN}.json`);
    const st = readState(e);
    st.worker = `noema-733-acc-${other}`;
    st.base = `https://${st.worker}.zer0state-noema.workers.dev`;
    fs.writeFileSync(file, JSON.stringify(st), { mode: 0o600 });
    for (const cmd of ["teardown", "g1", "g2", "r0", "g3-urls", "receipt"]) {
      execCalls.length = 0;
      const seen = h.seen.length;
      c.err.length = 0;
      expect(await main([cmd, "--run", RUN], c.ctx), cmd).not.toBe(0);
      expect(c.err.join("\n"), cmd).toContain("run state does not match run id");
      expect(execCalls, cmd).toEqual([]);
      expect(h.seen.length, cmd).toBe(seen);
    }
  });
});

describe("acceptance-733 secrets file lifecycle (advisory 2)", () => {
  function fakeProc() {
    const handlers = new Map<string, Array<() => void>>();
    const killed: string[] = [];
    return {
      handlers, killed, pid: 4242,
      on(ev: string, fn: () => void) { handlers.set(ev, [...(handlers.get(ev) || []), fn]); return this; },
      off(ev: string, fn: () => void) { handlers.set(ev, (handlers.get(ev) || []).filter((f) => f !== fn)); return this; },
      kill(_pid: number, sig: string) { killed.push(sig); return true; },
      emit(ev: string) { for (const fn of [...(handlers.get(ev) || [])]) fn(); },
      count() { return [...handlers.values()].reduce((n, l) => n + l.length, 0); },
    };
  }

  it("unlinks the secrets file synchronously on SIGTERM/SIGINT/SIGHUP, re-raises, and removes handlers after deploy", async () => {
    for (const sig of ["SIGTERM", "SIGINT", "SIGHUP"]) {
      const h = fakeHosted();
      const e = mkEnv();
      const proc = fakeProc();
      const c = mkCtx(h, e, { proc });
      let secretsFile = "";
      let existedAtSignal = true;
      const inner = c.ctx.exec;
      c.ctx.exec = (cmd: string, args: string[], opts: { env?: Record<string, string | undefined> } = {}) => {
        if (args[1] === "deploy") {
          secretsFile = args[args.indexOf("--secrets-file") + 1];
          expect(fs.existsSync(secretsFile)).toBe(true);
          proc.emit(sig);
          existedAtSignal = fs.existsSync(secretsFile);
        }
        return inner(cmd, args, opts);
      };
      await main(["deploy"], c.ctx);
      expect(existedAtSignal, sig).toBe(false);
      expect(proc.killed, sig).toEqual([sig]);
      expect(fs.existsSync(secretsFile), sig).toBe(false);
      expect(proc.count(), sig).toBe(0);
    }
  });

  it("unlinks on process exit during the deploy window and leaves no handlers after a normal deploy", async () => {
    const h = fakeHosted();
    const e = mkEnv();
    const proc = fakeProc();
    const c = mkCtx(h, e, { proc });
    let during = 0;
    const inner = c.ctx.exec;
    c.ctx.exec = (cmd: string, args: string[], opts: { env?: Record<string, string | undefined> } = {}) => {
      if (args[1] === "deploy") {
        during = proc.count();
        const f = args[args.indexOf("--secrets-file") + 1];
        proc.emit("exit");
        expect(fs.existsSync(f)).toBe(false);
      }
      return inner(cmd, args, opts);
    };
    expect(await main(["deploy"], c.ctx)).toBe(0);
    expect(during).toBeGreaterThanOrEqual(4);
    expect(proc.count()).toBe(0);
  });

  it("creates the secrets file exclusively: a pre-existing file is refused, left untouched, and wrangler never runs", async () => {
    const h = fakeHosted();
    const e = mkEnv();
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "acc-tmp-"));
    const execCalls: ExecCall[] = [];
    const c = mkCtx(h, e, { execCalls, tmpdir: tmp });
    const squat = path.join(tmp, `.noema-733-acc-${RUN}-${process.pid}.json`);
    fs.writeFileSync(squat, "PRE-EXISTING", { mode: 0o644 });
    expect(await main(["deploy"], c.ctx)).not.toBe(0);
    expect(fs.readFileSync(squat, "utf8")).toBe("PRE-EXISTING");
    expect(execCalls.some((x) => x.args[1] === "deploy")).toBe(false);
  });
});

describe("acceptance-733 clean source tree (advisory 5)", () => {
  it("refuses to deploy a dirty working tree before any wrangler call or state write", async () => {
    const h = fakeHosted();
    const e = mkEnv();
    const execCalls: ExecCall[] = [];
    const c = mkCtx(h, e, { execCalls, dirty: true });
    expect(await main(["deploy"], c.ctx)).not.toBe(0);
    expect(c.err.join("\n")).toMatch(/dirty|uncommitted/i);
    expect(execCalls.some((x) => x.args[1] === "deploy")).toBe(false);
    expect(fs.existsSync(e.runsDir)).toBe(false);
    expect(execCalls.some((x) => x.cmd === "git" && x.args.join(" ") === "status --porcelain")).toBe(true);
  });

  it("refuses when git status itself fails", async () => {
    const h = fakeHosted();
    const e = mkEnv();
    const execCalls: ExecCall[] = [];
    const c = mkCtx(h, e, { execCalls, gitFails: true });
    expect(await main(["deploy"], c.ctx)).not.toBe(0);
    expect(execCalls.some((x) => x.args[1] === "deploy")).toBe(false);
  });

  it("records source_tree_clean: true in state and receipt for a clean tree", async () => {
    const { e, c } = await deployed();
    expect(readState(e).source_tree_clean).toBe(true);
    c.out.length = 0;
    await main(["receipt", "--run", RUN], c.ctx);
    expect(JSON.parse(c.out.join("\n")).source_tree_clean).toBe(true);
  });
});

describe("acceptance-733 --g3 file validation (advisory 6)", () => {
  async function receiptWithG3(content: unknown) {
    const { e, c } = await deployed();
    const f = path.join(e.home, "g3.json");
    fs.writeFileSync(f, typeof content === "string" ? content : JSON.stringify(content));
    c.out.length = 0;
    const code = await main(["receipt", "--run", RUN, "--g3", f], c.ctx);
    return { code, receipt: code === 0 ? JSON.parse(c.out.join("\n")) : null, c, e };
  }

  it("keeps allowlisted keys, drops unknown keys, and cannot override status or other receipt fields", async () => {
    const { receipt } = await receiptWithG3({
      passed: true, keyboard_ok: true, sentinel_absent: true, min_contrast: 4.7, notes: "ok",
      status: "pending_browser_phase", worker: "noema-gateway", production_worker_version_control: { unchanged: false },
      schema: "evil", evil_extra: { a: 1 }, teardown: { deleted: true },
    });
    const g3 = receipt.g3_watch_home;
    expect(g3.status).toBe("recorded");
    expect(g3).toMatchObject({ passed: true, keyboard_ok: true, sentinel_absent: true, min_contrast: 4.7, notes: "ok" });
    for (const k of ["worker", "production_worker_version_control", "schema", "evil_extra", "teardown"]) expect(g3, k).not.toHaveProperty(k);
    expect(receipt.worker).toBe(WORKER);
    expect(receipt.schema).toBe("noema-733-hosted-gates/1");
    expect(receipt.production_worker_version_control.unchanged).toBe(true);
    expect(receipt.teardown).toEqual({ status: "not_run" });
  });

  it("rejects wrongly typed values for allowlisted keys and non-object files", async () => {
    expect((await receiptWithG3({ passed: "yes" })).code).not.toBe(0);
    expect((await receiptWithG3({ min_contrast: "high" })).code).not.toBe(0);
    expect((await receiptWithG3([1, 2])).code).not.toBe(0);
    expect((await receiptWithG3("not json")).code).not.toBe(0);
  });
});

describe("acceptance-733 aggregate gates (advisory 7)", () => {
  async function receiptAfter(phases: string[], g3?: unknown) {
    const { e, c } = await deployed();
    for (const p of phases) await main([p, "--run", RUN], c.ctx);
    const args = ["receipt", "--run", RUN];
    if (g3 !== undefined) {
      const f = path.join(e.home, "g3.json");
      fs.writeFileSync(f, JSON.stringify(g3));
      args.push("--g3", f);
    }
    c.out.length = 0;
    await main(args, c.ctx);
    return JSON.parse(c.out.join("\n"));
  }

  it("pending g3 (and not-yet-run phases) never count as passed", async () => {
    const r = await receiptAfter(["g1", "g2", "r0"]);
    expect(r.gates).toEqual({ g1: "passed", g2: "passed", g3: "pending", r0: "passed", c9: "not_covered" });
    expect(r.all_required_passed).toBe(false);
  });

  it("all_required_passed is true only when g1, g2, g3 and r0 passed; c9 is optional", async () => {
    const r = await receiptAfter(["g1", "g2", "r0"], { passed: true, sentinel_absent: true });
    expect(r.gates).toEqual({ g1: "passed", g2: "passed", g3: "passed", r0: "passed", c9: "not_covered" });
    expect(r.all_required_passed).toBe(true);
  });

  it("a recorded g3 with passed:false or a false check is failed; an unrun phase is pending", async () => {
    const failed = await receiptAfter(["g1", "g2", "r0"], { passed: false });
    expect(failed.gates.g3).toBe("failed");
    expect(failed.all_required_passed).toBe(false);
    const falseCheck = await receiptAfter(["g1", "g2", "r0"], { passed: true, keyboard_ok: false });
    expect(falseCheck.gates.g3).toBe("failed");
    const none = await receiptAfter([]);
    expect(none.gates).toEqual({ g1: "pending", g2: "pending", g3: "pending", r0: "pending", c9: "not_covered" });
    expect(none.all_required_passed).toBe(false);
  });
});
