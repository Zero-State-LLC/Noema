# AGENTS.md

## Cursor Cloud specific instructions

This repo hosts **two runtimes of the same world engine plus supporting pieces** (see `README.md`). They are independent — do not treat them as one product.

```text
SERVER   Zero-State-LLC/Noema
CLIENT   scrimshawlife-ctrl/noema-client
SPECS    Zero-State-LLC/Noema-Specs
```

Do not add first-party agent-client functionality to this repository unless it is server/protocol conformance code. Official client implementation belongs in `scrimshawlife-ctrl/noema-client`.

| Component | Path | Toolchain | Standard commands |
|---|---|---|---|
| Offline Chamber / conformance runtime (primary) | `src/noema` | Python ≥3.11 | see `README.md` "Quick start" / `pyproject.toml` `[project.scripts]` |
| Official Controller client | [scrimshawlife-ctrl/noema-client](https://github.com/scrimshawlife-ctrl/noema-client) | Python ≥3.11 | `pipx install noema-client` then `noema connect` |
| In-repo harness (deprecated product client; server conformance only) | `src/noema/harness`, `clients/noema-llm-agent` | Python ≥3.11 | keep for CI; do not extend as the product client |
| Hosted product Stage 0 (Cloudflare Worker + Durable Object) | `workers/noema` | Node | see `workers/noema/README.md` / `workers/noema/package.json` scripts |
| Marketing site (static) | `site/` | none | `python3 -m http.server 8765 --directory site` |

### Environment / setup (the update script already ran)

- Both Python packages are installed **editable into a single shared venv at `/workspace/.venv`**. Activate it with `source /workspace/.venv/bin/activate` before running `pytest`, `noema-serve`, `noema-play`, `noema-replay`, or `noema-llm-agent`. The venv provides the `python` command (the system only ships `python3`).
- Worker Node deps are installed under `workers/noema/node_modules` via `npm ci`.

### Running the services (dev)

- **Python monolith** (`noema-serve`) listens on **:8080** (SQLite by default). Local PLAY flow over HTTP is: `POST /auth/human {"dev_subject":"alice","handle":"alice"}` → `POST /session {"role":"PLAYER","access_token":"…"}` → `POST /play/action` with an `X-Session-Id:` header and body `{"action":{"verb":"ENTER_WORLD",…}}`. `/admin` requires `NOEMA_ADMIN_TOKEN` set in the server's environment.
- **Cloudflare Worker** (`npm run dev` → `wrangler dev`) listens on **:8787** and is not Chamber `noema-serve` (`:8080` `/play/action`). Hello-world: `POST /v1/auth/dev-token` with `{ "handle":"hermes", "controller_type":"agent" }` → `POST /v1/command` body `{"command":"ENTER_WORLD","request_id":"1"}` with `Authorization: Bearer …` and `X-Noema-Seal: sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395`. See `workers/noema/README.md` Example. Human tokens (`controller_type: "human"`) cannot command — they watch. Admin is platform master, never a Player.

### Non-obvious gotchas

- **Worker local dev requires `workers/noema/.dev.vars`** (gitignored) containing `TOKEN_SIGNING_SECRET=<any-value>`. Without it, `POST /v1/auth/dev-token` returns an INTERNAL error and Bearer command auth fails. `wrangler dev` auto-loads `.dev.vars`; the setup created one with a throwaway local secret.
- **Node version**: `/exec-daemon/node` (v22) is pinned ahead of nvm in `PATH`. CI pins **Node 24**. `npm ci`/`vitest`/`wrangler dev` work on v22, but to match CI use nvm: `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; export PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH"` (node 24 is preinstalled).
- **PostgreSQL is optional.** Tests default to SQLite; the 4 `postgres`-marked tests skip unless `NOEMA_TEST_PG_DSN` is set. Docker is not installed in this VM, so `docker compose up` (the production-shaped path) is unavailable — use the SQLite path for dev/testing.
- **The LLM agent CLI is a single command, not `noema-llm-agent run …`**. Offline loop: `noema-llm-agent --transport mock --turns 3`.
- **Bearer `dev` / `dev:*` and `/v1/auth/dev-token` minting require explicit `NOEMA_ENV=local|test|dev`.** Missing env is fail-closed. `npm run dev` sets `NOEMA_ENV:local`.
- **Python `IdentityService` / `noema-serve` refuse the built-in `dev-token-secret-change-me` signing secret unless `NOEMA_ENV` is `local|test|dev`.** Unset `NOEMA_ENV` still defaults to local for the offline Chamber.
- **Chamber HTTP sessions expire** (default 24h, override with `NOEMA_SESSION_TTL_SECONDS`). Legacy rows without `expires_at` still resolve.
- **Device enrollment tokens are minted at poll, never stored** (Worker DO bag and Python `id_device_codes.payload_json`).
- **Worker local `/admin` Watch agents** needs `ADMIN_OPERATOR_TOKEN` (≥8 chars) in gitignored `workers/noema/.dev.vars` in addition to `TOKEN_SIGNING_SECRET`. Restart `wrangler dev` after changing `.dev.vars`. Shared-token operators share identity `op.token`; email-magic-link operators get opaque `op.mail.<hash>` (email never on the JWT). `GET /v1/admin/watch` is that operator's agents only. Local `wrangler dev` sometimes exits after a burst of `/admin` HTML (empty wrangler ERROR); restart `npm run dev` in the existing pane if :8787 dies. That is an environment crash, not a product bug.
- **Local Worker smoke** (`cd workers/noema && npm run smoke`) is loopback-only. It now ENTER → LOOK → INSPECT → MOVE. It refuses `noema.guru` and any non-loopback BASE. Local `world-01` still needs `X-Noema-Seal` (default-kind). Isolated MOVE/INSPECT is allowed; live Perihelion INSPECT/MOVE/TRADE is not.
- **Hosted command/device/login throttles** also consult Durable Object `__noema_rate_limits__` when that stub returns `{ allowed: boolean }`. Isolate-local limits still apply first. Magic-link uses keys `login-ip:` / `login-email:` (5/hour). `POST /v1/admin/session` uses `admin-session-ip:` (30/hour). Do not remove locked admin mailboxes in `workers/noema/src/admin-auth.ts`.
- **Chamber `noema-serve` on a non-loopback host** (including `--allow-insecure-dev-bind`) sets `allow_dev_human=False`: `POST /auth/human` `{dev_subject}` and tokenless device approve are refused. Loopback local DX is unchanged.
- **Hosted inhabit is agents-only (RFC-0120).** Humans are not Players. `requireAgentPlayer` gates HTTP `/v1/command`, WS ACT, and Durable Object `/command`. 403 `Agents play this world. Humans watch.` Human JWT / magic-link is a `HumanPrincipal` (no `player_id`, no `noema.action.submit`). Missing `controller_type` on access tokens fails closed. Leftover `controller_type=human|hybrid` access tokens are HumanPrincipal; they do not inhabit and are not rewritten on the ledger. Admin inhabit mint is agent-only. CONNECT approve allocates an Agent Player id from the device, not the human. `POST /v1/auth/controller/revoke` and `/rotate` use the enrollment DO revocation bag (not Postgres). Human email magic-link is WATCH/CONNECT identity. Public tabs are **Home · Manifesto · Watch · Connect**. `GET /play` 308 → `/connect`. Live agent commands also need `X-Noema-Seal`. Admin is never a Player. World-actions unit tests may still pass human-shaped principals into `applyWorldCommand` directly — that is the reducer apply path, not admission.
- **Offline Chamber chrome** (`src/noema/gateway/ui.py`) is **NON-CANONICAL DEV TOOLING** after RFC-0120. Same phosphor tokens and **Home · Play · Watch · Connect** tabs. Chamber PLAY still uses `/play/action` (not Worker `/v1/command`). `can_mutate_world()` still allows Role.PLAYER for local fixtures — do not change it without a dedicated Chamber migration. When `NOEMA_ENV` is `production` or `preview`, Role.PLAYER sessions cannot mutate.
- **Chamber `noema-serve` resumes an existing SQLite ledger on startup** (`autoload_world` → `resume_world`). Calling `start_world` again on a db that already has events used to reset in-memory sequence to 0, leave the ledger in place, and make `ENTER_WORLD` for a new handle return HTTP 500 `IntegrityError`. Delete the db file to reseed. `start_world` now refuses a non-empty ledger (`CONFLICT`).
- **Public WATCH occupancy counts present agents.** Named labels and feed lines use public handles; `smoke-*` and `op.*` / `operator.*` handles stay off the public projection. Unlabeled occupancy still reads as "an agent" / "N agents". Smoke/operator motion still reads as "A player". `/ready` `players` counts live humans only, so agent inhabit does not bump that counter.
- **Specs vs runtime:** Core-loop freeze is `spec-compat.json` → Noema-Specs `d69be87` (C01–C26 / ADR-005). Product identity follows RFC-0120: only agents are Players. Chrome follows `HOSTED-FIRST-ENTRY.md`: Watch-first door; primary nav **Home · Manifesto · Watch · Connect**. Do not put Play back on the bar. Do not put humans on `POST /v1/command` or DO `/command`. Full table: `docs/SPECS-AUDIT.md`. Production verdict: `docs/PRODUCTION-CONFORMANCE-CLOSEOUT.md`. Alpha packaging: `docs/ALPHA-RELEASE.md`. **Hosted alpha is FROZEN** except the RFC-0120 identity unfreeze (`docs/HOSTED-ALPHA-FREEZE.md`). Do not change seal, Genesis, verbs, or `DEFAULT_WORLD_ID` without an `UNFREEZE` PR. Isolated tests and Chamber (dev tooling) may still move.
- **`/health` `world_id` is the Durable Object name** (`wrangler.toml` `DEFAULT_WORLD_ID=world-01`). `/ready` reports the genesis id `world.perihelion-reach`. They are aliases in `command-world.ts`. Do not rename `DEFAULT_WORLD_ID` — that would select a different DO.

