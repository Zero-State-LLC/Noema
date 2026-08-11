"""Interventions: ablation, perturbation, lesion (unsupported → NOT_COMPUTABLE)."""

from __future__ import annotations

from typing import Any

from noema.research.lab.catalog import ablation_catalog, perturbation_catalog
from noema.research.lab.errors import INVALID_INTERVENTION, NOT_COMPUTABLE, PRODUCTION_MUTATION_FORBIDDEN, LabError
from noema.research.lab.fork import ExperimentalWorld
from noema.world.digest import sha256_digest

INTERVENTION_TYPES = ("ABLATION", "PERTURBATION", "LESION", "COUNTERFACTUAL")
FORBIDDEN_SIDE_EFFECTS = (
    "PRODUCTION_WORLD_MUTATION",
    "LEDGER_APPEND_TO_SOURCE",
    "REWARD_INJECTION",
)


def validate_intervention(iv: dict[str, Any]) -> dict[str, Any]:
    if iv.get("schema_version") != "intervention/0.4":
        raise LabError(INVALID_INTERVENTION, f"unsupported intervention schema {iv.get('schema_version')}")
    itype = iv.get("type") or iv.get("intervention_type")
    if itype not in INTERVENTION_TYPES:
        raise LabError(INVALID_INTERVENTION, f"unknown intervention type {itype}")
    if not iv.get("intervention_id"):
        raise LabError(INVALID_INTERVENTION, "intervention_id required")
    if not iv.get("target"):
        raise LabError(INVALID_INTERVENTION, "target required")
    for bad in iv.get("forbidden_side_effects") or []:
        if bad not in FORBIDDEN_SIDE_EFFECTS and bad not in (
            "PRODUCTION_WORLD_MUTATION",
            "LEDGER_APPEND_TO_SOURCE",
            "REWARD_INJECTION",
        ):
            pass
    # must declare no production mutation
    if iv.get("mutates_production") is True:
        raise LabError(PRODUCTION_MUTATION_FORBIDDEN, "intervention mutates_production forbidden")
    return dict(iv)


def apply_intervention(world: ExperimentalWorld, iv: dict[str, Any]) -> dict[str, Any]:
    """Apply intervention to experimental world only. Returns application record."""
    iv = validate_intervention(iv)
    itype = iv.get("type") or iv.get("intervention_type")
    target = iv.get("target") or {}

    if itype == "LESION":
        # unsupported internal lesions → NOT_COMPUTABLE (no silent invent)
        if target.get("version") == "unavailable" or target.get("kind") == "AGENT_COMPONENT":
            raise LabError(
                NOT_COMPUTABLE,
                "unsupported lesion — adapter unavailable",
                details={"intervention_id": iv["intervention_id"], "code": "UNSUPPORTED_LESION"},
            )
        raise LabError(NOT_COMPUTABLE, "lesion not supported in v0.4 runtime adapters")

    if itype == "ABLATION":
        return _apply_ablation(world, iv)
    if itype == "PERTURBATION":
        return _apply_perturbation(world, iv)
    if itype == "COUNTERFACTUAL":
        return _apply_counterfactual(world, iv)
    raise LabError(INVALID_INTERVENTION, f"unhandled type {itype}")


def _apply_ablation(world: ExperimentalWorld, iv: dict[str, Any]) -> dict[str, Any]:
    target = iv["target"]
    tool_id = target.get("id")
    catalog_ids = {e.get("affordance_id") for e in ablation_catalog().get("entries") or []}
    # TOOL_ACCESS covers tool.* ablations
    if target.get("kind") == "TOOL" and tool_id:
        world.ablated_tools.add(str(tool_id))
    elif "TOOL_ACCESS" in catalog_ids:
        world.ablated_tools.add(str(tool_id or "tool.unknown"))
    else:
        raise LabError(INVALID_INTERVENTION, "ablation target not in catalog")
    rec = {
        "applied": True,
        "type": "ABLATION",
        "intervention_id": iv["intervention_id"],
        "experimental_world_id": world.fork["experimental_world_id"],
        "production_mutated": False,
        "ablated": list(world.ablated_tools),
        "restore_rule": iv.get("restore_rule") or "AUTO_ON_RUN_END",
    }
    rec["digest"] = sha256_digest(rec)
    return rec


def _apply_perturbation(world: ExperimentalWorld, iv: dict[str, Any]) -> dict[str, Any]:
    target = iv["target"]
    param_id = target.get("id") or target.get("parameter_id")
    entries = {e["parameter_id"]: e for e in perturbation_catalog().get("entries") or []}
    # map observation.noise.level → OBSERVATION_NOISE if needed
    resolved = None
    if param_id in entries:
        resolved = param_id
    else:
        for eid, e in entries.items():
            if eid.lower() in str(param_id).lower().replace(".", "_"):
                resolved = eid
                break
        if "noise" in str(param_id).lower() and "OBSERVATION_NOISE" in entries:
            resolved = "OBSERVATION_NOISE"
        if "resource" in str(param_id).lower() and "RESOURCE_LEVEL" in entries:
            resolved = "RESOURCE_LEVEL"
    if resolved is None and entries:
        # still allow versioned application if declared as VARIABLE
        if target.get("kind") != "VARIABLE":
            raise LabError(INVALID_INTERVENTION, f"perturbation not in catalog: {param_id}")
        resolved = str(param_id)
    pert = {
        "parameter_id": resolved or param_id,
        "before": iv.get("before_reference"),
        "after": iv.get("after_reference"),
        "application_point": iv.get("application_point"),
        "seed_policy": iv.get("seed_policy") or "SAME_SEED",
    }
    world.perturbations.append(pert)
    rec = {
        "applied": True,
        "type": "PERTURBATION",
        "intervention_id": iv["intervention_id"],
        "perturbation": pert,
        "production_mutated": False,
        "deterministic": True,
    }
    rec["digest"] = sha256_digest(rec)
    return rec


def _apply_counterfactual(world: ExperimentalWorld, iv: dict[str, Any]) -> dict[str, Any]:
    # counterfactual requires complete before/after variable declaration
    if "before_reference" not in iv or "after_reference" not in iv:
        # also accept changed_variables style from counterfactual.json
        if not iv.get("changed_variables"):
            raise LabError(INVALID_INTERVENTION, "counterfactual incomplete variable declaration")
    rec = {
        "applied": True,
        "type": "COUNTERFACTUAL",
        "intervention_id": iv.get("intervention_id") or iv.get("counterfactual_id"),
        "changed": iv.get("changed_variables") or {
            "before": iv.get("before_reference"),
            "after": iv.get("after_reference"),
        },
        "held_constant": iv.get("held_constant_variables") or [],
        "production_mutated": False,
    }
    rec["digest"] = sha256_digest(rec)
    return rec


def restore_on_run_end(world: ExperimentalWorld) -> None:
    world.ablated_tools.clear()
    world.perturbations.clear()
    world.restored = True


def validate_counterfactual_record(cf: dict[str, Any]) -> dict[str, Any]:
    if not cf.get("changed_variables"):
        raise LabError(INVALID_INTERVENTION, "counterfactual requires changed_variables")
    for ch in cf["changed_variables"]:
        if "before_value_or_ref" not in ch or "after_value_or_ref" not in ch:
            raise LabError(INVALID_INTERVENTION, "counterfactual variable incomplete")
    if "held_constant_variables" not in cf:
        raise LabError(INVALID_INTERVENTION, "counterfactual requires held_constant_variables")
    return dict(cf)
