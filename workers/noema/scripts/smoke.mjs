#!/usr/bin/env node
/**
 * Smoke against local wrangler dev (http://127.0.0.1:8787 by default).
 * Hosted preview verification uses scripts/hosted-conformance.mjs instead.
 */
import { pathToFileURL } from "node:url";

const DEFAULT_BASE = "http://127.0.0.1:8787";
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "[::1]", "localhost"]);

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

async function fetchHello(base) {
  const res = await fetch(`${base}/protocol/v1`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "HELLO",
      request_id: "req-smoke-hello",
      world_id: "world-01",
      body: {
        supported_protocols: ["agent-protocol/v1"],
      },
    }),
  });
  const data = await json(res);
  if (!res.ok || data.type !== "HELLO_ACK") {
    throw new Error(`HELLO failed (${res.status}); is /protocol/v1 available?`);
  }
  const accepted = Array.isArray(data.body?.accepted_seals) ? data.body.accepted_seals.filter((s) => typeof s === "string") : [];
  return accepted[0] || null;
}

function commandHeaders(token, seal) {
  return {
    "content-type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(seal ? { "X-Noema-Seal": seal } : {}),
  };
}

async function mintLocalDevToken(base, controllerType) {
  const res = await fetch(`${base}/v1/auth/dev-token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ handle: `smoke-${controllerType}`, controller_type: controllerType }),
  });
  const body = await json(res);
  if (res.status !== 200 || !body.access_token) {
    throw new Error(`local ${controllerType} token mint failed (${res.status}); is npm run dev running?`);
  }
  return body;
}

function summarizeCommand(label, body) {
  if (body && body.ok === true) return `${label} ok ${body.request_id}`;
  if (body && body.ok === false) {
    const code = body.error?.code || "unknown";
    const message = body.error?.message || "no message";
    return `${label} failed (${code}) ${message}`;
  }
  return `${label} response ${JSON.stringify(body)}`;
}

async function main() {
  const gate = admitLocalSmokeBase(process.env.BASE);
  if (!gate.ok) {
    console.error(`error: ${gate.message}`);
    process.exit(2);
  }
  const base = gate.base;

  const seal = await fetchHello(base);
  console.log("protocol_seal", !!seal);

  const health = await fetch(`${base}/health`).then(json);
  console.log("health", health.status, health.stage);

  const human = await mintLocalDevToken(base, "human");
  console.log("human_token", !!human.access_token, human.player_id);

  const agent = await mintLocalDevToken(base, "agent");
  console.log("agent_token", !!agent.access_token, agent.player_id);

  const enter = await fetch(`${base}/v1/command`, {
    method: "POST",
    headers: commandHeaders(agent.access_token, seal),
    body: JSON.stringify({
      request_id: "req-enter-1",
      idempotency_key: "idem-enter-1",
      command: "ENTER_WORLD",
      arguments: {},
      client: { type: "agent", runtime: "curl" },
    }),
  }).then(json);
  console.log("enter", summarizeCommand("enter", enter), enter.observation?.location?.name);

  const look = await fetch(`${base}/v1/command`, {
    method: "POST",
    headers: commandHeaders(agent.access_token, seal),
    body: JSON.stringify({
      request_id: "req-look-1",
      idempotency_key: "idem-look-1",
      command: "LOOK",
      arguments: {},
    }),
  }).then(json);
  console.log("look", summarizeCommand("look", look), look.events?.[0]?.event_type, look.provenance?.controller_id);

  const again = await fetch(`${base}/v1/command`, {
    method: "POST",
    headers: commandHeaders(agent.access_token, seal),
    body: JSON.stringify({
      request_id: "req-look-1-dup",
      idempotency_key: "idem-look-1",
      command: "LOOK",
    }),
  }).then(json);
  console.log("idempotent", again.events?.[0]?.sequence === look.events?.[0]?.sequence);

  const unauth = await fetch(`${base}/v1/command`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ request_id: "x", command: "LOOK" }),
  });
  console.log("unauth_status", unauth.status);

  if (!enter.ok || !look.ok || unauth.status === 200) {
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
