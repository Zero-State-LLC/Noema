"""Phase 3 — Experiment Lab v0.4 (L01–L34 coverage + production isolation)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.research.errors import POLICY_DENIED, ResearchError
from noema.research.lab.audit import make_lab_audit
from noema.research.lab.catalog import FORK_POINTS, SEED_POLICIES, ablation_catalog, perturbation_catalog
from noema.research.lab.errors import (
    CAPTURE_NOT_READY,
    INVALID_FORK,
    INVALID_INTERVENTION,
    LabError,
    NOT_COMPUTABLE,
    PRODUCTION_MUTATION_FORBIDDEN,
)
from noema.research.lab.experiment import experiment_identity_digest, validate_experiment
from noema.research.lab.fork import create_fork, fork_digest, validate_fork
from noema.research.lab.intent import compile_intent_to_design, simple_lifecycle, study_reason, validate_intent
from noema.research.lab.intervention import (
    apply_intervention,
    validate_counterfactual_record,
    validate_intervention,
)
from noema.research.lab.lab import Lab
from noema.research.lab.plan import topological_run_order, validate_plan
from noema.research.lab.result import (
    build_lab_result,
    classify_intervention_outcome,
    gate_capture_as_test,
    simple_result_projection,
)
from noema.research.lab.runs import execute_run, run_identity_digest
from noema.world.digest import sha256_digest
from noema.world.state import load_seed

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures" / "v01-seed"
V04 = ROOT / "fixtures" / "v04-lab"


def _load(name: str) -> dict | list:
    path = V04 / name
    text = path.read_text(encoding="utf-8")
    if name.endswith(".jsonl"):
        return [json.loads(line) for line in text.splitlines() if line.strip()]
    return json.loads(text)


def test_prior_phases_green():
    from noema.replay.runner import replay_v01_seed

    r = replay_v01_seed(FIXTURES)
    assert r.ok


# L01 identity / L02 validation
def test_l01_l02_experiment_identity_and_validation():
    exp = validate_experiment(_load("experiment.json"))
    assert exp["experiment_id"]
    assert exp["identity"]["source_candidate_ids"]
    dig = experiment_identity_digest(exp)
    assert dig.startswith("sha256:")
    # recompute stable
    assert dig == experiment_identity_digest(exp)


# L03–L04 fork integrity
def test_l03_l04_fork_integrity_and_points():
    fork = validate_fork(_load("experiment-fork.json"))
    assert fork["mutates_production"] is False
    assert fork["fork_digest"] == _load("expected-digests.json")["fork_digest"]
    assert fork["fork_point"] in FORK_POINTS or fork["fork_point"] == "CYCLE_BOUNDARY"
    # illegal mid-reducer style point
    bad = dict(fork)
    bad["fork_point"] = "MID_REDUCER"
    bad.pop("fork_digest", None)
    bad.pop("digest", None)
    with pytest.raises(LabError) as ei:
        validate_fork(bad)
    assert ei.value.code == INVALID_FORK


def test_l03_create_fork_reproducible_digest():
    state = load_seed(FIXTURES / "world-seed.json")
    f1 = create_fork(experiment_id="exp.x", source_state=state, fork_id="fork.x")
    f2 = create_fork(experiment_id="exp.x", source_state=state, fork_id="fork.x")
    assert f1["fork_digest"] == f2["fork_digest"] == fork_digest(f1)


# L05–L08 interventions
def test_l05_l07_ablation_and_perturbation():
    ab = validate_intervention(_load("intervention-ablation.json"))
    assert ab["type"] == "ABLATION"
    assert "PRODUCTION_WORLD_MUTATION" in (ab.get("forbidden_side_effects") or [])
    pt = validate_intervention(_load("intervention-perturbation.json"))
    assert pt["type"] == "PERTURBATION"
    assert ablation_catalog()["entries"]
    assert perturbation_catalog()["entries"]


def test_l08_unsupported_lesion_not_computable():
    lesion = validate_intervention(_load("intervention-lesion-not-computable.json"))
    state = load_seed(FIXTURES / "world-seed.json")
    fork = create_fork(experiment_id="exp.lesion", source_state=state)
    from noema.research.lab.fork import ExperimentalWorld, clone_state_for_fork

    world = ExperimentalWorld(fork, clone_state_for_fork(state, fork["experimental_world_id"]))
    with pytest.raises(LabError) as ei:
        apply_intervention(world, lesion)
    assert ei.value.code == NOT_COMPUTABLE


# L09 counterfactual
def test_l09_counterfactual_complete_variables():
    cf = validate_counterfactual_record(_load("counterfactual.json"))
    assert cf["changed_variables"]
    assert cf["held_constant_variables"]
    incomplete = {"changed_variables": [{"variable_id": "x"}]}
    with pytest.raises(LabError):
        validate_counterfactual_record(incomplete)


# L10 seed policy
def test_l10_seed_policies_closed():
    assert "SAME_SEED" in SEED_POLICIES
    assert "RESEED" in SEED_POLICIES


# L11–L12 controls
def test_l11_l12_controls_fixture():
    controls = _load("controls.json")
    roles = {c["role"] for c in controls["controls"]}
    assert "BASELINE" in roles
    assert "SHAM_CONTROL" in roles
    sham = next(c for c in controls["controls"] if c["role"] == "SHAM_CONTROL")
    assert sham["required"] is True


# L13 run identity
def test_l13_run_identity_stable():
    run = _load("run-baseline.json")
    d1 = run_identity_digest(run)
    d2 = run_identity_digest(run)
    assert d1 == d2


# L14 outcomes
def test_l14_outcome_classification():
    assert classify_intervention_outcome(420, 120) == "DEGRADED"
    assert classify_intervention_outcome(420, 400) == "PERSISTED"
    assert classify_intervention_outcome(None, 100) == "NOT_COMPUTABLE"


# L15 confounds + L16 replication + L17 generalization
def test_l15_l16_l17_result_fields():
    result = _load("lab-result.json")
    assert result["confounds"]
    assert result["replication_outcomes"]
    assert result["generalization_outcomes"]
    assert result["claim_label"] == "INFERRED"
    assert result["compiler_readiness"] in ("READY", "NOT_READY", "REJECTED")


# L18 nondeterminism residual via confounds
def test_l18_nondeterminism_as_confound():
    result = _load("lab-result.json")
    assert any("nondetermin" in c.lower() or "provider" in c.lower() for c in result["confounds"])


# L19 audit chain
def test_l19_audit_chain():
    a1 = make_lab_audit(
        audit_id="a1",
        experiment_id="e",
        event_kind="DESIGN_VALIDATION",
        previous_state="DRAFT",
        new_state="VALIDATED",
        reason_code="OK",
        previous_digest=None,
    )
    a2 = make_lab_audit(
        audit_id="a2",
        experiment_id="e",
        event_kind="RESULT_CLASSIFICATION",
        previous_state="RUNNING",
        new_state="COMPLETE",
        reason_code="ALL_RUNS_FINISHED",
        previous_digest=a1["digest"],
    )
    assert a2["previous_digest"] == a1["digest"]
    ledger = _load("lab-audit-ledger.jsonl")
    assert ledger


# L20 production isolation
def test_l20_production_world_isolation(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    seq = rt.store.get_state().sequence
    head = rt.store.ledger_head()
    researcher = rt.create_session(role=Role.RESEARCHER)
    out = rt.run_lab(
        researcher["session_id"],
        intent=_load("experiment-intent.json"),
        interventions=[_load("intervention-ablation.json")],
        agent_id="agent.nacre",
    )
    assert out["production_isolated"] is True
    assert rt.store.get_state().sequence == seq
    assert rt.store.ledger_head() == head
    assert out["result"]["production_mutated"] is False
    assert out["fork"]["mutates_production"] is False


def test_l20_player_cannot_run_lab(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    sess = rt.create_session(role=Role.AGENT, agent_id="p")
    with pytest.raises(ResearchError) as ei:
        rt.run_lab(sess["session_id"], intent=_load("experiment-intent.json"), interventions=[])
    assert ei.value.code == POLICY_DENIED


# L21 null/failed retention
def test_l21_null_result_retained():
    null = _load("lab-result-null.json")
    assert null["failed_experiments_retained"] is True or null.get("interpretation")
    assert null["claim_label"] in ("OBSERVED", "INFERRED", "NOT_COMPUTABLE", "SPECULATIVE")
    assert null["compiler_readiness"] in ("NOT_READY", "REJECTED", "READY")


# L22–L32 compiler handoff / capture gating
def test_l22_l26_l32_capture_gate():
    ready = {
        "compiler_readiness": "READY",
        "lab_result_id": "r1",
        "experiment_id": "e1",
    }
    assert gate_capture_as_test(ready)["capture_allowed"] is True
    with pytest.raises(LabError) as ei:
        gate_capture_as_test({"compiler_readiness": "NOT_READY", "lab_result_id": "r"})
    assert ei.value.code == CAPTURE_NOT_READY
    # fixture default NOT_READY
    assert _load("lab-result.json")["compiler_readiness"] == "NOT_READY"


# L23 intent compilation
def test_l23_intent_compilation_deterministic():
    intent = validate_intent(_load("experiment-intent.json"))
    d1 = compile_intent_to_design(intent, world_id="world-01", agent_id="agent.nacre")
    d2 = compile_intent_to_design(intent, world_id="world-01", agent_id="agent.nacre")
    assert d1["input_digest"] == d2["input_digest"]
    assert d1["source_intent_id"] == intent["intent_record_id"]
    assert d1["provenance"]["compiled_from_intent"]


# L24 lifecycle mapping
def test_l24_lifecycle_mapping():
    assert simple_lifecycle("RUNNING") == "running"
    assert simple_lifecycle("COMPLETE") == "finished"


# L25 simple projection preserves claims
def test_l25_simple_projection_claim_preserving():
    result = _load("lab-result.json")
    proj = simple_result_projection(result, question="q?")
    assert proj["claim_label"] == result["claim_label"]
    assert proj["interpretation"] == result["interpretation"]
    assert proj["compiler_readiness"] == result["compiler_readiness"]
    assert proj["same_record"] is True
    fixture = _load("simple-result-projection.json")
    assert fixture["claim_label"] == "INFERRED"


# L27 reason codes
def test_l27_reason_code_study_translation():
    assert "live world" in study_reason("PRODUCTION_MUTATION_FORBIDDEN").lower() or "never" in study_reason(
        "PRODUCTION_MUTATION_FORBIDDEN"
    ).lower()


# L28 budget partial
def test_l28_budget_partial(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    researcher = rt.create_session(role=Role.RESEARCHER)
    out = rt.run_lab(
        researcher["session_id"],
        intent=_load("experiment-intent.json"),
        interventions=[_load("intervention-ablation.json")],
        agent_id="agent.nacre",
        max_runs=1,
    )
    assert out["status"] == "PARTIAL" or out["result"]["execution_status"] == "PARTIAL"
    assert out["result"]["failed_experiments_retained"] is True


# L29 advanced disclosure same experiment id
def test_l29_advanced_equals_simple_identity(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    researcher = rt.create_session(role=Role.RESEARCHER)
    out = rt.run_lab(
        researcher["session_id"],
        experiment=_load("experiment.json"),
        interventions=[_load("intervention-ablation.json")],
        plan=_load("experiment-plan.json"),
        agent_id="agent.nacre",
    )
    assert out["simple_projection"]["experiment_id"] == out["result"]["experiment_id"]
    assert out["simple_projection"]["lab_result_id"] == out["result"]["lab_result_id"]


# L30 intent provenance
def test_l30_intent_provenance_survives():
    intent = _load("experiment-intent.json")
    design = compile_intent_to_design(intent, world_id="world-01")
    assert design["source_intent_id"] == intent["intent_record_id"]
    assert design["provenance"]["compiled_from_intent"] == intent["intent_record_id"]


# L31 lab result boundary — research only
def test_l31_lab_result_not_world_truth():
    r = build_lab_result(
        lab_result_id="lr",
        experiment_id="e",
        source_candidate_ids=["c"],
        runs=[
            {"run_id": "b", "run_role": "BASELINE", "measures": {"cooperation_signal": 400}},
            {"run_id": "s", "run_role": "SHAM_CONTROL", "measures": {"cooperation_signal": 400}},
            {
                "run_id": "i",
                "run_role": "INTERVENTION",
                "measures": {"cooperation_signal": 100},
                "interventions_applied": [{"intervention_id": "int.x", "type": "ABLATION"}],
            },
            {"run_id": "r", "run_role": "REPLICATION", "measures": {"cooperation_signal": 100}},
        ],
    )
    assert r["world_truth"] is False
    assert r["creates_fixture"] is False


# L33 study isolation / L34 integration e2e
def test_l33_l34_e2e_intent_to_study_projection(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    # play a little for realism
    player = rt.create_session(role=Role.AGENT, agent_id="agent.p")
    rt.apply_player_action(
        player["session_id"],
        {
            "verb": "ENTER_WORLD",
            "agent_id": "agent.p",
            "client_action_sequence": 1,
            "action_id": "a1",
            "idempotency_key": "i1",
            "parameters": {},
        },
    )
    seq = rt.store.get_state().sequence
    researcher = rt.create_session(role=Role.RESEARCHER)
    out = rt.run_lab(
        researcher["session_id"],
        intent=_load("experiment-intent.json"),
        interventions=[_load("intervention-ablation.json")],
        agent_id="agent.nacre",
        confounds=["provider nondeterminism residual"],
    )
    assert out["production_isolated"] is True
    assert rt.store.get_state().sequence == seq
    assert out["result"]["claim_label"] in ("INFERRED", "NOT_COMPUTABLE")
    assert out["simple_projection"]["mutates_world"] is False
    assert out["study_view"]["production_isolated"] is True
    assert out["audit"]
    # CAPTURE blocked when NOT_READY
    if out["result"]["compiler_readiness"] != "READY":
        with pytest.raises((LabError, ResearchError)):
            rt.lab_capture_gate(researcher["session_id"], out["result"])
    # research view sees lab results
    view = rt.research_view(researcher["session_id"])
    assert view["lab_results"]
    # PLAY still works
    rt.apply_player_action(
        player["session_id"],
        {
            "verb": "WAIT",
            "agent_id": "agent.p",
            "client_action_sequence": 2,
            "action_id": "a2",
            "idempotency_key": "i2",
            "parameters": {"cycles": 1},
        },
    )


def test_plan_dag_order():
    plan = validate_plan(_load("experiment-plan.json"))
    ordered = topological_run_order(plan)
    assert ordered[0]["run_role"] == "BASELINE"
    ids = [r["run_id"] for r in ordered]
    assert "run.baseline.1" in ids


def test_execute_run_never_marks_production():
    state = load_seed(FIXTURES / "world-seed.json")
    run = execute_run(
        run_spec={
            "schema_version": "experiment-run/0.4",
            "run_id": "run.x",
            "experiment_id": "exp.x",
            "run_role": "INTERVENTION",
        },
        source_state=state,
        interventions=[_load("intervention-ablation.json")],
        agent_id="agent.nacre",
    )
    assert run["production_mutated"] is False
    assert run["fork"]["mutates_production"] is False


# v3.2.1 Slice C stability test for state_bundles + core entity
def test_v321_state_bundles_core_stability_and_projection():
    """Proves that the thin core entity (6 fields) remains stable when using bundles.

    acceptance_projection and spectator projections now go through bundle interfaces.
    This is the stability guarantee of the deepened WorldState module.
    """
    from noema.world.state import (
        load_seed, get_core_entity,
        RoomsBundle, EntitiesBundle, OrganizationsBundle,
        acceptance_projection,
    )
    from noema.observations.project import project_spectator_live

    state = load_seed(FIXTURES / "world-seed.json")

    core1 = get_core_entity(state)
    assert len(core1) == 6
    assert set(core1.keys()) == {"world_id", "world_version", "seed", "catalog_version", "cycle", "sequence"}

    # Exercise bundles
    rooms_b = RoomsBundle(state)
    ents_b = EntitiesBundle(state)
    orgs_b = OrganizationsBundle(state)

    _ = rooms_b.rooms
    _ = ents_b.entities
    _ = orgs_b.organizations
    _ = ents_b.entity_ids()
    _ = orgs_b.organization_member_ids  # method exists

    core2 = get_core_entity(state)
    assert core1 == core2, "core entity must be stable across bundle usage"

    # Projections still work and use the deepened paths
    view = acceptance_projection(state)
    assert view["world_id"] == core1["world_id"]
    assert "organizations" in view
    assert "entities_present" in view

    live = project_spectator_live(state)
    assert live["world_id"] == core1["world_id"]
    assert "rooms" in live or "organizations" in live

    # One more assertion: even after reducer-style mutation via bundle helper,
    # the core entity remains untouched (proves stable seam)
    RoomsBundle(state).link_entity(list(state.rooms.keys())[0], "stability-test-eid")
    core3 = get_core_entity(state)
    assert core1 == core3, "core entity untouched even after reducer-style mutation via bundle"

    print("state_bundles core stability + projection via bundles: verified")
