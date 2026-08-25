#!/usr/bin/env node
/**
 * Fail-closed A-B-A Cloudflare Worker rollback rehearsal.
 *
 * This script creates only a dedicated workers.dev service and its own Durable
 * Object namespace. It never deploys routes, imports production bindings, or
 * accepts a production world id. Secrets are generated per run, uploaded from
 * an ephemeral mode-0600 file, redacted from receipts, and removed on exit.
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const REQUIRED_ACK = "I_ACKNOWLEDGE_ISOLATED_A_B_A";
export const DEFAULT_WORKER = "noema-rollback-rehearsal-555-20260825";
export const REHEARSAL_WORLD = "test.hosted-canonical.ewm-cutover";
export const ACCEPTED_SEAL = "sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395";
export const PRODUCTION_BASE = "https://noema.guru";

const CONFIG = path.resolve("wrangler.rollback-rehearsal.jsonc");
const DEFAULT_JSON_OUTPUT = path.resolve("../../docs/ISOLATED-ROLLBACK-REHEARSAL-555-EVIDENCE.json");
const DEFAULT_MD_OUTPUT = path.resolve("../../docs/ISOLATED-ROLLBACK-REHEARSAL-555-EVIDENCE.md");
const WORKER_PREFIX = "noema-rollback-rehearsal-";
const FORBIDDEN_WORKERS = new Set(["noema-gateway", "noema-gateway-production", "noema"]);

function fail(message) {
  throw new Error(message);
}

export function admitWorkerName(raw) {
  const worker = String(raw || "").trim().toLowerCase();
  if (!worker) return { ok: false, message: "WORKER_NAME is required" };
  if (FORBIDDEN_WORKERS.has(worker) || worker.includes("production") || worker.includes("prod-")) {
    return { ok: false, message: "production-like Worker names are forbidden" };
  }
  if (!worker.startsWith(WORKER_PREFIX)) {
    return { ok: false, message: `Worker name must start with ${WORKER_PREFIX}` };
  }
  if (!/^[a-z][a-z0-9-]{2,62}$/.test(worker)) {
    return { ok: false, message: "Worker name must be a valid 3..63 character Cloudflare service name" };
  }
  return { ok: true, worker };
}

export function admitWorldId(raw) {
  const world = String(raw || "").trim();
  if (world !== REHEARSAL_WORLD) {
    return { ok: false, message: `world id must be exactly ${REHEARSAL_WORLD}` };
  }
  if (world === "world-01" || world.startsWith("world.perihelion")) {
    return { ok: false, message: "production world ids are forbidden" };
  }
  return { ok: true, world };
}

export function parseWorkersDevUrl(output) {
  const urls = [...String(output || "").matchAll(/https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev\/?/gi)].map((m) =>
    m[0].replace(/\/$/, ""),
  );
  return [...new Set(urls)].at(-1) || null;
}

export function parseCurrentVersionId(output) {
  const matches = [...String(output || "").matchAll(/Current Version ID:\s*([0-9a-f-]{36})/gi)].map((m) =>
    m[1].toLowerCase(),
  );
  const unique = [...new Set(matches)];
  if (unique.length !== 1) fail(`Wrangler output must contain exactly one Current Version ID, found ${unique.length}`);
  return unique[0];
}

export function immutableProductionIdentity(snapshot) {
  return {
    worker_version_id: snapshot?.version?.worker_version_id ?? null,
    version_world_id: snapshot?.version?.world_id ?? null,
    ready_world_id: snapshot?.ready?.world?.world_id ?? null,
    genesis_id: snapshot?.ready?.world?.genesis_id ?? null,
  };
}

export function assertProductionUnchanged(before, after) {
  const a = immutableProductionIdentity(before);
  const b = immutableProductionIdentity(after);
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    fail(`production identity changed during rehearsal: ${JSON.stringify({ before: a, after: b })}`);
  }
  if (after?.health?.status !== "ok" || after?.ready?.ready !== true || after?.ready?.settlement_health !== "HEALTHY") {
    fail("production health/readiness was not healthy after rehearsal");
  }
}

export function compareDurableSnapshot(label, expected, actual) {
  const keys = [
    "state_digest",
    "history_digest",
    "history_count",
    "history_head_event_id",
    "history_head_sequence",
  ];
  for (const key of keys) {
    if (expected?.rollback_evidence?.[key] !== actual?.rollback_evidence?.[key]) {
      fail(`${label}: rollback evidence mismatch for ${key}`);
    }
  }
  for (const key of ["world_id", "genesis_id", "cycle0_digest", "status", "settlement_health"]) {
    if (expected?.[key] !== actual?.[key]) fail(`${label}: world evidence mismatch for ${key}`);
  }
  if (expected?.sequence !== actual?.sequence || expected?.cycle !== actual?.cycle) {
    fail(`${label}: sequence or cycle changed without a command`);
  }
}

function printable(args) {
  return args
    .map((value, i) => (args[i - 1] === "--secrets-file" ? "<ephemeral-secrets-file>" : String(value)))
    .join(" ");
}

function run(command, args, options = {}) {
  const display = `$ ${command} ${printable(args)}`;
  console.log(display);
  const result = spawnSync(command, args, {
    cwd: options.cwd || process.cwd(),
    encoding: "utf8",
    input: options.input,
    env: { ...process.env, ...(options.env || {}) },
    maxBuffer: 20 * 1024 * 1024,
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`;
  if (result.status !== 0) fail(`${display} failed (${result.status})\n${output}`);
  if (!options.quiet && output.trim()) console.log(output.trim());
  return { output, display };
}

async function fetchJson(url, init = {}, expected = [200]) {
  const response = await fetch(url, init);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!expected.includes(response.status)) {
    fail(`${init.method || "GET"} ${url} returned ${response.status}: ${JSON.stringify(body)}`);
  }
  return { status: response.status, body };
}

async function waitJson(url, predicate, attempts = 30) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      last = await fetchJson(url);
      if (predicate(last.body)) return last.body;
    } catch (error) {
      last = { error: error instanceof Error ? error.message : String(error) };
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  fail(`timed out waiting for ${url}: ${JSON.stringify(last)}`);
}

async function publicSnapshot(base) {
  const [health, ready, version] = await Promise.all([
    fetchJson(`${base}/health`),
    fetchJson(`${base}/ready`),
    fetchJson(`${base}/version`),
  ]);
  return { health: health.body, ready: ready.body, version: version.body };
}

function deploymentArgs(worker, phase, tag, message, secretsFile) {
  const args = [
    "wrangler",
    "deploy",
    "--config",
    CONFIG,
    "--name",
    worker,
    "--tag",
    tag,
    "--message",
    message,
    "--var",
    "NOEMA_ENV:test",
    "--var",
    "NOEMA_PROTOCOL_VERSION:1",
    "--var",
    `DEFAULT_WORLD_ID:${REHEARSAL_WORLD}`,
    "--var",
    `ROLLBACK_REHEARSAL_PHASE:${phase}`,
  ];
  if (secretsFile) args.push("--secrets-file", secretsFile);
  return args;
}

async function deployPhase(worker, phase, secretsFile, commands, knownBase) {
  const tag = `issue-555-${phase.toLowerCase()}`;
  const message = `Issue #555 isolated rollback rehearsal phase ${phase}`;
  const deployed = run("npx", deploymentArgs(worker, phase, tag, message, secretsFile));
  commands.push(deployed.display);
  const base = parseWorkersDevUrl(deployed.output) || knownBase;
  if (!base) fail("Wrangler output did not contain a workers.dev URL");
  const deployedVersionId = parseCurrentVersionId(deployed.output);
  const version = await waitJson(`${base}/version`, (body) => body.worker_version_id === deployedVersionId);
  if (version.env !== "test" || version.world_id !== REHEARSAL_WORLD) {
    fail(`deployed Worker self-reported unsafe identity: ${JSON.stringify(version)}`);
  }
  return { base, version, deploy_output_sha256: sha256(deployed.output), deployed_version_id: deployedVersionId };
}

async function mintSessions(base, adminOperatorToken) {
  const admin = await fetchJson(
    `${base}/v1/admin/session`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ admin_token: adminOperatorToken }),
    },
    [200],
  );
  const player = await fetchJson(
    `${base}/v1/auth/dev-token`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle: "rollback555", controller_type: "agent" }),
    },
    [200],
  );
  if (!admin.body.access_token || !player.body.access_token) fail("rehearsal session mint did not return access tokens");
  return { admin: admin.body.access_token, player: player.body.access_token };
}

async function activateGenesis(base, adminToken, runId) {
  const headers = { "content-type": "application/json", Authorization: `Bearer ${adminToken}` };
  const preview = await fetchJson(`${base}/v1/admin/genesis/preview`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      world_id: REHEARSAL_WORLD,
      world_name: "Rollback Rehearsal",
      world_seed: `issue-555-${runId}`,
      profile_id: "EWM_ENHANCED",
      story_seed_ids: [],
    }),
  });
  const genesisId = preview.body?.result?.genesis_id;
  if (!genesisId || preview.body?.determinism?.ok !== true || preview.body?.live_world_unchanged?.ok !== true) {
    fail(`Genesis preview evidence failed: ${JSON.stringify(preview.body)}`);
  }
  const activated = await fetchJson(`${base}/v1/admin/genesis/activate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ world_id: REHEARSAL_WORLD, genesis_id: genesisId, confirm: true }),
  });
  if (activated.body?.ok !== true || activated.body?.settlement?.digest_match !== true) {
    fail(`Genesis activation failed: ${JSON.stringify(activated.body)}`);
  }
  return {
    genesis_id: genesisId,
    cycle0_digest: activated.body?.settlement?.cycle0_digest,
    external_settlement_recorded: activated.body?.settlement?.settled === true,
    note: activated.body?.settlement?.note,
  };
}

async function command(base, playerToken, body, seal = ACCEPTED_SEAL, expected = [200]) {
  return fetchJson(
    `${base}/v1/command`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${playerToken}`,
        ...(seal ? { "X-Noema-Seal": seal } : {}),
      },
      body: JSON.stringify(body),
    },
    expected,
  );
}

function sanitizeOverview(body) {
  const copy = structuredClone(body);
  delete copy.admin;
  if (copy.world) {
    delete copy.world.player_ids;
    delete copy.world.live_players;
    delete copy.world.system_actors;
  }
  return copy;
}

async function adminOverview(base, adminToken) {
  const response = await fetchJson(`${base}/v1/admin/overview`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const body = sanitizeOverview(response.body);
  if (body?.world?.world_id !== REHEARSAL_WORLD) fail("admin overview resolved an unexpected world");
  if (body?.world?.rollback_evidence?.pin !== "rollback-rehearsal-evidence/1") {
    fail("admin overview is missing rollback rehearsal evidence");
  }
  if (body?.canonical_head?.head_present !== false) {
    fail("isolated rehearsal unexpectedly found an external canonical settlement head");
  }
  return body;
}

function durableView(overview) {
  const world = overview.world || {};
  const meta = world.meta || {};
  return {
    world_id: world.world_id,
    genesis_id: meta.genesis_id,
    cycle0_digest: meta.cycle0_digest,
    status: meta.status,
    settlement_health: meta.settlement_health,
    settlement_ok: meta.settlement_ok,
    cycle: world.cycle,
    sequence: world.sequence,
    rollback_evidence: world.rollback_evidence,
    canonical_head: overview.canonical_head,
  };
}

function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function fileSha256(file) {
  return sha256(fs.readFileSync(file));
}

function readLockVersion(name) {
  const lock = JSON.parse(fs.readFileSync(path.resolve("package-lock.json"), "utf8"));
  return lock.packages?.[`node_modules/${name}`]?.version || null;
}

function writeEvidence(jsonPath, mdPath, evidence) {
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(evidence, null, 2)}\n`);
  const a = evidence.phases.a_before_b.durable;
  const b = evidence.phases.b.durable;
  const r = evidence.phases.rollback_a.durable;
  const lines = [
    "# Issue #555 isolated A-B-A rollback evidence",
    "",
    `- Verdict: **${evidence.verdict}**`,
    `- Executed: ${evidence.finished_at}`,
    `- Worker: \`${evidence.isolation.worker_name}\``,
    `- URL: ${evidence.isolation.base}`,
    `- World: \`${evidence.isolation.world_id}\``,
    `- Source commit: \`${evidence.pins.git_sha}\``,
    `- Wrangler: \`${evidence.pins.wrangler}\`; workerd: \`${evidence.pins.workerd}\`; Node: \`${evidence.pins.node}\``,
    `- A version: \`${evidence.versions.a}\``,
    `- B version: \`${evidence.versions.b}\``,
    `- Rolled back active version: \`${evidence.versions.rollback_active}\``,
    "",
    "## Durable state pins",
    "",
    "| point | sequence | state digest | history digest | settlement |",
    "|---|---:|---|---|---|",
    `| A before B | ${a.sequence} | \`${a.rollback_evidence.state_digest}\` | \`${a.rollback_evidence.history_digest}\` | ${a.status}/${a.settlement_health} |`,
    `| B | ${b.sequence} | \`${b.rollback_evidence.state_digest}\` | \`${b.rollback_evidence.history_digest}\` | ${b.status}/${b.settlement_health} |`,
    `| rollback A | ${r.sequence} | \`${r.rollback_evidence.state_digest}\` | \`${r.rollback_evidence.history_digest}\` | ${r.status}/${r.settlement_health} |`,
    "",
    "A, B, and immediate rollback A matched for Genesis, cycle-0 digest, sequence/cycle, canonical state digest, ordered history digest, and history head. The idempotent ENTER replay also returned the stored response without changing semantic state.",
    "",
    "## Isolation and production non-impact",
    "",
    "- Dedicated Worker service name and Durable Object namespace only.",
    "- `workers.dev` only. No routes, custom domains, cron, email, Supabase, KV, D1, R2, queues, or production service bindings.",
    "- Fresh per-run signing/admin secrets were uploaded from an ephemeral file and are not present in this receipt.",
    "- The isolated admin overview reported `canonical_head.head_present=false`, proving no external production canonical store was bound. The Durable Object canonical `state_digest` is the rehearsal head.",
    `- Production identity before and after: \`${JSON.stringify(immutableProductionIdentity(evidence.production.before))}\``,
    "",
    "## Recovery behavior",
    "",
    `Rollback immediately restored A at 100% traffic. Health and readiness were healthy, the pre-B state was intact without manual recovery, an idempotent replay remained stable, and a new WAIT mutation advanced the isolated world to sequence ${evidence.phases.recovery_write.durable.sequence}.`,
    "",
    "## Exact commands",
    "",
    "```text",
    ...evidence.commands,
    "```",
    "",
    `Machine-readable receipt: \`${path.basename(jsonPath)}\``,
  ];
  fs.writeFileSync(mdPath, `${lines.join("\n")}\n`);
}

async function main() {
  if (process.env.NOEMA_ROLLBACK_REHEARSAL !== REQUIRED_ACK) {
    fail(`set NOEMA_ROLLBACK_REHEARSAL=${REQUIRED_ACK} to execute`);
  }
  const workerGate = admitWorkerName(process.env.WORKER_NAME || DEFAULT_WORKER);
  if (!workerGate.ok) fail(workerGate.message);
  const worldGate = admitWorldId(process.env.WORLD_ID || REHEARSAL_WORLD);
  if (!worldGate.ok) fail(worldGate.message);
  if (!fs.existsSync(CONFIG)) fail(`missing rehearsal config: ${CONFIG}`);
  const worker = workerGate.worker;
  const startedAt = new Date().toISOString();
  const runId = startedAt.replace(/[^0-9]/g, "").slice(0, 14);
  const jsonOutput = path.resolve(process.env.EVIDENCE_JSON || DEFAULT_JSON_OUTPUT);
  const mdOutput = path.resolve(process.env.EVIDENCE_MD || DEFAULT_MD_OUTPUT);
  const commands = [];
  const secretsFile = path.join(os.tmpdir(), `.noema-rollback-${process.pid}.json`);
  const tokenSigningSecret = crypto.randomBytes(48).toString("base64url");
  const adminOperatorToken = crypto.randomBytes(36).toString("base64url");
  fs.writeFileSync(secretsFile, JSON.stringify({ TOKEN_SIGNING_SECRET: tokenSigningSecret, ADMIN_OPERATOR_TOKEN: adminOperatorToken }), {
    mode: 0o600,
  });

  try {
    const whoami = run("npx", ["wrangler", "whoami"], { quiet: true });
    commands.push(whoami.display);
    if (!whoami.output.includes("315fb44b61212825452aad0ca566ea42")) {
      fail("Wrangler identity does not include the pinned Noema Cloudflare account");
    }

    const productionBefore = await publicSnapshot(PRODUCTION_BASE);
    const a = await deployPhase(worker, "A", secretsFile, commands);
    const sessions = await mintSessions(a.base, adminOperatorToken);
    const genesis = await activateGenesis(a.base, sessions.admin, runId);
    const readyA = await waitJson(`${a.base}/ready`, (body) => body.ready === true && body.settlement_health === "HEALTHY");

    const sealedBody = {
      command: "ENTER_WORLD",
      request_id: `issue555-enter-${runId}`,
      idempotency_key: `issue555-enter-${runId}`,
      arguments: {},
    };
    const noSeal = await command(a.base, sessions.player, sealedBody, null, [401]);
    if (noSeal.body?.error?.code !== "SEAL_REQUIRED") fail("default-world command did not enforce the live seal");
    const wrongSeal = await command(a.base, sessions.player, sealedBody, `sha256:${"0".repeat(64)}`, [401]);
    if (wrongSeal.body?.error?.code !== "SEAL_MISMATCH") fail("default-world command did not reject the wrong seal");

    const entered = await command(a.base, sessions.player, sealedBody);
    if (entered.body?.ok !== true) fail(`ENTER_WORLD failed: ${JSON.stringify(entered.body)}`);
    const beforeReplay = durableView(await adminOverview(a.base, sessions.admin));
    const replayed = await command(a.base, sessions.player, sealedBody);
    if (JSON.stringify(replayed.body) !== JSON.stringify(entered.body)) fail("idempotent ENTER replay response changed");
    const afterReplay = durableView(await adminOverview(a.base, sessions.admin));
    if (beforeReplay.rollback_evidence.state_digest !== afterReplay.rollback_evidence.state_digest) {
      fail("idempotent replay changed semantic state digest");
    }
    if (beforeReplay.sequence !== afterReplay.sequence) fail("idempotent replay advanced sequence");

    const aBeforeB = { health: await publicSnapshot(a.base), durable: afterReplay };
    const b = await deployPhase(worker, "B", null, commands, a.base);
    if (b.version.worker_version_id === a.version.worker_version_id) fail("B did not create a distinct Worker version");
    const bSnapshot = { health: await publicSnapshot(b.base), durable: durableView(await adminOverview(b.base, sessions.admin)) };
    compareDurableSnapshot("A to B", aBeforeB.durable, bSnapshot.durable);

    const rollback = run("npx", [
      "wrangler",
      "rollback",
      a.version.worker_version_id,
      "--config",
      CONFIG,
      "--name",
      worker,
      "--message",
      "Issue #555 isolated A-B-A rollback rehearsal",
      "--yes",
    ]);
    commands.push(rollback.display);
    const rollbackVersion = await waitJson(`${a.base}/version`, (body) => body.worker_version_id === a.version.worker_version_id);
    const rollbackSnapshot = {
      health: await publicSnapshot(a.base),
      durable: durableView(await adminOverview(a.base, sessions.admin)),
    };
    compareDurableSnapshot("B to rollback A", bSnapshot.durable, rollbackSnapshot.durable);

    const replayAfterRollback = await command(a.base, sessions.player, sealedBody);
    if (JSON.stringify(replayAfterRollback.body) !== JSON.stringify(entered.body)) {
      fail("idempotent response did not survive rollback");
    }
    const afterRollbackReplay = durableView(await adminOverview(a.base, sessions.admin));
    compareDurableSnapshot("rollback A idempotent replay", rollbackSnapshot.durable, afterRollbackReplay);

    const waitBody = {
      command: "WAIT",
      request_id: `issue555-recovery-${runId}`,
      idempotency_key: `issue555-recovery-${runId}`,
      arguments: {},
    };
    const recoveryWrite = await command(a.base, sessions.player, waitBody);
    if (recoveryWrite.body?.ok !== true) fail(`post-rollback recovery write failed: ${JSON.stringify(recoveryWrite.body)}`);
    const recoveryDurable = durableView(await adminOverview(a.base, sessions.admin));
    if (recoveryDurable.sequence <= rollbackSnapshot.durable.sequence) fail("post-rollback write did not advance sequence");

    const productionAfter = await publicSnapshot(PRODUCTION_BASE);
    assertProductionUnchanged(productionBefore, productionAfter);

    const evidence = {
      schema_version: "noema-isolated-rollback-rehearsal/1",
      issue: 555,
      verdict: "PASS",
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      isolation: {
        worker_name: worker,
        base: a.base,
        world_id: worldGate.world,
        workers_dev_only: true,
        routes: [],
        external_storage_bindings: [],
        durable_object_namespace_is_worker_local: true,
        secrets: ["TOKEN_SIGNING_SECRET (fresh, redacted)", "ADMIN_OPERATOR_TOKEN (fresh, redacted)"],
      },
      pins: {
        git_sha: run("git", ["rev-parse", "HEAD"], { quiet: true }).output.trim(),
        config_sha256: fileSha256(CONFIG),
        package_lock_sha256: fileSha256(path.resolve("package-lock.json")),
        node: process.version,
        wrangler: readLockVersion("wrangler"),
        workerd: readLockVersion("workerd"),
        typescript: readLockVersion("typescript"),
        compatibility_date: "2026-08-01",
        canonicalization: "noema-jcs/1",
        seal: ACCEPTED_SEAL,
      },
      versions: {
        a: a.version.worker_version_id,
        b: b.version.worker_version_id,
        rollback_active: rollbackVersion.worker_version_id,
        a_deploy_output_sha256: a.deploy_output_sha256,
        b_deploy_output_sha256: b.deploy_output_sha256,
      },
      genesis,
      seal_checks: {
        missing: noSeal.body?.error?.code,
        mismatch: wrongSeal.body?.error?.code,
        accepted: entered.body?.ok === true,
      },
      phases: {
        a_before_b: aBeforeB,
        b: bSnapshot,
        rollback_a: rollbackSnapshot,
        rollback_idempotent_replay: { durable: afterRollbackReplay, response_equal: true },
        recovery_write: { durable: recoveryDurable, command_ok: true },
      },
      production: { before: productionBefore, after: productionAfter, unchanged: true },
      commands,
      assertions: {
        genesis_preserved: true,
        state_digest_preserved_a_b_a: true,
        history_preserved_a_b_a: true,
        canonical_external_head_absent: true,
        settlement_health_healthy: true,
        idempotency_survived_rollback: true,
        post_rollback_write_recovered: true,
        production_identity_unchanged: true,
        readiness_healthy: readyA.ready === true && rollbackSnapshot.health.ready.ready === true,
      },
    };
    writeEvidence(jsonOutput, mdOutput, evidence);
    console.log(`PASS: wrote ${jsonOutput}`);
    console.log(`PASS: wrote ${mdOutput}`);
  } finally {
    try {
      fs.rmSync(secretsFile, { force: true });
    } catch {
      // Best-effort cleanup. The file name contains no secret and values were never logged.
    }
  }
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
