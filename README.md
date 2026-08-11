# NOEMA Runtime

Modular monolith for the frozen NOEMA core loop:

```text
PLAY → NOTICE → TEST → CAPTURE → LEARN
```

| Phase | Status |
|---|---|
| Chamber PLAY | Complete |
| Frontier + Observatory NOTICE | Complete |
| Lab TEST | Complete |
| Compiler CAPTURE | Complete |
| **LEARN Capability Graph** | **This branch** |
| Deep Time / Genesis | Deferred |

Implements frozen slices of [`Zero-State-LLC/Noema-Specs`](https://github.com/Zero-State-LLC/Noema-Specs).  
Claims: `OBSERVED` / `INFERRED` / `SPECULATIVE` / `NOT_COMPUTABLE`.

## Architecture

```text
PLAY ── production ledger
  ├─ Frontier / Observatory / Lab / Compiler (research)
  └─ LEARN projection (rebuildable disposable index)
```

LEARN answers: what was reproduced, by whom, under which conditions, where it generalizes/fails, what remains untested.  
It does **not** modify gameplay or create evidence.

## Closed edge taxonomy

`OBSERVED_IN` · `REPRODUCED_BY` · `DEPENDS_ON` · `FAILS_WITHOUT` · `GENERALIZES_TO` · `DIFFERS_ACROSS_VERSION`

No transitive automatic edges. Not-tested ≠ failed.

## Quick start

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest -q
noema-replay
```

## Research endpoints

| Path | Role |
|---|---|
| `POST /research/compiler/capture` | CAPTURE AS TEST |
| `POST /research/learn/rebuild` | rebuild LEARN index |
| `GET/POST /research/learn/view` | LEARN projection |
| `GET /research/view` | all research indexes |
| `GET /watch/live` | public redacted |

## Tests

```bash
pytest -q
pytest -q tests/test_phase5_learn.py
```

## Explicit deferrals

Deep Time · Genesis · v0.8 Phenomena · graph DB/service · model rankings · consciousness scores

## License

Copyright © 2026 Zero State LLC. Zero State Proprietary License v1.0 — see [`LICENSE`](LICENSE).
