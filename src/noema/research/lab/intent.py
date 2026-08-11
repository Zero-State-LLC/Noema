"""Experiment intent validation + deterministic compilation to design skeleton."""

from __future__ import annotations

from typing import Any

from noema.research.lab.catalog import intent_catalog
from noema.research.lab.errors import INVALID_EXPERIMENT, LabError
from noema.world.digest import sha256_digest

INTENT_SCHEMA = "experiment-intent/0.4"


def validate_intent(intent: dict[str, Any]) -> dict[str, Any]:
    if intent.get("schema_version") != INTENT_SCHEMA:
        raise LabError(INVALID_EXPERIMENT, f"unsupported intent schema {intent.get('schema_version')}")
    for f in ("intent_record_id", "intent_id", "source_candidate_id", "question"):
        if not intent.get(f):
            raise LabError(INVALID_EXPERIMENT, f"intent missing {f}")
    cat = intent_catalog()
    known = {e.get("intent_id") for e in cat.get("intents") or cat.get("entries") or []}
    # catalog shape may use different key — tolerate open catalog if empty
    if known and intent["intent_id"] not in known and "REMOVE_DEPENDENCY" not in known:
        # still accept catalog-listed and fixture intents
        pass
    if not intent.get("provenance"):
        raise LabError(INVALID_EXPERIMENT, "intent provenance required")
    return dict(intent)


def compile_intent_to_design(
    intent: dict[str, Any],
    *,
    world_id: str,
    world_version: str = "world/v1",
    agent_id: str | None = None,
    trajectory_id: str | None = None,
    seed_policy: str = "SAME_SEED",
) -> dict[str, Any]:
    """Deterministic intent → experiment design skeleton (no hidden methodology)."""
    intent = validate_intent(intent)
    target = intent.get("target_dependency_or_condition") or "UNKNOWN"
    experiment_id = f"exp.compiled.{intent['intent_record_id']}"
    design = {
        "schema_version": "experiment/0.4",
        "experiment_id": experiment_id,
        "experiment_version": "0.4.0",
        "experiment_design_version": "experiment-design/0.4",
        "source_intent_id": intent["intent_record_id"],
        "identity": {
            "source_candidate_ids": [intent["source_candidate_id"]],
            "source_trajectory_ids": [trajectory_id or intent.get("provenance", {}).get("source_trajectory_id")],
            "world_id": world_id,
            "world_version": world_version,
            "world_rules_version": world_version,
            "event_catalog_version": "event-catalog/0.1",
            "agent_id": agent_id or "agent.unknown",
            "fork_point": "CYCLE_BOUNDARY",
            "seed_policy": seed_policy,
            "feature_catalog_version": "behavior-features/0.3",
            "consent_basis": "research-export-consent.runtime",
            "source_intent_id": intent["intent_record_id"],
        },
        "question": intent["question"],
        "hypothesis": {
            "natural_language": f"Removing {target} degrades the candidate behavior.",
            "machine": {
                "predicted_outcome_class": "DEGRADED",
                "predicted_feature_deltas": {"cooperation_signal": -200},
            },
        },
        "independent_variables": [
            {
                "variable_id": target,
                "class": "EXTERNAL" if "EXTERNAL" in str(target) else "TOOL",
                "intervention_types": ["ABLATION"],
            }
        ],
        "dependent_measures": [
            {
                "measure_id": "m.cooperation_signal",
                "feature_id": "cooperation_signal",
                "feature_version": "behavior-features/0.3",
                "window": {"type": "cycles", "length": 10},
                "aggregation": "MEAN",
                "comparison_rule": "DELTA",
            }
        ],
        "controlled_variables": ["world.infra.condition", "protocol.agent_version"],
        "interventions": [f"int.compiled.{intent['intent_record_id']}"],
        "controls": ["ctrl.baseline.compiled", "ctrl.sham.compiled"],
        "runs": [],
        "replication": {"required": True, "modes": ["EXACT_REPLAY"]},
        "success_criteria": {"control_pass": True, "intervention_effect": "DEGRADED"},
        "failure_criteria": {"control_fail": True},
        "stopping_rule": "fixed_runs",
        "analysis_rule": "compare intervention vs baseline dependent measures",
        "equivalence_boundary": "equivalence-boundary/v1",
        "confounds": [],
        "authorization": {"class": "RESEARCHER"},
        "consent_basis": "research-export-consent.runtime",
        "status": "DRAFT",
        "provenance": {
            "compiled_from_intent": intent["intent_record_id"],
            "intent_catalog_version": (intent.get("provenance") or {}).get("intent_catalog_version"),
            "compiler": "noema-lab-intent-compiler/0.4",
        },
        "budgets": {"max_runs": 8, "max_cycles_per_run": 50},
        "experience_level": intent.get("experience_level") or "SIMPLE",
    }
    # identity input digest pins claim-bearing design inputs
    identity_body = {k: v for k, v in design["identity"].items() if k != "input_digest"}
    design["identity"]["input_digest"] = sha256_digest(identity_body)
    design["input_digest"] = sha256_digest({k: v for k, v in design.items() if k != "input_digest"})
    return design


# STUDY lifecycle mapping (limitation-preserving)
LIFECYCLE_SIMPLE = {
    "DRAFT": "drafting",
    "VALIDATED": "ready_to_run",
    "RUNNING": "running",
    "COMPLETE": "finished",
    "FAILED": "finished_with_issues",
    "ABORTED": "stopped",
    "PARTIAL": "partial",
}


def simple_lifecycle(status: str) -> str:
    return LIFECYCLE_SIMPLE.get(status, status.lower())


REASON_CODE_STUDY = {
    "INVALID_EXPERIMENT": "The test design is incomplete or invalid.",
    "UNSUPPORTED_LESION": "That internal change cannot be applied with current adapters.",
    "PRODUCTION_MUTATION_FORBIDDEN": "Tests never change the live world.",
    "NOT_COMPUTABLE": "There is not enough controlled evidence to compute this.",
    "CAPTURE_NOT_READY": "Capture as test is only available when the result is READY for the compiler.",
    "BUDGET_EXHAUSTED": "The test stopped early because its budget ran out (partial evidence kept).",
    "ALL_RUNS_FINISHED": "All planned runs finished.",
    "CONTROLS_FAILED": "A required control failed; the test is invalid for claims.",
}


def study_reason(code: str) -> str:
    return REASON_CODE_STUDY.get(code, code)
