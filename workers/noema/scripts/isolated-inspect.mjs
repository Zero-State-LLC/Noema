#!/usr/bin/env node
/**
 * Isolated hosted INSPECT on test.hosted-canonical.inspect-s0
 * Loads ~/.config/noema/operator.env (never prints values).
 * Refuses noema.guru and Perihelion.
 * ack-s3 may lack way-lamp; this script uses inspect-s0.
 */
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { admitConformanceBase, admitConformanceWorld } from "./hosted-conformance.mjs";
import { loadOperatorEnv, resolveAdminMaterial } from "./operator-env.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_BASE = "https://noema-gateway.zer0state-noema.workers.dev";
const DEFAULT_WORLD = "test.hosted-canonical.inspect-s0";
const FALLBACK_ENTITY = "entity.way-lamp";

async function json(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { parse_error: true, bytes: text.length };
  }
}

function colocatedEntityIds(body) {
  const entities = body?.observation?.location?.entities;
  if (!Array.isArray(entities)) return [];
  return entities.map((e) => e && e.entity_id).filter((id) => typeof id === "string" && id);
}

async function main() {
  const loaded = loadOperatorEnv(join(HERE, ".."));
  const material = resolveAdminMaterial(process.env, loaded.values);
  if (!material.present || !material.ok) {
    console.log(JSON.stringify({
      ok: false,
      code: "UNCONFIGURED",
      message: "Put ADMIN_OPERATOR_TOKEN in ~/.config/noema/operator.env (chmod 600). Do not paste it in chat.",
      hint: "workers/noema/scripts/capture-operator-token.sh",
      loaded_files: loaded.loaded.map((f) => ({ path: f.path, keys: f.keys, mode: f.mode.toString(8) })),
    }));
    process.exit(2);
  }

  const baseGate = admitConformanceBase(process.env.BASE || DEFAULT_BASE);
  if (!baseGate.ok) {
    console.error(`error: ${baseGate.message}`);
    process.exit(2);
  }
  const worldGate = admitConformanceWorld(process.env.WORLD_ID || DEFAULT_WORLD);
  if (!worldGate.ok) {
    console.error(`error: ${worldGate.message}`);
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
      console.log(JSON.stringify({
        ok: false,
        code: "ADMIN_SESSION_FAILED",
        http: sess.status,
        err: sessBody.error || null,
      }));
      process.exit(1);
    }
    adminJwt = sessBody.access_token;
  }

  const minted = await fetch(`${base}/v1/admin/controller-token`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${adminJwt}`,
    },
    body: JSON.stringify({ handle: "inspect-s0", controller_type: "agent", expires_in: 1800 }),
  });
  const mintedBody = await json(minted);
  if (minted.status !== 200 || !mintedBody.access_token) {
    console.log(JSON.stringify({
      ok: false,
      code: "PLAYER_MINT_FAILED",
      http: minted.status,
      err: mintedBody.error || null,
    }));
    process.exit(1);
  }
  const playerJwt = mintedBody.access_token;

  const dualAuth = {
    "content-type": "application/json",
    authorization: `Bearer ${playerJwt}`,
    "X-Noema-Admin-Token": adminJwt,
  };

  const enter = await fetch(`${base}/v1/operator/test-world/command`, {
    method: "POST",
    headers: dualAuth,
    body: JSON.stringify({
      world_id,
      request_id: `inspect-enter-${Date.now()}`,
      idempotency_key: `idem-inspect-enter-${world_id}-${Date.now()}`,
      command: "ENTER_WORLD",
      arguments: {},
    }),
  });
  const enterBody = await json(enter);

  const look = await fetch(`${base}/v1/operator/test-world/command`, {
    method: "POST",
    headers: dualAuth,
    body: JSON.stringify({
      world_id,
      request_id: `inspect-look-${Date.now()}`,
      idempotency_key: `idem-inspect-look-${world_id}-${Date.now()}`,
      command: "LOOK",
      arguments: {},
    }),
  });
  const lookBody = await json(look);
  const lookEntities = colocatedEntityIds(lookBody);
  const from_room = lookBody?.observation?.location?.room_id
    || enterBody?.observation?.location?.room_id
    || null;
  const inspect_entity = lookEntities[0] || FALLBACK_ENTITY;

  const inspect = await fetch(`${base}/v1/operator/test-world/command`, {
    method: "POST",
    headers: dualAuth,
    body: JSON.stringify({
      world_id,
      request_id: `inspect-entity-${Date.now()}`,
      idempotency_key: `idem-inspect-entity-${world_id}-${Date.now()}`,
      command: "INSPECT",
      arguments: { entity_id: inspect_entity },
    }),
  });
  const inspectBody = await json(inspect);

  const perihelionDenied = await fetch(`${base}/v1/operator/test-world/command`, {
    method: "POST",
    headers: dualAuth,
    body: JSON.stringify({
      world_id: "world.perihelion-reach",
      request_id: "inspect-peri-deny",
      command: "LOOK",
      arguments: {},
    }),
  });

  const ok = enter.status === 200 && enterBody.ok === true
    && inspect.status === 200 && inspectBody.ok === true
    && perihelionDenied.status === 403;
  console.log(JSON.stringify({
    ok,
    world_id,
    enter_http: enter.status,
    look_http: look.status,
    inspect_http: inspect.status,
    inspect_entity,
    perihelion_test_world_http: perihelionDenied.status,
    from_room,
  }));
  process.exit(ok ? 0 : 1);
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
