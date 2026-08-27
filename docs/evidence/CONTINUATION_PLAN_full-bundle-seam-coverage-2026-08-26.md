# CONTINUATION PLAN: Architecture Deepening v3.3 — Full Bundle Seam Coverage
**Date:** 2026-08-27
**Branch:** feat/ewm-enhanced-cutover-2026-08 (currently at fbabc8e)
**Base:** v3.2.1 complete (377 tests passing)

## Goal
Extend bundle_seam pattern to full codebase: ActionRouter, Frontier/LLM, Catalog, Persistence, Observations, Evidence, Deployment, Telemetry, Testing, Compiler.

## Vocabulary (Mandatory)
Use exclusively: module, interface, depth, shallow, deep, seam, adapter, leverage, locality, bundle_seam, state_bundle, core_entity
Never: component, service, API, boundary, layer, wrapper

## Contracts to Preserve
- BehavioralOracle.evaluate() signature
- max_oracle_calls = 256
- minimize() backward compat
- AdapterStrategy
- WorldState backward compat
- core_entity (6 fields)

---

## Phase 1: ActionRouter → ActionBundle + ValidatorBundle (Tier 1, Highest ROI)

### Target
`src/noema/actions/router.py` — central mutation funnel, ~200 lines in apply_actions

### Current Direct Accesses (grep estimate)
- state.active_agents, state.registered_agents, state.rooms, state.entities
- state.exits, state.messages, state.trades, state.organizations
- state.situations, state.pending_observations, state.destroyed_entities
- state.audit, state.sequence, state.cycle, state.world_id

### New Bundles
**ActionBundle** (mutation coordination):
- apply_action(action, principal) → (new_state, events, results)
- route_to_reducer(action) → reducer_fn
- validate_preconditions(action, state) → bool

**ValidatorBundle** (policy/budget/security):
- check_budget(agent_id, costs) → bool
- check_authorization(principal, action) → bool
- check_visibility(agent_id, target) → bool

### Exit Criteria
- router.py direct state. accesses ≤ 5 (core_entity only)
- All validators route through ValidatorBundle
- Tests: phase4 28 + router slice + full suite green

---

## Phase 2: Frontier/LLM → PromptBundle + ContextBundle (Tier 1)

### Target
`src/noema/frontier/` — prompt builders, context assembly

### Current State
Direct WorldState access in prompt construction

### New Bundles
**PromptBundle** (prompt assembly):
- build_system_prompt(state, agent_id) → str
- build_action_prompt(state, agent_id, actions) → str
- build_observation_prompt(state, agent_id) → str

**ContextBundle** (context slicing):
- slice_for_agent(state, agent_id, budget_tokens) → dict
- slice_for_spectator(state, limit) → dict
- slice_for_observatory(state) → dict

### Exit Criteria
- Zero direct WorldState in frontier/
- Prompt/Context bundles testable in isolation
- Phase7 e2e tests pass

---

## Phase 3: Catalog/Modules → ModuleBundle + RegistryBundle (Tier 1)

### Target
`src/noema/catalog/`, `src/noema/modules/` — ModuleRegistry, CatalogService

### New Bundles
**ModuleBundle** (module lifecycle):
- discover_modules(paths) → list[ModuleSpec]
- validate_module(spec) → ValidationResult
- instantiate_module(spec, state) → ModuleInstance

**RegistryBundle** (registration):
- register(spec) → RegistrationHandle
- unregister(module_id) → bool
- resolve(module_id) → ModuleSpec | None

### Exit Criteria
- Catalog/modules use only bundle seams
- Module hot-reload test passes

---

## Phase 4: Persistence → StorageAdapter (Tier 2)

### Target
`src/noema/persistence/store.py` — already delegates to to_serializable_dict()

### New Adapter Interface
**StorageAdapter** (protocol):
- save(serializable_dict) → SaveResult
- load(world_id) → SerializableDict | None
- list_worlds() → list[WorldSummary]
- delete(world_id) → bool

### Implementations
- SQLiteAdapter (current)
- PostgresAdapter (future)
- S3Adapter (future)

### Exit Criteria
- Store uses StorageAdapter protocol
- SQLiteAdapter unchanged behavior
- Tests pass with mock adapter

---

## Phase 5: Observations → SpectatorBundle + AgentBundle + ReplayBundle (Tier 2)

### Target
`src/noema/observations/project.py` — already deepened for LIVE spectator

### New Bundles (extend project.py)
**SpectatorBundle** (public projections):
- project_live(state, limit) → dict
- project_public(state) → dict

**AgentBundle** (agent projections):
- project_agent(state, agent_id) → dict
- project_agent_history(state, agent_id, limit) → list

**ReplayBundle** (historical):
- project_at_cycle(state, cycle) → dict
- project_event_sequence(state, from_seq, to_seq) → list

### Exit Criteria
- All projections via bundles
- Observation tests pass

---

## Phase 6: Evidence/Resume → EvidenceBundle (Tier 2)

### Target
`src/noema/evidence/resume.py` — ResumeRegistry

### New Bundle
**EvidenceBundle**:
- pack_evidence(resume_id) → EvidencePackage
- unpack_evidence(package) → ResumeEntry
- verify_chain(package) → bool

### Exit Criteria
- ResumeRegistry uses EvidenceBundle
- Evidence integrity tests pass

---

## Phase 7: Deployment Config → ConfigBundle (Tier 2)

### Target
`src/noema/config/deployment.py` — configuration_digest, load_deployment_config

### New Bundle
**ConfigBundle**:
- load(path) → DeploymentConfig
- validate(config) → ValidationResult
- digest(config) → ConfigDigest
- merge(base, override) → DeploymentConfig

### Exit Criteria
- Config loading via bundle
- Deployment tests pass

---

## Phase 8: Telemetry → TelemetryBundle (Tier 3)

### Target
Cross-cutting — event emission, last_event_digest

### New Bundle
**TelemetryBundle**:
- emit(event_type, payload) → EventRecord
- digest() → EventDigest
- query(filter) → list[EventRecord]

### Exit Criteria
- Structured telemetry via bundle
- Observatory/public_pressure uses bundle

---

## Phase 9: Testing/Harness → ScenarioBundle (Tier 3)

### Target
`src/noema/harness/` — test fixtures, validation

### New Bundle
**ScenarioBundle**:
- build_scenario(name, overrides) → NoemaState
- mutate_scenario(state, actions) → NoemaState
- assert_invariant(state, invariant) → bool

### Exit Criteria
- Test fixtures declarative via bundle
- Harness tests pass

---

## Phase 10: Compiler (Phase4) → CompileBundle (Tier 3)

### Target
`src/noema/compiler/` — parse, validate, lower, emit

### New Bundle
**CompileBundle**:
- parse(source) → AST
- validate(ast) → ValidationResult
- lower(ast) → IR
- emit(ir, target) → Artifact

### Exit Criteria
- Compiler stages isolated
- Phase4 tests pass

---

## Verification Protocol (Iron Discipline)

After EACH phase:
1. `PYTHONPATH=src .venv/bin/python -m pytest tests/test_phase4_compiler.py -q --tb=no` (must be 28 passed)
2. `PYTHONPATH=src .venv/bin/python -m pytest tests/ -q -k "harness or world or reduce or frontier or phase7 or compiler" --tb=no` (must be 159 passed)
3. `PYTHONPATH=src .venv/bin/python -m pytest tests/ -q --tb=no` (must be 377 passed, 3 skipped)

## Timeline
- Phases 1-3: Core mutation/frontier/catalog (highest impact)
- Phases 4-7: Persistence/observations/evidence/config (infrastructure)
- Phases 8-10: Telemetry/testing/compiler (cross-cutting)

## Risk Mitigation
- Each phase isolated — can stop after any phase
- Backward compat maintained via adapters
- Full test suite gate at each phase
- Receipt produced per phase

---

## Execution Order Recommendation
1. **Phase 1** (ActionRouter) — unlocks parallel validator work
2. **Phase 2** (Frontier) — decouples LLM from state
3. **Phase 3** (Catalog) — module system independence
4. **Phases 4-7** — infrastructure bundles (can parallelize)
5. **Phases 8-10** — cross-cutting (can parallelize)

---

## Next Step
Awaiting user confirmation to begin Phase 1 execution.
