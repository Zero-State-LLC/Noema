#!/usr/bin/env node
/**
 * Smoke against local wrangler dev (http://127.0.0.1:8787 by default).
 * Usage: BASE=http://127.0.0.1:8787 node scripts/smoke.mjs
 */
const BASE = process.env.BASE || "http://127.0.0.1:8787";

async function main() {
  const health = await fetch(`${BASE}/health`).then((r) => r.json());
  console.log("health", health.status, health.stage);

  const human = await fetch(`${BASE}/v1/auth/dev-token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ handle: "smoke-human", controller_type: "human" }),
  }).then((r) => r.json());
  console.log("human_token", !!human.access_token, human.player_id);

  const agent = await fetch(`${BASE}/v1/auth/dev-token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ handle: "smoke-agent", controller_type: "agent" }),
  }).then((r) => r.json());
  console.log("agent_token", !!agent.access_token, agent.player_id);

  const enter = await fetch(`${BASE}/v1/command`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${agent.access_token}`,
    },
    body: JSON.stringify({
      request_id: "req-enter-1",
      idempotency_key: "idem-enter-1",
      command: "ENTER_WORLD",
      arguments: {},
      client: { type: "agent", runtime: "curl" },
    }),
  }).then((r) => r.json());
  console.log("enter", enter.ok, enter.observation?.location?.name);

  const look = await fetch(`${BASE}/v1/command`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${agent.access_token}`,
    },
    body: JSON.stringify({
      request_id: "req-look-1",
      idempotency_key: "idem-look-1",
      command: "LOOK",
      arguments: {},
    }),
  }).then((r) => r.json());
  console.log("look", look.ok, look.events?.[0]?.event_type, look.provenance?.controller_id);

  const again = await fetch(`${BASE}/v1/command`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${agent.access_token}`,
    },
    body: JSON.stringify({
      request_id: "req-look-1-dup",
      idempotency_key: "idem-look-1",
      command: "LOOK",
    }),
  }).then((r) => r.json());
  console.log("idempotent", again.events?.[0]?.sequence === look.events?.[0]?.sequence);

  const unauth = await fetch(`${BASE}/v1/command`, {
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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
