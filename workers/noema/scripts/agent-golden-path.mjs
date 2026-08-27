#!/usr/bin/env node
/**
 * Golden path over POST /v1/command only (not the operator test-world door).
 * Isolated: ENTER → LOOK → MOVE (+ INSPECT if a site exists). Dual-auth + seal carried.
 * Live: LOOK with X-Noema-Seal and no Admin header.
 * Token never printed.
 */
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { admitConformanceBase, admitConformanceWorld } from "./hosted-conformance.mjs";
import { loadOperatorEnv, parseOperatorEnv, resolveAdminMaterial } from "./operator-env.mjs";
import { readFileSync, statSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_BASE = "https://noema-gateway.zer0state-noema.workers.dev";
const DEFAULT_WORLD = "test.hosted-canonical.ack-s3";
export const LIVE_SEAL = "sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395";

async function json(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { parse_error: true, bytes: text.length };
  }
}

function loadTesterToken() {
  const p = join(homedir(), ".config/noema/tester.env");
  try {
    if (!statSync(p).isFile()) return "";
    return parseOperatorEnv(readFileSync(p, "utf8")).NOEMA_TOKEN || "";
  } catch {
    return "";
  }
}

/** PLAY command path. Isolated still sends the seal; live LOOK never sends Admin. */
async function command(base, opts) {
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${opts.token}`,
    "X-Noema-Seal": LIVE_SEAL,
  };
  if (opts.adminJwt) headers["X-Noema-Admin-Token"] = opts.adminJwt;
  const body = {
    request_id: opts.request_id,
    command: opts.command,
    arguments: opts.arguments || {},
  };
  if (opts.world_id) body.world_id = opts.world_id;
  const res = await fetch(`${base}/v1/command`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const payload = await json(res);
  return {
    http: res.status,
    ok: res.status === 200 && payload.ok === true,
    error: payload.error || null,
    body: payload,
    used_command_path: "/v1/command",
    sent_seal: true,
    sent_admin: Boolean(opts.adminJwt),
  };
}

async function mintAgent(base, adminJwt, handle) {
  const minted = await fetch(`${base}/v1/admin/controller-token`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminJwt}` },
    body: JSON.stringify({ handle, controller_type: "agent", expires_in: 1800 }),
  });
  const mintedBody = await json(minted);
  if (minted.status !== 200 || !mintedBody.access_token) {
    return { ok: false, http: minted.status };
  }
  return { ok: true, token: mintedBody.access_token };
}

async function adminSession(base, material, loaded) {
  const raw = process.env.ADMIN_TOKEN || process.env.ADMIN_OPERATOR_TOKEN
    || loaded.values.ADMIN_TOKEN || loaded.values.ADMIN_OPERATOR_TOKEN;
  if (material.kind === "admin_jwt") return raw;
  const sess = await fetch(`${base}/v1/admin/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ admin_token: raw }),
  });
  const sessBody = await json(sess);
  return sess.status === 200 ? sessBody.access_token || "" : "";
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
  const adminJwt = await adminSession(base, material, loaded);
  if (!adminJwt) {
    console.log(JSON.stringify({ ok: false, code: "ADMIN_SESSION_FAILED" }));
    process.exit(1);
  }
  const minted = await mintAgent(base, adminJwt, "gold-cmd");
  if (!minted.ok) {
    console.log(JSON.stringify({ ok: false, code: "PLAYER_MINT_FAILED", http: minted.http }));
    process.exit(1);
  }
  const agentTok = minted.token;
  const isolated = (commandName, extra = {}) =>
    command(base, {
      token: agentTok,
      adminJwt,
      world_id,
      command: commandName,
      request_id: `gold-${commandName}-${Date.now()}`,
      arguments: extra.arguments,
    });

  const enter = await isolated("ENTER_WORLD");
  const look = await isolated("LOOK");
  const loc = look.body?.observation?.location || enter.body?.observation?.location || {};
  const exits = Array.isArray(loc.exits) ? loc.exits : [];
  const ents = Array.isArray(loc.entities) ? loc.entities : [];
  const dir = exits.find((e) => e && e.direction)?.direction;
  const entity_id = ents.find((e) => e && e.entity_id)?.entity_id;
  const move = dir
    ? await isolated("MOVE", { arguments: { direction: dir } })
    : { http: 0, ok: false, error: { code: "NO_PUBLIC_EXIT" }, body: {}, used_command_path: "/v1/command", sent_seal: true, sent_admin: true };
  const inspect = entity_id
    ? await isolated("INSPECT", { arguments: { entity_id } })
    : { http: 0, ok: false, error: { code: "NO_COLOCATED_ENTITY" }, skipped: true };

  const liveTok = loadTesterToken() || agentTok;
  const liveEnter = await command(base, {
    token: liveTok,
    command: "ENTER_WORLD",
    request_id: `gold-live-enter-${Date.now()}`,
  });
  const liveLook = await command(base, {
    token: liveTok,
    command: "LOOK",
    request_id: `gold-live-look-${Date.now()}`,
  });
  const liveLeave = await command(base, {
    token: liveTok,
    command: "LEAVE_WORLD",
    request_id: `gold-live-leave-${Date.now()}`,
  });

  const afterMove = move.body?.observation?.location?.room_id || null;
  const beforeMove = loc.room_id || null;
  const isolatedOk = enter.ok && look.ok && (dir ? move.ok && afterMove && afterMove !== beforeMove : true);
  const liveOk = liveLook.ok && liveLook.sent_seal && !liveLook.sent_admin;
  console.log(JSON.stringify({
    ok: isolatedOk && liveOk,
    path: "/v1/command",
    seal: LIVE_SEAL,
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
    isolated_used_admin: true,
    isolated_sent_seal: true,
    live_enter_http: liveEnter.http,
    live_look_http: liveLook.http,
    live_look_ok: liveLook.ok,
    live_look_code: liveLook.error?.code || null,
    live_look_room: liveLook.body?.observation?.location?.name || liveLook.body?.observation?.location?.room_id || null,
    live_leave_http: liveLeave.http,
    live_look_sent_admin: liveLook.sent_admin,
    live_look_sent_seal: liveLook.sent_seal,
  }));
  process.exit(isolatedOk && liveOk ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
