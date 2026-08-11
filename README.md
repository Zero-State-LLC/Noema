# NOEMA Runtime

World Engine runtime for **NOEMA** — Phase 2A adds research capture + Frontier NOTICE on the stable Chamber modular monolith.

Implements frozen slices of [`Zero-State-LLC/Noema-Specs`](https://github.com/Zero-State-LLC/Noema-Specs).  
Does **not** claim consciousness measurement. Claim labels remain `OBSERVED` / `INFERRED` / `SPECULATIVE` / `NOT_COMPUTABLE`.

## Spec pin

See [`spec-compat.json`](spec-compat.json).

| Field | Value |
|---|---|
| Specs repo | `Zero-State-LLC/Noema-Specs` |
| Authority | core-loop freeze + v0.2 Frontier contracts |
| Chamber fixtures | `fixtures/v01-seed` |
| Frontier fixtures | `fixtures/v02-frontier` + `fixtures/v02-catalogs` |
| Event catalog | `event-catalog/0.1` |
| Frontier director | `frontier-director/0.2` |
| Canonicalization | `noema-jcs/1` |

## Phase status

| Phase | Status |
|---|---|
| Phase 0 / 1 Chamber MVP | **Complete** — seed replay EQUIVALENT |
| **Phase 2A Research capture + Frontier** | **This branch** |
| Phase 2B Observatory | Deferred |
| Lab / Compiler / LEARN / Deep Time | Deferred |

## Architecture (modular monolith)

```text
PLAY (validate → schedule → reduce → persist → project)
        ↓ post-persist seam
research capture → trajectory indexes (rebuildable)
        ↓
Frontier Director (enumerate → score → select → audit)
        ↓
canonical SITUATION_INJECTED (+ optional ENTITY_UPDATE)
        ↓
ledger (world truth)
```

**WORLD TRUTH ≠ RESEARCH DERIVATION.** Frontier may read world state and propose condition changes; it must not rewrite ledger history, mutate reducers directly, or force agent actions.

## Quick start (PLAY only)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest -q
noema-replay
noema-play
```

Frontier is **not** required for local PLAY.

### HTTP

```bash
noema-serve --port 8080
```

| Method | Path | Notes |
|---|---|---|
| GET | `/health` `/ready` `/version` | PLAY readiness ignores optional research degradation |
| POST | `/admin/start` | load seed |
| POST | `/session` | roles: PLAYER, AGENT, SPECTATOR, RESEARCHER, ADMIN |
| POST | `/play/action` | PLAY only |
| GET | `/watch/live` | public; research metadata redacted |
| POST | `/research/frontier/run` | RESEARCHER/ADMIN only |
| GET | `/research/frontier/audit/<id>` | RESEARCHER/ADMIN |
| GET | `/research/view` | RESEARCHER/ADMIN |

## Frontier tests / demo

```bash
# Full suite (Chamber + F01–F15 + E2E)
pytest -q

# Frontier only
pytest -q tests/test_phase2a_frontier.py

# Chamber seed replay
noema-replay
```

Deterministic Frontier demo path (in tests):

```text
start Chamber → player ENTER/LOOK → capture trajectory
→ Frontier run (RESEARCHER) → select Situation Genome
→ inject SITUATION_INJECTED through reducer/ledger
→ player observation (no research private fields)
→ WATCH redacts targeting metadata
→ audit references canonical event digests
```

## Research capture

- Module: `src/noema/research/`
- Trajectory records reference ledger event digests (not a second event stream)
- Stored in SQLite tables `research_*` separate from world tables
- Rebuild: `runtime.rebuild_research_indexes()` from canonical ledger

## Explicit deferrals

Observatory · Lab · Compiler · LEARN · Deep Time · Genesis · microservices · graph DB · worker fleets · LLM planner · embeddings/vector infra · public Frontier platform API

## Layout

```text
src/noema/
  world/          pure reducers + state + digests
  research/       capture, trajectories, frontier/*
  actions/        single action router (PLAY)
  persistence/    SQLite world + research indexes
  observations/   permissioned projections + redaction
  app/            composition root
fixtures/v01-seed/
fixtures/v02-frontier/
fixtures/v02-catalogs/
```

## License

Copyright © 2026 Zero State LLC. Licensed under the Zero State Proprietary License v1.0. See [`LICENSE`](LICENSE).
