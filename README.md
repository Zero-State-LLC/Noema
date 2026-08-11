# NOEMA Runtime

World Engine **modular monolith** implementing the frozen NOEMA core loop from  
[`Zero-State-LLC/Noema-Specs`](https://github.com/Zero-State-LLC/Noema-Specs).

```text
PLAY → NOTICE → TEST → CAPTURE → LEARN
Admin Genesis → Cycle 0 → Deep Time history
```

| Layer | Spec | Status |
|---|---|---|
| Chamber | v0.1 | Complete |
| Frontier | v0.2 | Complete |
| Observatory | v0.3 | Complete |
| Lab | v0.4 | Complete |
| Compiler | v0.5 | Complete |
| Deep Time + Genesis | v0.6 | Complete |
| LEARN | v0.7 | Complete |
| **Core-loop E2E** | — | **Phase 7** |

Claim labels: `OBSERVED` / `INFERRED` / `SPECULATIVE` / `NOT_COMPUTABLE`.  
No consciousness or scalar intelligence scores.

## Spec pin

See [`spec-compat.json`](spec-compat.json) and [`docs/CORE-LOOP-RUNTIME.md`](docs/CORE-LOOP-RUNTIME.md).

## Quick start (PLAY)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest -q
noema-replay          # Chamber seed EQUIVALENT
noema-play            # local text PLAY
python scripts/core_loop_demo.py
```

Research layers are **optional** for local PLAY. `/ready` is PLAY readiness only.

## Architecture

```text
src/noema/
  world/           pure reducers + state + digests
  actions/         single action router
  persistence/     SQLite world + research_* indexes
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
  cli/             noema-replay | serve | play
```

**Invariants:** one fenced writer · research ≠ world truth · Frontier injects only via ledger events · Lab never mutates production · CAPTURE needs `READY` Lab results · Genesis is ADMIN-only.

## HTTP (minimal)

| Path | Role |
|---|---|
| `GET /health` `/ready` `/version` | public |
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

v0.8 Phenomena · graph DB / microservices · LLM claim planners · full market/religion sims · procedural lore engines · consciousness scores

## License

Copyright © 2026 Zero State LLC. Zero State Proprietary License v1.0 — see [`LICENSE`](LICENSE).
