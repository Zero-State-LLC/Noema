#!/usr/bin/env node
/** Real local-only npm/SIGTERM acceptance. No supplied URL, PID or receipt is authority. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { constants } from "node:fs";
import { chmod, lstat, mkdir, mkdtemp, open, readdir, unlink, writeFile } from "node:fs/promises";
import { get } from "node:http";
import { connect } from "node:net";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { admitArgs, childEnvironment, redact } from "./mud-local-acceptance.mjs";

export { admitArgs };
const WORKER_ROOT = fileURLToPath(new URL("../", import.meta.url));
const USAGE = "node scripts/mud-local-interruption-acceptance.mjs [--artifacts /absolute/parent]\nDefaults to JCODE_SCRATCH_DIR. Actual LOCAL npm CLI interruption only, no target/PID options.";
const OUTPUT_BOUND = 65_536;
const PID = value => Number.isSafeInteger(value) && value > 1 && value <= 0x7fffffff;
const PORT = value => Number.isInteger(value) && value > 0 && value <= 65535;

/** Synthetic tests exercise these guards, not the real npm/workerd acceptance boundary. */
export function validateOwnership(value, observer, npmPid) {
  assert.match(observer, /^[a-f0-9]{32}$/);
  assert.ok(PID(npmPid) && npmPid !== process.pid, "known spawned npm PID required");
  assert.equal(value?.observer, observer, "ownership nonce must match this invocation");
  assert.match(value.run_id, /^[a-f0-9]{16}$/);
  assert.equal(value.world_id, `test.hosted-canonical.mud-${value.run_id}`);
  assert.ok(PID(value.runner_pid) && value.runner_pid !== npmPid && value.runner_pid !== process.pid);
  assert.ok(PORT(value.port) && PORT(value.inspector_port) && value.port !== value.inspector_port);
  assert.ok(Array.isArray(value.processes) && value.processes.length >= 1 && value.processes.length <= 2);
  const pids = new Set([npmPid, value.runner_pid, process.pid]);
  value.processes.forEach((p, i) => {
    assert.equal(p.phase, ["initial", "retained-storage restart"][i]);
    assert.ok(PID(p.pid) && !pids.has(p.pid), "only distinct attested detached Wrangler groups");
    pids.add(p.pid);
  });
  return { observer, runner_pid: value.runner_pid, run_id: value.run_id, world_id: value.world_id,
    port: value.port, inspector_port: value.inspector_port,
    processes: value.processes.map(({ phase, pid }) => ({ phase, pid })) };
}

export function assertInterruptionReceipt(receipt, owner) {
  assert.equal(receipt?.local_only, true);
  assert.equal(receipt.run_id, owner.run_id);
  assert.equal(receipt.world_id, owner.world_id);
  assert.equal(receipt.port, owner.port);
  assert.equal(receipt.inspector_port, owner.inspector_port);
  assert.equal(receipt.status, "failed", "normal success is not interruption acceptance");
  assert.equal(receipt.error, "Interrupted by SIGTERM");
  assert.equal(receipt.cleanup_error, undefined, "inner cleanup failure is not acceptance");
  assert.ok(Array.isArray(receipt.processes) && receipt.processes.length === owner.processes.length);
  receipt.processes.forEach((p, i) => {
    assert.equal(p.pid, owner.processes[i].pid);
    assert.equal(p.phase, owner.processes[i].phase);
    assert.equal(p.cleaned_up, true);
  });
  for (const key of ["owned_process_groups_stopped", "loopback_port_closed", "inspector_port_closed", "local_signing_file_removed"]) {
    assert.equal(receipt.cleanup?.[key], true, `runner cleanup ${key}`);
  }
}

export function assertLocalHealth(health, worldId) {
  assert.equal(health?.env, "local");
  assert.equal(health.world_id, worldId, "health belongs to unique authenticated local run");
}

export function assertInterruptedExit(exit) {
  // Node reports signal termination as { code: null, signal }, not an exit code.
  // The exact failed inner receipt and independent cleanup are checked separately.
  const failedCode = Number.isInteger(exit?.code) && exit.code > 0 && exit.signal === null;
  const expectedSignal = exit?.code === null && exit.signal === "SIGTERM";
  assert.ok(failedCode || expectedSignal,
    `npm must fail or terminate by SIGTERM, never succeed or require SIGKILL: ${JSON.stringify(exit)}`);
}

export function assertNoCredentials(text) {
  assert.ok(!/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text), "no raw JWT in artifacts");
  assert.ok(!/Bearer\s+(?!\[REDACTED\])\S+/i.test(text), "no raw bearer in artifacts");
  assert.ok(!text.includes("AMBIENT_PRODUCTION_"), "no ambient credential sentinel in artifacts");
}

function groupAlive(pid) {
  try { process.kill(-pid, 0); return true; }
  catch (e) { if (e.code === "ESRCH") return false; throw e; }
}
function signalGroup(pid, signal) {
  try { process.kill(-pid, signal); }
  catch (e) { if (e.code !== "ESRCH") throw e; }
}
async function listening(port) {
  return new Promise(resolve => {
    const socket = connect({ host: "127.0.0.1", port });
    const finish = result => { socket.destroy(); resolve(result); };
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.setTimeout(500, () => finish(true));
  });
}

/** Fixed loopback route only. A hard deadline also covers connection/body stalls. */
export function probeHealth(port, signal) {
  assert.ok(PORT(port));
  return new Promise((resolve, reject) => {
    let bytes = 0;
    const chunks = [];
    const request = get({ hostname: "127.0.0.1", port, path: "/health", signal }, response => {
      if (response.statusCode !== 200) { fail("local health HTTP status"); return; }
      response.on("data", chunk => {
        bytes += chunk.length;
        if (bytes > 8192) fail("health response exceeds bound");
        else chunks.push(chunk);
      });
      response.on("error", reject);
      response.once("end", () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
        catch (e) { reject(e); }
      });
    });
    // Reject explicitly, then close without injecting an unhandled error into a
    // keep-alive socket which may already have detached from ClientRequest.
    const fail = message => { reject(new Error(message)); request.destroy(); };
    const timeout = setTimeout(() => fail("local health deadline"), 500);
    request.on("error", reject);
    request.once("close", () => clearTimeout(timeout));
  });
}

async function privateFile(path, maxBytes) {
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await file.stat();
    assert.ok(stat.isFile() && stat.uid === process.getuid() && (stat.mode & 0o077) === 0, "private owned regular artifact");
    assert.ok(stat.size <= maxBytes, "artifact size bound");
    const bytes = Buffer.alloc(maxBytes + 1);
    const { bytesRead } = await file.read(bytes, 0, bytes.length, 0);
    assert.ok(bytesRead <= maxBytes, "artifact read bound");
    return bytes.subarray(0, bytesRead).toString("utf8");
  } finally { await file.close(); }
}

export async function runInterruptionAcceptance(options) {
  assert.notEqual(process.platform, "win32", "POSIX process groups required");
  await mkdir(options.artifactsRoot, { recursive: true });
  const root = await mkdtemp(join(options.artifactsRoot, "mud-interruption-"));
  await chmod(root, 0o700);
  const runnerRoot = join(root, "runner");
  const env = childEnvironment(root);
  for (const dir of [runnerRoot, env.HOME, env.XDG_CONFIG_HOME, env.TMPDIR]) await mkdir(dir, { recursive: true, mode: 0o700 });
  const observer = randomBytes(16).toString("hex"); // Per-invocation attestation, not a credential.
  const controller = new AbortController();
  const handlers = Object.fromEntries(["SIGINT", "SIGTERM", "SIGHUP"].map(signal => [signal, () => controller.abort(new Error(`Observer interrupted by ${signal}`))]));
  for (const [signal, handler] of Object.entries(handlers)) process.on(signal, handler);
  const report = { local_only: true, status: "running", started_at: new Date().toISOString(), checks: [], cleanup: {}, limits: ["Actual local npm/workerd SIGTERM only, not hosted acceptance"] };
  const knownGroups = new Set();
  let child, exit, runDir, owner, failure;
  let output = "", outputBytes = 0;
  const check = name => report.checks.push(name);
  const collectOwnership = async () => {
    const entries = await readdir(runnerRoot, { withFileTypes: true });
    assert.ok(entries.length <= 1, "fresh owned runner parent has at most one run");
    if (!entries.length) return;
    const entry = entries[0];
    assert.ok(entry.isDirectory() && /^mud-local-[A-Za-z0-9_-]+$/.test(entry.name), "only fresh runner child directory");
    const candidate = join(runnerRoot, entry.name);
    const stat = await lstat(candidate);
    assert.ok(stat.isDirectory() && stat.uid === process.getuid() && (stat.mode & 0o077) === 0, "private owned run directory");
    let text;
    try { text = await privateFile(join(candidate, "ownership.json"), 4096); }
    catch (e) { if (e.code === "ENOENT") return; throw e; }
    const next = validateOwnership(JSON.parse(text), observer, child.pid);
    if (owner) {
      for (const key of ["runner_pid", "run_id", "world_id", "port", "inspector_port"]) assert.equal(next[key], owner[key], "ownership identity stays stable");
      assert.ok(next.processes.length >= owner.processes.length);
      owner.processes.forEach((p, i) => assert.deepEqual(next.processes[i], p));
    }
    owner = next;
    runDir = candidate;
    for (const p of owner.processes) knownGroups.add(p.pid);
  };
  try {
    child = spawn("npm", ["run", "acceptance:mud:local", "--", "--artifacts", runnerRoot], {
      cwd: WORKER_ROOT, env: { ...env, NOEMA_LOCAL_ACCEPTANCE_OBSERVER: observer, npm_config_update_notifier: "false" },
      detached: true, stdio: ["ignore", "pipe", "pipe"],
    });
    child.once("error", e => { exit = { error: e.message }; });
    child.once("exit", (code, signal) => { exit = { code, signal }; });
    const capture = chunk => {
      outputBytes += chunk.length;
      if (outputBytes > OUTPUT_BOUND) controller.abort(new Error("npm output exceeds bound"));
      else output += chunk.toString("utf8");
    };
    child.stdout.on("data", capture);
    child.stderr.on("data", capture);
    const untilReady = Date.now() + 70_000;
    let ready = false;
    while (Date.now() < untilReady) {
      controller.signal.throwIfAborted();
      assert.equal(exit, undefined, "public npm runner completed before readiness observation");
      await collectOwnership();
      if (owner) {
        let health;
        try { health = await probeHealth(owner.port, controller.signal); }
        catch { controller.signal.throwIfAborted(); }
        if (health) {
          assertLocalHealth(health, owner.world_id);
          assert.equal(exit, undefined, "runner completed before readiness observation");
          ready = true;
          break;
        }
      }
      await delay(25, undefined, { signal: controller.signal });
    }
    assert.ok(ready, "own local health readiness deadline exceeded");
    check("actual unique local health observed before runner completion");
    signalGroup(child.pid, "SIGTERM");
    check("external SIGTERM sent only to this spawned npm group");
    const untilReceipt = Date.now() + 25_000;
    let receipt;
    while (Date.now() < untilReceipt) {
      controller.signal.throwIfAborted();
      await collectOwnership();
      try { receipt = JSON.parse(await privateFile(join(runDir, "receipt.json"), 2_000_000)); }
      catch (e) { if (e.code !== "ENOENT" && !(e instanceof SyntaxError)) throw e; }
      if (receipt && exit) break;
      await delay(50, undefined, { signal: controller.signal });
    }
    assertInterruptionReceipt(receipt, owner);
    check("failed Interrupted by SIGTERM receipt matches authenticated run");
    assertInterruptedExit(exit);
    check("public npm runner terminates unsuccessfully after interruption");
    const untilGroupsClose = Date.now() + 3000;
    while ([child.pid, ...knownGroups].some(groupAlive) && Date.now() < untilGroupsClose) await delay(25, undefined, { signal: controller.signal });
    for (const pid of [child.pid, ...knownGroups]) assert.equal(groupAlive(pid), false, "independent process-group closure");
    check("independent npm and Wrangler process groups are gone");
    assert.equal(await listening(owner.port), false);
    assert.equal(await listening(owner.inspector_port), false);
    check("independent loopback and inspector ports closed");
    await assert.rejects(lstat(join(runDir, ".dev.vars")), { code: "ENOENT" });
    check("independent local signing file absent");
    for (const [name, bound] of [["receipt.json", 2_000_000], ["runtime-log.json", 65_536], ["wrangler.json", 8192], ["ownership.json", 4096]]) {
      assertNoCredentials(await privateFile(join(runDir, name), bound));
    }
    assertNoCredentials(output);
    check("bounded output and artifacts exclude raw credentials");
    report.status = "passed";
  } catch (e) {
    failure = controller.signal.aborted ? controller.signal.reason : e;
    report.status = "failed";
    report.error = redact(failure.message).slice(0, 2000);
  } finally {
    // Authority is only our spawned npm group and nonce-attested metadata in our
    // fresh private parent. Never infer kill targets from a supplied receipt.
    try {
      if (child?.pid) {
        if (groupAlive(child.pid)) signalGroup(child.pid, "SIGTERM");
        const until = Date.now() + 9000;
        let ownershipError;
        while (Date.now() < until) {
          try { await collectOwnership(); } catch (e) { ownershipError = e; }
          if (![child.pid, ...knownGroups].some(groupAlive)) break;
          await delay(100);
        }
        for (const pid of knownGroups) if (groupAlive(pid)) signalGroup(pid, "SIGKILL");
        if (groupAlive(child.pid)) signalGroup(child.pid, "SIGKILL");
        const killedUntil = Date.now() + 3000;
        while ([child.pid, ...knownGroups].some(groupAlive) && Date.now() < killedUntil) await delay(100);
        assert.ok(![child.pid, ...knownGroups].some(groupAlive), "fallback owned groups stopped");
        if (owner) await unlink(join(runDir, ".dev.vars")).catch(e => { if (e.code !== "ENOENT") throw e; });
        if (ownershipError) throw ownershipError;
      }
      report.cleanup = { owned_groups_stopped: !child?.pid || ![child.pid, ...knownGroups].some(groupAlive),
        loopback_port_closed: owner ? !(await listening(owner.port)) : null,
        inspector_port_closed: owner ? !(await listening(owner.inspector_port)) : null,
        local_signing_file_removed: owner ? !(await lstat(join(runDir, ".dev.vars")).catch(e => { if (e.code === "ENOENT") return false; throw e; })) : null };
      assert.ok(Object.values(report.cleanup).every(Boolean), "observer cleanup complete");
    } catch (e) {
      failure ??= e;
      report.status = "failed";
      report.cleanup_error = redact(e.message).slice(0, 2000);
    } finally {
      for (const [signal, handler] of Object.entries(handlers)) process.off(signal, handler);
      child?.stdout?.destroy();
      child?.stderr?.destroy();
      child?.unref();
    }
    report.npm_pid = child?.pid ?? null;
    report.finished_at = new Date().toISOString();
    report.npm_exit = exit;
    report.output_bytes = outputBytes;
    report.runner_receipt = runDir ? join(runDir, "receipt.json") : null;
    report.ownership = owner;
    await writeFile(join(root, "npm-output.log"), redact(output), { mode: 0o600 });
    await writeFile(join(root, "interruption-receipt.json"), JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
  }
  const receipt = join(root, "interruption-receipt.json");
  if (failure) throw new Error(`Local interruption acceptance failed. Receipt: ${receipt} (${redact(failure.message).slice(0, 500)})`);
  return { status: report.status, checks: report.checks.length, receipt, npm_exit: report.npm_exit };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = admitArgs(process.argv.slice(2), process.env);
    if (options.help) console.log(USAGE);
    else console.log(JSON.stringify(await runInterruptionAcceptance(options)));
  } catch (e) { console.error(redact(e.message)); process.exitCode = 1; }
}
