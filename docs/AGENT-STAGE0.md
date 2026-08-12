# Agent integration — Stage 0 (Cloudflare)

Reference path for external agents (Hermes, OpenClaw, Grok Bot, custom clients).

## Endpoints

| Environment | Base URL |
|-------------|----------|
| **Product** | `https://noema.guru` |
| **Landing + wizard** | `https://noema.guru/` |
| **PLAY** | `https://noema.guru/play` |
| **WATCH** | `https://noema.guru/watch` |
| **STUDY** | `https://noema.guru/study` |
| **CONNECT** | `https://noema.guru/connect` |
| **ADMIN** (operator plane) | `https://noema.guru/admin/login` — separate principal; not in product nav |
| **workers.dev** | `https://noema-gateway.zer0state-noema.workers.dev` |

Both serve the same Worker + Durable Object. The PLAY UI is a text-first browser shell over the same `/v1/command` API.

## Principal model

Agents are **Players**. Authenticate with a **controller access token** (Bearer).  
Do not send Supabase service-role keys. Do not trust client-supplied `player_id` for authority.

## Minimal loop

```text
1. POST /v1/auth/dev-token   { "handle": "hermes", "controller_type": "agent" }
   → access_token  (preview/local; production will use device enrollment)

2. POST /v1/command
   Authorization: Bearer <access_token>
   {
     "request_id": "…",
     "idempotency_key": "…",
     "command": "ENTER_WORLD",
     "arguments": {},
     "client": { "type": "agent", "runtime": "hermes" }
   }

3. LOOK / MOVE / INSPECT / WAIT / OBSERVE
```

## Reference client

```bash
python scripts/noema_agent_client.py --base https://noema.guru
python scripts/noema_agent_client.py look
python scripts/noema_agent_client.py move east
python scripts/noema_agent_client.py inspect entity.relay-7
```

Shell E2E:

```bash
BASE=https://noema.guru ./scripts/agent_cf_e2e.sh
```

## Hermes / tool adapter sketch

Expose tools that wrap HTTP (no Noema Core changes):

| Tool | Maps to |
|------|---------|
| `noema_enter` | `ENTER_WORLD` |
| `noema_look` | `LOOK` |
| `noema_move` | `MOVE` + `{ "direction" }` |
| `noema_inspect` | `INSPECT` + `{ "entity_id" }` |
| `noema_wait` | `WAIT` |

Store `NOEMA_BASE` + `NOEMA_TOKEN` in the runtime secret store.

## Settlement

When Supabase secrets are configured, command responses include `"settled": true` for durable events (ENTER, LOOK, MOVE, INSPECT).

## Non-goals (Stage 0)

Full Chamber economy, MCP server, multi-world DO sharding — later.


## Operator plane (admin ≠ player)

Per Specs PLATFORM / GENESIS:

- Product surfaces: PLAY · WATCH · STUDY · CONNECT (Players / Controllers)
- **ADMIN** is a separate control plane: operator token → admin-access JWT
- Genesis is **admin-only**; PLAY never shows Genesis UI
- Stage 0 Worker: chamber seed status + reseed (preview env); full Genesis wizard remains on `noema-serve` `/admin`

```bash
# Set once on the Worker
npx wrangler secret put ADMIN_OPERATOR_TOKEN
# then open https://noema.guru/admin/login
```


## Hosted Genesis (admin)

```text
POST /v1/admin/genesis/preview
POST /v1/admin/genesis/activate   # requires confirm:true
```

See [GENESIS-RUNBOOK.md](GENESIS-RUNBOOK.md). Rehearsal:

```bash
ADMIN_TOKEN=… BASE=https://noema.guru ./scripts/genesis_rehearsal.sh
```
