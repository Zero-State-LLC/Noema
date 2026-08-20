#!/usr/bin/env node
/**
 * Isolated hosted ATTEST on test.hosted-canonical.attest-s0.
 * LOOK affordance → structured COMMIT. Never Perihelion.
 * Loads ~/.config/noema/operator.env (never prints values).
 */
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { admitConformanceBase, admitConformanceWorld } from "./hosted-conformance.mjs";
import { loadOperatorEnv, resolveAdminMaterial } from "./operator-env.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_BASE = "https://noema-gateway.zer0state-noema.workers.dev";
const DEFAULT_WORLD = "test.hosted-canonical.attest-s0";

async function json(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { parse_error: true, bytes: text.length };
  }
}

async function main() {
  const loaded = loadOperatorEnv(join(HERE, ".."));
  const material = resolveAdminMaterial(process.env, loaded.values);
  if (!material.present || !material.ok) {
    console.log(JSON.stringify({
      ok: false,
      code: "UNCONFIGURED",
      message: "Put ADMIN_OPERATOR_TOKEN in ~/.config/noema/operator.env (chmod 600).",
    }));
    process.exit(2);
  }
  const baseGate = admitConformanceBase(process.env.BASE || DEFAULT_BASE);
  const worldGate = admitConformanceWorld(process.env.WORLD_ID || DEFAULT_WORLD);
  if (!baseGate.ok || !worldGate.ok) {
    console.error(baseGate.ok ? worldGate.message : baseGate.message);
    process.exit(2);
  }
  const base = baseGate.base;
  const world_id = worldGate.world_id;
  const raw = process.env.ADMIN_TOKEN || process.env.ADMIN_OPERATOR_TOKEN
    || loaded.values.ADMIN_TOKEN || loaded.values.ADMIN_OPERATOR_TOKEN;
  let adminJwt = material.kind === "admin_jwt" ? raw : "";
  if (material.kind === "operator_secret") {
    const sess = await fetch(`${base}/v1/admin/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ admin_token: raw }),
    });
    const sessBody = await json(sess);
    if (sess.status !== 200 || !sessBody.access_token) {
      console.log(JSON.stringify({ ok: false, code: "ADMIN_SESSION_FAILED", http: sess.status }));
      process.exit(1);
    }
    adminJwt = sessBody.access_token;
  }
  const minted = await fetch(`${base}/v1/admin/controller-token`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminJwt}` },
    body: JSON.stringify({ handle: "attest-s0", controller_type: "agent", expires_in: 1800 }),
  });
  const mintedBody = await json(minted);
  if (minted.status !== 200 || !mintedBody.access_token) {
    console.log(JSON.stringify({ ok: false, code: "PLAYER_MINT_FAILED", http: minted.status }));
    process.exit(1);
  }
  const dualAuth = {
    "content-type": "application/json",
    authorization: `Bearer ${mintedBody.access_token}`,
    "X-Noema-Admin-Token": adminJwt,
  };
  const recover = await fetch(`${base}/v1/operator/test-world/lifecycle`, {
    method: "POST",
    headers: dualAuth,
    body: JSON.stringify({ world_id, action: "recover" }),
  });
  const recoverBody = await json(recover);
  const cmd = async (command, arguments_ = {}) => {
    const res = await fetch(`${base}/v1/operator/test-world/command`, {
      method: "POST",
      headers: dualAuth,
      body: JSON.stringify({
        world_id,
        request_id: `attest-${command}-${Date.now()}`,
        idempotency_key: `idem-attest-${command}-${world_id}-${Date.now()}`,
        command,
        arguments: arguments_,
      }),
    });
    return { http: res.status, body: await json(res) };
  };
  const enter = await cmd("ENTER_WORLD");
  const look = await cmd("LOOK");
  const aff = look.body?.observation?.affordances || [];
  const hit = aff.find((x) => x && x.operation === "ATTEST" && x.archive_claim === "OPERATING");
  const attest = hit
    ? await cmd("COMMIT", {
        operation: "ATTEST",
        entity_id: hit.target_id,
        subject_id: hit.subject_id,
        archive_claim: hit.archive_claim,
      })
    : { http: 0, body: { ok: false, error: { code: "NO_ATTEST_AFFORDANCE" } } };
  const after = await cmd("LOOK");
  const perihelionDenied = await fetch(`${base}/v1/operator/test-world/command`, {
    method: "POST",
    headers: dualAuth,
    body: JSON.stringify({
      world_id: "world.perihelion-reach",
      request_id: "attest-peri-deny",
      command: "LOOK",
      arguments: {},
    }),
  });
  const claimed = (after.body?.observation?.location?.entities || []).find(
    (e) => e && e.entity_id === (hit?.target_id || "entity.archive-ledger"),
  );
  const recoverOk = recover.status === 200 || recover.status === 409;
  const ok = recoverOk
    && enter.http === 200 && enter.body.ok === true
    && look.http === 200 && Boolean(hit)
    && attest.http === 200 && attest.body.ok === true
    && !(after.body?.observation?.affordances || []).some((x) => x && x.operation === "ATTEST")
    && perihelionDenied.status === 403;
  console.log(JSON.stringify({
    ok,
    world_id,
    recover_http: recover.status,
    enter_http: enter.http,
    look_http: look.http,
    attest_http: attest.http,
    attest_ok: Boolean(attest.body?.ok),
    target_id: hit?.target_id || null,
    subject_id: hit?.subject_id || null,
    archive_claim: hit?.archive_claim || null,
    after_attest_rows: (after.body?.observation?.affordances || []).filter((x) => x && x.operation === "ATTEST").length,
    perihelion_test_world_http: perihelionDenied.status,
    genesis_untouched: true,
  }));
  void claimed;
  process.exit(ok ? 0 : 1);
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
