#!/usr/bin/env node
/**
 * Isolated sealed-style golden path: ENTER → LOOK → MOVE → INSPECT.
 * POST /v1/operator/test-world/command only. Never noema.guru. Never Perihelion.
 * Token never printed.
 */
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { admitConformanceBase, admitConformanceWorld } from "./hosted-conformance.mjs";
import { loadOperatorEnv, resolveAdminMaterial } from "./operator-env.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_BASE = "https://noema-gateway.zer0state-noema.workers.dev";
const DEFAULT_WORLD = "test.hosted-canonical.ack-s3";

async function json(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { parse_error: true, bytes: text.length };
  }
}

async function cmd(base, playerJwt, adminJwt, world_id, command, extra = {}) {
  const res = await fetch(`${base}/v1/operator/test-world/command`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${playerJwt}`,
      "X-Noema-Admin-Token": adminJwt,
    },
    body: JSON.stringify({
      world_id,
      request_id: `gold-${command}-${Date.now()}`,
      command,
      arguments: extra.arguments || {},
    }),
  });
  const body = await json(res);
  return { http: res.status, ok: res.status === 200 && body.ok === true, error: body.error || null, body };
}

async function main() {
  const loaded = loadOperatorEnv(join(HERE, ".."));
  const material = resolveAdminMaterial(process.env, loaded.values);
  if (!material.present || !material.ok) {
    console.log(JSON.stringify({ ok: false, code: "UNCONFIGURED" }));
    process.exit(2);
  }
  const baseGate = admitConformanceBase(process.env.BASE || DEFAULT_BASE);
  const worldGate = admitConformanceWorld(process.env.WORLD_ID || DEFAULT_WORLD);
  if (!baseGate.ok || !worldGate.ok) {
    console.error(baseGate.message || worldGate.message);
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
    body: JSON.stringify({ handle: "gold-path", controller_type: "agent", expires_in: 1800 }),
  });
  const mintedBody = await json(minted);
  if (minted.status !== 200 || !mintedBody.access_token) {
    console.log(JSON.stringify({ ok: false, code: "PLAYER_MINT_FAILED", http: minted.status }));
    process.exit(1);
  }
  const playerJwt = mintedBody.access_token;
  const enter = await cmd(base, playerJwt, adminJwt, world_id, "ENTER_WORLD");
  const look = await cmd(base, playerJwt, adminJwt, world_id, "LOOK");
  const loc = look.body?.observation?.location || enter.body?.observation?.location || {};
  const exits = Array.isArray(loc.exits) ? loc.exits : [];
  const ents = Array.isArray(loc.entities) ? loc.entities : [];
  const dir = exits.find((e) => e && e.direction)?.direction;
  const entity_id = ents.find((e) => e && e.entity_id)?.entity_id;
  const move = dir
    ? await cmd(base, playerJwt, adminJwt, world_id, "MOVE", { arguments: { direction: dir } })
    : { http: 0, ok: false, error: { code: "NO_PUBLIC_EXIT" }, body: {} };
  const inspect = entity_id
    ? await cmd(base, playerJwt, adminJwt, world_id, "INSPECT", { arguments: { entity_id } })
    : { http: 0, ok: false, error: { code: "NO_COLOCATED_ENTITY" }, skipped: true };
  const afterMove = move.body?.observation?.location?.room_id || null;
  const beforeMove = loc.room_id || null;
  console.log(JSON.stringify({
    ok: enter.ok && look.ok && (dir ? move.ok && afterMove && afterMove !== beforeMove : true),
    world_id,
    enter_http: enter.http,
    look_http: look.http,
    move_http: move.http,
    inspect_http: inspect.http,
    inspect_skipped: !entity_id,
    from_room: beforeMove,
    to_room: afterMove,
    move_dir: dir || null,
    settled: Boolean(enter.body?.settled || look.body?.settled || move.body?.settled),
  }));
  process.exit(enter.ok && look.ok && (dir ? move.ok : true) ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
