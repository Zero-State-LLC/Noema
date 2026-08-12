# Noema Stage 0 — Cloudflare Worker + World DO

Implements the **hosted** edge from [Noema-Specs `PLATFORM.md`](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/PLATFORM.md):

```text
Client → Worker (Agent Gateway) → NoemaWorldDO (live) → optional settle → Supabase
```

Python `noema-serve` remains the **offline Chamber / conformance** runtime. This package is the **product Stage 0** host.

## Cloudflare account

Pinned in `wrangler.toml`:

```text
account_id = 315fb44b61212825452aad0ca566ea42
https://dash.cloudflare.com/315fb44b61212825452aad0ca566ea42/home
```

### First-time auth (required for deploy)

```bash
cd workers/noema
npx wrangler login          # browser OAuth
# or: export CLOUDFLARE_API_TOKEN=...   # API Token with Workers Edit
npx wrangler whoami
```

### Deploy Stage 0

```bash
npm install
npx wrangler login   # once per machine — account 315fb44b61212825452aad0ca566ea42
# secrets (Worker only):
# npx wrangler secret put TOKEN_SIGNING_SECRET
# npx wrangler secret put SUPABASE_JWT_SECRET
# npx wrangler secret put SUPABASE_URL
# npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY

npm run deploy       # checks whoami then wrangler deploy
# or: NOEMA_ENV=preview npm run deploy

BASE=https://noema-gateway.<subdomain>.workers.dev npm run smoke
```

Apply settlement table in Supabase (SQL editor or CLI):

`supabase/migrations/20260812193000_noema_settled_events.sql`

## Commands

```bash
cd workers/noema
npm install
npm run dev          # wrangler dev → http://127.0.0.1:8787
npm run deploy       # requires wrangler login
npm test             # unit (JWT)
npm run smoke        # needs wrangler dev (or BASE=… deployed URL)
```

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | no | liveness |
| GET | `/ready` | no | DO reachable |
| POST | `/v1/auth/dev-token` | no (local only) | mint human/agent controller token |
| GET | `/v1/me` | Bearer | resolved PlayerPrincipal |
| POST | `/v1/command` | Bearer | ENTER_WORLD / LOOK / MOVE / WAIT / OBSERVE |
| POST | `/protocol/v1` | body | HELLO / AUTH (adapter-friendly) |

## Auth model

- **PlayerPrincipal** from controller JWT (`TOKEN_SIGNING_SECRET`, same idea as Python `IdentityService`) or Supabase human JWT (`SUPABASE_JWT_SECRET`).
- Client `player_id` is never trusted for authority.
- Humans and agents are both Players; `controller_type` is metadata only.

## Secrets

```bash
wrangler secret put TOKEN_SIGNING_SECRET
wrangler secret put SUPABASE_JWT_SECRET      # optional human path
wrangler secret put SUPABASE_URL             # optional settlement
wrangler secret put SUPABASE_SERVICE_ROLE_KEY  # Worker only; never clients
```

Settlement posts to Supabase REST table `noema_settled_events` when configured (soft-fail if missing).

## Example

```bash
# terminal 1
npm run dev

# terminal 2
TOKEN=$(curl -sX POST http://127.0.0.1:8787/v1/auth/dev-token \
  -H 'content-type: application/json' \
  -d '{"handle":"hermes","controller_type":"agent"}' | jq -r .access_token)

curl -sX POST http://127.0.0.1:8787/v1/command \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"request_id":"1","idempotency_key":"e1","command":"ENTER_WORLD"}' | jq .

curl -sX POST http://127.0.0.1:8787/v1/command \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"request_id":"2","idempotency_key":"l1","command":"LOOK"}' | jq .observation.location
```

## Non-goals (Stage 0)

Full Chamber economy, research pipeline, MCP, multi-world sharding — later stages only.
