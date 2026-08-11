"""Capture intent → canonical compilation request."""

from __future__ import annotations

from typing import Any

from noema.research.compiler.admission import admit_lab_result
from noema.research.compiler.catalog import capture_defaults
from noema.research.compiler.errors import INVALID_INTENT, CompilerError
from noema.world.digest import sha256_digest

INTENT_SCHEMA = "capture-intent/0.5"
REQUEST_SCHEMA = "compilation-request/0.5"


def validate_capture_intent(intent: dict[str, Any]) -> dict[str, Any]:
    if intent.get("schema_version") != INTENT_SCHEMA:
        raise CompilerError(INVALID_INTENT, f"unsupported capture-intent schema {intent.get('schema_version')}")
    if intent.get("capture_intent") != "CAPTURE_AS_TEST":
        raise CompilerError(INVALID_INTENT, "capture_intent must be CAPTURE_AS_TEST")
    if not intent.get("capture_intent_id") or not intent.get("source_lab_result_id"):
        raise CompilerError(INVALID_INTENT, "capture_intent_id and source_lab_result_id required")
    defaults = capture_defaults()
    allowed = set(defaults.get("allowed_override_fields") or [])
    for key in (intent.get("user_overrides") or {}):
        if key not in allowed:
            raise CompilerError(INVALID_INTENT, f"override not allowed: {key}")
    out = dict(intent)
    body = {k: v for k, v in out.items() if k != "digest"}
    dig = sha256_digest(body)
    if out.get("digest") and out["digest"] != dig:
        raise CompilerError(INVALID_INTENT, "capture intent digest mismatch")
    out["digest"] = dig
    return out


def compile_intent_to_request(
    intent: dict[str, Any],
    lab_result: dict[str, Any],
    *,
    units: list[dict[str, Any]] | None = None,
    trajectory: dict[str, Any] | None = None,
    compile_id: str | None = None,
) -> dict[str, Any]:
    """Deterministic mapping: capture-intent + defaults + READY lab → compilation-request."""
    intent = validate_capture_intent(intent)
    admit_lab_result(lab_result)
    defaults = capture_defaults()
    overrides = dict(intent.get("user_overrides") or {})
    cid = compile_id or f"compile.{intent['capture_intent_id'].removeprefix('capture.')}"
    traj = trajectory or {
        "trajectory_id": f"traj.{lab_result['lab_result_id']}",
        "trajectory_digest": sha256_digest({"lab_result_id": lab_result["lab_result_id"]}),
        "world_seed_digest": sha256_digest({"seed": "source"}),
        "world_version": "world/v1",
        "protocol_versions": {"agent-protocol": "agent-protocol/v1", "event-catalog": "event-catalog/0.1"},
        "deterministic_config_digest": sha256_digest({"config": "default"}),
        "external_inputs_digest": sha256_digest({"external": "none"}),
    }
    removable = []
    for u in units or []:
        if u.get("eligible_for_removal") and not u.get("protected"):
            removable.append(u["unit_id"])
    budgets = dict(defaults.get("budgets") or {})
    if "max_oracle_calls" in overrides:
        budgets["max_oracle_calls"] = int(overrides["max_oracle_calls"])
    request = {
        "schema_version": REQUEST_SCHEMA,
        "compile_id": cid,
        "candidate_id": (lab_result.get("source_candidate_ids") or ["candidate.unknown"])[0],
        "source_lab_result_id": lab_result["lab_result_id"],
        "source_trajectory": traj,
        "candidate_interval": {
            "start_cycle": 0,
            "end_cycle": 40,
            "start_event_id": "ev.start",
            "end_event_id": "ev.end",
        },
        "target_behavior": {
            "target_id": f"target.{cid}",
            "predicate_version": "predicate/runtime/0.5.0",
            "predicates": [
                {
                    "predicate_id": "pred.behavior-preserved",
                    "version": "1.0.0",
                    "observation_points": ["cycle_end"],
                }
            ],
            "claim_label": lab_result.get("claim_label") or "INFERRED",
        },
        "equivalence_boundary": {
            "boundary_version": "equivalence-boundary/v1",
            "profile": "compiler-capture",
        },
        "removable_units": removable,
        "dependency_graph": {"nodes": [], "edges": [], "closure_rules_version": "dependency-closure/0.5"},
        "required_controls": list((lab_result.get("control_outcomes") or {}).keys()),
        "perturbation_space": {"operators": [], "enumeration_order": "canonical"},
        "budgets": budgets,
        "policy_context": {
            "visibility": overrides.get("export_class") or defaults.get("capture_visibility_default"),
            "consent": True,
            "export_class": overrides.get("export_class") or "RESEARCH_ISOLATED",
        },
        "compiler_version": {
            "compiler": "phenomenon-compiler/0.5.0",
            "oracle": defaults.get("oracle_policy"),
            "minimization": defaults.get("minimization_strategy_version"),
            "canonicalization": "noema-jcs/1",
            "defaults_version": defaults.get("defaults_version"),
            "seed_policy": overrides.get("seed_policy") or defaults.get("seed_policy"),
            "replication_policy": overrides.get("replication_policy") or defaults.get("replication_policy"),
        },
        "source_capture_intent_id": intent["capture_intent_id"],
        "title": intent.get("optional_title") or lab_result.get("lab_result_id"),
    }
    request["digest"] = sha256_digest({k: v for k, v in request.items() if k != "digest"})
    return request
