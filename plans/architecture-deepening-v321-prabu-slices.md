# Architecture Deepening v3.2.1 — Prabu Slices

**Context**: Decisions from improve-codebase-architecture skill for Noema + Noema-Specs. All candidates verified (tests + smoke). Top recommendation: Candidate 1 (deep_minimize module for leverage and locality).

**Status (2026-08-26)**:
- **Candidate 1 (deep_minimize module)**: 1 deep module (5 modules → 1). deep_minimize is the primary interface. minimize() retained for compatibility. Dedicated 1-interface test. Wired in compiler.py. 28+ passing in compiler tests.
- **Candidate 2 (adapter_strategy)**: AdapterStrategy (ABC) + ScriptedStrategy, DebugStrategy, LlmStrategy (1 deep interface for 4 adapters). Wired into harness/loop.py (HeadlessHarness + run_unattended). Strategy swap exercised in e2e. Backward compat preserved. locality + leverage gains active.
- **Candidate 3 (state_bundles)**: WorldState module split to stable core_entity (6 fields) + state_bundles (RoomsBundle, EntitiesBundle, OrganizationsBundle, MessagesBundle, TradesBundle). acceptance_projection, spectator, runtime, persistence, and light reducer paths now use bundle seams. 4 high-value mutation helpers added. Stability invariant proven. "36-field" assumptions cleaned.
- All changes use exact vocabulary (module, interface, depth, seam, adapter_strategy, state_bundle, core_entity, bundle_seam, locality, leverage). No changes to BehavioralOracle.evaluate(), max_oracle_calls=256, or existing minimize()/adapter contracts.

## Slice progress
- Slice A (Candidate 1): Complete.
- Slice B (Candidate 2): Complete.
- Slice C (Candidate 3): Complete for v3.2.1 (good depth achieved — core + multiple bundle seams in production paths + light mutation seam in reduce.py + stability test). Further deepening of the mutation seam deferred until next functional change to reduce.py.

## Handoff Note (for Prabu)

**Current state of the deepenings**:
- deep_minimize (Candidate 1): Single deep module providing the minimization interface. Proves leverage (N call sites through 1 interface) and locality (bugs concentrate in one module).
- AdapterStrategy (Candidate 2): 1 deep adapter interface replacing prior 4 adapter types. Real runtime usage in loop.py + live strategy swap test.
- state_bundles + core_entity (Candidate 3): Deeper WorldState module. Call sites go through narrow bundle seams for rooms/entities/orgs/etc. instead of a flat structure. Light usage in reduce.py proves the mutation seam without full rewrite.

**Exact verification commands** (run these after any further work):
```bash
cd /home/scrimshawlife/Noema
.venv/bin/python -m pytest tests/test_phase4_compiler.py -q
.venv/bin/python -m pytest tests/ -q -k "harness or world" --tb=no
.venv/bin/python -m pytest tests/ -q -k "harness or world or reduce or frontier" --tb=no
```

**What was delivered per candidate (receipts)**:
- **Candidate 1 (Slice A)**: deep_minimize added to minimize.py with exact signature matching minimize (units, oracle, *, edges=None, max_oracle_calls=256, compile_id="compile"). Imported + used in compiler.py. test_v321_deep_minimize_1_interface added (direct call proves 1-interface benefit). All compiler tests green.
- **Candidate 2 (Slice B)**: AdapterStrategy ABC + 3 concrete strategies in harness/adapters.py. Wired into harness/loop.py (HeadlessHarness accepts strategy, run_unattended uses DebugStrategy). Legacy Adapter Protocol kept for compat. test_v321_adapter_strategy_swap_in_loop + full e2e live strategy swap test (Scripted → Debug). phase7 tests exercising the seam green.
- **Candidate 3 (Slice C)**: Core 6-field entity + 5 bundles in world/state.py. acceptance_projection now delegates via bundles + get_core_entity. project_spectator_live, runtime summaries, persistence snapshots use bundles. 4 mutation helpers (link_entity/unlink_entity on RoomsBundle, create/remove on EntitiesBundle, create/add_member/remove_member on OrganizationsBundle). Migrated simplest patterns in reduce.py (ENTER/LEAVE/MOVE room links + basic ORG ops). Cleaned last direct .situations access in frontier test. Added post-mutation core stability assertion. Updated comments. test_v321_state_bundles_core_stability_and_projection (core invariant holds even after reducer-style mutation via bundle). 125+ passing in relevant slices.

**Key files touched**:
- src/noema/research/compiler/minimize.py, compiler.py
- src/noema/harness/adapters.py, loop.py, __init__.py
- src/noema/world/state.py, reduce.py
- src/noema/observations/project.py, app/runtime.py, persistence/store.py
- tests/test_phase4_compiler.py, test_phase7_core_loop_e2e.py, test_phase3_lab.py, test_phase2a_frontier.py
- Noema-Specs/CONTEXT.md (domain modeling)
- plans/architecture-deepening-v321-prabu-slices.md (this file)

**Constraints observed**:
- Backward compatibility for minimize(), adapters, WorldState, and acceptance_projection.
- Oracle budget and evaluate() contract untouched.
- All relevant tests passing (see runs below).
- No new direct raw state.XXX mutations outside the new bundle helpers on hot paths.

**Current grep for raw bundle concerns is clean** (only legitimate core_entity fields like .world_id/.cycle/.sequence remain; no flat rooms/entities/orgs mutations bypassing bundles).

## Recommended slices for Prabu (operator lane)
(Already executed for v3.2.1 per prior scope. Use for reference or future polish.)

### Slice A — Candidate 1 (Complete)
- deep_minimize as the consolidated deep module.

### Slice B — Candidate 2 (Complete)
- AdapterStrategy wired + swap exercised.

### Slice C — Candidate 3 (Complete for v3.2.1)
- state_bundles + core_entity + light reducer seam + stability.

## Verification commands (run after any slice)
```bash
cd /home/scrimshawlife/Noema
.venv/bin/python -m pytest tests/test_phase4_compiler.py -q
.venv/bin/python -m pytest tests/ -q -k "harness or world" --tb=no
```

## Deliverables
- Keep changes minimal and reversible.
- Use the exact vocabulary: module, interface, depth, seam, adapter_strategy, state_bundle, core_entity, bundle_seam, locality, leverage.
- Update this file with receipts when further work is done.
- Contact Daniel before touching oracle budget, acceptance_projection contract, or doing deeper reducer mutation work.

**Anchor**: Architecture review v3.2.1 (report at architecture-deepening-v321.html) + ADRs 009-011 in Noema-Specs + CONTEXT.md.

## Latest verification runs (recorded 2026-08-26)
```bash
.venv/bin/python -m pytest tests/test_phase4_compiler.py -q
# 28 passed in 0.58s / 17.86s (multiple clean runs)

.venv/bin/python -m pytest tests/ -q -k "harness or world" --tb=no
# 66 passed, 314 deselected in 6.99s / 7.73s

.venv/bin/python -m pytest tests/ -q -k "harness or world or reduce or frontier or phase7 or compiler" --tb=no
# 159 passed, 221 deselected in 13.01s

.venv/bin/python -m pytest tests/test_phase7_core_loop_e2e.py -q --tb=no -k "adapter or strategy or bundle or v321"
# 2 passed, 5 deselected in 6.10s

Full targeted relevant slices (including prior broader runs): 125–159+ passing with zero regressions on the new interfaces/seams.
```

All deepenings (deep_minimize module, AdapterStrategy interface, state_bundles + core_entity on WorldState module) are exercised and green. Slice C light increment complete per scope.


**Fresh verification run at handoff prep time (2026-08-26)**:
```bash
.venv/bin/python -m pytest tests/test_phase4_compiler.py -q
# 28 passed in 0.56s

.venv/bin/python -m pytest tests/ -q -k "harness or world" --tb=no
# 66 passed, 314 deselected in 6.97s
```
All green. No regressions.

## Next items (post-Slice C light increment)
**Handoff complete. Remaining items below.**

- Prabu handoff: **DONE** — sent via hermes to buzz:DM with full Handoff Note + commands + receipts (see section below).
- Optional: one more bundle site only if new friction appears (current grep clean on important paths).
- Re-run full relevant suite before merge.
- Domain-modeling update on CONTEXT.md only if/when we decide to deepen the reducer mutation seam later.

## Prabu handoff executed (2026-08-26)
- Consolidated plan sent via hermes to buzz:DM
- Subject: [ARCH v3.2.1] Prabu handoff — v3.2.1 slices complete
- Body: full Handoff Note + verification commands + per-candidate receipts + constraints
- File attached in message: /tmp/arch-v321-prabu-handoff.md (also the plan itself in repo)
- hermes output: "sent"

Full suite re-run immediately prior: 377 passed, 3 skipped (22.27s).
All deepenings remain exercised and green.

## Commit prep (2026-08-26)
- Staged relevant changes only (core architecture work + plan).
- Tests verified green immediately before commit (phase4 + harness/world/reduce slices).
- Branch: feat/ewm-enhanced-cutover-2026-08
- Target merge: main
- Unrelated untracked files (node_modules, .claude/, etc.) left out.
- Full handoff already sent to Prabu.
