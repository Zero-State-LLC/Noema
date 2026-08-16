#!/usr/bin/env node
/**
 * Isolated H1–H2 smoke against a preview Worker or wrangler dev.
 * Never defaults to noema.guru. Never commands Perihelion / DEFAULT_WORLD_ID.
 *
 *   BASE=https://<preview>.workers.dev \\
 *   PLAYER_TOKEN=… ADMIN_TOKEN=… \\
 *   node scripts/hosted-conformance.mjs
 */
import { pathToFileURL } from "node:url";

export const FORBIDDEN_BASES = ["noema.guru", "www.noema.guru"];
export const FORBIDDEN_WORLD_IDS = ["world.perihelion-reach", "world-01"];
export const DEFAULT_TEST_WORLD = "test.hosted-canonical.ci-smoke";

export function admitConformanceBase(raw) {
  const base = String(raw || "").trim().replace(/\/$/, "");
  if (!base) return { ok: false, message: "BASE is required (preview or wrangler dev). Never defaults to noema.guru" };
  let host = "";
  try {
    host = new URL(base).hostname.toLowerCase();
  } catch {
    return { ok: false, message: "BASE must be an absolute http(s) URL" };
  }
  if (FORBIDDEN_BASES.some((h) => host === h || host.endsWith(`.${h}`))) {
    return { ok: false, message: `refusing production door ${base}` };
  }
  return { ok: true, base };
}

export function admitConformanceWorld(raw) {
  const world_id = String(raw || "").trim() || DEFAULT_TEST_WORLD;
  if (FORBIDDEN_WORLD_IDS.includes(world_id) || world_id.startsWith("world.perihelion")) {
    return { ok: false, message: "that world is not admitted for isolated verification" };
  }
  if (!world_id.startsWith("test.hosted-canonical.")) {
    return { ok: false, message: "world_id must be test.hosted-canonical.<suffix>" };
  }
  return { ok: true, world_id };
}

async function json(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function main() {
  const baseGate = admitConformanceBase(process.env.BASE);
  if (!baseGate.ok) {
    console.error(`error: ${baseGate.message}`);
    process.exit(2);
  }
  const worldGate = admitConformanceWorld(process.env.WORLD_ID);
  if (!worldGate.ok) {
    console.error(`error: ${worldGate.message}`);
    process.exit(2);
  }
  const base = baseGate.base;
  const world_id = worldGate.world_id;
  const player = process.env.PLAYER_TOKEN || "";
  const admin = process.env.ADMIN_TOKEN || "";

  const helloOk = await fetch(`${base}/protocol/v1`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "HELLO",
      request_id: "req-hello-ok",
      body: { supported_protocols: ["agent-protocol/v1"] },
    }),
  });
  const helloOkBody = await json(helloOk);
  if (helloOk.status !== 200 || helloOkBody.type !== "HELLO_ACK") {
    console.error("C01 compatible HELLO failed", helloOk.status, helloOkBody);
    process.exit(1);
  }

  const helloBad = await fetch(`${base}/protocol/v1`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "HELLO",
      request_id: "req-hello-bad",
      body: { supported_protocols: ["agent-protocol/v0"] },
    }),
  });
  const helloBadBody = await json(helloBad);
  if (helloBad.status !== 400 || helloBadBody.error?.code !== "NO_COMPATIBLE_PROTOCOL") {
    console.error("C01 incompatible HELLO failed", helloBad.status, helloBadBody);
    process.exit(1);
  }

  const unauth = await fetch(`${base}/v1/operator/test-world/command`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ world_id, request_id: "r1", command: "LOOK", arguments: {} }),
  });
  if (unauth.status !== 401) {
    console.error("C02 isolated without bearer should be 401", unauth.status);
    process.exit(1);
  }

  const peri = await fetch(`${base}/v1/operator/test-world/command`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(player ? { Authorization: `Bearer ${player}` } : {}),
      ...(admin ? { "X-Noema-Admin-Token": admin } : {}),
    },
    body: JSON.stringify({
      world_id: "world.perihelion-reach",
      request_id: "r-peri",
      command: "LOOK",
      arguments: {},
    }),
  });
  if (player && admin && peri.status !== 403) {
    console.error("C02 perihelion must 403 before DO", peri.status, await json(peri));
    process.exit(1);
  }

  if (player && admin) {
    const enter = await fetch(`${base}/v1/operator/test-world/command`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${player}`,
        "X-Noema-Admin-Token": admin,
      },
      body: JSON.stringify({
        world_id,
        request_id: "r-enter",
        idempotency_key: "idem-ci-enter",
        command: "ENTER_WORLD",
        arguments: {},
      }),
    });
    const enterBody = await json(enter);
    if (enter.status !== 200 || enterBody.ok !== true) {
      console.error("isolated ENTER failed", enter.status, enterBody);
      process.exit(1);
    }
  } else {
    console.log("skip isolated ENTER (set PLAYER_TOKEN and ADMIN_TOKEN)");
  }

  const watchPost = await fetch(`${base}/v1/watch/live`, { method: "POST" });
  if (![404, 405].includes(watchPost.status)) {
    console.error("C25 POST /v1/watch/live should be 404/405", watchPost.status);
    process.exit(1);
  }

  console.log("ok", { base, world_id, hello: helloOkBody.body?.selected_protocol });
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
