# AGENTS.md

## Cursor Cloud specific instructions

This repo hosts **two runtimes of the same world engine plus supporting pieces** (see `README.md`). They are independent — do not treat them as one product.

| Component | Path | Toolchain | Standard commands |
|---|---|---|---|
| Offline Chamber / conformance runtime (primary) | `src/noema` | Python ≥3.11 | see `README.md` "Quick start" / `pyproject.toml` `[project.scripts]` |
| LLM Controller client | `clients/noema-llm-agent` | Python ≥3.11 | see `clients/noema-llm-agent/README.md` |
| Hosted product Stage 0 (Cloudflare Worker + Durable Object) | `workers/noema` | Node | see `workers/noema/README.md` / `workers/noema/package.json` scripts |
| Marketing site (static) | `site/` | none | `python3 -m http.server 8765 --directory site` |

### Environment / setup (the update script already ran)

- Both Python packages are installed **editable into a single shared venv at `/workspace/.venv`**. Activate it with `source /workspace/.venv/bin/activate` before running `pytest`, `noema-serve`, `noema-play`, `noema-replay`, or `noema-llm-agent`. The venv provides the `python` command (the system only ships `python3`).
- Worker Node deps are installed under `workers/noema/node_modules` via `npm ci`.

### Running the services (dev)

- **Python monolith** (`noema-serve`) listens on **:8080** (SQLite by default). Local PLAY flow over HTTP is: `POST /auth/human {"dev_subject":"alice","handle":"alice"}` → `POST /session {"role":"PLAYER","access_token":"…"}` → `POST /play/action` with an `X-Session-Id:` header and body `{"action":{"verb":"ENTER_WORLD",…}}`. `/admin` requires `NOEMA_ADMIN_TOKEN` set in the server's environment.
- **Cloudflare Worker** (`npm run dev` → `wrangler dev`) listens on **:8787** and runs fully local (no Cloudflare login needed). Hello-world: `POST /v1/auth/dev-token` → `POST /v1/command {"command":"ENTER_WORLD"}` with `Authorization: Bearer …`.

### Non-obvious gotchas

- **Worker local dev requires `workers/noema/.dev.vars`** (gitignored) containing `TOKEN_SIGNING_SECRET=<any-value>`. Without it, `POST /v1/auth/dev-token` returns an INTERNAL error and Bearer command auth fails. `wrangler dev` auto-loads `.dev.vars`; the setup created one with a throwaway local secret.
- **Node version**: `/exec-daemon/node` (v22) is pinned ahead of nvm in `PATH`. CI pins **Node 24**. `npm ci`/`vitest`/`wrangler dev` work on v22, but to match CI use nvm: `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; export PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH"` (node 24 is preinstalled).
- **PostgreSQL is optional.** Tests default to SQLite; the 4 `postgres`-marked tests skip unless `NOEMA_TEST_PG_DSN` is set. Docker is not installed in this VM, so `docker compose up` (the production-shaped path) is unavailable — use the SQLite path for dev/testing.
- **The LLM agent CLI is a single command, not `noema-llm-agent run …`**. Offline loop: `noema-llm-agent --transport mock --turns 3`.
- **Bearer `dev` / `dev:*` and `/v1/auth/dev-token` minting require explicit `NOEMA_ENV=local|test|dev`.** Missing env is fail-closed. `npm run dev` sets `NOEMA_ENV:local`.
- **Python `IdentityService` / `noema-serve` refuse the built-in `dev-token-secret-change-me` signing secret unless `NOEMA_ENV` is `local|test|dev`.** Unset `NOEMA_ENV` still defaults to local for the offline Chamber.
- **Chamber HTTP sessions expire** (default 24h, override with `NOEMA_SESSION_TTL_SECONDS`). Legacy rows without `expires_at` still resolve.
- **Device enrollment tokens are minted at poll, never stored** (Worker DO bag and Python `id_device_codes.payload_json`).
- **Worker local `/admin` Watch agents** needs `ADMIN_OPERATOR_TOKEN` (≥8 chars) in gitignored `workers/noema/.dev.vars` in addition to `TOKEN_SIGNING_SECRET`. Restart `wrangler dev` after changing `.dev.vars`. Shared-token operators share identity `op.token`; email-magic-link operators get opaque `op.mail.<hash>` (email never on the JWT). `GET /v1/admin/watch` is that operator's agents only.
- **Hosted command/device/login throttles** also consult Durable Object `__noema_rate_limits__` when that stub returns `{ allowed: boolean }`. Isolate-local limits still apply first. Magic-link uses keys `login-ip:` / `login-email:` (5/hour). `POST /v1/admin/session` uses `admin-session-ip:` (30/hour). Do not remove locked admin mailboxes in `workers/noema/src/admin-auth.ts`.
- **Chamber `noema-serve` on a non-loopback host** (including `--allow-insecure-dev-bind`) sets `allow_dev_human=False`: `POST /auth/human` `{dev_subject}` and tokenless device approve are refused. Loopback local DX is unchanged.
- **`POST /admin/start` `seed_path`** must resolve to a file under `fixtures/`. PLAY/STUDY HTML requires credentials (controller token / operator token); they no longer post unauthenticated PLAYER/RESEARCHER sessions.

