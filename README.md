# NOEMA Runtime

World Engine runtime for **NOEMA v0.1 — The Chamber** (Phase 1 playable modular monolith).

Implements the frozen core-loop Chamber slice of [`Zero-State-LLC/Noema-Specs`](https://github.com/Zero-State-LLC/Noema-Specs).  
Does **not** claim consciousness measurement. Claim labels remain `OBSERVED` / `INFERRED` / `SPECULATIVE` / `NOT_COMPUTABLE`.

## Spec pin

See [`spec-compat.json`](spec-compat.json).

| Field | Value |
|---|---|
| Specs repo | `Zero-State-LLC/Noema-Specs` |
| Authority | `main` / core-loop freeze (`docs/SPEC-FREEZE-CORE-LOOP.md`) |
| Chamber fixtures | `fixtures/v01-seed` (from Specs `examples/v01-seed`) |
| Event catalog | `event-catalog/0.1` |
| World rules | `world/v1` |
| Canonicalization | `noema-jcs/1` |
| Agent protocol | `agent-protocol/v1` |

**Known SPEC DEFECT:** Specs `expected-final-state-digest.txt` may not match digest of `expected-final-state.json` after RFC-0003 lineage fields were added to the JSON. Runtime treats the JSON shape as authority and recomputes its digest (see `spec-compat.json`).

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest -q
noema-replay
noema-play
```

### HTTP modular monolith

```bash
noema-serve --port 8080
# or
docker compose up --build
```

Endpoints:

- `GET /health` `/ready` `/version`
- `POST /admin/start` `{ "seed_path": "..." }`
- `POST /session` `{ "role": "PLAYER", "agent_id": "agent.x" }`
- `POST /play/action` header `X-Session-Id` + action body
- `POST /play/observe`
- `GET /watch/live`
- `POST /protocol/v1` agent-protocol/v1 messages

## What this phase proves

- Seed replay **EQUIVALENT** under Chamber acceptance boundary
- Single-process modular monolith with **one fenced writer**
- SQLite durability for ledger + snapshots + sessions
- Human PLAY (text CLI + HTTP)
- Minimal agent protocol (HELLO → AUTH → ENTER → OBSERVE → ACT)
- WATCH LIVE read-only projection
- Restart recovery by replaying persisted ledger
- Deterministic scheduler ordering
- Same-cycle `MESSAGE` then `MESSAGE_DELIVERED`

## Layout

```text
src/noema/
  world/          pure reducers + state + digests
  replay/         fixture equivalence runner
  actions/        single action router
  scheduler/      deterministic order keys
  persistence/    SQLite store (local MVP)
  observations/   permissioned projections
  spectator/      (WATCH via observations)
  protocol/       agent-protocol/v1
  gateway/        stdlib HTTP server
  app/            composition root
  auth/           minimal roles
  cli/            noema-replay, noema-serve, noema-play
fixtures/v01-seed/
spec-compat.json
docker-compose.yml
```

## Explicitly deferred

Frontier · Observatory · Lab · Compiler · LEARN · Deep Time · Genesis · microservices · graph DB · worker queues · live LLM requirement · complex frontend.

## License

Copyright © 2026 Zero State LLC. Licensed under the Zero State Proprietary License v1.0. See [`LICENSE`](LICENSE).
