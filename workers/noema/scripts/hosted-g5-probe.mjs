#!/usr/bin/env node
/** Admission and raw WATCH activity only, not hosted G5 acceptance proof. */
import { pathToFileURL } from "node:url";
import { admitConformanceBase, admitConformanceWorld } from "./hosted-conformance.mjs";

const WAIT_CAP_MS = 60_000;
const REQUEST_MS = 5_000;
const BODY_CAP = 64 * 1024;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const head = (value) => Number.isSafeInteger(value) && value >= 0;

// Transport/time injection is for synthetic controls, never hosted proof.
export async function main({ env = process.env, transport = globalThis.fetch, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
  const report = {
    status: "NOT_COMPUTABLE",
    alarm: "not_observed",
    alarm_reason: "Causal attribution unavailable: WATCH counter growth does not identify an alarm fire or settlement.",
    alarm_after_evict: "not_run",
    hibernated: "not_run",
  };
  const refuse = (reason) => ({ code: 2, report: { ...report, reason } });
  const required = ["BASE", "WORLD_ID", "PLAYER_TOKEN", "ADMIN_TOKEN", "SEAL"];
  if (required.some((key) => typeof env[key] !== "string" || !env[key].trim())) {
    return refuse("Explicit nonblank BASE, WORLD_ID and all three credentials are required.");
  }
  if (env.WS_URL !== undefined || env.G5_HIBERNATION_WAIT_MS !== undefined) {
    return refuse("WebSocket and hibernation configuration is unsupported.");
  }
  let base;
  try {
    const url = new URL(env.BASE.trim());
    if (!/^https?:\/\/[^/?#\\]+\/?$/i.test(env.BASE.trim()) || url.hostname.endsWith(".") || !["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error();
    if (!admitConformanceBase(url.origin).ok) throw new Error();
    base = url.origin;
  } catch { return refuse("BASE is not an admitted isolated HTTP(S) origin."); }
  const world = admitConformanceWorld(env.WORLD_ID);
  if (!world.ok || world.world_id === "test.hosted-canonical.") return refuse("WORLD_ID is not an admitted isolated world.");
  const world_id = world.world_id;
  const waitMs = env.G5_WAIT_MS === undefined ? 25_000 : Number(env.G5_WAIT_MS);
  if (!/^\d+$/.test(String(env.G5_WAIT_MS ?? 25_000)) || !Number.isSafeInteger(waitMs) || waitMs < 0 || waitMs > WAIT_CAP_MS) return refuse("Wait must be an integer from 0 through 60000 milliseconds.");

  async function request(path, init = {}) {
    const controller = new AbortController();
    let timer;
    // The deadline covers headers and the complete bounded body, including injected transports.
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error()); }, REQUEST_MS);
    });
    try {
      return await Promise.race([deadline, (async () => {
        const response = await transport(`${base}${path}`, { ...init, redirect: "error", signal: controller.signal });
        if (!response.ok || response.redirected) throw new Error();
        const length = response.headers.get("content-length");
        if (length !== null && (!/^\d+$/.test(length) || Number(length) > BODY_CAP)) throw new Error();
        if (!response.body) throw new Error();
        const reader = response.body.getReader();
        const chunks = [];
        let size = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > BODY_CAP) throw new Error();
            chunks.push(value);
          }
        } finally { void reader.cancel().catch(() => {}); }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
        return { status: response.status, json: JSON.parse(new TextDecoder().decode(bytes)) };
      })()]);
    } finally { clearTimeout(timer); controller.abort(); }
  }
  async function watch() {
    const { status, json } = await request("/v1/watch/live");
    if (!object(json) || json.world_id !== world_id || json.freshness !== "live" || json.pin !== "watch-live/1.0" || !head(json.sequence) || !head(json.cycle)) throw new Error();
    return { status, world_id, sequence: json.sequence, cycle: json.cycle };
  }
  try {
    const before = await watch();
    const pin = await request("/v1/operator/test-world/tempo-pin", {
      method: "POST",
      headers: { authorization: `Bearer ${env.PLAYER_TOKEN}`, "x-noema-admin-token": env.ADMIN_TOKEN, "x-noema-seal": env.SEAL, "content-type": "application/json" },
      body: JSON.stringify({ world_id }),
    });
    if (!object(pin.json) || pin.json.ok !== true || pin.json.world_id !== world_id || !object(pin.json.player_tempo)) return refuse("Tempo pin was not confirmed for the requested world.");
    await sleep(waitMs);
    const after = await watch();
    return { code: 0, report: { ...report, status: "RAW_OBSERVATIONS_ONLY", world_id, pin_status: pin.status, pin_has_tempo: true, watch_before: before, watch_after: after, watch_advanced: after.sequence > before.sequence || after.cycle > before.cycle } };
  } catch { return refuse("Request or evidence validation failed. No G5 acceptance conclusion is available."); }
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  main().then(({ code, report }) => {
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = code;
  }).catch(() => {
    console.log(JSON.stringify({ status: "NOT_COMPUTABLE", reason: "Probe failed.", alarm: "not_observed", alarm_after_evict: "not_run", hibernated: "not_run" }));
    process.exitCode = 2;
  });
}
