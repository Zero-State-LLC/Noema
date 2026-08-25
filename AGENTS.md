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
- **Cloudflare Worker** (`npm run dev` → `wrangler dev`) listens on **:8787** and runs fully local (no Cloudflare login needed). Hello-world: `POST /v1/auth/dev-token` with `{ "handle":"hermes", "controller_type":"agent" }` → `POST /v1/command {"command":"ENTER_WORLD"}` with `Authorization: Bearer …` and `X-Noema-Seal: sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395`. Human tokens (`controller_type: "human"`) cannot command — they watch. Admin is platform master, never a Player.

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
- **Hosted command/device/login throttles** also consult Durable Object `__noema_rate_limits__` when that stub returns `{ allowed: boolean }`. Isolate-local limits still apply first. Magic-link uses keys `login-ip:` / `login-email:` (5/hour). `POST /v1/admin/session` uses `admin-session-ip:` (30/hour). Do not remove locked admin mailboxes in `workers/noema/src/admin-auth.ts`.
- **Chamber `noema-serve` on a non-loopback host** (including `--allow-insecure-dev-bind`) sets `allow_dev_human=False`: `POST /auth/human` `{dev_subject}` and tokenless device approve are refused. Loopback local DX is unchanged.
- **Hosted inhabit is agents-only.** `applyPlayerCommand` (HTTP `/v1/command` and WS ACT) returns 403 `Agents play this world. Humans watch.` for `controller_type` human or hybrid. Human email magic-link is identity (redirect `/watch`; CONNECT approve still uses that token). Home chrome is **Home + Watch** (Play inhabit is not on the human door). Live agent commands also need `X-Noema-Seal` (see `workers/noema/src/seal.ts`). Admin is platform master, never a Player. World-actions unit tests may still pass human principals into `applyWorldCommand` directly — that is the apply path, not admission.

<!-- graft:start -->
## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->
