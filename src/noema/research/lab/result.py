"""Lab results, classification, compiler readiness, simple projection."""

from __future__ import annotations

from typing import Any

from noema.research.lab.errors import CAPTURE_NOT_READY, LabError
from noema.world.digest import sha256_digest

OUTCOME_CLASSES = (
    "DEGRADED",
    "PERSISTED",
    "IMPROVED",
    "UNCHANGED",
    "INVALID",
    "NOT_COMPARABLE",
    "NOT_COMPUTABLE",
)
REPLICATION = ("REPRODUCED", "PARTIALLY_REPRODUCED", "NOT_REPRODUCED", "NOT_COMPARABLE")
COMPILER_READY = ("READY", "NOT_READY", "REJECTED")


def classify_intervention_outcome(baseline_measure: int | None, intervention_measure: int | None, *, threshold: int = 150) -> str:
    if baseline_measure is None or intervention_measure is None:
        return "NOT_COMPUTABLE"
    delta = int(intervention_measure) - int(baseline_measure)
    if delta <= -threshold:
        return "DEGRADED"
    if delta >= threshold:
        return "IMPROVED"
    return "PERSISTED"


def classify_replication(a: int | None, b: int | None, *, band: int = 50) -> str:
    if a is None or b is None:
        return "NOT_COMPARABLE"
    if abs(int(a) - int(b)) <= band:
        return "REPRODUCED"
    if abs(int(a) - int(b)) <= band * 3:
        return "PARTIALLY_REPRODUCED"
    return "NOT_REPRODUCED"


def build_lab_result(
    *,
    lab_result_id: str,
    experiment_id: str,
    source_candidate_ids: list[str],
    runs: list[dict[str, Any]],
    measure_feature: str = "cooperation_signal",
    confounds: list[str] | None = None,
    counterevidence: list[str] | None = None,
    source_intent_id: str | None = None,
    required_controls_pass: bool = True,
    budget_partial: bool = False,
) -> dict[str, Any]:
    by_role: dict[str, list[dict[str, Any]]] = {}
    for r in runs:
        by_role.setdefault(r.get("run_role") or "BASELINE", []).append(r)

    def measure(role: str) -> int | None:
        rs = by_role.get(role) or []
        if not rs:
            return None
        return (rs[0].get("measures") or {}).get(measure_feature)

    base_m = measure("BASELINE")
    sham_m = measure("SHAM_CONTROL")
    int_m = measure("INTERVENTION")
    rep_m = measure("REPLICATION")
    ver_m = measure("VERSION_DIFFERENTIAL")

    control_outcomes: dict[str, str] = {}
    if base_m is not None:
        control_outcomes["BASELINE"] = "PASS"
    if sham_m is not None and base_m is not None:
        control_outcomes["SHAM_CONTROL"] = "PASS" if abs(sham_m - base_m) <= 50 else "FAIL"
    elif sham_m is not None:
        control_outcomes["SHAM_CONTROL"] = "PASS"

    controls_ok = all(v == "PASS" for v in control_outcomes.values()) if control_outcomes else False
    if required_controls_pass and control_outcomes and not controls_ok:
        interpretation = "INVALID"
        intervention_outcomes = {"*": "INVALID"}
        claim = "NOT_COMPUTABLE"
        readiness = "REJECTED"
    else:
        iv_out = classify_intervention_outcome(base_m, int_m)
        intervention_outcomes = {}
        for r in by_role.get("INTERVENTION") or []:
            for iv in r.get("interventions_applied") or []:
                if iv.get("intervention_id"):
                    intervention_outcomes[iv["intervention_id"]] = iv_out
        if not intervention_outcomes:
            intervention_outcomes["intervention"] = iv_out
        if iv_out == "DEGRADED":
            interpretation = "SUPPORTED"
            claim = "INFERRED"
            readiness = "NOT_READY"  # needs replication/generalization for READY
        elif iv_out == "PERSISTED":
            interpretation = "NOT_SUPPORTED"
            claim = "INFERRED"
            readiness = "NOT_READY"
        else:
            interpretation = "INCONCLUSIVE"
            claim = "INFERRED" if iv_out != "NOT_COMPUTABLE" else "NOT_COMPUTABLE"
            readiness = "NOT_READY"

    replication_outcomes = {
        "EXACT_REPLAY": classify_replication(int_m, rep_m),
    }
    if ver_m is not None:
        replication_outcomes["CROSS_AGENT_VERSION"] = classify_replication(int_m, ver_m, band=80)

    # READY only when supported + reproduced + controls pass
    if (
        interpretation == "SUPPORTED"
        and controls_ok
        and replication_outcomes.get("EXACT_REPLAY") == "REPRODUCED"
        and not budget_partial
    ):
        readiness = "READY"

    supporting = []
    if base_m is not None and int_m is not None:
        supporting.append(f"{measure_feature} baseline {base_m} vs intervention {int_m}")
    if replication_outcomes.get("EXACT_REPLAY") == "REPRODUCED":
        supporting.append("replication matched intervention band")

    result = {
        "schema_version": "lab-result/0.4",
        "lab_result_id": lab_result_id,
        "experiment_id": experiment_id,
        "source_candidate_ids": list(source_candidate_ids),
        "run_ids": [r.get("run_id") for r in runs],
        "control_outcomes": control_outcomes,
        "intervention_outcomes": intervention_outcomes,
        "replication_outcomes": replication_outcomes,
        "generalization_outcomes": {"default": "NOT_COMPARABLE"},
        "supporting_evidence": supporting,
        "counterevidence": list(counterevidence or []),
        "confounds": list(confounds or []),
        "execution_status": "PARTIAL" if budget_partial else "COMPLETE",
        "interpretation": interpretation,
        "claim_label": claim,
        "compiler_readiness": readiness,
        "failed_experiments_retained": True,
        "source_intent_id": source_intent_id,
        "world_truth": False,
        "creates_fixture": False,
        "production_mutated": False,
    }
    result["digest"] = sha256_digest({k: v for k, v in result.items() if k != "digest"})
    return result


def simple_result_projection(result: dict[str, Any], *, question: str | None = None) -> dict[str, Any]:
    """Claim-preserving STUDY projection — never stronger than lab result."""
    readiness = result.get("compiler_readiness") or "NOT_READY"
    interpretation = result.get("interpretation")
    claim = result.get("claim_label")
    # simple statement must not upgrade claim
    if interpretation == "SUPPORTED":
        stmt = (
            "Evidence suggests the behavior occurred less reliably when the declared "
            "support was removed, within the tested conditions."
        )
        outcome = next(iter((result.get("intervention_outcomes") or {}).values()), "DEGRADED")
    elif interpretation == "NOT_SUPPORTED":
        stmt = "Within the tested conditions, the behavior did not clearly degrade under the intervention."
        outcome = next(iter((result.get("intervention_outcomes") or {}).values()), "PERSISTED")
    elif interpretation == "INVALID":
        stmt = "Required controls failed; this test cannot support a claim."
        outcome = "INVALID"
    else:
        stmt = "The test finished without a clear supported/not-supported interpretation."
        outcome = "INCONCLUSIVE"

    return {
        "schema_version": "simple-result-projection/0.4",
        "projection_id": f"simple-result.{result.get('lab_result_id')}",
        "lab_result_id": result.get("lab_result_id"),
        "experiment_id": result.get("experiment_id"),
        "source_intent_id": result.get("source_intent_id"),
        "question": question,
        "interpretation": interpretation,
        "claim_label": claim,  # preserved exactly
        "compiler_readiness": readiness,
        "result": {
            "outcome_class": outcome,
            "simple_statement": stmt,
            "within_tested_conditions": True,
        },
        "evidence": list(result.get("supporting_evidence") or [])[:5],
        "counterevidence": list(result.get("counterevidence") or [])[:5],
        "same_record": True,
        "mutates_world": False,
    }


def gate_capture_as_test(result: dict[str, Any]) -> dict[str, Any]:
    """CAPTURE AS TEST only when compiler_readiness is READY."""
    if result.get("compiler_readiness") != "READY":
        raise LabError(
            CAPTURE_NOT_READY,
            "CAPTURE AS TEST gated on compiler_readiness READY",
            details={"compiler_readiness": result.get("compiler_readiness")},
        )
    return {
        "capture_allowed": True,
        "lab_result_id": result.get("lab_result_id"),
        "experiment_id": result.get("experiment_id"),
        "note": "handoff evidence only — does not create permanent fixture",
        "creates_fixture": False,
    }
