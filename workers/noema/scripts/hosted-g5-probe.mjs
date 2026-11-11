#!/usr/bin/env node
/**
 * #777 hosted tempo-alarm and WebSocket-hibernation probe.
 *
 * Does not default to production. With no isolated BASE this process
 * prints NOT_COMPUTABLE and exits 2. It does not deploy and does not
 * change alarm behavior.
 *
 *   BASE=https://<isolated>.workers.dev \
 *   WORLD_ID=test.hosted-canonical.<suffix> \
 *   PLAYER_TOKEN=… ADMIN_TOKEN=… SEAL=… \
 *   node scripts/hosted-g5-probe.mjs
 *
 * Hibernation is observational. An unset G5_HIBERNATION_WAIT_MS records
 * hibernated: not_run rather than a pass or a fail.
 */
import { pathToFileURL } from "node:url";
import { admitConformanceBase, admitConformanceWorld } from "./hosted-conformance.mjs";

const WAIT_CAP_MS = 60_000;

function notComputable(reason) {
  console.log(JSON.stringify({
    status: "NOT_COMPUTABLE",
    reason,
    alarm: "not_run",
    alarm_after_evict: "not_run",
    hibernated: "not_run",
  }, null, 2));
  process.exit(2);
}

function authHeaders() {
  return {
    authorization: `Bearer ${process.env.PLAYER_TOKEN}`,
    "x-noema-admin-token": process.env.ADMIN_TOKEN,
    "x-noema-seal": process.env.SEAL,
    "content-type": "application/json",
  };
}

async function post(base, path, body) {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: response.status, json };
}

async function watchSequence(base) {
  const response = await fetch(`${base}/v1/watch/live`);
  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = null; }
  const sequence = json && typeof json.sequence === "number" ? json.sequence : null;
  const cycle = json && typeof json.cycle === "number" ? json.cycle : null;
  return { status: response.status, sequence, cycle };
}

export async function main() {
  if (!process.env.BASE || !process.env.PLAYER_TOKEN || !process.env.ADMIN_TOKEN || !process.env.SEAL) {
    notComputable("BASE, PLAYER_TOKEN, ADMIN_TOKEN, and SEAL are required. No production default.");
  }
  const admittedBase = admitConformanceBase(process.env.BASE);
  if (!admittedBase.ok) notComputable(admittedBase.message);
  const admittedWorld = admitConformanceWorld(process.env.WORLD_ID);
  if (!admittedWorld.ok) notComputable(admittedWorld.message);
  const base = admittedBase.base;
  const world_id = admittedWorld.world_id;
  const before = await watchSequence(base);
  const pin = await post(base, "/v1/operator/test-world/tempo-pin", { world_id });
  const waitMs = Math.min(WAIT_CAP_MS, Number(process.env.G5_WAIT_MS || 25_000) || 25_000);
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  const after = await watchSequence(base);
  const advanced = before.sequence != null && after.sequence != null && after.sequence > before.sequence;
  const evict = await post(base, "/v1/operator/test-world/instance", { world_id, action: "evict" });
  let hibernated = "not_run";
  const hibernationWait = Number(process.env.G5_HIBERNATION_WAIT_MS || 0);
  if (process.env.WS_URL && hibernationWait > 0) {
    hibernated = "not_observed";
    const socket = new WebSocket(process.env.WS_URL);
    await new Promise((resolve) => {
      socket.addEventListener("open", () => resolve());
      socket.addEventListener("error", () => resolve());
    });
    await new Promise((resolve) => setTimeout(resolve, Math.min(WAIT_CAP_MS, hibernationWait)));
    const probe = await post(base, "/v1/operator/test-world/instance", { world_id, action: "probe" });
    const instance = probe.json && (probe.json.instance_id || probe.json.instance || null);
    if (instance) hibernated = "observed";
    socket.close();
  }
  console.log(JSON.stringify({
    status: "OBSERVED",
    world_id,
    pin_status: pin.status,
    pin_has_tempo: Boolean(pin.json && pin.json.player_tempo),
    watch_before: before,
    watch_after: after,
    alarm: advanced ? "observed" : "not_observed",
    alarm_after_evict: "not_run",
    evict_status: evict.status,
    hibernated,
  }, null, 2));
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
