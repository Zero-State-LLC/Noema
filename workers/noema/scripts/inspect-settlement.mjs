#!/usr/bin/env node
/**
 * Read-only hosted settlement inspect.
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the environment.
 * Prints status codes and redacted head fields. Never prints secrets.
 * Does not apply SQL, invent events, or reseed Genesis.
 * RPC names are probed via GET OpenAPI. Never POST to settlement RPCs.
 */
import {
  adoptSequenceFromReceipt,
  openApiAvailable,
  openApiRpcPresent,
  summarizeChain,
} from "./settlement-chain.mjs";
const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const worldId = process.env.SUPABASE_CANONICAL_WORLD_ID || "world.perihelion-reach";

if (!url || !key) {
  console.log(JSON.stringify({
    ok: false,
    code: "UNCONFIGURED",
    message: "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Do not pass them on the command line.",
  }));
  process.exit(2);
}

const headers = {
  apikey: key,
  authorization: `Bearer ${key}`,
  accept: "application/json",
};

const openapiHeaders = {
  apikey: key,
  authorization: `Bearer ${key}`,
  accept: "application/openapi+json",
};

async function probe(name, href, init) {
  const res = await fetch(href, init);
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { parse_error: true, bytes: text.length };
  }
  return { name, status: res.status, body };
}

function redactHead(row) {
  if (!row || typeof row !== "object") return null;
  return {
    world_id: row.world_id ?? null,
    cycle: row.cycle ?? null,
    sequence: row.sequence ?? null,
    revision: row.revision ?? null,
    writer_generation: row.writer_generation ?? null,
    settlement_health: row.settlement_health ?? null,
    genesis_id: row.genesis_id ?? null,
    state_digest_prefix: typeof row.state_digest === "string" ? row.state_digest.slice(0, 12) : null,
    ledger_head_event_id: row.ledger_head_event_id ?? null,
  };
}

function rpcHint(openapiOk, present) {
  if (!openapiOk) return "openapi_unavailable";
  return present ? "named in OpenAPI" : "RPC name missing from OpenAPI";
}

const COMMIT_RPC = "noema_commit_canonical_settlement";
const ADOPT_RPC = "noema_adopt_live_world_head";
const headUrl = `${url}/rest/v1/noema_world_heads?world_id=eq.${encodeURIComponent(worldId)}&select=world_id,cycle,sequence,revision,writer_generation,settlement_health,genesis_id,state_digest,ledger_head_event_id&limit=1`;
const eventsUrl = `${url}/rest/v1/noema_settled_events?world_id=eq.${encodeURIComponent(worldId)}&select=sequence&order=sequence`;
const firstReceiptUrl = `${url}/rest/v1/noema_canonical_settlements?world_id=eq.${encodeURIComponent(worldId)}&select=revision,sequence,ledger_head_event_id&order=revision.asc&limit=1`;
const lastReceiptUrl = `${url}/rest/v1/noema_canonical_settlements?world_id=eq.${encodeURIComponent(worldId)}&select=revision,sequence,ledger_head_event_id&order=revision.desc&limit=1`;
const openapiUrl = `${url}/rest/v1/`;

const [head, events, firstReceipt, lastReceipt, openapi] = await Promise.all([
  probe("noema_world_heads", headUrl, { headers }),
  probe("noema_settled_events", eventsUrl, { headers }),
  probe("first_receipt", firstReceiptUrl, { headers }),
  probe("last_receipt", lastReceiptUrl, { headers }),
  probe("openapi", openapiUrl, { headers: openapiHeaders }),
]);

const rows = Array.isArray(head.body) ? head.body : [];
const tablePresent = head.status === 200;
const openapiOk = openApiAvailable(openapi.status, openapi.body);
const commitPresent = openapiOk && openApiRpcPresent(openapi.body, COMMIT_RPC);
const adoptPresent = openapiOk && openApiRpcPresent(openapi.body, ADOPT_RPC);
const eventRows = Array.isArray(events.body) ? events.body : [];
const firstRec = Array.isArray(firstReceipt.body) ? firstReceipt.body[0] : null;
const lastRec = Array.isArray(lastReceipt.body) ? lastReceipt.body[0] : null;
const adoptSeq = adoptSequenceFromReceipt(firstRec);
const chain = summarizeChain({
  sequences: eventRows.map((r) => r?.sequence),
  headSequence: rows[0]?.sequence,
  adoptSequence: adoptSeq,
});

function redactReceipt(row) {
  if (!row || typeof row !== "object") return null;
  return {
    revision: row.revision ?? null,
    sequence: row.sequence ?? null,
    ledger_head_event_id: row.ledger_head_event_id ?? null,
  };
}

const out = {
  ok: tablePresent && commitPresent && adoptPresent,
  project_host: (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "invalid-url";
    }
  })(),
  world_id: worldId,
  noema_world_heads: {
    http: head.status,
    present: tablePresent,
    row: tablePresent ? redactHead(rows[0] || null) : null,
  },
  openapi: {
    http: openapi.status,
    available: openapiOk,
    hint: openapiOk ? "rpc names read from GET /rest/v1/ OpenAPI" : "openapi_unavailable",
  },
  noema_commit_canonical_settlement: {
    http: openapi.status,
    present: openapiOk ? commitPresent : null,
    hint: rpcHint(openapiOk, commitPresent),
  },
  noema_adopt_live_world_head: {
    http: openapi.status,
    present: openapiOk ? adoptPresent : null,
    hint: rpcHint(openapiOk, adoptPresent),
  },
  chain: {
    ...chain,
    events_http: events.status,
    first_receipt: redactReceipt(firstRec),
    last_receipt: redactReceipt(lastRec),
  },
  genesis_pin: "genesis.ef578f4ffceeccd0",
};

console.log(JSON.stringify(out, null, 2));
process.exit(out.ok ? 0 : 1);
