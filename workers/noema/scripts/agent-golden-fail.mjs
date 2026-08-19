#!/usr/bin/env node
/**
 * Failure path: missing token, bad seal on live /v1/command, invalid MOVE on isolated.
 * Bad-seal POST never mutates: Worker rejects before route.
 */
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { admitConformanceBase, admitConformanceWorld } from "./hosted-conformance.mjs";
import { loadOperatorEnv, resolveAdminMaterial } from "./operator-env.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_BASE = "https://noema-gateway.zer0state-noema.workers.dev";
const DEFAULT_WORLD = "test.hosted-canonical.ack-s3";
const BAD_SEAL = "sha256:0000000000000000000000000000000000000000000000000000000000000000";

async function json(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { parse_error: true };
  }
}

async function main() {
  const loaded = loadOperatorEnv(join(HERE, ".."));
  const material = resolveAdminMaterial(process.env, loaded.values);
  const baseGate = admitConformanceBase(process.env.BASE || DEFAULT_BASE);
  if (!baseGate.ok) {
    console.error(baseGate.message);
    process.exit(2);
  }
  const base = baseGate.base;

  const missing = await fetch(`${base}/v1/command`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ request_id: "fail-no-token", command: "LOOK" }),
  });
  const missingBody = await json(missing);

  let sealHttp = 0;
  let sealCode = null;
  if (material.present && material.ok) {
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
      adminJwt = sessBody.access_token || "";
    }
    if (adminJwt) {
      const minted = await fetch(`${base}/v1/admin/controller-token`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${adminJwt}` },
        body: JSON.stringify({ handle: "gold-fail", controller_type: "agent", expires_in: 600 }),
      });
      const mintedBody = await json(minted);
      if (mintedBody.access_token) {
        const bad = await fetch(`${base}/v1/command`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${mintedBody.access_token}`,
            "X-Noema-Seal": BAD_SEAL,
          },
          body: JSON.stringify({ request_id: "fail-bad-seal", command: "LOOK" }),
        });
        const badBody = await json(bad);
        sealHttp = bad.status;
        sealCode = badBody.error?.code || null;
      }
    }
  }

  const worldGate = admitConformanceWorld(process.env.WORLD_ID || DEFAULT_WORLD);
  let moveHttp = 0;
  let moveCode = null;
  if (material.present && material.ok && worldGate.ok) {
    const raw = process.env.ADMIN_TOKEN || process.env.ADMIN_OPERATOR_TOKEN
      || loaded.values.ADMIN_TOKEN || loaded.values.ADMIN_OPERATOR_TOKEN;
    let adminJwt = material.kind === "admin_jwt" ? raw : "";
    if (material.kind === "operator_secret") {
      const sess = await fetch(`${base}/v1/admin/session`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ admin_token: raw }),
      });
      adminJwt = (await json(sess)).access_token || "";
    }
    const minted = await fetch(`${base}/v1/admin/controller-token`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminJwt}` },
      body: JSON.stringify({ handle: "gold-fail-move", controller_type: "agent", expires_in: 600 }),
    });
    const playerJwt = (await json(minted)).access_token;
    if (playerJwt) {
      await fetch(`${base}/v1/operator/test-world/command`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${playerJwt}`,
          "X-Noema-Admin-Token": adminJwt,
        },
        body: JSON.stringify({
          world_id: worldGate.world_id,
          request_id: "fail-enter",
          command: "ENTER_WORLD",
        }),
      });
      const badMove = await fetch(`${base}/v1/operator/test-world/command`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${playerJwt}`,
          "X-Noema-Admin-Token": adminJwt,
        },
        body: JSON.stringify({
          world_id: worldGate.world_id,
          request_id: "fail-move",
          command: "MOVE",
          arguments: { direction: "no-such-exit" },
        }),
      });
      const mv = await json(badMove);
      moveHttp = badMove.status;
      moveCode = mv.error?.code || null;
    }
  }

  const missingOk = missing.status === 401;
  const sealOk = sealHttp === 401 && (sealCode === "SEAL_MISMATCH" || sealCode === "SEAL_REQUIRED");
  const moveOk = moveHttp === 400 || moveHttp === 409 || (moveHttp === 200 && moveCode);
  console.log(JSON.stringify({
    ok: missingOk && sealOk && moveOk,
    missing_token_http: missing.status,
    missing_token_code: missingBody.error?.code || null,
    bad_seal_http: sealHttp,
    bad_seal_code: sealCode,
    invalid_move_http: moveHttp,
    invalid_move_code: moveCode,
    live_seal_not_used: BAD_SEAL !== "sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395",
  }));
  process.exit(missingOk && sealOk && moveOk ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
