#!/usr/bin/env node
/**
 * One live Perihelion ATTEST from LOOK fields.
 * Requires NOEMA_LIVE_TENANT=1. Never reseeds. Never uses the test-world door.
 */
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readFileSync, statSync } from "node:fs";
import { loadOperatorEnv, parseOperatorEnv, resolveAdminMaterial } from "./operator-env.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const LIVE_BASE = process.env.BASE || "https://noema-gateway.zer0state-noema.workers.dev";
const LIVE_SEAL = "sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395";
const MAX_LOOKS = 16;
const REV = { north: "south", south: "north", east: "west", west: "east", up: "down", down: "up", in: "out", out: "in" };

async function json(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { parse_error: true, bytes: text.length };
  }
}

function liveOn() {
  const v = String(process.env.NOEMA_LIVE_TENANT || "").trim();
  return v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "yes";
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

async function command(base, token, commandName, args = {}) {
  const res = await fetch(`${base}/v1/command`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      "X-Noema-Seal": LIVE_SEAL,
    },
    body: JSON.stringify({
      request_id: `live-attest-${commandName}-${Date.now()}`,
      idempotency_key: `idem-live-attest-${commandName}-${Date.now()}`,
      command: commandName,
      arguments: args,
    }),
  });
  return { http: res.status, body: await json(res) };
}

async function main() {
  if (!liveOn()) {
    console.log(JSON.stringify({
      ok: false,
      code: "LIVE_TENANT_REQUIRED",
      message: "Perihelion ATTEST requires NOEMA_LIVE_TENANT=1",
    }));
    process.exit(2);
  }
  const ready = await json(await fetch("https://noema.guru/ready"));
  const genesis_before = ready?.world?.genesis_id || null;
  const loaded = loadOperatorEnv(join(HERE, ".."));
  const material = resolveAdminMaterial(process.env, loaded.values);
  let token = "";
  if (material.present && material.ok) {
    const raw = process.env.ADMIN_TOKEN || process.env.ADMIN_OPERATOR_TOKEN
      || loaded.values.ADMIN_TOKEN || loaded.values.ADMIN_OPERATOR_TOKEN;
    let adminJwt = material.kind === "admin_jwt" ? raw : "";
    if (material.kind === "operator_secret") {
      const sess = await fetch(`${LIVE_BASE}/v1/admin/session`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ admin_token: raw }),
      });
      const sessBody = await json(sess);
      adminJwt = sessBody.access_token || "";
    }
    if (adminJwt) {
      const minted = await fetch(`${LIVE_BASE}/v1/admin/controller-token`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${adminJwt}` },
        body: JSON.stringify({ handle: `attest-live-${Date.now().toString(36)}`, controller_type: "agent", expires_in: 1800 }),
      });
      const mintedBody = await json(minted);
      token = mintedBody.access_token || "";
    }
  }
  if (!token) {
    console.log(JSON.stringify({ ok: false, code: "PLAYER_TOKEN_REQUIRED", genesis_before }));
    process.exit(2);
  }
  const enter = await command(LIVE_BASE, token, "ENTER_WORLD");
  const visited = new Set();
  const trail = [];
  const seen = [];
  let looks = 0;
  let hit = null;
  let look = await command(LIVE_BASE, token, "LOOK");
  const enter_code = enter.body?.error?.code || null;
  const look_code = look.body?.error?.code || null;
  while (looks < MAX_LOOKS) {
    looks += 1;
    const loc = look.body?.observation?.location || {};
    const room_id = loc.room_id || `unknown.${looks}`;
    visited.add(room_id);
    const ents = Array.isArray(loc.entities) ? loc.entities : [];
    const entBits = ents.map((e) => `${e.entity_type || "?"}:${e.entity_id || e.label || "?"}`).join(",");
    seen.push(`${loc.name || room_id}${entBits ? `[${entBits}]` : ""}`);
    hit = (look.body?.observation?.affordances || []).find(
      (x) => x && x.operation === "ATTEST" && x.target_id && x.subject_id && x.archive_claim,
    );
    if (hit) break;
    const exits = Array.isArray(loc.exits) ? loc.exits : [];
    const next = exits.find((e) => e && e.to_room_id && !visited.has(e.to_room_id));
    if (next?.direction) {
      const moved = await command(LIVE_BASE, token, "MOVE", { direction: next.direction });
      if (!moved.body?.ok) break;
      trail.push(next.direction);
      look = await command(LIVE_BASE, token, "LOOK");
      continue;
    }
    const back = trail.pop();
    if (!back) break;
    const rev = REV[back];
    if (!rev) break;
    const moved = await command(LIVE_BASE, token, "MOVE", { direction: rev });
    if (!moved.body?.ok) break;
    look = await command(LIVE_BASE, token, "LOOK");
  }
  let attest = { http: 0, body: { ok: false, error: { code: "NO_ATTEST_AFFORDANCE" } } };
  if (hit) {
    attest = await command(LIVE_BASE, token, "COMMIT", {
      operation: "ATTEST",
      entity_id: hit.target_id,
      subject_id: hit.subject_id,
      archive_claim: hit.archive_claim,
    });
  }
  await command(LIVE_BASE, token, "LEAVE_WORLD");
  const readyAfter = await json(await fetch("https://noema.guru/ready"));
  const genesis_after = readyAfter?.world?.genesis_id || null;
  const ok = Boolean(enter.body?.ok) && Boolean(hit) && Boolean(attest.body?.ok)
    && genesis_before && genesis_before === genesis_after;
  console.log(JSON.stringify({
    ok,
    live: true,
    enter_http: enter.http,
    enter_ok: Boolean(enter.body?.ok),
    enter_code,
    look_http: look.http,
    look_ok: Boolean(look.body?.ok),
    look_code,
    rooms_walked: looks,
    path: seen,
    room: look.body?.observation?.location?.name || look.body?.observation?.location?.room_id || null,
    target_id: hit?.target_id || null,
    subject_id: hit?.subject_id || null,
    archive_claim: hit?.archive_claim || null,
    attest_http: attest.http,
    attest_ok: Boolean(attest.body?.ok),
    attest_code: attest.body?.error?.code || null,
    genesis_before,
    genesis_after,
    reseeded: genesis_before !== genesis_after,
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
