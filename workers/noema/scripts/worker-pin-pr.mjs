#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_VERSION_URL = "https://noema.guru/version";

function fail(message) {
  const error = new Error(message);
  error.noemaPinError = true;
  throw error;
}

export function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function normalizeLiveVersion(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    fail("live /version evidence must be a JSON object");
  }
  const workerVersionId = String(input.worker_version_id || "").trim();
  const deployedAt = String(input.deployed_at || "").trim();
  if (!workerVersionId) fail("live /version evidence is missing worker_version_id");
  if (!deployedAt) fail("live /version evidence is missing deployed_at");
  const deployedDate = new Date(deployedAt);
  if (Number.isNaN(deployedDate.valueOf())) {
    fail(`live /version deployed_at is not a valid timestamp: ${deployedAt}`);
  }
  return {
    product: typeof input.product === "string" ? input.product : undefined,
    stage: typeof input.stage === "string" ? input.stage : undefined,
    env: typeof input.env === "string" ? input.env : undefined,
    protocol_version:
      typeof input.protocol_version === "string" ? input.protocol_version : undefined,
    world_id: typeof input.world_id === "string" ? input.world_id : undefined,
    worker_version_id: workerVersionId,
    deployed_at: deployedDate.toISOString(),
  };
}

export function normalizeReady(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("live /ready evidence must be a JSON object");
  if (typeof input.world_id === "string" && typeof input.genesis_id === "string") {
    const worldId = input.world_id.trim();
    const genesisId = input.genesis_id.trim();
    if (!worldId) fail("live /ready evidence is missing world.world_id");
    if (!genesisId) fail("live /ready evidence is missing world.genesis_id");
    return { world_id: worldId, genesis_id: genesisId };
  }
  const world = input.world && typeof input.world === "object" && !Array.isArray(input.world) ? input.world : null;
  const worldId = String(world?.world_id || "").trim();
  const genesisId = String(world?.genesis_id || "").trim();
  if (!worldId) fail("live /ready evidence is missing world.world_id");
  if (!genesisId) fail("live /ready evidence is missing world.genesis_id");
  if (input.ready !== true) fail("live /ready evidence is not ready=true");
  return { world_id: worldId, genesis_id: genesisId };
}

export function extractWranglerVersionId(output) {
  const matches = [...String(output || "").matchAll(/(?:worker\s+)?version(?:\s+id)?[^0-9a-f]*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi)].map((m) => m[1].toLowerCase());
  const unique = [...new Set(matches)];
  if (unique.length !== 1) fail(`Wrangler deployment output must contain exactly one Worker version id, found ${unique.length}`);
  return unique[0];
}

export function validateSourceCommit(sourceCommit) {
  const value = String(sourceCommit || "").trim();
  if (!/^[0-9a-f]{40}$/i.test(value)) {
    fail(`source commit must be a 40-character git SHA, got: ${sourceCommit || ""}`);
  }
  return value.toLowerCase();
}

export function updateHostedLivePin(compat, options) {
  if (!compat || typeof compat !== "object" || Array.isArray(compat)) {
    fail("spec-compat.json must be a JSON object");
  }
  if (!compat.hosted_live || typeof compat.hosted_live !== "object" || Array.isArray(compat.hosted_live)) {
    fail("spec-compat.json is missing hosted_live object");
  }
  const live = normalizeLiveVersion(options.live);
  const ready = normalizeReady(options.ready);
  const expectedWorkerVersionId = String(options.expectedWorkerVersionId || "").trim().toLowerCase();
  if (!expectedWorkerVersionId) fail("expected Wrangler worker version id is required");
  if (live.worker_version_id.toLowerCase() !== expectedWorkerVersionId) {
    fail(`live /version worker_version_id (${live.worker_version_id}) does not match Wrangler deployment output (${expectedWorkerVersionId})`);
  }
  if (live.world_id !== ready.world_id) {
    fail(`live /version world_id (${live.world_id || "missing"}) does not match live /ready world.world_id (${ready.world_id})`);
  }
  const sourceCommit = validateSourceCommit(options.sourceCommit);
  const fetchedAt = new Date(options.fetchedAt || new Date()).toISOString();
  const evidenceUrl = options.evidenceUrl || DEFAULT_VERSION_URL;
  const previousWorkerVersionId = compat.hosted_live.worker_version_id || null;

  const next = structuredClone(compat);
  next.hosted_live.worker_version_id = live.worker_version_id;
  next.hosted_live.source_commit = sourceCommit;
  next.hosted_live.deployed_at = live.deployed_at;
  next.hosted_live.version_evidence = {
    url: evidenceUrl,
    fetched_at: fetchedAt,
    worker_version_id: live.worker_version_id,
    deployed_at: live.deployed_at,
    source_commit: sourceCommit,
    world_id: ready.world_id,
    genesis_id: ready.genesis_id,
    env: live.env,
    protocol_version: live.protocol_version,
  };
  next.hosted_live.note =
    `Production PLAY default. Worker ${live.worker_version_id} published ${live.deployed_at}, ` +
    `READ from GET /version after successful production deployment of source commit ${sourceCommit}. ` +
    `Generated post-deploy pin PR evidence fetched ${fetchedAt} from ${evidenceUrl}; ` +
    `world_id ${ready.world_id} and Genesis ${ready.genesis_id} were derived from live /version + /ready. ` +
    `Prior worker_version_id was ${previousWorkerVersionId || "unknown"}. ` +
    `A new worker_version_id does not imply a Specs pin change; specs_git remains the live build's Specs alignment unless changed by the deployed source. ` +
    `Prior PLAY world.perihelion-reach-2 / genesis.dbeb43d198ce81b1 is not reseeding. Frozen first world remains genesis.ef578f4ffceeccd0 on world-01 (operator-only).`;

  validatePinEqualsLive(next, live);
  return { compat: next, live, ready, sourceCommit, previousWorkerVersionId, fetchedAt, evidenceUrl, expectedWorkerVersionId };
}

export function validatePinEqualsLive(compat, liveInput) {
  const live = normalizeLiveVersion(liveInput);
  const pinned = compat?.hosted_live?.worker_version_id;
  if (pinned !== live.worker_version_id) {
    fail(
      `hosted_live.worker_version_id (${pinned || "missing"}) does not match live /version (${live.worker_version_id})`,
    );
  }
  return true;
}

export function pullRequestBody(result) {
  const evidence = result.live;
  return [
    "## Post-deployment Worker pin update",
    "",
    "This PR was generated only after `npm run deploy` completed successfully in the production deployment workflow. It does not write to `main` directly.",
    "",
    "### Live `/version` evidence",
    "",
    `- Evidence URL: ${result.evidenceUrl}`,
    `- Fetched at: ${result.fetchedAt}`,
    `- Worker version id: ${evidence.worker_version_id}`,
    `- Deployed at: ${evidence.deployed_at}`,
    `- Source commit deployed by workflow: ${result.sourceCommit}`,
    `- Wrangler deployment output Worker version id: ${result.expectedWorkerVersionId}`,
    `- World id: ${result.ready.world_id}`,
    `- Genesis id: ${result.ready.genesis_id}`,
    evidence.env ? `- Environment: ${evidence.env}` : null,
    evidence.protocol_version ? `- Protocol version: ${evidence.protocol_version}` : null,
    "",
    "### Validation",
    "",
    "- `spec-compat.json hosted_live.worker_version_id` was updated from live `/version` evidence.",
    "- The workflow re-runs the pin validator after the edit, rejecting stale live `/version` responses, live/pin mismatch, and `/version` vs `/ready` world mismatch before opening or updating the PR.",
    "- Scheduled `pin-currency` drift monitoring is preserved as an independent monitor.",
    "- CODEOWNERS review protection is preserved because this is a normal pull request.",
    "",
    "Closes #554 when merged.",
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const opts = { command };
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (!arg.startsWith("--")) fail(`unexpected positional argument: ${arg}`);
    const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value = rest[i + 1];
    if (!value || value.startsWith("--")) fail(`missing value for ${arg}`);
    opts[key] = value;
    i += 1;
  }
  return opts;
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function runCli(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  if (opts.command !== "generate" && opts.command !== "validate" && opts.command !== "extract-wrangler-version") {
    fail("usage: worker-pin-pr.mjs <generate|validate|extract-wrangler-version> --compat spec-compat.json --live live-version.json --ready ready.json --expected-worker-version-id UUID [--source-commit SHA] [--body-output file]");
  }
  if (opts.command === "extract-wrangler-version") {
    if (!opts.deployOutput) fail("--deploy-output is required");
    const versionId = extractWranglerVersionId(fs.readFileSync(path.resolve(opts.deployOutput), "utf8"));
    console.log(versionId);
    return { ok: true, worker_version_id: versionId };
  }
  if (!opts.compat) fail("--compat is required");
  if (!opts.live) fail("--live is required");

  const compatPath = path.resolve(opts.compat);
  const livePath = path.resolve(opts.live);
  const compat = readJsonFile(compatPath);
  const live = normalizeLiveVersion(readJsonFile(livePath));
  if (!opts.ready) fail("--ready is required");
  if (!opts.expectedWorkerVersionId) fail("--expected-worker-version-id is required");
  const ready = normalizeReady(readJsonFile(path.resolve(opts.ready)));

  if (opts.command === "validate") {
    validatePinEqualsLive(compat, live);
    if (live.worker_version_id.toLowerCase() !== String(opts.expectedWorkerVersionId).trim().toLowerCase()) fail("live /version does not match expected Wrangler worker version id");
    if (live.world_id !== ready.world_id) fail("live /version world_id does not match live /ready world.world_id");
    console.log(`Pin matches live Worker ${live.worker_version_id}`);
    return { ok: true, live, ready };
  }

  const result = updateHostedLivePin(compat, {
    live,
    ready,
    sourceCommit: opts.sourceCommit,
    expectedWorkerVersionId: opts.expectedWorkerVersionId,
    evidenceUrl: opts.evidenceUrl || DEFAULT_VERSION_URL,
    fetchedAt: opts.fetchedAt,
  });
  writeJsonFile(compatPath, result.compat);
  if (opts.bodyOutput) {
    fs.writeFileSync(path.resolve(opts.bodyOutput), pullRequestBody(result), "utf8");
  }
  console.log(`Updated hosted_live.worker_version_id ${result.previousWorkerVersionId || "<unset>"} -> ${result.live.worker_version_id}`);
  return result;
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  try {
    runCli();
  } catch (error) {
    console.error(error?.message || error);
    process.exit(1);
  }
}
