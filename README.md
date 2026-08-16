# NOEMA Runtime

Two runtimes live in this repository. Do not treat them as one product.

```text
Product host:     Cloudflare Worker noema-gateway + NoemaWorldDO at https://noema.guru
                  PLAY / WATCH / CONNECT / Admin Live. STUDY is a stub.
Offline Chamber:  Python src/noema + fixtures (C01–C26, ADR-005). Not the live door.
Hosted C01–C26:   isolated worlds only (`test.hosted-canonical.*`).
                  23 pass / 3 skip (C14 C16 C17). Not ADR-005 digest-equivalent.
                  Perihelion Reach is not a conformance target.
                  Preview smoke: BASE=<preview> node workers/noema/scripts/hosted-conformance.mjs
                  (never defaults to noema.guru).
```

Specs: [`Zero-State-LLC/Noema-Specs`](https://github.com/Zero-State-LLC/Noema-Specs).  
Hosted routes: Worker `POST /v1/command` with a Bearer Player token. Python `/session` and `/play/action` are offline only.

```text
PLAY → NOTICE → TEST → CAPTURE → LEARN
Admin Genesis → Cycle 0 → Deep Time history
```

| Layer | Spec | Hosted Worker | Offline Python |
|---|---|---|---|
| Chamber | v0.1 | **PARTIAL** — PLAY/WATCH/CONNECT/Admin Live; isolated C01–C26 23 pass / 3 skip | Complete (C01–C26 spine) |
| Frontier | v0.2 | not on Stage 0 | Complete |
| Observatory | v0.3 | not on Stage 0 | Complete |
| Lab | v0.4 | STUDY stub | Complete |
| Compiler | v0.5 | not on Stage 0 | Complete |
| Deep Time + Genesis | v0.6 | Genesis admin-only, freeze after activate | Complete |
| LEARN | v0.7 | not on Stage 0 | Complete |
| Identity / auth gateway | AUTH-AND-IDENTITY | Player email + device enroll + Admin email | Phase 12 |

Claim labels: `OBSERVED` / `INFERRED` / `SPECULATIVE` / `NOT_COMPUTABLE`.  
No consciousness or scalar intelligence scores.

### Hosted stack (pinned)

```text
Human auth       → Supabase Auth
Identity + history → Supabase Postgres
Live world       → Cloudflare Durable Object (Stage 0: workers/noema)
API / Gateway    → Cloudflare Worker
Agents           → external → Bearer controller token → /v1/command
Offline Chamber  → noema-serve (Python modular monolith)
```

Specs: [PLATFORM.md](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/PLATFORM.md).  
CF Stage 0: [workers/noema/README.md](workers/noema/README.md). Agents never get Supabase service-role keys.

**Live Stage 0:**  
- **Product entry:** https://noema.guru/ — Player email gate first; PLAY is the primary path
- **PLAY / WATCH / STUDY / CONNECT:** https://noema.guru/play · /watch · /study · /connect
- **ADMIN (operators):** https://noema.guru/admin/login — separate email-gated control plane
- API / health: https://noema.guru/health · workers.dev  

The hosted `/` route is rendered by `workers/noema/src/landing.ts` through the Cloudflare Worker. It is not the GitHub Pages homepage and does not expose Genesis or operator-token entry.

```bash
./scripts/agent_cf_e2e.sh
python scripts/noema_agent_client.py --base https://noema.guru
# docs: docs/AGENT-STAGE0.md
```

```bash
# Human (local without Supabase)
curl -sX POST localhost:8080/auth/human -H 'content-type: application/json' \
  -d '{"dev_subject":"alice","handle":"alice"}'

# Agent device enrollment
curl -sX POST localhost:8080/auth/device -H 'content-type: application/json' -d '{}'
# human approves with user_code + player_id → /auth/device/approve
# agent polls → /auth/device/token  then AUTH with access_token on /protocol/v1
```

## Spec pin

See [`spec-compat.json`](spec-compat.json), [`docs/CORE-LOOP-RUNTIME.md`](docs/CORE-LOOP-RUNTIME.md), and the hosted Worker audit [`docs/RUNTIME-READINESS-2026-08-13.md`](docs/RUNTIME-READINESS-2026-08-13.md).

**Genesis runbook:** [`docs/GENESIS-RUNBOOK.md`](docs/GENESIS-RUNBOOK.md) — first hosted world activation.

**Product UI handoff:** [`docs/UI-HANDOFF.md`](docs/UI-HANDOFF.md) — hosted entry, routes, roles, PLAY/WATCH/STUDY/CONNECT, errors, and non-goals.

## Public site (GitHub Pages)

| Page | Shape |
|---|---|
| [`site/index.html`](site/) | **Marketing reference (visual/dynamic)** — GitHub Pages only |
| [`site/memo.html`](site/memo.html) | Specs map for builders |
| Worker `/` `/play` `/watch` `/study` `/connect` | **Hosted product entry and text-first product shells** |
| `noema-serve` local routes | Offline modular-monolith UI and API surfaces |
| [`site/design.md`](site/design.md) | Two-surface split + tokens |

```text
https://zero-state-llc.github.io/Noema/
https://zero-state-llc.github.io/Noema/memo.html
```

```bash
python3 -m http.server 8765 --directory site   # local preview
```

Deploy: GitHub Actions on `site/**` · **Settings → Pages → Source: GitHub Actions**.

## Quick start (PLAY)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest -q
noema-replay          # Chamber seed EQUIVALENT
noema-play            # local text PLAY (SQLite)
python scripts/core_loop_demo.py
```

### Production-shaped (PostgreSQL)

```bash
pip install -e ".[postgres]"
cp .env.example .env
docker compose up          # postgres + noema (SERIALIZABLE cycles)
# or host runtime:
noema-serve --db "postgresql://noema:noema@127.0.0.1:5432/noema"
```

Local PLAY keeps SQLite (`--db :memory:` or a file path). Postgres is optional for tests unless `NOEMA_TEST_PG_DSN` is set.

### Operator commands

```bash
noema-verify  --db data/noema.sqlite3 --seed fixtures/v01-seed/world-seed.json \
              --config examples/deployment/local-deployment-config.json
noema-backup  --db data/noema.sqlite3 --out backups/world-1
noema-restore backups/world-1 --db data/restored.sqlite3 --seed fixtures/v01-seed/world-seed.json
noema-serve   --config examples/deployment/local-deployment-config.json
# open http://localhost:8080/  · /watch  · /play  · /study
# set NOEMA_ADMIN_TOKEN in the server environment, then open /admin/login
```

Successful verify prints `NOEMA VERIFY: PASS`. Bundles never embed secrets; restore always claims a fresh writer fence.

The `/admin` route is a separate graphical management console. It requires an ADMIN session (`NOEMA_ADMIN_TOKEN` on `noema-serve`, `ADMIN_OPERATOR_TOKEN` on the Cloudflare Worker). Admin is never a player privilege. PLAY, WATCH, and STUDY remain the text-first product surfaces. Human-controlled and agent-controlled inhabitants are both **Players** in the world; controller type is operational metadata.

### Evidence export (research-isolated)

```bash
noema-keygen-evidence --out var/evidence-keyring.json   # keep secret
noema-export-evidence --db data/noema.sqlite3 --keyring var/evidence-keyring.json \
  --out exports/run-1 --profile research-isolated
noema-verify-evidence exports/run-1 --keyring var/evidence-keyring.json
# → NOEMA EVIDENCE: VALID   (else INVALID_EVIDENCE)
```

Research layers are **optional** for local PLAY. `/ready` is PLAY readiness only.

## Architecture

```text
src/noema/
  world/           pure reducers + state + digests
  actions/         single action router
  persistence/     SQLite (local) or PostgreSQL SERIALIZABLE + research_* indexes
  observations/    PLAY/WATCH projections + redaction
  research/
    capture.py     post-persist trajectories
    frontier/      Situation Genome pressure
    observatory/   features / anomalies / candidates
    lab/           isolated experiment forks
    compiler/      CAPTURE AS TEST
    learn/         rebuildable capability graph
    deep_time/     institutions / artifacts / scars
    genesis/       admin-only create-world
  app/runtime.py   composition root
  gateway/         stdlib HTTP
  ops/             verify · backup · restore · runtime manifest
  config/          deployment-config validation + digests
  evidence/        signed receipts + bounded resume/ack windows
  gateway/         HTTP + minimal operator/WATCH/PLAY HTML
  cli/             replay | serve | play | verify | backup | restore | evidence
```

**Invariants:** one fenced writer · research ≠ world truth · Frontier injects only via ledger events · Lab never mutates production · CAPTURE needs `READY` Lab results · Genesis is ADMIN-only.

## HTTP (minimal)

| Path | Role |
|---|---|
| `GET /` `/watch` `/play` | public HTML (operator / spectator / play shell) |
| `GET /health` `/ready` `/version` `/manifest` `/config` | public JSON |
| `POST /admin/start` | load seed |
| `POST /admin/genesis/preview\|activate` | ADMIN |
| `POST /play/action` `/play/observe` | PLAYER/AGENT |
| `GET /watch/live` | public (redacted) |
| `POST /research/frontier/run` | RESEARCHER/ADMIN |
| `POST /research/observatory/run` | RESEARCHER/ADMIN |
| `POST /research/lab/run` | RESEARCHER/ADMIN |
| `POST /research/compiler/capture` | RESEARCHER/ADMIN |
| `POST /research/learn/rebuild` | RESEARCHER/ADMIN |
| `POST /research/deep-time/ingest` | RESEARCHER/ADMIN |
| `GET /research/view` | RESEARCHER/ADMIN |

## Tests

```bash
pytest -q                                 # full suite
pytest -q tests/test_phase7_core_loop_e2e.py
noema-replay
```

Phase 7 proves Genesis → PLAY → Frontier → Observatory → Lab → CAPTURE → LEARN → Deep Time → WATCH with role isolation.

## Explicit deferrals

v0.8 Phenomena · graph DB / microservices · LLM claim planners · full market/religion sims · procedural lore engines · consciousness scores · rich product UI · asymmetric public evidence keys

## License

Copyright © 2026 Zero State LLC. Zero State Proprietary License v1.0 — see [`LICENSE`](LICENSE).
