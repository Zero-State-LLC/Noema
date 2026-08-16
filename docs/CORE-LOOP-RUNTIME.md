# NOEMA Runtime — Core Loop Implementation Map

**Status:** Offline Python modular-monolith spine for frozen Specs v0.1–v0.7 + Deep Time/Genesis.  
**Not** a map of the hosted Worker. Product host: `workers/noema` at https://noema.guru (`POST /v1/command`).  
**Authority:** `Zero-State-LLC/Noema-Specs` (`docs/SPEC-FREEZE-CORE-LOOP.md`)

## Product loop

```text
PLAY → NOTICE → TEST → CAPTURE → LEARN
```

| User concept | Spec packages | Runtime modules |
|---|---|---|
| PLAY | Chamber C01–C26 | `world/`, `actions/`, `persistence/`, `observations/`, `cli/play` |
| NOTICE (conditions) | Frontier F01–F15 | `research/frontier/`, post-persist capture |
| NOTICE (detection) | Observatory O01–O16 | `research/observatory/` |
| TEST | Lab L01–L34 | `research/lab/` (isolated forks only) |
| CAPTURE | Compiler P01–P30 | `research/compiler/` |
| LEARN | Capability Graph K01–K12 | `research/learn/` |
| History | Deep Time D01–D30 | `research/deep_time/` |
| Create world | Genesis G01–G09 | `research/genesis/` (ADMIN only) |

## Architectural invariants

1. **One fenced writer** for production world ledger (`WorldStore` + writer fence token).
   - Local PLAY: SQLite with `BEGIN IMMEDIATE`.
   - Production reference: PostgreSQL with cycle commits under `SERIALIZABLE` isolation (DEPLOYMENT / RFC-0003).
2. **WORLD TRUTH ≠ RESEARCH DERIVATION** — research tables/indexes are rebuildable.
3. **Frontier** may inject only via `SITUATION_INJECTED` (and follow-on events) through reducers.
4. **Observatory / Lab / Compiler / LEARN / Deep Time** never rewrite production history.
5. **Lab** mutations only on experimental forks (`mutates_production: false`).
6. **CAPTURE** requires `compiler_readiness: READY`.
7. **Genesis** is admin-only; after activate, config freezes; PLAY needs no Genesis UI.
8. **Lore / LEARN simple views** never strengthen claim labels beyond source evidence.
9. **Canonicalization** is `noema-jcs/1` (sort_keys JSON + sha256) for digests.

## UI handoff

Product UI builders: see **[UI-HANDOFF.md](UI-HANDOFF.md)** for routes, roles, redaction, error shape, PLAY/WATCH/STUDY flows, and non-goals. Marketing site is separate ([GitHub Pages](https://zero-state-llc.github.io/Noema/)).

## Composition root

`NoemaRuntime` (`src/noema/app/runtime.py`) wires:

```text
store + router + research capture
  + frontier + observatory + lab + compiler + learn
  + deep_time + genesis
```

Hosted Worker surfaces are `/`, `/play`, `/watch`, `/connect`, `/study` (stub), `/admin`, `/health`, `/ready`, `/v1/command`, `/v1/watch/live`. The table below is the **offline Python** server.

## HTTP surface (minimal, offline Python)

| Path | Role |
|---|---|
| `/admin/login` | public operator login shell |
| `/admin` | ADMIN-only graphical management console |
| `/admin/overview\|verify` | ADMIN-only bounded projection and safe checks |
| `/admin/start` | ADMIN; load seed |
| `/admin/genesis/preview\|activate` | ADMIN |
| `/play/action`, `/play/observe` | PLAYER/AGENT |
| `/watch/live` | public redacted |
| `/research/frontier/run` | RESEARCHER/ADMIN |
| `/research/observatory/run` | RESEARCHER/ADMIN |
| `/research/lab/run`, `/research/lab/capture-gate` | RESEARCHER/ADMIN |
| `/research/compiler/capture` | RESEARCHER/ADMIN |
| `/research/learn/rebuild\|view` | RESEARCHER/ADMIN |
| `/research/deep-time/ingest` | RESEARCHER/ADMIN |
| `/research/view` | RESEARCHER/ADMIN |
| `/health`, `/ready`, `/version` | public |

`/ready` is **PLAY readiness**; optional research degradation does not block PLAY.

## Verification

```bash
pytest -q
pytest -q tests/test_phase7_core_loop_e2e.py
noema-replay
```

Phase 7 E2E walks Genesis → PLAY → Frontier → Observatory → Lab → CAPTURE → LEARN → Deep Time → WATCH and asserts isolation.

## Persistence (Phase 8)

| Profile | Backend | Cycle transaction |
|---|---|---|
| Local PLAY | SQLite path or `:memory:` | `BEGIN IMMEDIATE` |
| Production / compose | `postgresql://…` DSN | `SERIALIZABLE` + revision + writer fence |

```bash
# local
noema-play --db :memory:
noema-serve --db data/noema.sqlite3

# production-shaped
pip install -e ".[postgres]"
export NOEMA_TEST_PG_DSN=postgresql://noema:noema@127.0.0.1:5432/noema
docker compose up
noema-serve --db "$NOEMA_TEST_PG_DSN"
pytest -q -m postgres
```

Factory: `noema.persistence.open_store(path_or_url)`.

## Operator surfaces (Phase 9)

Specs `OPERATIONS.md` equivalents (CLI names use `noema-*` prefix to match existing entry points):

```bash
noema-verify  --db data/noema.sqlite3 --seed fixtures/v01-seed/world-seed.json
noema-backup  --db data/noema.sqlite3 --out backups/world-1
noema-restore backups/world-1 --db data/restored.sqlite3 --seed fixtures/v01-seed/world-seed.json
```

| Command | Semantics |
|---|---|
| `noema-verify` | Fail-closed checklist; prints `NOEMA VERIFY: PASS` |
| `noema-backup` | Portable bundle: ledger, snapshots, runtime manifest, config digest, fence audit |
| `noema-restore` | Clean target + fresh writer fence; refuses non-empty without `--force`; runs verify |

CI runs the full suite against Postgres 16 and a verify/backup/restore smoke.

## Deployment config + minimal UI (Phase 10)

Non-secret deployment config validates against Specs `deployment-config/1.0` rules
(`noema.config.validate_deployment_config`). Secrets and unknown properties fail closed.
`configuration_digest` is `noema-jcs/1` + sha256 of the resolved config.

```bash
noema-serve --config examples/deployment/local-deployment-config.json
```

| Path | Role |
|---|---|
| `/` | Operator home HTML |
| `/watch` | Spectator HTML (polls `/watch/live`) |
| `/play` | Minimal browser PLAY shell |
| `/manifest` | Runtime manifest JSON |
| `/config` | Non-secret config + digest JSON |

Positive fixture: `examples/deployment/local-deployment-config.json`  
Negative fixture: `examples/deployment/invalid-deployment-config-secret-field.json`

## Evidence receipts + resume windows (Phase 11)

RFC-0003 / SECURITY: signed evidence receipts are **optional** for local gameplay and
**mandatory** for `research-isolated`, `reproducibility`, and `public-evidence-export`.
Missing or invalid required receipts → `INVALID_EVIDENCE` (never silently unsigned).

Reference algorithm: `hmac-sha256` over noema-jcs/1 body (`evidence-receipt/1.0`).
Keyring is operator-side only; public bundles never embed secrets. Key rotation
keeps retired keys for historical verification.

```bash
noema-keygen-evidence --out var/evidence-keyring.json
noema-export-evidence --db data/noema.sqlite3 --keyring var/evidence-keyring.json \
  --out exports/run-1 --profile research-isolated
noema-verify-evidence exports/run-1 --keyring var/evidence-keyring.json
noema-verify --db data/noema.sqlite3 --seed fixtures/v01-seed/world-seed.json \
  --evidence-bundle exports/run-1 --evidence-keyring var/evidence-keyring.json
```

Resume/ack delivery windows are non-canonical, bounded (default 256), and only
reference **committed** sequences. Uncommitted acks fail closed.

## Explicit non-goals (still deferred)

- v0.8 Phenomena platform
- Graph DB / microservices / worker fleets
- LLM claim-bearing planners
- Consciousness / intelligence scores
- Full market / religion / procedural lore engines
