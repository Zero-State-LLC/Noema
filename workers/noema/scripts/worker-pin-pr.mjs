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
    world_id: live.world_id || next.hosted_live.world_id,
    env: live.env,
    protocol_version: live.protocol_version,
  };
  next.hosted_live.note =
    `Production PLAY default. Worker ${live.worker_version_id} published ${live.deployed_at}, ` +
    `READ from GET /version after successful production deployment of source commit ${sourceCommit}. ` +
    `Generated post-deploy pin PR evidence fetched ${fetchedAt} from ${evidenceUrl}. ` +
    `Prior worker_version_id was ${previousWorkerVersionId || "unknown"}. ` +
    `A new worker_version_id does not imply a Specs pin change; specs_git remains the live build's Specs alignment unless changed by the deployed source. ` +
    `Prior PLAY world.perihelion-reach-2 / genesis.dbeb43d198ce81b1 is not reseeding. Frozen first world remains genesis.ef578f4ffceeccd0 on world-01 (operator-only).`;

  validatePinEqualsLive(next, live);
  return { compat: next, live, sourceCommit, previousWorkerVersionId, fetchedAt, evidenceUrl };
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
    evidence.world_id ? `- World id: ${evidence.world_id}` : null,
    evidence.env ? `- Environment: ${evidence.env}` : null,
    evidence.protocol_version ? `- Protocol version: ${evidence.protocol_version}` : null,
    "",
    "### Validation",
    "",
    "- `spec-compat.json hosted_live.worker_version_id` was updated from live `/version` evidence.",
    "- The workflow re-runs the pin validator after the edit, rejecting live/pin mismatch before opening or updating the PR.",
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
  if (opts.command !== "generate" && opts.command !== "validate") {
    fail("usage: worker-pin-pr.mjs <generate|validate> --compat spec-compat.json --live live-version.json [--source-commit SHA] [--body-output file]");
  }
  if (!opts.compat) fail("--compat is required");
  if (!opts.live) fail("--live is required");

  const compatPath = path.resolve(opts.compat);
  const livePath = path.resolve(opts.live);
  const compat = readJsonFile(compatPath);
  const live = normalizeLiveVersion(readJsonFile(livePath));

  if (opts.command === "validate") {
    validatePinEqualsLive(compat, live);
    console.log(`Pin matches live Worker ${live.worker_version_id}`);
    return { ok: true, live };
  }

  const result = updateHostedLivePin(compat, {
    live,
    sourceCommit: opts.sourceCommit,
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
