#!/usr/bin/env node
/** Ops intent: reproduce bounded MUD writer/readback evidence on fresh LOCAL workerd.
 * No hosted settlement claim, seed mutation, caller URL, deployment or reset path.
 * Usage: node scripts/mud-local-acceptance.mjs --artifacts /absolute/parent
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, mkdtemp, chmod, writeFile, unlink, rename } from "node:fs/promises";
import { createServer, connect } from "node:net";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const WORKER_ROOT = fileURLToPath(new URL("../", import.meta.url));
const SEAL = "sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395";
const SURFACES = { BOARD: "board_lines", SHOUT: "shout_lines", NOTICE: "notice_lines", TRADE_NOTICE: "trade_notice_lines" };
const USAGE = "node scripts/mud-local-acceptance.mjs [--artifacts /absolute/parent]\nDefaults to JCODE_SCRATCH_DIR when present. LOCAL only, no external target options.";

/** Pure admission: intentionally no base/world/env/config/secret/remote switches. */
export function admitArgs(argv, env = {}) {
  if (argv.length === 1 && argv[0] === "--help") return { help: true };
  let root;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== "--artifacts" || root !== undefined) throw new Error("Only one --artifacts DIR is supported");
    root = argv[++i];
    if (!root || root.startsWith("--")) throw new Error("--artifacts requires an absolute directory");
  }
  root ??= env.JCODE_SCRATCH_DIR;
  if (typeof root !== "string" || !isAbsolute(root) || /[\r\n\0]/.test(root)) {
    throw new Error("Set JCODE_SCRATCH_DIR or supply --artifacts /absolute/parent");
  }
  return { artifactsRoot: resolve(root) };
}

/** Pure configuration. Nothing is inherited from the checked-in production config. */
export function localConfig(workerRoot, runId) {
  assert.match(runId, /^[a-z0-9]{12,32}$/);
  assert.ok(isAbsolute(workerRoot));
  return {
    name: `noema-mud-local-${runId}`,
    main: join(workerRoot, "src/index.ts"),
    compatibility_date: "2026-08-01",
    compatibility_flags: ["nodejs_compat"],
    vars: { NOEMA_ENV: "local", NOEMA_PROTOCOL_VERSION: "1", DEFAULT_WORLD_ID: `test.hosted-canonical.mud-${runId}` },
    durable_objects: { bindings: [{ name: "WORLD_DO", class_name: "NoemaWorldDO" }] },
    migrations: [{ tag: "v1", new_classes: ["NoemaWorldDO"] }],
  };
}

/** Pure allowlist, NOT a filtered copy of process.env. Own HOME excludes CLI auth. */
export function childEnvironment(runDir, nodePath = process.execPath) {
  assert.ok(isAbsolute(runDir));
  assert.ok(isAbsolute(nodePath));
  return {
    PATH: `${dirname(nodePath)}:/usr/bin:/bin`, HOME: join(runDir, "home"),
    XDG_CONFIG_HOME: join(runDir, "home/.config"), TMPDIR: join(runDir, "tmp"),
    CI: "true", WRANGLER_SEND_METRICS: "false", WRANGLER_LOG: "error",
    WRANGLER_WRITE_LOGS: "false", WRANGLER_LOG_SANITIZE: "true",
    CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false",
  };
}

export function redact(text, sensitive = []) {
  let clean = String(text);
  for (const value of sensitive) if (value) clean = clean.split(value).join("[REDACTED]");
  return clean.replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[REDACTED_JWT]");
}

/** Read-only, bounded provenance. Never retain status paths or Git diagnostics. */
export function gitMetadata(root, run = args => {
  const result = spawnSync("git", args, { cwd: root, env: { PATH: "/usr/bin:/bin" },
    encoding: "utf8", timeout: 2_000, maxBuffer: 65_536 });
  return { status: result.status, stdout: String(result.stdout ?? ""), error: Boolean(result.error) };
}) {
  try {
    const head = run(["rev-parse", "--verify", "HEAD"]);
    if (head.error || head.status !== 0 || !/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(head.stdout.trim())) return null;
    const status = run(["status", "--porcelain", "--untracked-files=normal"]);
    if (status.error || status.status !== 0) return null;
    return { head: head.stdout.trim(), dirty: status.stdout.length !== 0 };
  } catch { return null; }
}

async function reservePort() {
  const server = createServer();
  await new Promise((ok, bad) => { server.once("error", bad); server.listen(0, "127.0.0.1", ok); });
  const port = server.address().port;
  return { port, release: () => new Promise((ok, bad) => server.close(e => e ? bad(e) : ok())) };
}

async function isListening(port) {
  return new Promise(ok => {
    const socket = connect({ host: "127.0.0.1", port });
    const finish = value => { socket.destroy(); ok(value); };
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.setTimeout(500, () => finish(true));
  });
}

// Exported only for native tests, not exposed by CLI admission. Production retains
// exactly the same own-group authority, probes, signals and wait budget.
/** @param {{ pid?: number }} child
 * @param {{ pid: number, phase: string, cleanup_diagnostics?: object[] }} record
 * @param {{ kill?: (pid: number, signal: string | number) => void, wait?: (ms: number) => Promise<void> }} [io]
 */
export async function stopOwned(child, record, { kill = (pid, signal) => { process.kill(pid, signal); }, wait = async ms => { await delay(ms); } } = {}) {
  if (!child?.pid) return;
  let stage = "terminate", operation = "signal", attemptedSignal = "SIGTERM";
  const signal = name => {
    operation = "signal";
    attemptedSignal = name;
    try { kill(-child.pid, name); }
    catch (e) { if (e.code !== "ESRCH") throw e; }
  };
  const alive = () => {
    operation = "probe";
    attemptedSignal = 0;
    try { kill(-child.pid, 0); return true; }
    catch (e) { if (e.code === "ESRCH") return false; throw e; }
  };
  const pause = async () => { operation = "wait"; attemptedSignal = null; await wait(100); };
  try {
    signal("SIGTERM");
    for (let i = 0; i < 40 && alive(); i++) await pause();
    if (alive()) { stage = "escalate"; signal("SIGKILL"); }
    stage = "verify";
    for (let i = 0; i < 30 && alive(); i++) await pause();
    const live = alive();
    operation = "wait";
    attemptedSignal = null;
    assert.equal(live, false, "owned Wrangler/workerd process group must stop");
  } catch (error) {
    // Error properties are untrusted: never invoke accessors or copy arbitrary
    // strings, messages, stacks, paths or environment into structured evidence.
    // Diagnostics must not replace the exact original thrown value.
    try {
      if (record) {
        const diagnostic = { pid: child.pid, process_group: child.pid, stage, operation, signal: attemptedSignal };
        const data = key => Object.getOwnPropertyDescriptor(error, key)?.value;
        const code = data("code"), errno = data("errno");
        if (["EPERM", "EACCES", "EINVAL", "ESRCH", "EIO", "ENOSYS", "ERR_ASSERTION"].includes(code)) diagnostic.code = code;
        if (Number.isSafeInteger(errno) && Math.abs(errno) <= 4096) diagnostic.errno = errno;
        // At most four failed attempts per owned process, including final cleanup.
        record.cleanup_diagnostics ??= [];
        if (record.cleanup_diagnostics.length < 4) record.cleanup_diagnostics.push(diagnostic);
      }
    } catch { /* Recording must never mask or suppress cleanup failure. */ }
    throw error;
  }
}

function bounded(value, maxBytes = 32_768) {
  const json = JSON.stringify(value);
  return json?.length > maxBytes ? { omitted: true, bytes: json.length } : value;
}

export function abortable(pending, signal) {
  // Transport cancellation alone may not settle fetch/read/cancel. Keep the
  // runner's await bounded so its existing finally can always stop owned groups.
  return new Promise((resolve, reject) => {
    const interrupted = () => { signal.removeEventListener("abort", interrupted); reject(signal.reason); };
    const finish = settle => value => { signal.removeEventListener("abort", interrupted); settle(value); };
    signal.addEventListener("abort", interrupted, { once: true });
    Promise.resolve(pending).then(finish(resolve), finish(reject));
    if (signal.aborted) interrupted();
  });
}

export function assertBudgetDelta(before, after, delta) {
  for (const key of ["attention", "compute", "energy", "influence", "storage"]) {
    assert.ok(Number.isFinite(before?.[key]) && Number.isFinite(after?.[key]), `${key} must be finite`);
    assert.equal(after[key], before[key] + (delta[key] ?? 0), `${key} exact delta`);
  }
}

export async function runLocalAcceptance(options) {
  assert.notEqual(process.platform, "win32", "This runner requires POSIX process groups");
  const runId = randomBytes(8).toString("hex");
  await mkdir(options.artifactsRoot, { recursive: true });
  const runDir = await mkdtemp(join(options.artifactsRoot, "mud-local-"));
  await chmod(runDir, 0o700);
  const config = localConfig(WORKER_ROOT, runId);
  const env = childEnvironment(runDir);
  const configPath = join(runDir, "wrangler.json");
  const signing = randomBytes(32).toString("hex");
  const sensitive = [signing];
  const controller = new AbortController();
  const interrupt = signal => controller.abort(new Error(`Interrupted by ${signal}`));
  const onInt = () => interrupt("SIGINT");
  const onTerm = () => interrupt("SIGTERM");
  const onHup = () => interrupt("SIGHUP");
  const receipt = {
    local_only: true, status: "running", run_id: runId, world_id: config.vars.DEFAULT_WORLD_ID,
    worker_name: config.name, started_at: new Date().toISOString(), git: gitMetadata(WORKER_ROOT), checks: [], records: [], processes: [],
    limits: ["Actual local workerd only, not hosted SQL/settlement or production acceptance", "WAIT checks only committed cycle/barrier, not disputed outcome tokens", "No seed mutation, global reset, org-owned asset or public rumor fabricated"],
  };
  let current, reservation, inspectorReservation;
  let failure;
  let requestId = 0;
  const logs = [];
  process.on("SIGINT", onInt);
  process.on("SIGTERM", onTerm);
  process.on("SIGHUP", onHup);
  const check = (name, predicate) => { assert.ok(predicate, name); receipt.checks.push(name); };
  const request = async (path, body, token) => {
    controller.signal.throwIfAborted();
    assert.ok(["/health", "/v1/auth/dev-token", "/v1/command", "/v1/watch/live"].includes(path));
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]);
    const response = await abortable(fetch(`http://127.0.0.1:${receipt.port}${path}`, {
      method: body ? "POST" : "GET", redirect: "error",
      headers: { "content-type": "application/json", ...(token ? { Authorization: `Bearer ${token}`, "X-Noema-Seal": SEAL } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    }), signal);
    const reader = response.body.getReader();
    const chunks = [];
    let bytes = 0;
    try {
      for (;;) {
        const { done, value } = await abortable(reader.read(), signal);
        if (done) break;
        bytes += value.length;
        assert.ok(bytes <= 524_288, "local response exceeds bound");
        chunks.push(Buffer.from(value));
      }
    } finally { await abortable(reader.cancel(), signal); }
    assert.equal(response.status, 200, `${path} HTTP status`);
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  };
  const command = async (agent, command, args = {}, { id = `mud-${runId}-${++requestId}`, expectedOk = true, phase = "lifecycle" } = {}) => {
    const result = await request("/v1/command", { request_id: id, idempotency_key: id, command, arguments: args }, agent.token);
    assert.ok(receipt.records.length < 80, "receipt command bound");
    receipt.records.push({ actor: agent.handle, phase, request_id: id, idempotency_key: id, command, arguments: args, ok: result.ok,
      error: bounded(result.error), settled: result.settled, events: bounded(result.events), observation: bounded(result.observation) });
    assert.equal(result.ok, expectedOk, `${command}: ${JSON.stringify(result.error)}`);
    return result;
  };
  const start = async phase => {
    controller.signal.throwIfAborted();
    let tail = "";
    const child = spawn(process.execPath, [join(WORKER_ROOT, "node_modules/wrangler/bin/wrangler.js"), "dev",
      "--config", configPath, "--local", "--ip", "127.0.0.1",
      "--port", String(receipt.port), "--inspector-ip", "127.0.0.1", "--inspector-port", String(receipt.inspector_port),
      "--persist-to", join(runDir, "storage"), "--no-show-interactive-dev-session", "--log-level", "error"],
    { cwd: runDir, env, detached: true, stdio: ["ignore", "pipe", "pipe"] });
    current = child;
    let spawnError;
    child.on("error", e => { spawnError = e; });
    const capture = chunk => { tail = (tail + chunk.toString()).slice(-16_384); };
    child.stdout.on("data", capture);
    child.stderr.on("data", capture);
    logs.push(() => ({ phase, tail: redact(tail, sensitive) }));
    receipt.processes.push({ phase, pid: child.pid });
    // Private, credential-free attestation for the real interruption observer.
    // The nonce is supplied only to this runner, never to Wrangler/workerd.
    const observer = process.env.NOEMA_LOCAL_ACCEPTANCE_OBSERVER;
    if (/^[a-f0-9]{32}$/.test(observer ?? "") && child.pid) {
      const ownership = { observer, runner_pid: process.pid, run_id: runId, world_id: receipt.world_id,
        port: receipt.port, inspector_port: receipt.inspector_port,
        processes: receipt.processes.map(({ phase, pid }) => ({ phase, pid })) };
      await writeFile(join(runDir, "ownership.json.next"), JSON.stringify(ownership) + "\n", { mode: 0o600 });
      await rename(join(runDir, "ownership.json.next"), join(runDir, "ownership.json"));
    }
    const until = Date.now() + 60_000;
    while (Date.now() < until) {
      controller.signal.throwIfAborted();
      if (spawnError) throw spawnError;
      assert.equal(child.exitCode, null, `${phase} Wrangler exited: ${redact(tail, sensitive)}`);
      assert.equal(child.signalCode, null, `${phase} Wrangler was terminated`);
      try {
        const health = await request("/health");
        assert.equal(health.env, "local", "own server must report local");
        assert.equal(health.world_id, config.vars.DEFAULT_WORLD_ID, "own unique world must match");
        receipt.records.push({ phase, health: bounded(health) });
        return;
      } catch (e) {
        // A different server must never be accepted even during startup.
        if (e.code === "ERR_ASSERTION") throw e;
        await delay(200, undefined, { signal: controller.signal });
      }
    }
    throw new Error(`${phase} local readiness deadline exceeded`);
  };
  const stop = async () => {
    const child = current;
    if (!child) return;
    const record = receipt.processes.find(p => p.pid === child.pid);
    await stopOwned(child, record);
    record.cleaned_up = true;
    current = undefined;
  };
  try {
    for (const dir of [env.HOME, env.XDG_CONFIG_HOME, env.TMPDIR]) await mkdir(dir, { recursive: true });
    await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });
    // The only secret binding. Own config/cwd + disabled dotenv fallback + minimal env
    // exclude repository .dev.vars, .env files, shell secrets and CLI auth.
    await writeFile(join(runDir, ".dev.vars"), `TOKEN_SIGNING_SECRET=${signing}\n`, { mode: 0o600 });
    reservation = await reservePort();
    inspectorReservation = await reservePort();
    receipt.port = reservation.port;
    receipt.inspector_port = inspectorReservation.port;
    await reservation.release(); reservation = undefined;
    await inspectorReservation.release(); inspectorReservation = undefined;
    await start("initial");
    const mint = async role => {
      const handle = `mud-${role}-${runId.slice(0, 8)}`;
      const result = await request("/v1/auth/dev-token", { handle, controller_type: "agent" });
      assert.equal(result.player_id, `player.${handle}`);
      assert.equal(result.agent_id, `agent.${handle}`);
      assert.ok(result.access_token);
      sensitive.push(result.access_token);
      return { handle, token: result.access_token, player_id: result.player_id };
    };
    const builder = await mint("builder");
    const witness = await mint("witness");
    await command(builder, "ENTER_WORLD");
    const entered = await command(witness, "ENTER_WORLD");
    // Actual Mini Chamber route. Storage 16 is free capacity, an empty hold, so MOVE costs energy 1 only.
    // Round-trip before the initial WAIT keeps the later notice/plate lifecycle intact.
    const origin = entered.observation;
    check("MOVE witness starts at actual Mini Chamber Anchor", origin.location.room_id === "room.anchor"
      && origin.location.exits.some(e => e.direction === "east" && e.to_room_id === "room.hall") && origin.budgets.storage === 16);
    const rejected = await command(witness, "MOVE", { direction: "down" }, { expectedOk: false, phase: "move rejection" });
    check("nonexistent down MOVE canonically rejected without events", rejected.error?.code === "MOVE_REJECTED"
      && rejected.error?.message === "There is no exit down from here." && (rejected.events ?? []).length === 0);
    assert.deepEqual(rejected.observation.location, origin.location);
    assertBudgetDelta(origin.budgets, rejected.observation.budgets, {});
    check("rejected MOVE preserves location and all five budgets", true);
    const moveId = `mud-${runId}-move-witness`;
    const moved = await command(witness, "MOVE", { direction: "east" }, { id: moveId, phase: "move original" });
    check("legal MOVE has exactly one MOVE event and no hidden LOOK", moved.events?.length === 1
      && moved.events[0].event_type === "MOVE" && moved.events[0].payload?.from === "room.anchor"
      && moved.events[0].payload?.to === "room.hall" && moved.events[0].payload?.direction === "east");
    assert.deepEqual(moved.events[0].payload.cost_paid, { energy: 1 });
    assertBudgetDelta(origin.budgets, moved.observation.budgets, { energy: -1 });
    check("legal MOVE exact all-five budget deltas", true);
    check("MOVE destination orientation and legal return hint", moved.observation.location.room_id === "room.hall"
      && moved.observation.location.name === "Hall"
      && moved.observation.location.exits.some(e => e.direction === "west" && e.to_room_id === "room.anchor")
      && moved.observation.affordances.some(a => a.cmd === "move west" && a.available)
      && moved.observation.play_text.includes("Hall"));
    const returned = await command(witness, "MOVE", { direction: "west" }, { phase: "move return" });
    assertBudgetDelta(moved.observation.budgets, returned.observation.budgets, { energy: -1 });
    check("MOVE round-trip restores origin before initial WAIT", returned.observation.location.room_id === origin.location.room_id
      && returned.events?.length === 1 && returned.events[0].event_type === "MOVE");
    const formed = await command(builder, "ORG_CREATE", { name: `Local Compact ${runId}`, charter: "Local reproducible MUD acceptance." });
    const orgId = formed.events?.find(e => e.event_type === "ORG_CREATE")?.payload?.org_id;
    assert.ok(orgId, "canonical ORG_CREATE must identify org");
    const created = await command(builder, "ORG_OFFICE_CREATE", { org_id: orgId, display_name: "Crier", authority_profile: "PUBLISH_NOTICE" });
    const officeId = created.events?.find(e => e.event_type === "ENTITY_CREATE" && e.payload?.entity_id?.startsWith("office."))?.payload.entity_id;
    assert.ok(officeId, "canonical office create must identify office");
    const assigned = await command(builder, "ORG_OFFICE_ASSIGN", { office_id: officeId, agent_id: builder.player_id });
    const initialCycle = assigned.observation.cycle;
    const firstWait = await command(builder, "WAIT");
    check("initial first WAIT holds two-agent barrier", firstWait.observation.cycle === initialCycle);
    const restored = await command(witness, "WAIT");
    check("initial second WAIT commits one cycle", restored.observation.cycle === initialCycle + 1);
    const harvest = await command(builder, "HARVEST", { entity_id: "entity.acceptance-source", amount: 2 });
    check("native bootstrap harvest uses real source", harvest.events?.some(e => e.event_type === "RESOURCE_TRANSFER"
      && e.payload?.kind === "harvest" && e.payload?.from_id === "entity.acceptance-source"
      && e.payload?.resource === "materials" && e.payload?.amount === 2));
    const repair = await command(builder, "REPAIR", { entity_id: "entity.acceptance-relay" });
    const plate = `A maintenance plate names ${builder.handle} as the last repairer.`;
    const hasPlate = observation => observation?.location?.traces?.some(t => t.text === plate);
    check("canonical REPAIR writes mandatory maintenance plate", hasPlate(repair.observation)
      && repair.events?.some(e => e.event_type === "ENTITY_UPDATE" && e.payload?.operation === "REPAIR"));
    const notices = Object.fromEntries(Object.keys(SURFACES).map(surface => [surface, `${surface}_${runId} <img src=x onerror=window.__mud=1><script>window.__mud=2</script>`]));
    for (const [surface, field] of Object.entries(SURFACES)) {
      const text = notices[surface];
      const posted = await command(builder, "MESSAGE", { surface, text, ...(surface === "NOTICE" ? { org_id: orgId } : {}) });
      check(`${surface} canonical writer/readback`, posted.events?.some(e => e.event_type === "MESSAGE" && e.payload?.text === text)
        && posted.observation?.[field]?.some(line => line.includes(text)));
    }
    const assertNotices = (obs, phase) => {
      for (const [surface, field] of Object.entries(SURFACES)) check(`${phase} ${surface} retained`, obs?.[field]?.some(line => line.includes(notices[surface])));
      check(`${phase} plate retained`, hasPlate(obs));
    };
    const watch = async phase => {
      const value = await request("/v1/watch/live");
      assert.equal(value.world_id, config.vars.DEFAULT_WORLD_ID);
      const serialized = JSON.stringify(value);
      check(`${phase} WATCH excludes authored notice bodies`, Object.entries(notices).every(([surface, text]) =>
        !serialized.includes(text) && !serialized.includes(`${surface}_${runId}`)));
      check(`${phase} WATCH includes permitted plate`, value.rooms?.some(room => room.traces?.some(t => t.text === plate)));
      receipt.records.push({ phase, watch: bounded(value, 65_536) });
    };
    const before = await command(builder, "LOOK");
    assertNotices(before.observation, "before restart");
    await watch("before restart");
    await stop();
    check("first real process stopped before restart", !(await isListening(receipt.port)) && !(await isListening(receipt.inspector_port)));
    await start("retained-storage restart"); // SAME name, config, local signing binding and storage.
    check("restart is a different process", receipt.processes[0].pid !== receipt.processes[1].pid);
    const preReplay = await command(witness, "LOOK", {}, { phase: "move replay fresh before" });
    check("restart witness independently remains at origin", preReplay.observation.location.room_id === origin.location.room_id);
    const replay = await command(witness, "MOVE", { direction: "east" }, { id: moveId, phase: "move retained-storage replay" });
    assert.deepEqual(replay, moved, "retained-storage MOVE replay exact original result including observation");
    check("retained-storage MOVE replay exact original result and observation", true);
    const postReplay = await command(witness, "LOOK", {}, { phase: "move replay fresh after" });
    assert.deepEqual(postReplay.observation.location, preReplay.observation.location);
    assertBudgetDelta(preReplay.observation.budgets, postReplay.observation.budgets, { attention: -1 });
    check("independent fresh LOOK proves replay no movement or debit except LOOK attention 1", true);
    const retained = await command(builder, "LOOK");
    assertNotices(retained.observation, "after real restart");
    check("restart did not advance cycle", retained.observation.cycle === before.observation.cycle);
    const waiting = await command(builder, "WAIT");
    check("expiry first WAIT holds barrier", waiting.observation.cycle === retained.observation.cycle);
    const expired = await command(witness, "WAIT");
    check("expiry second WAIT commits one cycle", expired.observation.cycle === retained.observation.cycle + 1);
    for (const [surface, field] of Object.entries(SURFACES)) check(`${surface} existing cycle expiry`, Array.isArray(expired.observation?.[field]) && expired.observation[field].length === 0);
    await command(builder, "LEAVE_WORLD");
    const independent = await command(witness, "LOOK");
    for (const [surface, field] of Object.entries(SURFACES)) check(`${surface} independent LOOK field empty after LEAVE`,
      Array.isArray(independent.observation?.[field]) && independent.observation[field].length === 0);
    const { attention: beforeAttention, ...beforeOtherBudgets } = expired.observation.budgets;
    const { attention: afterAttention, ...afterOtherBudgets } = independent.observation.budgets;
    check("independent LOOK costs exactly one attention since witness WAIT",
      Number.isFinite(beforeAttention) && Number.isFinite(afterAttention) && afterAttention === beforeAttention - 1);
    assert.deepEqual(afterOtherBudgets, beforeOtherBudgets, "independent LOOK preserves all other witness budgets");
    receipt.checks.push("independent LOOK preserves all other witness budgets");
    check("independent witness sees plate after builder LEAVE", hasPlate(independent.observation));
    check("expired notices absent from independent traces", Object.keys(notices).every(surface =>
      !JSON.stringify(independent.observation.location.traces).includes(`${surface}_${runId}`)));
    await watch("after expiry and LEAVE");
    receipt.status = "passed";
  } catch (e) {
    failure = controller.signal.aborted ? controller.signal.reason : e;
    receipt.status = "failed";
    receipt.error = redact(failure.message, sensitive).slice(0, 2_000);
  } finally {
    try {
      // Every cleanup action is attempted even when another cleanup action fails.
      const outcomes = await Promise.allSettled([
        stop(), reservation?.release(), inspectorReservation?.release(),
        unlink(join(runDir, ".dev.vars")).catch(e => { if (e.code !== "ENOENT") throw e; }),
      ]);
      receipt.cleanup = { owned_process_groups_stopped: receipt.processes.every(p => p.cleaned_up),
        loopback_port_closed: !receipt.port || !(await isListening(receipt.port)),
        inspector_port_closed: !receipt.inspector_port || !(await isListening(receipt.inspector_port)),
        local_signing_file_removed: outcomes[3].status === "fulfilled" };
      const rejected = outcomes.find(outcome => outcome.status === "rejected");
      if (rejected) throw rejected.reason;
      assert.ok(Object.values(receipt.cleanup).every(Boolean), "cleanup must complete");
    } catch (e) {
      failure ??= e;
      receipt.status = "failed";
      receipt.cleanup_error = redact(e.message, sensitive).slice(0, 2_000);
    } finally {
      process.off("SIGINT", onInt);
      process.off("SIGTERM", onTerm);
      process.off("SIGHUP", onHup);
    }
    receipt.finished_at = new Date().toISOString();
    const serialized = redact(JSON.stringify(receipt, null, 2), sensitive) + "\n";
    assert.ok(serialized.length <= 2_000_000, "receipt must stay bounded");
    await writeFile(join(runDir, "receipt.json"), serialized, { mode: 0o600 });
    await writeFile(join(runDir, "runtime-log.json"), JSON.stringify(logs.map(read => read()), null, 2) + "\n", { mode: 0o600 });
  }
  if (failure) throw new Error(`Local acceptance failed. Receipt: ${join(runDir, "receipt.json")} (${redact(failure.message, sensitive).slice(0, 500)})`);
  return { receipt: join(runDir, "receipt.json"), checks: receipt.checks.length, status: receipt.status };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = admitArgs(process.argv.slice(2), process.env);
    if (options.help) console.log(USAGE);
    else console.log(JSON.stringify(await runLocalAcceptance(options)));
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
