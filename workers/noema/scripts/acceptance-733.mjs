#!/usr/bin/env node
/**
 * Fail-closed #733 hosted-gates acceptance runner (isolated no-route Worker).
 *
 *   node scripts/acceptance-733.mjs plan | deploy | g1 | g2 | g3-urls | r0 | receipt | teardown
 *
 * Only ever touches a uniquely named `noema-733-acc-<utc>` workers.dev Worker, test
 * worlds `test.hosted-canonical.*`, and the acceptance Supabase project listed in
 * ~/.config/noema/acceptance.env (mode 600; never the production project). All
 * network/process access goes through the injected ctx (`fetch`, `exec`) so tests
 * use fakes. Secrets are generated per run, uploaded from an ephemeral 0600 file
 * deleted in `finally`, and never written to receipts.
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseOperatorEnv } from "./operator-env.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG_DIR = path.resolve(HERE, "..");

export const RECEIPT_SCHEMA = "noema-733-hosted-gates/1";
export const RUN_STATE_SCHEMA = "noema-733-run-state/1";
export const CONFIG_NAME = "wrangler.acceptance.jsonc";
export const PRODUCTION_SUPABASE_REF = "dezykkherxlaysxyvgbs";
export const PRODUCTION_VERSION_URL = "https://noema-gateway.zer0state-noema.workers.dev/version";
export const WORKER_RE = /^noema-733-acc-\d{8}t\d{6}z$/;
export const BASE_RE = /^https:\/\/noema-733-acc-\d{8}t\d{6}z\.zer0state-noema\.workers\.dev$/;
const RUN_ID_RE = /^\d{8}t\d{6}z$/;
const TEST_WORLD_PREFIX = "test.hosted-canonical.";
const SUPABASE_URL_RE = /^https:\/\/[a-z0-9]{10,40}\.supabase\.co$/;
const KEEP_KEYS = ["worker_version", "worker_version_id", "production_version_before", "production_version_after", "source_commit"];
const SCREEN_WIDTHS = [360, 390, 768, 1280, 1440];

// ---------------------------------------------------------------- guards

export function admitWorkerName(raw) {
  const worker = String(raw ?? "");
  return WORKER_RE.test(worker) ? { ok: true, worker } : { ok: false, message: `worker name must match ${WORKER_RE}` };
}

export function admitBaseUrl(raw) {
  const base = String(raw ?? "");
  return BASE_RE.test(base) ? { ok: true, base } : { ok: false, message: "base URL must be https://noema-733-acc-<utc>.zer0state-noema.workers.dev" };
}

/** Mirror of src/test-world.ts admitTestWorldId (parity-tested). */
function admitTestWorld(raw, defaultWorldId) {
  const world_id = String(raw || "").trim();
  if (!world_id) return { ok: false, message: "world_id required" };
  const defaultId = String(defaultWorldId || "world-01").trim() || "world-01";
  if (world_id === defaultId || world_id === "world-01" || world_id === "world.perihelion-reach" || world_id.startsWith("world.perihelion")) {
    return { ok: false, message: "that world is not admitted for isolated verification" };
  }
  if (!world_id.startsWith(TEST_WORLD_PREFIX)) return { ok: false, message: "world_id must be test.hosted-canonical.<suffix>" };
  const suffix = world_id.slice(TEST_WORLD_PREFIX.length);
  if (!suffix || suffix.startsWith(".") || suffix.endsWith(".") || suffix.includes("..")) return { ok: false, message: "invalid test world suffix" };
  if (!/^[a-z0-9][a-z0-9.-]{0,47}$/i.test(suffix)) return { ok: false, message: "invalid test world suffix" };
  return { ok: true, world_id };
}

export function admitWorlds({ defaultWorld, isolatedWorld }) {
  const iso = admitTestWorld(isolatedWorld, defaultWorld);
  if (!iso.ok) return iso;
  const def = admitTestWorld(defaultWorld, "world-01");
  if (!def.ok) return { ok: false, message: `default world: ${def.message}` };
  return { ok: true, defaultWorld: def.world_id, isolatedWorld: iso.world_id };
}

function stripJsonc(text) {
  let out = "";
  let inStr = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inStr) {
      out += c;
      if (c === "\\") { out += text[i + 1] ?? ""; i += 1; } else if (c === '"') inStr = false;
    } else if (c === '"') { inStr = true; out += c; }
    else if (c === "/" && text[i + 1] === "/") { while (i < text.length && text[i] !== "\n") i += 1; out += "\n"; }
    else if (c === "/" && text[i + 1] === "*") { i += 2; while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i += 1; i += 1; }
    else out += c;
  }
  return out;
}

const FORBIDDEN_CONFIG_KEYS = ["routes", "route", "triggers", "kv_namespaces", "d1_databases", "r2_buckets", "queues", "send_email", "env", "services", "unsafe"];

/** Refuse any config/var that is not NOEMA_ENV=test with no routes/crons/bindings. */
export function assertConfigSafe(configText, extraVars = []) {
  let cfg;
  try {
    cfg = JSON.parse(stripJsonc(String(configText)));
  } catch {
    return { ok: false, message: "config is not valid JSONC" };
  }
  if (cfg?.vars?.NOEMA_ENV !== "test") return { ok: false, message: "config vars.NOEMA_ENV must be exactly test" };
  for (const key of FORBIDDEN_CONFIG_KEYS) {
    if (key in cfg) return { ok: false, message: `config must not define ${key}` };
  }
  for (const v of extraVars) {
    const [name, ...rest] = String(v).split(":");
    if (name === "NOEMA_ENV" && rest.join(":") !== "test") return { ok: false, message: "--var NOEMA_ENV must be test" };
  }
  return { ok: true };
}

export function loadAcceptanceEnv(file) {
  let st;
  try {
    st = fs.statSync(file);
  } catch {
    return { ok: false, message: `acceptance env file not found: ${file}`, values: {} };
  }
  if (!st.isFile()) return { ok: false, message: "acceptance env path is not a file", values: {} };
  if ((st.mode & 0o777) !== 0o600) {
    return { ok: false, message: `acceptance env file must be mode 600 (found ${(st.mode & 0o777).toString(8)}); chmod 600 it`, values: {} };
  }
  return { ok: true, values: parseOperatorEnv(fs.readFileSync(file, "utf8")) };
}

export function admitAcceptanceEnv(values) {
  const url = String(values?.SUPABASE_URL || "").trim();
  const key = String(values?.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) return { ok: false, message: "acceptance.env needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" };
  if (url.includes(PRODUCTION_SUPABASE_REF)) return { ok: false, message: "refusing the production Supabase project (decision D1a: use a separate project)" };
  if (!SUPABASE_URL_RE.test(url)) return { ok: false, message: "SUPABASE_URL must be https://<ref>.supabase.co" };
  return { ok: true, url, key };
}

export function buildDeployArgs({ worker, defaultWorld, isolatedWorld, secretsFile }) {
  const w = admitWorkerName(worker);
  if (!w.ok) throw new Error(w.message);
  const worlds = admitWorlds({ defaultWorld, isolatedWorld });
  if (!worlds.ok) throw new Error(worlds.message);
  if (!secretsFile) throw new Error("secretsFile required");
  return ["wrangler", "deploy", "--config", CONFIG_NAME, "--name", worker,
    "--var", "NOEMA_ENV:test", "--var", "NOEMA_PROTOCOL_VERSION:1",
    "--var", `DEFAULT_WORLD_ID:${defaultWorld}`, "--var", `ISOLATED_WATCH_WORLD_ID:${isolatedWorld}`,
    "--secrets-file", secretsFile];
}

export function runIdFromDate(date) {
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(date.getUTCFullYear(), 4)}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}t${p(date.getUTCHours())}${p(date.getUTCMinutes())}${p(date.getUTCSeconds())}z`;
}

// ---------------------------------------------------------------- redaction

export function redact(input) {
  return String(input)
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g, "[redacted-jwt]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\b(?:sb_secret|sb_publishable|sbp)_[A-Za-z0-9_-]+/g, "[redacted-key]")
    .replace(/https?:\/\/[a-z0-9-]+\.supabase\.(?:co|in)\S*/gi, "[redacted-supabase-url]")
    .replace(new RegExp(PRODUCTION_SUPABASE_REF, "g"), "[redacted-ref]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "[redacted-id]")
    .replace(/\b[0-9a-f]{32,}\b/gi, "[redacted-id]");
}

export function redactDeep(value, keepKeys = [], key = "") {
  if (typeof value === "string") {
    if (keepKeys.includes(key) && /^[0-9a-f-]{7,40}$/i.test(value)) return value;
    return redact(value);
  }
  if (Array.isArray(value)) return value.map((v) => redactDeep(v, keepKeys, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redactDeep(v, keepKeys, k)]));
  }
  return value;
}

// ---------------------------------------------------------------- context & state

function defaultCtx() {
  return {
    env: process.env,
    fetch: (...a) => fetch(...a),
    exec: (cmd, args, opts = {}) => {
      const r = spawnSync(cmd, args, { cwd: opts.cwd || PKG_DIR, env: opts.env || process.env, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
      return { status: r.status ?? 1, stdout: r.stdout || "", stderr: r.stderr || "" };
    },
    wsFactory: typeof WebSocket === "function" ? (url) => new WebSocket(url) : undefined,
    now: () => new Date(),
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    out: (s) => console.log(s),
    err: (s) => console.error(s),
    randomHex: (n) => crypto.randomBytes(n).toString("hex"),
    pkgDir: PKG_DIR,
    tmpdir: os.tmpdir(),
    proc: process,
  };
}

const home = (ctx) => ctx.env.HOME || os.homedir();
const envFilePath = (ctx) => ctx.env.NOEMA_ACCEPTANCE_ENV || path.join(home(ctx), ".config/noema/acceptance.env");
const runsDir = (ctx) => ctx.env.NOEMA_ACCEPTANCE_RUNS || path.join(home(ctx), ".config/noema/acceptance-runs");
const wranglerEnv = (ctx) => {
  const env = { ...ctx.env };
  delete env.CLOUDFLARE_API_TOKEN;
  delete env.CLOUDFLARE_API_KEY;
  return env;
};

function fail(message) {
  throw new Error(message);
}

function statePath(ctx, runId) {
  if (!RUN_ID_RE.test(String(runId))) fail("--run must look like 20261104t120000z");
  return path.join(runsDir(ctx), `${runId}.json`);
}

function writeState(ctx, state) {
  const file = statePath(ctx, state.run_id);
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), { mode: 0o600 });
  fs.chmodSync(tmp, 0o600);
  fs.renameSync(tmp, file);
}

/** Load and re-validate the run state: a tampered file cannot widen the guards. */
function loadRun(ctx, runId) {
  if (!runId) fail("--run <run-id> is required");
  const file = statePath(ctx, runId);
  let state;
  try {
    state = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    fail(`no run state at ${file}`);
  }
  const w = admitWorkerName(state.worker);
  if (!w.ok) fail(w.message);
  if (state.worker !== `noema-733-acc-${runId}` || state.run_id !== runId) fail("run state does not match run id");
  const expectedBase = `https://${state.worker}.zer0state-noema.workers.dev`;
  if (state.base !== expectedBase || !admitBaseUrl(state.base).ok) fail("run state base URL failed the guard");
  const worlds = admitWorlds({ defaultWorld: state.default_world, isolatedWorld: state.isolated_world });
  if (!worlds.ok) fail(worlds.message);
  state.sections ||= {};
  return state;
}

async function http(ctx, state, method, pathname, { headers = {}, body } = {}) {
  if (!admitBaseUrl(state.base).ok) fail("base URL guard failed");
  const res = await ctx.fetch(`${state.base}${pathname}`, {
    method,
    headers: { ...(body === undefined ? {} : { "content-type": "application/json" }), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }
  return { status: res.status, body: parsed, text };
}

async function productionVersion(ctx) {
  try {
    const res = await ctx.fetch(PRODUCTION_VERSION_URL, { method: "GET" });
    const body = JSON.parse(await res.text());
    return typeof body.worker_version_id === "string" ? body.worker_version_id : null;
  } catch {
    return null;
  }
}

function acceptanceSupabase(ctx) {
  const loaded = loadAcceptanceEnv(envFilePath(ctx));
  if (!loaded.ok) fail(loaded.message);
  const admitted = admitAcceptanceEnv(loaded.values);
  if (!admitted.ok) fail(admitted.message);
  return admitted;
}

/** Read-only PostgREST GET scoped to one world. Never any other method. */
async function sbRows(ctx, state, table) {
  const { url, key } = acceptanceSupabase(ctx);
  const res = await ctx.fetch(`${url}/rest/v1/${table}?world_id=eq.${encodeURIComponent(state.isolated_world)}&select=*`, {
    method: "GET",
    headers: { apikey: key, authorization: `Bearer ${key}`, accept: "application/json" },
  });
  const rows = JSON.parse(await res.text());
  return Array.isArray(rows) ? rows : [];
}

async function sbHead(ctx, state) {
  const [row] = await sbRows(ctx, state, "noema_world_heads");
  return row ? { revision: row.revision ?? null, sequence: row.sequence ?? null } : null;
}

const strings = (value, acc = []) => {
  if (typeof value === "string") acc.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, acc));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) { acc.push(k); strings(v, acc); }
  return acc;
};

function findAll(value, pred, acc = []) {
  if (Array.isArray(value)) value.forEach((v) => findAll(v, pred, acc));
  else if (value && typeof value === "object") {
    if (pred(value)) acc.push(value);
    Object.values(value).forEach((v) => findAll(v, pred, acc));
  }
  return acc;
}

// ---------------------------------------------------------------- sessions

async function mintSessions(ctx, state, handles) {
  if (!state.admin_operator_token) fail("run state has no admin token (already torn down?)");
  const session = await http(ctx, state, "POST", "/v1/admin/session", { body: { admin_token: state.admin_operator_token } });
  const admin = session.body?.access_token;
  if (session.status !== 200 || !admin) fail(`admin session failed (${session.status})`);
  const agents = {};
  for (const handle of handles) {
    const minted = await http(ctx, state, "POST", "/v1/admin/controller-token", {
      headers: { Authorization: `Bearer ${admin}` },
      body: { handle, controller_type: "agent", expires_in: 1800 },
    });
    if (minted.status !== 200 || !minted.body?.access_token) fail(`controller token mint failed for ${handle} (${minted.status})`);
    agents[handle] = minted.body.access_token;
  }
  return { admin, agents };
}


/**
 * Agent protocol WebSocket (src/protocol-ws.ts). The isolated world is selected by `world_id` on every frame and
 * the admin JWT rides in AUTH `body.admin_token` (a WebSocket client cannot set headers). Returns null when no
 * WebSocket implementation was injected, so unit contexts never open a socket.
 */
async function openProtocolSocket(ctx, state, sessions, handle) {
  if (typeof ctx.wsFactory !== "function") return null;
  if (!admitBaseUrl(state.base).ok) fail("base URL guard failed");
  const ws = ctx.wsFactory(`${state.base.replace(/^https:/, "wss:")}/protocol/v1/ws`);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("ws open timeout")), 15000);
    ws.addEventListener("open", () => { clearTimeout(timer); resolve(); });
    ws.addEventListener("error", () => { clearTimeout(timer); reject(new Error("ws error")); });
  });
  const waiting = new Map();
  ws.addEventListener("message", (evt) => {
    let msg;
    try { msg = JSON.parse(String(evt.data)); } catch { return; }
    const resolve = waiting.get(msg.request_id);
    if (resolve) { waiting.delete(msg.request_id); resolve(msg); }
  });
  const frame = (msg) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => { waiting.delete(msg.request_id); reject(new Error("ws frame timeout")); }, 15000);
    waiting.set(msg.request_id, (m) => { clearTimeout(timer); resolve(m); });
    ws.send(JSON.stringify(msg));
  });
  const auth = await frame({ type: "AUTH", request_id: rid(state, "g1-ws-auth"), world_id: state.isolated_world,
    body: { access_token: sessions.agents[handle], admin_token: sessions.admin, world_id: state.isolated_world } });
  return { frame, close: () => { try { ws.close(); } catch { /* already closed */ } }, authOk: auth.type === "AUTH_ACK" };
}

let seq = 0;
const rid = (state, tag) => `${tag}-${state.run_id}-${(seq += 1)}`;

const authHeaders = (sessions, handle) => ({ Authorization: `Bearer ${sessions.agents[handle]}`, "X-Noema-Admin-Token": sessions.admin });

function operator(ctx, state, sessions, handle, command, args = {}, tag = "acc", extra = {}) {
  const request_id = rid(state, tag);
  return http(ctx, state, "POST", "/v1/operator/test-world/command", {
    headers: authHeaders(sessions, handle),
    body: { world_id: state.isolated_world, request_id, idempotency_key: `idem-${request_id}`, command, arguments: args, ...extra },
  }).then((r) => ({ ...r, request_id }));
}

const okBody = (r) => r.status === 200 && r.body?.ok === true;

/** Run ordered boolean checks; the first false stops the phase. */
async function runChecks(list) {
  const checks = {};
  let passed = true;
  for (const [name, fn] of list) {
    let value = false;
    try {
      value = (await fn()) === true;
    } catch {
      value = false;
    }
    checks[name] = value;
    if (!value) { passed = false; break; }
  }
  return { passed, checks };
}

function saveSection(ctx, state, name, section) {
  state.sections[name] = { ...section, finished_at: ctx.now().toISOString() };
  writeState(ctx, state);
  return section.passed ? 0 : 1;
}

// ---------------------------------------------------------------- commands

const SECRET_SIGNALS = ["SIGINT", "SIGTERM", "SIGHUP"];

const PLAN_LINES = [
  "#733 hosted-gates acceptance plan (no network, no process spawned)",
  "  deploy    npx wrangler deploy --config wrangler.acceptance.jsonc --name noema-733-acc-<utc> --var NOEMA_ENV:test --var NOEMA_PROTOCOL_VERSION:1 --var DEFAULT_WORLD_ID:... --var ISOLATED_WATCH_WORLD_ID:... --secrets-file <ephemeral 0600>",
  "            reads noema-gateway /version before (production control); writes ~/.config/noema/acceptance-runs/<run-id>.json (0600)",
  "  g1        admin session + Agent A/B; seed colliding aliases; structured JOIN/MOVE canonical; text carriers refused; /v1/admin/tempo refused for Agents",
  "  g2        A: ENTER -> HARVEST -> REPAIR -> LEAVE_WORLD; read-only PostgREST GETs; probe x2, evict, probe; B: ENTER/LOOK sees construction trace; /v1/watch/live",
  "  g3-urls   print public WATCH/Home URLs + viewports for the operator's browser agent (no network)",
  "  r0        Agent observation room stack (WHERE/HERE/EXITS/STATUS/HAPPENED/AVAILABLE ACTIONS) + MOVE orientation on a hosted response",
  "  receipt   print the redacted noema-733-hosted-gates/1 receipt (optionally --out FILE, --g3 FILE)",
  "  teardown  npx wrangler delete --name noema-733-acc-<utc> --force; scrub stored secrets; record production version after",
  "Credentials: ~/.config/noema/acceptance.env (mode 600) only. Run id: --run <id> for every phase after deploy.",
];

async function cmdPlan(ctx) {
  PLAN_LINES.forEach((l) => ctx.out(l));
  return 0;
}

async function cmdDeploy(ctx) {
  if (ctx.env.NOEMA_ENV && ctx.env.NOEMA_ENV !== "test") fail("NOEMA_ENV in the environment is not test; refusing");
  const runId = runIdFromDate(ctx.now());
  const worker = `noema-733-acc-${runId}`;
  const base = `https://${worker}.zer0state-noema.workers.dev`;
  const defaultWorld = `test.hosted-canonical.733-default-${runId}`;
  const isolatedWorld = `test.hosted-canonical.733-acc-${runId}`;
  for (const g of [admitWorkerName(worker), admitBaseUrl(base), admitWorlds({ defaultWorld, isolatedWorld })]) if (!g.ok) fail(g.message);
  const configText = fs.readFileSync(path.join(ctx.pkgDir || PKG_DIR, CONFIG_NAME), "utf8");
  const cfg = assertConfigSafe(configText, ["NOEMA_ENV:test", "NOEMA_PROTOCOL_VERSION:1"]);
  if (!cfg.ok) fail(cfg.message);
  const supabase = acceptanceSupabase(ctx);
  // source_commit is only honest when HEAD is what gets deployed: refuse a dirty (or unknowable) working tree.
  const tree = ctx.exec("git", ["status", "--porcelain"], { cwd: ctx.pkgDir || PKG_DIR, env: ctx.env });
  if (tree.status !== 0) fail("git status failed; cannot prove the working tree is clean; refusing to deploy");
  if (String(tree.stdout || "").trim() !== "") fail("working tree is dirty (uncommitted changes); commit or stash so source_commit is honest; refusing to deploy");
  const prodBefore = await productionVersion(ctx);
  if (!prodBefore) fail("could not read the production noema-gateway version (control); refusing to deploy");

  const sha = ctx.exec("git", ["rev-parse", "HEAD"], { cwd: ctx.pkgDir || PKG_DIR, env: ctx.env });
  const secrets = {
    TOKEN_SIGNING_SECRET: ctx.randomHex(32),
    ADMIN_OPERATOR_TOKEN: ctx.randomHex(32),
    SUPABASE_URL: supabase.url,
    SUPABASE_SERVICE_ROLE_KEY: supabase.key,
  };
  const state = {
    schema: RUN_STATE_SCHEMA,
    run_id: runId,
    worker,
    base,
    default_world: defaultWorld,
    isolated_world: isolatedWorld,
    sentinel: `PRIVATE_733_ACC_SENTINEL_${runId}`,
    admin_operator_token: secrets.ADMIN_OPERATOR_TOKEN,
    source_commit: sha.status === 0 ? sha.stdout.trim() : null,
    source_tree_clean: true,
    no_production_routes: true,
    production: { before: prodBefore, after: null },
    created_at: ctx.now().toISOString(),
    sections: {},
  };
  writeState(ctx, state);

  const secretsFile = path.join(ctx.tmpdir || os.tmpdir(), `.noema-733-acc-${runId}-${process.pid}.json`);
  const proc = ctx.proc || process;
  // 'wx': fail if the path already exists (no symlink/squat reuse); only a file we created is ever unlinked.
  const fd = fs.openSync(secretsFile, "wx", 0o600);
  const unlinkSecrets = () => { try { fs.rmSync(secretsFile, { force: true }); } catch { /* best effort */ } };
  const signalHandlers = SECRET_SIGNALS.map((sig) => [sig, () => {
    unlinkSecrets();
    detach();
    proc.kill(proc.pid, sig);
  }]);
  const exitHandler = () => unlinkSecrets();
  function detach() {
    for (const [sig, fn] of signalHandlers) proc.off(sig, fn);
    proc.off("exit", exitHandler);
  }
  for (const [sig, fn] of signalHandlers) proc.on(sig, fn);
  proc.on("exit", exitHandler);
  let output;
  try {
    try {
      fs.writeSync(fd, JSON.stringify(secrets));
    } finally {
      fs.closeSync(fd);
    }
    fs.chmodSync(secretsFile, 0o600);
    const args = buildDeployArgs({ worker, defaultWorld, isolatedWorld, secretsFile });
    const res = ctx.exec("npx", args, { cwd: ctx.pkgDir || PKG_DIR, env: wranglerEnv(ctx) });
    output = `${res.stdout || ""}${res.stderr || ""}`;
    if (res.status !== 0) fail(`wrangler deploy failed (${res.status}): ${redact(output).slice(-400)}`);
  } finally {
    unlinkSecrets();
    detach();
  }
  const urls = [...output.matchAll(/https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev/gi)].map((m) => m[0]);
  if (urls.length && !urls.includes(base)) fail("wrangler reported a workers.dev URL that does not match the guarded base");
  const wantVersion = output.match(/Current Version ID:\s*([0-9a-f-]{36})/i)?.[1]?.toLowerCase();

  let version;
  for (let i = 0; i < 30; i += 1) {
    const r = await http(ctx, state, "GET", "/version");
    if (r.status === 200 && r.body?.worker_version_id && (!wantVersion || r.body.worker_version_id === wantVersion)) { version = r.body; break; }
    await ctx.sleep(2000);
  }
  if (!version) fail("deployed Worker /version never matched the deployed version");
  if (version.env !== "test" || version.world_id !== defaultWorld) fail("deployed Worker self-reported an unsafe identity");
  state.version = version.worker_version_id;
  state.deployed_at = ctx.now().toISOString();
  writeState(ctx, state);
  ctx.out(JSON.stringify({ ok: true, run_id: runId, worker, base, isolated_world: isolatedWorld, version: state.version }));
  return 0;
}

// Each phase mints its own Agent handles: a later phase must not inherit an earlier phase's player
// position or inventory (G1 moves its Agent east, out of the room that holds G2's relay).
async function cmdG1(ctx, flags) {
  const state = loadRun(ctx, flags.run);
  const S = state.sentinel;
  const sessions = await mintSessions(ctx, state, ["acc-g1-a", "acc-g1-b"]);
  const aliasValue = `do look; wait ${S}`;
  const clean = (r) => !r.text.includes(S);
  const canonical = (r) => okBody(r) && r.body.request_id === r.request_id && !/\.m\d/.test(JSON.stringify(r.body)) && clean(r);
  const refused = (r) => r.status === 400 && r.body?.error?.code === "INVALID_REQUEST" && clean(r);
  let headMark = null;
  const wsHolder = {};
  const result = await runChecks([
    ["enter_a_ok", async () => okBody(await operator(ctx, state, sessions, "acc-g1-a", "ENTER_WORLD", {}, "g1-enter"))],
    ["seed_ok", async () => {
      const r = await http(ctx, state, "POST", "/v1/operator/test-world/seed", {
        headers: authHeaders(sessions, "acc-g1-a"),
        body: { world_id: state.isolated_world, aliases: { join: aliasValue, move: aliasValue } },
      });
      return r.status === 200 && r.body?.ok === true && r.body?.alias_count === 2 && clean(r);
    }],
    ["structured_join_canonical", async () => canonical(await operator(ctx, state, sessions, "acc-g1-a", "JOIN", {}, "g1-join"))],
    ["structured_move_canonical", async () => {
      const before = await sbHead(ctx, state);
      const r = await operator(ctx, state, sessions, "acc-g1-a", "MOVE", { direction: "east" }, "g1-move");
      headMark = { before, after: await sbHead(ctx, state) };
      return canonical(r);
    }],
    ["move_advanced_head", async () => headMark?.before && headMark?.after && headMark.after.revision > headMark.before.revision],
    // Real shape (stripHumanPlayLine, src/protocol-ws.ts:29): `arguments.line` / `_macro_step` are
    // stripped, not rejected. The command then runs as a plain structured JOIN, never as text.
    ["text_line_stripped_canonical", async () => {
      const before = await sbHead(ctx, state);
      const r = await operator(ctx, state, sessions, "acc-g1-a", "JOIN", { line: aliasValue }, "g1-line");
      const after = await sbHead(ctx, state);
      return canonical(r) && !!before && !!after && before.revision === after.revision && before.sequence === after.sequence;
    }],
    ["text_command_refused", async () => refused(await operator(ctx, state, sessions, "acc-g1-a", `alias set ii look ${S}`, {}, "g1-text"))],
    ["macro_step_stripped_canonical", async () => canonical(await operator(ctx, state, sessions, "acc-g1-a", "JOIN", { _macro_step: `look ${S}` }, "g1-macro"))],
    // /v1/command targets the isolated world only when the envelope names it AND carries the admin
    // header (src/protocol-ws.ts:169-181); without them it hits the default world and the seal gate.
    ["command_endpoint_structured_join_canonical", async () => {
      const request_id = rid(state, "g1-cmdjoin");
      const r = await http(ctx, state, "POST", "/v1/command", { headers: authHeaders(sessions, "acc-g1-a"), body: { request_id, command: "JOIN", arguments: {}, world_id: state.isolated_world } });
      return canonical({ ...r, request_id });
    }],
    ["command_endpoint_text_refused", async () => refused(await http(ctx, state, "POST", "/v1/command", {
      headers: authHeaders(sessions, "acc-g1-a"),
      body: { request_id: rid(state, "g1-cmd"), command: `alias set ii look ${S}`, arguments: {}, world_id: state.isolated_world },
    }))],
    ...(typeof ctx.wsFactory === "function" ? [
      ["ws_act_structured_join_canonical", async () => {
        wsHolder.ws = await openProtocolSocket(ctx, state, sessions, "acc-g1-a");
        if (!wsHolder.ws?.authOk) return false;
        const request_id = rid(state, "g1-ws-join");
        const reply = await wsHolder.ws.frame({ type: "ACT", request_id, world_id: state.isolated_world, body: { world_id: state.isolated_world, action: { verb: "JOIN" } } });
        return reply.type === "ACT_RESULT" && reply.body?.ok === true && reply.body?.request_id === request_id && !JSON.stringify(reply).includes(S) && !/\.m\d/.test(JSON.stringify(reply));
      }],
      ["ws_act_text_carrier_refused", async () => {
        const request_id = rid(state, "g1-ws-text");
        const reply = await wsHolder.ws.frame({ type: "ACT", request_id, world_id: state.isolated_world, body: { world_id: state.isolated_world, command: `alias set ii look ${S}` } });
        wsHolder.ws.close();
        return reply.type === "ERROR" && reply.error?.code === "INVALID_REQUEST" && !JSON.stringify(reply).includes(S);
      }],
    ] : []),
    ["refusals_left_head_unchanged", async () => {
      const after = await sbHead(ctx, state);
      return !!after && !!headMark?.after && after.revision === headMark.after.revision && after.sequence === headMark.after.sequence;
    }],
    ["agent_tempo_refused", async () => {
      const r = await http(ctx, state, "POST", "/v1/admin/tempo", {
        headers: { Authorization: `Bearer ${sessions.agents["acc-g1-a"]}` },
        body: { action: "step", reason: "agent must not step" },
      });
      return r.status === 401 || r.status === 403;
    }],
  ]);
  return saveSection(ctx, state, "g1_isolation", { ...result, informational: { ws_act: typeof ctx.wsFactory === "function" ? "run_by_runner" : "not_run_by_runner" } });
}

async function cmdG2(ctx, flags) {
  const state = loadRun(ctx, flags.run);
  const sessions = await mintSessions(ctx, state, ["acc-g2-a", "acc-g2-b"]);
  const probe = async () => (await http(ctx, state, "POST", "/v1/operator/test-world/instance", { headers: authHeaders(sessions, "acc-g2-a"), body: { world_id: state.isolated_world, action: "probe" } })).body?.instance_id;
  const version = async () => (await http(ctx, state, "GET", "/version")).body?.worker_version_id;
  const ctxv = {};
  const result = await runChecks([
    ["repairable_entity_found", async () => {
      await operator(ctx, state, sessions, "acc-g2-a", "ENTER_WORLD", {}, "g2-enter");
      const look = await operator(ctx, state, sessions, "acc-g2-a", "LOOK", {}, "g2-look");
      ctxv.entity = findAll(look.body, (o) => o.repairable === true && (o.entity_id || o.id)).map((o) => o.entity_id || o.id)[0];
      ctxv.source = findAll(look.body, (o) => o.harvestable === true && (o.entity_id || o.id)).map((o) => o.entity_id || o.id)[0];
      ctxv.head0 = await sbHead(ctx, state);
      return typeof ctxv.entity === "string" && !!ctxv.head0;
    }],
    // REPAIR consumes one unit of cargo (src/world-actions.ts COSTS.REPAIR storage 1); a fresh Agent holds none, so
    // the real verb HARVEST fills the hold first. No harvestable source is reported as a seed gap, never faked.
    ["harvest_source_found", async () => typeof ctxv.source === "string"],
    ["harvest_accepted", async () => {
      if (typeof ctxv.source !== "string") return false;
      const r = await operator(ctx, state, sessions, "acc-g2-a", "COMMIT", { operation: "HARVEST", entity_id: ctxv.source, amount: 1 }, "g2-harvest");
      if (!okBody(r)) ctxv.harvest_rejection = redact(String(r.body?.error?.message ?? r.status)).slice(0, 120);
      return okBody(r);
    }],
    ["harvest_committed_in_sql", async () => {
      const events = await sbRows(ctx, state, "noema_settled_events");
      return events.some((e) => e.event_type === "ENTITY_UPDATE" && e.payload?.operation === "HARVEST" && e.payload?.entity_id === ctxv.source);
    }],
    ["repair_accepted", async () => {
      const r = await operator(ctx, state, sessions, "acc-g2-a", "COMMIT", { operation: "REPAIR", entity_id: ctxv.entity }, "g2-repair");
      // Real rejection shape: { ok:false, error:{ code, message } } (e.g. BUDGET_EXCEEDED "...materials in hold").
      if (!okBody(r)) ctxv.repair_rejection = redact(String(r.body?.error?.message ?? r.status)).slice(0, 120);
      return okBody(r);
    }],
    ["leave_accepted", async () => okBody(await operator(ctx, state, sessions, "acc-g2-a", "LEAVE_WORLD", {}, "g2-leave"))],
    // Real settled rows (src/settle.ts RPC): { event_type, payload, ... }. REPAIR is an ENTITY_UPDATE with
    // payload.operation "REPAIR"; leaving is AGENT_LEFT_WORLD (there is no LEAVE_*/DEPART* event type).
    ["repair_committed_in_sql", async () => {
      ctxv.head1 = await sbHead(ctx, state);
      ctxv.events = await sbRows(ctx, state, "noema_settled_events");
      const settlements = await sbRows(ctx, state, "noema_canonical_settlements");
      return ctxv.events.some((e) => e.event_type === "ENTITY_UPDATE" && e.payload?.operation === "REPAIR" && e.payload?.entity_id === ctxv.entity) &&
        settlements.length >= 3 && ctxv.head1.revision >= ctxv.head0.revision + 3;
    }],
    ["leave_committed_in_sql", async () => (ctxv.events || []).some((e) => e.event_type === "AGENT_LEFT_WORLD")],
    ["probe_ids_equal_before_evict", async () => {
      const a = await probe();
      const b = await probe();
      ctxv.id = a;
      return typeof a === "string" && a === b;
    }],
    ["instance_id_changed_after_evict", async () => {
      ctxv.v0 = await version();
      await http(ctx, state, "POST", "/v1/operator/test-world/instance", { headers: authHeaders(sessions, "acc-g2-a"), body: { world_id: state.isolated_world, action: "evict" } });
      const c = await probe();
      return typeof c === "string" && c !== ctxv.id;
    }],
    ["same_worker_version_after_evict", async () => !!ctxv.v0 && (await version()) === ctxv.v0],
    ["second_principal_sees_construction_trace", async () => {
      await operator(ctx, state, sessions, "acc-g2-b", "ENTER_WORLD", {}, "g2-b-enter");
      const look = await operator(ctx, state, sessions, "acc-g2-b", "LOOK", {}, "g2-b-look");
      ctxv.traces = (look.body?.observation?.location?.traces ?? findAll(look.body, (o) => Array.isArray(o.traces)).flatMap((o) => o.traces));
      return Array.isArray(ctxv.traces) && ctxv.traces.some((t) => t?.kind === "construction" && /repair/i.test(String(t.text)));
    }],
    ["trace_count_within_3", async () => ctxv.traces.length <= 3],
    ["no_hidden_refs", async () => !/player\.|entity\.|source_state_ref/.test(JSON.stringify(ctxv.traces))],
    ["watch_live_shows_trace", async () => {
      const live = await http(ctx, state, "GET", "/v1/watch/live");
      const lists = findAll(live.body, (o) => Array.isArray(o.traces)).map((o) => o.traces);
      return live.status === 200 && lists.every((t) => t.length <= 3) && lists.some((t) => t.some((x) => x?.kind === "construction"));
    }],
  ]);
  // The stock `test.hosted-canonical.*` seed (src/mini-chamber.ts miniChamberState) holds only a PROP
  // (way-lamp) plus, since D5, a harvestable source and a worn relay. A world without them (older seed)
  // reports the gap below; never fake it.
  const gap = result.checks.repairable_entity_found === false
    ? { seed_gap: "isolated world seed exposes no repairable entity (observation.location.entities[].repairable); G2 cannot commit a REPAIR trace on this world" }
    : result.checks.harvest_source_found === false
      ? { seed_gap: "isolated world seed exposes no harvestable source (observation.location.entities[].harvestable); G2 cannot fund a REPAIR with real verbs" }
      : {};
  if (ctxv.harvest_rejection) gap.harvest_rejection = ctxv.harvest_rejection;
  if (ctxv.repair_rejection) gap.repair_rejection = ctxv.repair_rejection;
  return saveSection(ctx, state, "g2_s3_readback", { ...result, ...gap, ac17_stale_trace: "not_covered" });
}

/**
 * Real hosted shape (src/types.ts Observation; src/play-ui.ts lowNoiseRoomText): the A3 stack lives in
 * `observation.play_text` as a room-name line (WHERE), description, then the bare section headings
 * PRESSURE / HERE / EXITS / STATUS / HAPPENED. HERE is omitted for an empty room and there is no literal
 * "WHERE" or "AVAILABLE ACTIONS" heading: WHERE is `location.name` as the first line, and available
 * actions are the structured `available_actions` + `affordances` arrays.
 */
const heading = (text, name) => new RegExp(`^${name}$`, "m").test(text);
const R0_FIELDS = {
  WHERE: (o) => !!o?.location?.name && String(o.play_text || "").split("\n")[0] === o.location.name,
  HERE: (o) => heading(o?.play_text || "", "HERE") && (o.location?.entities || []).every((e) => o.play_text.includes(e.label)),
  EXITS: (o) => heading(o?.play_text || "", "EXITS") && (o.location?.exits || []).every((x) => o.play_text.includes(x.direction)),
  STATUS: (o) => heading(o?.play_text || "", "STATUS") && /^Energy \d+$/m.test(o.play_text),
  HAPPENED: (o) => heading(o?.play_text || "", "HAPPENED") && typeof o.consequence === "string" && o.consequence.length > 0,
  AVAILABLE_ACTIONS: (o) => Array.isArray(o?.available_actions) && o.available_actions.length > 0 && Array.isArray(o.affordances) && o.affordances.length > 0 && o.affordances.every((a) => typeof a.cmd === "string" || typeof a.verb === "string"),
};

async function cmdR0(ctx, flags) {
  const state = loadRun(ctx, flags.run);
  const sessions = await mintSessions(ctx, state, ["acc-r0-a"]);
  const blob = {};
  const list = [
    ["enter_ok", async () => {
      const r = await operator(ctx, state, sessions, "acc-r0-a", "ENTER_WORLD", {}, "r0-enter");
      return okBody(r);
    }],
    ["look_ok", async () => {
      const r = await operator(ctx, state, sessions, "acc-r0-a", "LOOK", {}, "r0-look");
      blob.look = r.body?.observation;
      return okBody(r) && !!blob.look;
    }],
    ...Object.entries(R0_FIELDS).map(([name, test]) => [`field_${name}`, async () => test(blob.look)]),
    ["move_orientation_present", async () => {
      // Orientation after MOVE: the new room name leads, then EXITS and HAPPENED (HERE only when occupied).
      for (const direction of (blob.look?.location?.exits || []).map((x) => x.direction)) {
        const r = await operator(ctx, state, sessions, "acc-r0-a", "MOVE", { direction }, "r0-move");
        if (!okBody(r)) continue;
        const o = r.body.observation;
        return !!o && o.location?.name !== blob.look.location.name && R0_FIELDS.WHERE(o) && R0_FIELDS.EXITS(o) && R0_FIELDS.HAPPENED(o);
      }
      return false;
    }],
  ];
  const result = await runChecks(list);
  return saveSection(ctx, state, "r0_presentation", { ...result, basis: "Specs MUD-PLAY-CRAFT-CLOSEOUT A3 Agent observation contract (decision D3a)" });
}

async function cmdG3Urls(ctx, flags) {
  const state = loadRun(ctx, flags.run);
  const pages = ["/watch?mode=text", "/watch?mode=pixel", "/watch?mode=map", "/"];
  ctx.out(`# G3 browser phase targets (public pages, no credentials). Run the real browser from the operator's agent.`);
  for (const p of pages) ctx.out(`${state.base}${p}`);
  ctx.out(`viewports: ${SCREEN_WIDTHS.join(", ")} (screenshot each)`);
  ctx.out(`checks: keyboard (skip link, pause/refresh), prefers-reduced-motion, bounded aria-live, contrast >= 4.5:1, Home degradation with live feed blocked`);
  ctx.out(`privacy sentinel (must be absent from innerText and DOM): ${state.sentinel}`);
  ctx.out(`record results as JSON and merge: receipt --run ${state.run_id} --g3 <file>`);
  return 0;
}

const G3_SHAPE = {
  passed: "boolean", keyboard_ok: "boolean", skip_link_ok: "boolean", pause_refresh_ok: "boolean", reduced_motion_ok: "boolean",
  aria_live_bounded: "boolean", contrast_ok: "boolean", home_degradation_ok: "boolean", sentinel_absent: "boolean",
  min_contrast: "number", notes: "string", browser: "string",
};
const G3_MAX_STRING = 500;

/** Allowlisted g3 record: known keys with the right primitive type only; everything else is dropped. */
function sanitizeG3(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("--g3 file must be a JSON object");
  const out = {};
  for (const [key, type] of Object.entries(G3_SHAPE)) {
    if (!(key in input)) continue;
    const v = input[key];
    if (typeof v !== type || (type === "number" && !Number.isFinite(v))) fail(`--g3 key ${key} must be a ${type}`);
    out[key] = type === "string" ? v.slice(0, G3_MAX_STRING) : v;
  }
  return out;
}

const REQUIRED_GATES = ["g1", "g2", "g3", "r0"];

/** passed | failed | pending | not_covered, strictly: only an explicit passed:true counts as passed. */
function deriveGates(s) {
  const phase = (section) => (section && typeof section === "object" && "passed" in section ? (section.passed === true ? "passed" : "failed") : "pending");
  const g3 = s.g3_watch_home;
  let g3State = "pending";
  if (g3 && g3.status === "recorded") {
    // Every boolean browser check must be present and true; a missing check is a failure, never a vacuous pass.
    const flags = Object.entries(G3_SHAPE).filter(([, t]) => t === "boolean").map(([k]) => g3[k]);
    g3State = flags.every((v) => v === true) ? "passed" : "failed";
  }
  const c9 = s.c9_checklist && typeof s.c9_checklist === "object" && "passed" in s.c9_checklist ? (s.c9_checklist.passed === true ? "passed" : "failed") : "not_covered";
  return { g1: phase(s.g1_isolation), g2: phase(s.g2_s3_readback), g3: g3State, r0: phase(s.r0_presentation), c9 };
}

async function cmdReceipt(ctx, flags) {
  const state = loadRun(ctx, flags.run);
  if (state.production.after == null) {
    state.production.after = await productionVersion(ctx);
    writeState(ctx, state);
  }
  let g3 = state.sections.g3_watch_home || { status: "pending_browser_phase" };
  if (flags.g3) {
    g3 = { ...sanitizeG3(JSON.parse(fs.readFileSync(flags.g3, "utf8"))), status: "recorded" };
    state.sections.g3_watch_home = g3;
    writeState(ctx, state);
  }
  const s = state.sections;
  const gates = deriveGates({ ...s, g3_watch_home: g3 });
  const receipt = redactDeep({
    schema: RECEIPT_SCHEMA,
    extends: "noema-733-same-world-hosted/1",
    evidence_kind: "isolated-hosted-gates",
    observed_date_utc: ctx.now().toISOString().slice(0, 10),
    run_id: state.run_id,
    source_commit: state.source_commit,
    source_tree_clean: state.source_tree_clean === true,
    worker: state.worker,
    worker_version: state.version ?? null,
    worker_url: state.base,
    no_production_routes: state.no_production_routes === true,
    target_world: state.isolated_world,
    configured_default_world: state.default_world,
    gates,
    all_required_passed: REQUIRED_GATES.every((k) => gates[k] === "passed"),
    g1_isolation: s.g1_isolation || { status: "not_run" },
    g2_s3_readback: s.g2_s3_readback || { status: "not_run" },
    g3_watch_home: g3,
    r0_presentation: s.r0_presentation || { status: "not_run" },
    c9_checklist: s.c9_checklist || { status: "not_run_by_runner" },
    teardown: s.teardown || { status: "not_run" },
    production_worker_version_control: {
      production_version_before: state.production.before,
      production_version_after: state.production.after,
      unchanged: !!state.production.before && state.production.before === state.production.after,
      method: "GET /version of noema-gateway before deploy and again at receipt/teardown",
    },
  }, KEEP_KEYS);
  const text = JSON.stringify(receipt, null, 2);
  if (flags.out) fs.writeFileSync(flags.out, `${text}\n`, { mode: 0o600 });
  ctx.out(text);
  return 0;
}

async function cmdTeardown(ctx, flags) {
  const state = loadRun(ctx, flags.run);
  const res = ctx.exec("npx", ["wrangler", "delete", "--config", CONFIG_NAME, "--name", state.worker, "--force"], { cwd: ctx.pkgDir || PKG_DIR, env: wranglerEnv(ctx) });
  const deleted = res.status === 0;
  state.production.after = await productionVersion(ctx);
  if (deleted) delete state.admin_operator_token;
  state.sections.teardown = { deleted, secrets_scrubbed: deleted, finished_at: ctx.now().toISOString() };
  writeState(ctx, state);
  if (!deleted) ctx.err(`wrangler delete failed (${res.status}); re-run teardown`);
  return deleted ? 0 : 1;
}

const COMMANDS = { plan: cmdPlan, deploy: cmdDeploy, g1: cmdG1, g2: cmdG2, "g3-urls": cmdG3Urls, r0: cmdR0, receipt: cmdReceipt, teardown: cmdTeardown };

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) { flags[argv[i].slice(2)] = argv[i + 1]; i += 1; }
  }
  return flags;
}

/**
 * @param {string[]} argv
 * @param {any} [ctx] injected process/network seams (tests pass fakes)
 * @returns {Promise<number>}
 */
export async function main(argv, ctx = defaultCtx()) {
  const [cmd, ...rest] = argv;
  const fn = COMMANDS[cmd];
  if (!fn) {
    ctx.err(`usage: acceptance-733.mjs ${Object.keys(COMMANDS).join(" | ")}`);
    return 2;
  }
  try {
    return await fn(ctx, parseFlags(rest));
  } catch (error) {
    ctx.err(`error: ${redact(error instanceof Error ? error.message : String(error))}`);
    return 2;
  }
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  process.exit(await main(process.argv.slice(2)));
}
