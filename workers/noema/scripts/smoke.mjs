#!/usr/bin/env node
/**
 * Smoke against local wrangler dev (http://127.0.0.1:8787 by default).
 * Hosted preview verification uses scripts/hosted-conformance.mjs instead.
 */
import { pathToFileURL } from "node:url";

const DEFAULT_BASE = "http://127.0.0.1:8787";
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "[::1]", "localhost"]);
/** Same published digest as `src/seal.ts` ACCEPTED_SEALS[0]. Local world-01 is default-kind, so attach still needs it. */
export const LOCAL_SMOKE_SEAL = "sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395";

export function admitLocalSmokeBase(raw) {
  const base = String(raw || DEFAULT_BASE).trim().replace(/\/$/, "");
  let url;
  try {
    url = new URL(base);
  } catch {
    return { ok: false, message: "BASE must be an absolute loopback http URL" };
  }
  if (url.protocol !== "http:" || !LOOPBACK_HOSTS.has(url.hostname.toLowerCase())) {
    return {
      ok: false,
      message: "local smoke refuses non-loopback BASE; use npm run smoke:hosted for preview verification",
    };
  }
  if ((url.pathname !== "/" && url.pathname !== "") || url.search || url.hash || url.username || url.password) {
    return { ok: false, message: "BASE must be a loopback origin without credentials, path, query, or fragment" };
  }
  return { ok: true, base };
}

async function json(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/** First visible inspectable site from a LOOK observation. */
export function pickInspectTarget(observation) {
  const entities = observation?.location?.entities;
  if (!Array.isArray(entities)) return null;
  const hit = entities.find((e) => e && e.entity_id);
  return hit ? String(hit.entity_id) : null;
}

/** First listed exit direction from a LOOK observation. */
export function pickMoveDirection(observation) {
  const exits = observation?.location?.exits;
  if (!Array.isArray(exits)) return null;
  const hit = exits.find((e) => e && e.direction);
  return hit ? String(hit.direction) : null;
}

async function mintLocalDevToken(base, handle) {
  const res = await fetch(`${base}/v1/auth/dev-token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ handle, controller_type: "agent" }),
  });
  const body = await json(res);
  if (res.status !== 200 || !body.access_token) {
    const detail = body.error?.message || body.error?.code || "unexpected response";
    throw new Error(`local agent token mint failed (${res.status}): ${detail}`);
  }
  return body;
}

async function command(base, token, envelope) {
  const res = await fetch(`${base}/v1/command`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Noema-Seal": LOCAL_SMOKE_SEAL,
    },
    body: JSON.stringify(envelope),
  });
  const body = await json(res);
  return { status: res.status, body };
}

async function main() {
  const gate = admitLocalSmokeBase(process.env.BASE);
  if (!gate.ok) {
    console.error(`error: ${gate.message}`);
    process.exit(2);
  }
  const base = gate.base;

  const health = await fetch(`${base}/health`).then(json);
  console.log("health", health.status, health.stage);

  const stamp = Date.now().toString(36);
  const humanMint = await fetch(`${base}/v1/auth/dev-token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ handle: `smoke-human-${stamp}`, controller_type: "human" }),
  });
  const humanMintBody = await json(humanMint);
  console.log("human_dev_token_status", humanMint.status, humanMintBody.error?.code || "");

  const agent = await mintLocalDevToken(base, `smoke-agent-${stamp}`);
  console.log("agent_token", !!agent.access_token, agent.player_id);

  const enter = await command(base, agent.access_token, {
    request_id: `req-enter-${stamp}`,
    idempotency_key: `idem-enter-${stamp}`,
    command: "ENTER_WORLD",
    arguments: {},
    client: { type: "agent", runtime: "curl" },
  });
  console.log("enter", enter.status, enter.body.ok, enter.body.observation?.location?.name, enter.body.error?.code || "");

  const look = await command(base, agent.access_token, {
    request_id: `req-look-${stamp}`,
    idempotency_key: `idem-look-${stamp}`,
    command: "LOOK",
    arguments: {},
  });
  console.log(
    "look",
    look.status,
    look.body.ok,
    look.body.events?.[0]?.event_type,
    look.body.observation?.location?.room_id,
  );

  const again = await command(base, agent.access_token, {
    request_id: `req-look-dup-${stamp}`,
    idempotency_key: `idem-look-${stamp}`,
    command: "LOOK",
  });
  console.log("idempotent", again.body.events?.[0]?.sequence === look.body.events?.[0]?.sequence);

  const entityId = pickInspectTarget(look.body.observation) || pickInspectTarget(enter.body.observation);
  if (!entityId) {
    console.error("error: LOOK observation had no inspectable entity");
    process.exit(1);
  }
  const inspect = await command(base, agent.access_token, {
    request_id: `req-inspect-${stamp}`,
    idempotency_key: `idem-inspect-${stamp}`,
    command: "INSPECT",
    arguments: { entity_id: entityId },
  });
  console.log("inspect", inspect.body.ok, entityId, inspect.body.events?.map((e) => e.event_type));

  const direction = pickMoveDirection(look.body.observation) || pickMoveDirection(enter.body.observation);
  if (!direction) {
    console.error("error: LOOK observation had no exit to MOVE");
    process.exit(1);
  }
  const move = await command(base, agent.access_token, {
    request_id: `req-move-${stamp}`,
    idempotency_key: `idem-move-${stamp}`,
    command: "MOVE",
    arguments: { direction },
  });
  console.log(
    "move",
    move.body.ok,
    direction,
    look.body.observation?.location?.room_id,
    "->",
    move.body.observation?.location?.room_id,
  );

  const unauth = await fetch(`${base}/v1/command`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ request_id: "x", command: "LOOK" }),
  });
  console.log("unauth_status", unauth.status);

  if (
    !enter.body.ok ||
    !look.body.ok ||
    !inspect.body.ok ||
    !move.body.ok ||
    humanMint.status !== 403 ||
    unauth.status === 200
  ) {
    process.exit(1);
  }
  console.log("SMOKE_OK");
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
