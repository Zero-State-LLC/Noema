# NOEMA Runtime

Modular monolith for **NOEMA** core loop through Lab TEST:

```text
PLAY → NOTICE (Frontier + Observatory) → TEST (Lab)
```

Implements frozen slices of [`Zero-State-LLC/Noema-Specs`](https://github.com/Zero-State-LLC/Noema-Specs).  
Claim labels: `OBSERVED` / `INFERRED` / `SPECULATIVE` / `NOT_COMPUTABLE`. No consciousness scores.

## Spec pin

See [`spec-compat.json`](spec-compat.json).

| Surface | Package |
|---|---|
| Chamber | `fixtures/v01-seed` |
| Frontier | `fixtures/v02-frontier` |
| Observatory | `fixtures/v03-observatory` |
| Lab | `fixtures/v04-lab` + `fixtures/v04-catalogs` |

## Phase status

| Phase | Status |
|---|---|
| 1 Chamber PLAY | Complete |
| 2A Frontier | Complete |
| 2B Observatory | Complete |
| **3 Lab TEST** | **This branch** |
| 4 Compiler CAPTURE | Deferred |
| LEARN / Deep Time | Deferred |

## Architecture

```text
PLAY ── fenced writer ── production ledger
                │
                ├─ research capture (trajectories)
                ├─ Frontier (SITUATION_INJECTED only via reducer)
                ├─ Observatory (candidates; no world writes)
                └─ Lab (experimental forks only; never production ledger)
```

**Lab isolation:** `mutates_production: false`. Experimental worlds use separate `storage_namespace` and experimental ledger identity.

## Quick start (PLAY)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest -q
noema-replay
noema-play
```

Lab/Frontier/Observatory are **not** required for local PLAY.

## Research endpoints

| Method | Path | Role |
|---|---|---|
| POST | `/research/frontier/run` | RESEARCHER/ADMIN |
| POST | `/research/observatory/run` | RESEARCHER/ADMIN |
| POST | `/research/lab/run` | RESEARCHER/ADMIN |
| POST | `/research/lab/capture-gate` | RESEARCHER/ADMIN (`READY` only) |
| GET | `/research/view` | RESEARCHER/ADMIN |
| GET | `/watch/live` | public (redacted) |

## Tests

```bash
pytest -q
pytest -q tests/test_phase3_lab.py
noema-replay
```

## Lab notes

- Intent → deterministic design compile (no hidden methodology)
- Fork only at legal points; mid-reducer forbidden
- Ablation / perturbation closed catalogs; unsupported lesion → `NOT_COMPUTABLE`
- Controls (baseline + sham), replication classification, confounds retained
- Simple result projection never strengthens claim labels
- `CAPTURE AS TEST` gated on `compiler_readiness: READY` (no fixture creation)

## Explicit deferrals

Phenomenon Compiler · Deep Time · LEARN · microservices · worker fleets · LLM claim path · live-world intervention

## License

Copyright © 2026 Zero State LLC. Zero State Proprietary License v1.0 — see [`LICENSE`](LICENSE).
