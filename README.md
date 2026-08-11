# NOEMA Runtime

World Engine runtime for **NOEMA** — Chamber PLAY + Frontier NOTICE + Observatory detection in a single modular monolith.

Implements frozen slices of [`Zero-State-LLC/Noema-Specs`](https://github.com/Zero-State-LLC/Noema-Specs).  
Does **not** claim consciousness measurement. Claim labels remain `OBSERVED` / `INFERRED` / `SPECULATIVE` / `NOT_COMPUTABLE`.

## Spec pin

See [`spec-compat.json`](spec-compat.json).

| Field | Value |
|---|---|
| Specs repo | `Zero-State-LLC/Noema-Specs` |
| Authority | core-loop freeze + v0.2 Frontier + v0.3 Observatory |
| Chamber fixtures | `fixtures/v01-seed` |
| Frontier fixtures | `fixtures/v02-frontier` + `fixtures/v02-catalogs` |
| Observatory fixtures | `fixtures/v03-observatory` + `fixtures/v03-catalogs` |
| Event catalog | `event-catalog/0.1` |
| Frontier director | `frontier-director/0.2` |
| Observatory | `observatory/0.3` |
| Canonicalization | `noema-jcs/1` |

## Phase status

| Phase | Status |
|---|---|
| Phase 0 / 1 Chamber MVP | **Complete** — seed replay EQUIVALENT |
| Phase 2A Research capture + Frontier | **Complete** |
| **Phase 2B Observatory** | **This branch** |
| Lab / Compiler / LEARN / Deep Time | Deferred |

## Architecture (modular monolith)

```text
PLAY (validate → schedule → reduce → persist → project)
        ↓ post-persist seam
research capture → trajectory indexes (rebuildable)
        ↓
Frontier Director (conditions) ──→ SITUATION_INJECTED → ledger
        ↓
Observatory (features → baselines → detectors → candidates)
        ↓ research partition only
anomaly / shift / capability / unknown candidates + audit
```

**WORLD TRUTH ≠ RESEARCH DERIVATION.**

| Module | May write world? |
|---|---|
| PLAY actions | Yes (via reducer) |
| Frontier injection | Yes (`SITUATION_INJECTED` only) |
| Observatory | **No** |

## Quick start (PLAY only)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest -q
noema-replay
noema-play
```

Frontier and Observatory are **not** required for local PLAY.

### HTTP

```bash
noema-serve --port 8080
```

| Method | Path | Notes |
|---|---|---|
| GET | `/health` `/ready` `/version` | PLAY readiness ignores optional research |
| POST | `/play/action` | PLAY only |
| GET | `/watch/live` | public; research metrics redacted |
| POST | `/research/frontier/run` | RESEARCHER/ADMIN |
| POST | `/research/observatory/run` | RESEARCHER/ADMIN; offline analysis |
| GET | `/research/view` | RESEARCHER/ADMIN |

## Tests

```bash
pytest -q
pytest -q tests/test_phase2a_frontier.py
pytest -q tests/test_phase2b_observatory.py
noema-replay
```

## Observatory notes

- Deterministic claim-bearing path only (no opaque ML authority)
- Baselines frozen per analysis run (silent rebuild forbidden)
- Capability candidates are `SPECULATIVE` + `replication_required`
- UNKNOWN_* markers need not map to a primitive
- WATCH never receives anomaly scores / detector metadata

## Explicit deferrals

Lab · Compiler · LEARN · Deep Time · Genesis · microservices · graph DB · worker fleets · LLM planner · embeddings · scalar intelligence scores

## Layout

```text
src/noema/
  world/                 pure reducers + state
  research/
    capture.py           post-persist trajectories
    frontier/            v0.2 Frontier Director
    observatory/         v0.3 features/baselines/detectors
  persistence/           SQLite world + research_* tables
  app/                   composition root
fixtures/v01-seed|v02-*|v03-*
```

## License

Copyright © 2026 Zero State LLC. Licensed under the Zero State Proprietary License v1.0. See [`LICENSE`](LICENSE).
