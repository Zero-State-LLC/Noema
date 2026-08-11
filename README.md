# NOEMA Runtime

Modular monolith for the frozen NOEMA core loop:

```text
PLAY → NOTICE (Frontier + Observatory) → TEST (Lab) → CAPTURE (Compiler)
```

Implements frozen slices of [`Zero-State-LLC/Noema-Specs`](https://github.com/Zero-State-LLC/Noema-Specs).  
Claims: `OBSERVED` / `INFERRED` / `SPECULATIVE` / `NOT_COMPUTABLE`. No consciousness scores.

## Spec pin

See [`spec-compat.json`](spec-compat.json).

| Surface | Fixtures |
|---|---|
| Chamber | `fixtures/v01-seed` |
| Frontier | `fixtures/v02-*` |
| Observatory | `fixtures/v03-*` |
| Lab | `fixtures/v04-*` |
| Compiler | `fixtures/v05-compiler` + `fixtures/v05-catalogs` |

## Phase status

| Phase | Loop | Status |
|---|---|---|
| 1 Chamber | PLAY | Complete |
| 2A Frontier | NOTICE conditions | Complete |
| 2B Observatory | NOTICE detection | Complete |
| 3 Lab | TEST | Complete |
| **4 Compiler** | **CAPTURE** | **This branch** |
| 5 LEARN / Deep Time | LEARN / history | Deferred |

## Architecture

```text
PLAY ── production ledger (fenced writer)
  ├─ research capture
  ├─ Frontier → SITUATION_INJECTED only
  ├─ Observatory → candidates (no world writes)
  ├─ Lab → experimental forks only
  └─ Compiler → CAPTURE AS TEST (research partition only)
```

Compiler never mutates production worlds or rewrites Lab/Observatory history.

## Ordinary capture flow

```text
STUDY test result (READY) → CAPTURE AS TEST → Capturing… → CAPTURED TEST
```

Machine path: admission → compilation request → units/deps → hierarchical ddmin → behavioral oracle → receipt + captured-test + progressive views.

## Quick start (PLAY)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest -q
noema-replay
```

Research layers are optional for local PLAY.

## Research endpoints

| Path | Role |
|---|---|
| `POST /research/frontier/run` | RESEARCHER/ADMIN |
| `POST /research/observatory/run` | RESEARCHER/ADMIN |
| `POST /research/lab/run` | RESEARCHER/ADMIN |
| `POST /research/lab/capture-gate` | READY gate only |
| `POST /research/compiler/capture` | CAPTURE AS TEST |
| `GET /research/view` | research overlays |
| `GET /watch/live` | public redacted |

## Tests

```bash
pytest -q
pytest -q tests/test_phase4_compiler.py
noema-replay
```

## Compiler notes

- Admission requires `compiler_readiness == READY` + passing controls
- Deterministic capture defaults (`capture-defaults/0.5.0`); no hidden LLM planning
- Dependency-closed hierarchical ddmin; **1-minimal ≠ global minimum**
- Oracle: `PRESERVED|NOT_PRESERVED|INCONCLUSIVE|INVALID` — only PRESERVED authorizes removal
- Over-minimization of protected units blocked
- Budget exhaustion → `PARTIALLY_MINIMIZED`, not silent success
- Simple/advanced/reproducibility views share the same captured-test record
- Regression FAIL is not a global ranking

## Explicit deferrals

Deep Time · Genesis · LEARN / Capability Graph · Atlas · microservices · worker fleets · scalar benchmarks

## License

Copyright © 2026 Zero State LLC. Zero State Proprietary License v1.0 — see [`LICENSE`](LICENSE).
