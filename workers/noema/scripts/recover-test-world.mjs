#!/usr/bin/env node
/**
 * Recover one test.hosted-canonical.* DO. Never Perihelion.
 * Loads ~/.config/noema/operator.env. Never prints secrets.
 */
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { admitConformanceBase, admitConformanceWorld } from "./hosted-conformance.mjs";
import { loadOperatorEnv, resolveAdminMaterial } from "./operator-env.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_BASE = "https://noema-gateway.zer0state-noema.workers.dev";

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
    console.log(JSON.stringify({ ok: false, code: "UNCONFIGURED" }));
    process.exit(2);
  }
  const baseGate = admitConformanceBase(process.env.BASE || DEFAULT_BASE);
  const worldGate = admitConformanceWorld(process.env.WORLD_ID || "");
  if (!baseGate.ok || !worldGate.ok) {
    console.error(baseGate.ok ? worldGate.message : baseGate.message);
    process.exit(2);
  }
  const raw = process.env.ADMIN_TOKEN || process.env.ADMIN_OPERATOR_TOKEN
    || loaded.values.ADMIN_TOKEN || loaded.values.ADMIN_OPERATOR_TOKEN;
  let adminJwt = material.kind === "admin_jwt" ? raw : "";
  if (material.kind === "operator_secret") {
    const sess = await fetch(`${baseGate.base}/v1/admin/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ admin_token: raw }),
    });
    const body = await json(sess);
    if (!body.access_token) {
      console.log(JSON.stringify({ ok: false, code: "ADMIN_SESSION_FAILED", http: sess.status }));
      process.exit(1);
    }
    adminJwt = body.access_token;
  }
  const minted = await fetch(`${baseGate.base}/v1/admin/controller-token`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminJwt}` },
    body: JSON.stringify({ handle: "ack-rec", controller_type: "agent", expires_in: 900 }),
  });
  const player = await json(minted);
  if (!player.access_token) {
    console.log(JSON.stringify({ ok: false, code: "PLAYER_MINT_FAILED", http: minted.status }));
    process.exit(1);
  }
  const rec = await fetch(`${baseGate.base}/v1/operator/test-world/lifecycle`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${player.access_token}`,
      "X-Noema-Admin-Token": adminJwt,
    },
    body: JSON.stringify({ world_id: worldGate.world_id, action: "recover" }),
  });
  const recBody = await json(rec);
  const safe = { ...recBody };
  delete safe.access_token;
  console.log(JSON.stringify({
    ok: rec.status === 200 && recBody.ok === true,
    http: rec.status,
    world_id: worldGate.world_id,
    recover: safe,
  }));
  process.exit(rec.status === 200 && recBody.ok === true ? 0 : 1);
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
