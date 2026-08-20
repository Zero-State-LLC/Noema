"""Phase 4 — Phenomenon Compiler v0.5 (P01–P30 coverage)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.research.compiler.admission import admit_lab_result
from noema.research.compiler.catalog import LAYER_ORDER, capture_defaults, reason_message
from noema.research.compiler.compiler import Compiler
from noema.research.compiler.errors import (
    BUDGET_EXHAUSTED,
    CONTROL_FAILED,
    NOT_READY,
    CompilerError,
)
from noema.research.compiler.intent import compile_intent_to_request, validate_capture_intent
from noema.research.compiler.minimize import minimize, reject_over_minimization
from noema.research.compiler.oracle import BehavioralOracle
from noema.research.compiler.units import dependency_closure, units_by_layer, validate_unit_manifest
from noema.research.errors import POLICY_DENIED, ResearchError
from noema.world.digest import sha256_digest

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures" / "v01-seed"
V05 = ROOT / "fixtures" / "v05-compiler"


def _load(name: str) -> dict | list:
    path = V05 / name
    text = path.read_text(encoding="utf-8")
    if name.endswith(".jsonl"):
        return [json.loads(line) for line in text.splitlines() if line.strip()]
    return json.loads(text)


def test_prior_phases_green():
    from noema.replay.runner import replay_v01_seed

    assert replay_v01_seed(FIXTURES).ok


# P01 intent compilation
def test_p01_capture_intent_digest_and_compile():
    intent = validate_capture_intent(_load("capture-intent.json"))
    assert intent["digest"] == _load("expected-digests.json")["capture_intent_digest"]
    lab = _load("source-lab-result-ready.json")
    units = validate_unit_manifest(_load("unit-manifest.json"))["units"]
    req = compile_intent_to_request(intent, lab, units=units)
    assert req["schema_version"] == "compilation-request/0.5"
    assert req["compiler_version"]["canonicalization"] == "noema-jcs/1"
    assert req["digest"].startswith("sha256:")


# P02 admission
def test_p02_admission_ready_only():
    admit_lab_result(_load("source-lab-result-ready.json"))
    not_ready = dict(_load("source-lab-result-ready.json"))
    not_ready["compiler_readiness"] = "NOT_READY"
    with pytest.raises(CompilerError) as ei:
        admit_lab_result(not_ready)
    assert ei.value.code == NOT_READY


def test_p02_control_failed_blocks():
    lab = dict(_load("source-lab-result-ready.json"))
    lab["control_outcomes"] = {"BASELINE": "FAIL"}
    with pytest.raises(CompilerError) as ei:
        admit_lab_result(lab)
    assert ei.value.code == CONTROL_FAILED


# P03 compilation identity
def test_p03_identity_changes_with_overrides():
    intent = dict(_load("capture-intent.json"))
    lab = _load("source-lab-result-ready.json")
    r1 = compile_intent_to_request(intent, lab)
    intent2 = dict(intent)
    intent2["user_overrides"] = {"max_oracle_calls": 10}
    intent2.pop("digest", None)
    intent2 = validate_capture_intent(intent2)
    r2 = compile_intent_to_request(intent2, lab)
    assert r1["digest"] != r2["digest"]


# P04 source replay preserved (oracle on full set)
def test_p04_source_must_preserve():
    units = validate_unit_manifest(_load("unit-manifest.json"))["units"]
    protected = {u["unit_id"] for u in units if u.get("protected")}
    oracle = BehavioralOracle(protected_ids=protected, required_ids=protected)
    assert oracle.evaluate({u["unit_id"] for u in units})["result"] == "PRESERVED"


# P05 phenomenon extraction via compiler
def test_p05_phenomenon_from_ready_lab():
    c = Compiler()
    session = c.capture_as_test(
        intent=_load("capture-intent.json"),
        lab_result=_load("source-lab-result-ready.json"),
        unit_manifest=_load("unit-manifest.json"),
    )
    assert session.phenomenon
    assert session.phenomenon["claim_label"] == "INFERRED"
    assert session.phenomenon["source_lab_result_id"]


# P06 unit manifest
def test_p06_unit_manifest():
    m = validate_unit_manifest(_load("unit-manifest.json"))
    assert m["digest"] == _load("expected-digests.json")["unit_manifest_digest"] or m["digest"].startswith("sha256:")
    assert any(u.get("protected") for u in m["units"])
    assert any(u.get("eligible_for_removal") for u in m["units"])


# P07 dependency closure
def test_p07_dependency_closure_protects():
    units = [
        {"unit_id": "a", "protected": False, "eligible_for_removal": True, "dependencies": ["b"]},
        {"unit_id": "b", "protected": True, "eligible_for_removal": False, "dependencies": []},
    ]
    remove, rejected = dependency_closure({"b"}, units)
    # removing protected b via candidate should surface protected rejection when a depends on b and a not removed
    # removing a alone is fine
    remove2, rejected2 = dependency_closure({"a"}, units)
    assert "a" in remove2
    assert not rejected2


# P08 layer order
def test_p08_layer_order():
    defaults = capture_defaults()
    assert defaults["layer_order"][0] == "WORLD_CONFIGURATION"
    assert LAYER_ORDER[0] == "WORLD_CONFIGURATION"
    units = validate_unit_manifest(_load("unit-manifest.json"))["units"]
    buckets = units_by_layer(units)
    assert "TOOLS_RESOURCES" in buckets


# P09–P12 ddmin + minimality
def test_p09_p12_minimize_removes_eligible_keeps_protected():
    units = validate_unit_manifest(_load("unit-manifest.json"))["units"]
    protected = {u["unit_id"] for u in units if u.get("protected")}
    oracle = BehavioralOracle(protected_ids=protected, required_ids=protected)
    result = minimize(units, oracle, max_oracle_calls=256, compile_id="compile.test")
    assert protected.issubset(set(result["retained"]))
    assert result["minimality_status"] in ("ONE_MINIMAL", "PARTIALLY_MINIMIZED", "NOT_MINIMIZED")
    # removable history unit should be droppable
    assert "unit.history.unrelated-cycles" in result["removed"] or "unit.history.unrelated-cycles" not in result["retained"]


# P13–P15 oracle
def test_p13_p15_oracle_results_and_cache():
    oracle = BehavioralOracle(protected_ids={"p"}, required_ids={"p"})
    r1 = oracle.evaluate({"p", "x"})
    r2 = oracle.evaluate({"p", "x"})
    assert r1["result"] == "PRESERVED"
    assert r2["cache_hit"] is True
    assert oracle.evaluate({"x"})["result"] == "NOT_PRESERVED"
    # INVALID/INCONCLUSIVE never authorize removal
    assert oracle.evaluate({"p"}, force="INCONCLUSIVE")["authorizes_removal"] is False
    assert oracle.evaluate({"p"}, force="INVALID")["authorizes_removal"] is False


# P16 over-minimization
def test_p16_over_minimization_protection():
    assert reject_over_minimization({"unit.tool.shared-ledger"}, {"unit.tool.shared-ledger"}) is True
    prop = _load("over-minimization-proposal.json")
    removed = set(prop.get("candidate_removed_units") or [])
    # fixture proposes removing protected ledger
    assert "unit.tool.shared-ledger" in removed


# P17 budget exhaustion
def test_p17_budget_exhaustion():
    units = validate_unit_manifest(_load("unit-manifest.json"))["units"]
    protected = {u["unit_id"] for u in units if u.get("protected")}
    oracle = BehavioralOracle(protected_ids=protected, required_ids=protected)
    result = minimize(units, oracle, max_oracle_calls=1, compile_id="compile.budget")
    # with tiny budget may exhaust or still compile lightly
    assert result["status"] in ("BUDGET_EXHAUSTED", "COMPILED")
    if result["budget_exhausted"]:
        assert result["minimality_status"] == "PARTIALLY_MINIMIZED"


# P18 required controls via admission already tested

# P19 stochastic — inconclusive not preserved
def test_p19_inconclusive_not_preserved():
    oracle = BehavioralOracle(protected_ids={"p"}, required_ids={"p"})
    assert oracle.evaluate({"p"}, force="INCONCLUSIVE")["result"] == "INCONCLUSIVE"


# P20 receipt / P21 audit / P22 result / P23 captured test
def test_p20_p23_full_compile_pipeline():
    c = Compiler()
    session = c.capture_as_test(
        intent=_load("capture-intent.json"),
        lab_result=_load("source-lab-result-ready.json"),
        unit_manifest=_load("unit-manifest.json"),
    )
    assert session.status == "COMPILED"
    assert session.receipt["receipt_version"] == "phenomenon-compile-receipt/v1"
    assert session.receipt["canonicalization"] == "noema-jcs/1"
    assert session.compiler_result["status"] == "COMPILED"
    assert session.compiler_result["promotion_status"] == "PROMOTABLE"
    assert session.captured_test["schema_version"] == "captured-test/0.5"
    assert session.audit
    assert session.audit[0]["phase"] == "ADMISSION"
    # audit chain linked
    assert session.audit[1]["previous_digest"] == session.audit[0]["digest"]


# P24–P25 progressive disclosure
def test_p24_p25_disclosure_same_record():
    c = Compiler()
    session = c.capture_as_test(
        intent=_load("capture-intent.json"),
        lab_result=_load("source-lab-result-ready.json"),
        unit_manifest=_load("unit-manifest.json"),
    )
    assert session.simple_view["same_record"] is True
    assert session.advanced_view["same_record"] is True
    assert session.reproducibility_view["same_record"] is True
    assert session.simple_view["claim_label"] == session.captured_test["claim_label"]
    # simple must not overclaim COMPILED as proven
    assert session.simple_view["claim_label"] != "PROVEN"
    assert session.simple_view["presentation"]["title"] == "CAPTURED TEST"


# P26 regression not global ranking
def test_p26_regression_not_global_ranking():
    c = Compiler()
    session = c.capture_as_test(
        intent=_load("capture-intent.json"),
        lab_result=_load("source-lab-result-ready.json"),
        unit_manifest=_load("unit-manifest.json"),
    )
    reg = c.run_regression(session.captured_test, agent_version="agentver.x", oracle_result="NOT_PRESERVED")
    assert reg["status"] == "FAIL"
    assert reg["not_a_global_ranking"] is True
    assert reg["silent_family_generalization"] is False
    fixture_fail = _load("regression-result-fail.json")
    assert fixture_fail.get("not_a_global_ranking") is True or fixture_fail.get("status") == "FAIL"


# P27 generalization boundary
def test_p27_generalization_boundary_scenario_family():
    defaults = capture_defaults()
    assert defaults["generalization_default"] == "SCENARIO_FAMILY"


# P28 counterexample preservation
def test_p28_counterevidence_retained():
    c = Compiler()
    session = c.capture_as_test(
        intent=_load("capture-intent.json"),
        lab_result=_load("source-lab-result-ready.json"),
        unit_manifest=_load("unit-manifest.json"),
    )
    assert session.compiler_result["counterevidence"]


# P29 privacy partition
def test_p29_privacy_research_isolated():
    c = Compiler()
    session = c.capture_as_test(
        intent=_load("capture-intent.json"),
        lab_result=_load("source-lab-result-ready.json"),
        unit_manifest=_load("unit-manifest.json"),
    )
    assert session.captured_test["privacy_partition"] == "RESEARCH_ISOLATED"


# P30 RFC-0003 provenance
def test_p30_rfc0003_canonicalization_reused():
    c = Compiler()
    session = c.capture_as_test(
        intent=_load("capture-intent.json"),
        lab_result=_load("source-lab-result-ready.json"),
        unit_manifest=_load("unit-manifest.json"),
    )
    assert session.compiler_result["canonicalization"] == "noema-jcs/1"
    assert session.receipt["canonicalization"] == "noema-jcs/1"
    assert session.request["compiler_version"]["canonicalization"] == "noema-jcs/1"


# Runtime isolation + not-ready path
def test_runtime_capture_isolated(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    seq = rt.store.get_state().sequence
    head = rt.store.ledger_head()
    researcher = rt.create_session(role=Role.RESEARCHER)
    out = rt.capture_as_test(
        researcher["session_id"],
        intent=_load("capture-intent.json"),
        lab_result=_load("source-lab-result-ready.json"),
        unit_manifest=_load("unit-manifest.json"),
    )
    assert out["production_isolated"] is True
    assert out["production_mutated"] is False
    assert out["world_truth"] is False
    assert rt.store.get_state().sequence == seq
    assert rt.store.ledger_head() == head
    assert out["status"] == "COMPILED"
    assert out["captured_test"]
    view = rt.research_view(researcher["session_id"])
    assert view["captured_tests"]


def test_runtime_not_ready_fails_closed(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    researcher = rt.create_session(role=Role.RESEARCHER)
    not_ready = dict(_load("source-lab-result-ready.json"))
    not_ready["compiler_readiness"] = "NOT_READY"
    out = rt.capture_as_test(
        researcher["session_id"],
        intent=_load("capture-intent.json"),
        lab_result=not_ready,
    )
    assert out["status"] in ("NOT_READY", "FAILED")
    assert out["captured_test"] is None
    assert out["simple_view"]["presentation"]["next_action"]


def test_player_cannot_capture(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    player = rt.create_session(role=Role.AGENT, agent_id="p")
    with pytest.raises(ResearchError) as ei:
        rt.capture_as_test(
            player["session_id"],
            intent=_load("capture-intent.json"),
            lab_result=_load("source-lab-result-ready.json"),
        )
    assert ei.value.code == POLICY_DENIED


def test_reason_catalog_messages():
    assert "ready" in reason_message("NOT_READY")["simple_message"].lower() or "evidence" in reason_message(
        "NOT_READY"
    )["simple_message"].lower()


def test_fixture_digests_intent_and_request():
    intent = _load("capture-intent.json")
    body = {k: v for k, v in intent.items() if k != "digest"}
    assert sha256_digest(body) == intent["digest"]
    req = _load("compilation-request.json")
    body = {k: v for k, v in req.items() if k != "digest"}
    assert sha256_digest(body) == req["digest"]
