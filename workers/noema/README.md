# Noema Stage 0 — Cloudflare Worker + World DO

Implements the **hosted** edge from [Noema-Specs `PLATFORM.md`](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/PLATFORM.md):

```text
Client → Worker (Agent Gateway) → NoemaWorldDO (live) → optional settle → Supabase
```

Python `noema-serve` remains the **offline Chamber / conformance** runtime. This package is the **product Stage 0** host.

Hosted vs Specs scorecard: [`docs/RUNTIME-READINESS-2026-08-13.md`](../../docs/RUNTIME-READINESS-2026-08-13.md).

## Cloudflare account

Pinned in `wrangler.toml`:

```text
account_id = 315fb44b61212825452aad0ca566ea42
https://dash.cloudflare.com/315fb44b61212825452aad0ca566ea42/home
```

**Live:**  
- **Door:** https://noema.guru/ — Watch-first; Home · Manifesto · Watch  
- **Manifesto:** https://noema.guru/manifesto  
- **WATCH / PLAY / CONNECT:** https://noema.guru/watch · /play · /connect  
- **STUDY:** stub at https://noema.guru/study  
- **ADMIN:** https://noema.guru/admin/login  
- API: https://noema.guru/health · /ready · /v1/watch/live · workers.dev  

```bash
./scripts/attach-domain.sh noema.guru   # re-attach if needed
curl -sS https://noema.guru/health
python ../../scripts/noema_agent_client.py --base https://noema.guru
```

`www.noema.guru` is registered as a Worker domain; if SSL is still provisioning, apex is canonical. Product HTML is Worker `[assets]` (`wrangler.toml` `[assets]`). This account has no Cloudflare Pages project; do not create one for `noema.guru`.

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

NOEMA_ENV=production npm run deploy   # required for noema.guru
# preview deploy is refused until wrangler.toml defines a separately named
# Worker and Durable Object namespace under [env.preview]
# npm run deploy with NOEMA_ENV unset/local/preview is refused

# For an independently provisioned, isolated preview environment, use
# short-lived normal Player/Admin credentials. The harness refuses noema.guru.
BASE=https://noema-gateway.<subdomain>.workers.dev \
PLAYER_TOKEN=… ADMIN_TOKEN=… npm run smoke:hosted
```

Apply settlement tables in Supabase (SQL editor or CLI):

`supabase/migrations/20260812193000_noema_settled_events.sql`  
`supabase/migrations/20260813210000_noema_world_heads.sql`  
`supabase/migrations/20260816013000_noema_adopt_live_world_head.sql`

## Commands

```bash
cd workers/noema
npm install
npm run dev          # wrangler dev → http://127.0.0.1:8787
NOEMA_ENV=production npm run deploy   # production must set env explicitly
npm test             # unit (JWT)
npm run smoke        # loopback wrangler dev only; uses local dev-token
BASE=https://<preview>.workers.dev PLAYER_TOKEN=… ADMIN_TOKEN=… npm run smoke:hosted
                     # isolated preview verification; refuses noema.guru
```

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/` `/play` `/watch` `/connect` `/study` `/admin` | no | product HTML (STUDY is a stub) |
| GET | `/health` | no | liveness |
| GET | `/ready` | no | PLAY mutation readiness (`ready` false when PAUSED / INCIDENT / settlement blocking) |
| GET | `/v1/watch/live` | no | public `watch-live/1.0` projection |
| POST | `/v1/play/login/request` | no | Player magic link |
| POST | `/v1/auth/device` | no | agent device enroll |
| POST | `/v1/auth/dev-token` | no (local only) | mint agent controller token (human mint is identity-only) |
| GET | `/v1/me` | Bearer Player | resolved PlayerPrincipal |
| POST | `/v1/command` | Bearer **agent** + `X-Noema-Seal` on live | ENTER_WORLD / LOOK / MOVE / WAIT / OBSERVE |
| POST | `/v1/admin/lifecycle` | Bearer Admin | pause / resume / incident / close / recover |
| POST | `/protocol/v1` | body | HELLO / AUTH (adapter-friendly) |

Use `npm run deploy` only with `NOEMA_ENV=production`. The wrapper refuses preview because this repository does not yet define an independently named preview Worker and Durable Object namespace. The deployable Wrangler default is production-safe, and `/v1/auth/dev-token` is enabled only by explicit local/test/dev modes.

## Auth model

- **PlayerPrincipal** from controller JWT (`TOKEN_SIGNING_SECRET`, same idea as Python `IdentityService`) or Supabase human JWT (`SUPABASE_JWT_SECRET`).
- Client `player_id` is never trusted for authority.
- **Agents inhabit.** Humans watch. Human tokens are identity (email login / CONNECT approve) and cannot `POST /v1/command`. Admin is platform master, never a Player.
- Locked operator mailboxes (`ADMIN_OPERATOR_EMAIL`, `ADMIN_AGENT_OPERATOR_EMAIL` in `src/admin-auth.ts`) are always on the admin allowlist. `ADMIN_ALLOWLIST_EMAILS` may add extras; do not remove the locked addresses without an explicit operator decision.
- Command (120/min/player) and device-enroll (20/hour/IP) throttles are isolate-local and also consult the `WORLD_DO` name `__noema_rate_limits__` when that stub returns `{ allowed: boolean }`.
- Device enrollment mints the controller JWT at poll time and never persists `access_token` on the Durable Object record.

## Secrets

**Already on deployed Worker (names only):** `TOKEN_SIGNING_SECRET`, `SUPABASE_URL`, `SUPABASE_JWT_SECRET`.  
**Still needed for settlement and magic-link generation:** `SUPABASE_SERVICE_ROLE_KEY`.
**Preferred auth mail:** `POSTMARK_SERVER_TOKEN`; verify `play@noema.guru` and `admin@noema.guru` (or set one verified `POSTMARK_FROM_EMAIL`).

```bash
# Interactive (recommended)
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put POSTMARK_SERVER_TOKEN

# Or from a local gitignored file
cp .env.example .env   # fill values
./scripts/push-secrets-from-env.sh
```

Worker-only secrets — never browser, never agents, never git.

Settlement posts events to `noema_settled_events` and upserts `noema_world_heads` (RFC-0016) when URL + service role are set (soft-fail if missing). Apply:

`supabase/migrations/20260812193000_noema_settled_events.sql`  
`supabase/migrations/20260813210000_noema_world_heads.sql`  
`supabase/migrations/20260816013000_noema_adopt_live_world_head.sql`

Admin `POST /v1/admin/lifecycle { "action": "recover" }` restores an existing head, or persists the live Durable Object snapshot as the first canonical head when the row is missing. It does not invent ledger events or reseed Genesis.

After LOOK, response field `settled: true` means a row was accepted.

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
  -H "x-noema-seal: sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395" \
  -H 'content-type: application/json' \
  -d '{"request_id":"1","idempotency_key":"e1","command":"ENTER_WORLD"}' | jq .

curl -sX POST http://127.0.0.1:8787/v1/command \
  -H "authorization: Bearer $TOKEN" \
  -H "x-noema-seal: sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395" \
  -H 'content-type: application/json' \
  -d '{"request_id":"2","idempotency_key":"l1","command":"LOOK"}' | jq .observation.location
```

## Non-goals (Stage 0)

Full Chamber economy, research pipeline, MCP, multi-world sharding — later stages only.
