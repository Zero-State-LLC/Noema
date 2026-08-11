# NOEMA Runtime — Core Loop Implementation Map

**Status:** Complete modular-monolith spine for frozen Specs v0.1–v0.7 + Deep Time/Genesis  
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

1. **One fenced writer** for production world ledger (`WorldStore` + `BEGIN IMMEDIATE`).
2. **WORLD TRUTH ≠ RESEARCH DERIVATION** — research tables/indexes are rebuildable.
3. **Frontier** may inject only via `SITUATION_INJECTED` (and follow-on events) through reducers.
4. **Observatory / Lab / Compiler / LEARN / Deep Time** never rewrite production history.
5. **Lab** mutations only on experimental forks (`mutates_production: false`).
6. **CAPTURE** requires `compiler_readiness: READY`.
7. **Genesis** is admin-only; after activate, config freezes; PLAY needs no Genesis UI.
8. **Lore / LEARN simple views** never strengthen claim labels beyond source evidence.
9. **Canonicalization** is `noema-jcs/1` (sort_keys JSON + sha256) for digests.

## Composition root

`NoemaRuntime` (`src/noema/app/runtime.py`) wires:

```text
store + router + research capture
  + frontier + observatory + lab + compiler + learn
  + deep_time + genesis
```

## HTTP surface (minimal)

| Path | Role |
|---|---|
| `/admin/start` | load seed |
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

## Explicit non-goals (still deferred)

- v0.8 Phenomena platform
- Graph DB / microservices / worker fleets
- LLM claim-bearing planners
- Consciousness / intelligence scores
- Full market / religion / procedural lore engines
