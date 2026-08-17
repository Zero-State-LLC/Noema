#!/usr/bin/env node
/**
 * Read-only hosted settlement inspect.
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the environment.
 * Prints status codes and redacted head fields. Never prints secrets.
 * Does not apply SQL, invent events, or reseed Genesis.
 */
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
  "content-type": "application/json",
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
  };
}

const headUrl = `${url}/rest/v1/noema_world_heads?world_id=eq.${encodeURIComponent(worldId)}&select=world_id,cycle,sequence,revision,writer_generation,settlement_health,genesis_id,state_digest&limit=1`;
const commitRpc = `${url}/rest/v1/rpc/noema_commit_canonical_settlement`;
const adoptRpc = `${url}/rest/v1/rpc/noema_adopt_live_world_head`;

const [head, commit, adopt] = await Promise.all([
  probe("noema_world_heads", headUrl, { headers }),
  probe("noema_commit_canonical_settlement", commitRpc, {
    method: "POST",
    headers,
    body: "{}",
  }),
  probe("noema_adopt_live_world_head", adoptRpc, {
    method: "POST",
    headers,
    body: "{}",
  }),
]);

const rows = Array.isArray(head.body) ? head.body : [];
const tablePresent = head.status === 200;
const commitPresent = commit.status !== 404 && commit.status !== 406;
const adoptPresent = adopt.status !== 404 && adopt.status !== 406;

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
  noema_commit_canonical_settlement: {
    http: commit.status,
    present: commitPresent,
    hint: commit.status === 404 || commit.status === 406 ? "RPC missing from schema cache" : "function exists (empty body is expected to fail closed)",
  },
  noema_adopt_live_world_head: {
    http: adopt.status,
    present: adoptPresent,
    hint: adopt.status === 404 || adopt.status === 406 ? "RPC missing from schema cache" : "function exists (empty body is expected to fail closed)",
  },
  genesis_pin: "genesis.ef578f4ffceeccd0",
};

console.log(JSON.stringify(out, null, 2));
process.exit(out.ok ? 0 : 1);
