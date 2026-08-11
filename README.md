# NOEMA Runtime

Modular monolith for the frozen NOEMA core loop **and** Deep Time / Genesis foundation:

```text
PLAY → NOTICE → TEST → CAPTURE → LEARN
Admin Genesis → Cycle 0 ordinary world → Deep Time history layers
```

| Area | Status |
|---|---|
| Chamber / Frontier / Observatory / Lab / Compiler / LEARN | Complete |
| **Deep Time + Genesis** | **This branch** |

Implements frozen slices of [`Zero-State-LLC/Noema-Specs`](https://github.com/Zero-State-LLC/Noema-Specs).

## Deep Time

Derived historical records (institutions, succession, artifacts, claims, scars, names, reconstruction).

- Lore is **presentation**, not a second world truth  
- Artifact claims `claims_are_not_world_truth: true`  
- Decay never mutates the canonical event ledger  
- Contested claims retained without forced resolution  
- PLAY projections use plain language  

## Genesis (admin-only)

```text
ADMIN → profile + seed + story seeds → PREVIEW → ACTIVATE → Cycle 0 world → PLAY
```

Players/agents/researchers cannot configure Genesis. After activation, config is frozen; a new Genesis run means a new world.

## Endpoints

| Path | Role |
|---|---|
| `POST /admin/genesis/preview` | ADMIN |
| `POST /admin/genesis/activate` | ADMIN |
| `POST /research/deep-time/ingest` | RESEARCHER/ADMIN |
| `GET /watch/live` | public |

## Tests

```bash
pytest -q
pytest -q tests/test_phase6_deep_time_genesis.py
noema-replay
```

## Explicit deferrals

Full markets · religion sim · procedural lore engine · long prehistory sim · v0.8 Phenomena

## License

Copyright © 2026 Zero State LLC. Zero State Proprietary License v1.0 — see [`LICENSE`](LICENSE).
