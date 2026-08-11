"""Deterministic Situation Genome mutation (closed catalog, seeded, bounded)."""

from __future__ import annotations

import copy
from typing import Any

from noema.research.errors import INVALID_MUTATION, ResearchError
from noema.research.frontier.catalog import operator_by_id, operator_ids
from noema.research.frontier.genomes import genome_content_digest, validate_genome


def _clamp_mp(value: int) -> int:
    return max(0, min(1000, int(value)))


def apply_operator(genome: dict[str, Any], operator_id: str, params: dict[str, Any]) -> dict[str, Any]:
    """Apply one closed-catalog operator. Mutations change conditions only."""
    op = operator_by_id(operator_id)
    if op is None:
        raise ResearchError(INVALID_MUTATION, f"unknown operator {operator_id}")
    domain = op.get("parameter_domain") or {}
    intensity = params.get("intensity_millipoints")
    if "intensity_millipoints" in domain:
        if not isinstance(intensity, int):
            raise ResearchError(INVALID_MUTATION, "intensity_millipoints must be int")
        lo = int(domain["intensity_millipoints"].get("minimum", 0))
        hi = int(domain["intensity_millipoints"].get("maximum", 1000))
        if intensity < lo or intensity > hi:
            raise ResearchError(INVALID_MUTATION, "intensity out of domain")

    # Forbidden research paths must not be written
    for path in op.get("forbidden_paths") or []:
        if path in params:
            raise ResearchError(INVALID_MUTATION, f"forbidden path in params: {path}")

    child = copy.deepcopy(genome)
    intensity = int(intensity or 0)
    rc = int(child.get("risk_class") or 0)
    nv = dict(child.get("novelty_vector") or {})

    if operator_id == "MUT_RESOURCE_SCARCITY":
        rc = min(4, rc + int(op.get("risk_effect") or 1))
        rc_map = dict(child.get("resource_conditions") or {})
        rc_map["production_modifier_pressure"] = _clamp_mp(
            int(rc_map.get("production_modifier_pressure") or 0) + intensity
        )
        child["resource_conditions"] = rc_map
        nv["resource"] = _clamp_mp(int(nv.get("resource") or 0) + intensity // 2 + 50)
    elif operator_id == "MUT_RESOURCE_DISTRIBUTION":
        rc = min(4, rc + 1)
        rc_map = dict(child.get("resource_conditions") or {})
        rc_map["distribution_skew_millipoints"] = intensity
        child["resource_conditions"] = rc_map
        nv["resource"] = _clamp_mp(int(nv.get("resource") or 0) + intensity // 3)
        nv["social_topology"] = _clamp_mp(int(nv.get("social_topology") or 0) + intensity // 4)
    elif operator_id == "MUT_INFORMATION_VISIBILITY":
        info = dict(child.get("information_distribution") or {})
        info["visibility_pressure"] = intensity
        child["information_distribution"] = info
        nv["epistemic"] = _clamp_mp(int(nv.get("epistemic") or 0) + intensity // 2)
    elif operator_id == "MUT_FALSE_SIGNAL":
        ce = dict(child.get("contradictory_evidence") or {})
        ce["false_signal_intensity"] = intensity
        ce.setdefault("contradiction_set_id", ce.get("contradiction_set_id") or "cset.runtime")
        child["contradictory_evidence"] = ce
        nv["epistemic"] = _clamp_mp(int(nv.get("epistemic") or 0) + intensity // 2 + 100)
        nv["causal"] = _clamp_mp(int(nv.get("causal") or 0) + intensity // 3)
    elif operator_id == "MUT_COMMUNICATION_TOPOLOGY":
        child["social_topology"] = f"{child.get('social_topology') or 'baseline'}:topo-{intensity}"
        nv["social_topology"] = _clamp_mp(int(nv.get("social_topology") or 0) + intensity // 2)
    elif operator_id == "MUT_ORG_RELATION":
        child["social_topology"] = f"{child.get('social_topology') or 'baseline'}:org-{intensity}"
        nv["social_topology"] = _clamp_mp(int(nv.get("social_topology") or 0) + intensity // 2)
    elif operator_id == "MUT_TIME_PRESSURE":
        ts = dict(child.get("temporal_structure") or {})
        ts["decision_deadline_cycle_offset"] = max(1, int(ts.get("decision_deadline_cycle_offset") or 5) - intensity // 200)
        child["temporal_structure"] = ts
        nv["temporal"] = _clamp_mp(int(nv.get("temporal") or 0) + intensity // 2)
    elif operator_id == "MUT_TOOL_AVAILABILITY":
        tools = list(child.get("tool_availability") or [])
        # degrade by dropping optional tools deterministically at high intensity
        if intensity >= 700 and "TRADE" in tools:
            tools = [t for t in tools if t != "TRADE"]
        child["tool_availability"] = tools
        nv["tool"] = _clamp_mp(int(nv.get("tool") or 0) + intensity // 2)
    elif operator_id == "MUT_INFRA_CONDITION":
        entities = list(child.get("affected_entities") or [])
        child["affected_entities"] = entities
        rc_map = dict(child.get("resource_conditions") or {})
        rc_map["infra_degradation_millipoints"] = intensity
        child["resource_conditions"] = rc_map
        nv["causal"] = _clamp_mp(int(nv.get("causal") or 0) + intensity // 2)
        nv["resource"] = _clamp_mp(int(nv.get("resource") or 0) + intensity // 4)
    elif operator_id == "MUT_GOAL_CONFLICT":
        gs = dict(child.get("goal_structure") or {})
        incentives = list(gs.get("world_incentives") or [])
        incentives.append(f"conflict-pressure-{intensity}")
        gs["world_incentives"] = incentives
        gs["no_scripted_agent_actions"] = True
        child["goal_structure"] = gs
        nv["goal_structure"] = _clamp_mp(int(nv.get("goal_structure") or 0) + intensity // 2)
    elif operator_id == "MUT_PARTICIPANT_TOPOLOGY":
        parts = dict(child.get("participants") or {})
        parts["topology_pressure"] = intensity
        child["participants"] = parts
        nv["social_topology"] = _clamp_mp(int(nv.get("social_topology") or 0) + intensity // 2)
    else:
        raise ResearchError(INVALID_MUTATION, f"operator not implemented: {operator_id}")

    child["risk_class"] = min(4, max(rc, int(child.get("risk_class") or 0)))
    child["novelty_vector"] = nv
    lineage = list(child.get("mutation_lineage") or [])
    lineage.append({"operator_id": operator_id, "params": {"intensity_millipoints": intensity}})
    child["mutation_lineage"] = lineage
    child["genome_version"] = str(int(child.get("genome_version") or "0") + 1)
    child["parent_genome_id"] = genome.get("genome_id")
    child["genome_id"] = f"{genome.get('genome_id')}.{operator_id}.{intensity}"
    child["content_digest"] = genome_content_digest(child)
    return child


def mutate_sequence(
    parent: dict[str, Any],
    operations: list[dict[str, Any]],
    *,
    validate: bool = True,
) -> dict[str, Any]:
    """Apply ordered mutation ops. Same parent+params ⇒ same child digest."""
    if validate:
        parent = validate_genome(parent)
    child = copy.deepcopy(parent)
    for op in operations:
        operator_id = op.get("operator_id")
        if not operator_id:
            raise ResearchError(INVALID_MUTATION, "operator_id required")
        if operator_id not in operator_ids():
            raise ResearchError(INVALID_MUTATION, f"operator not in catalog: {operator_id}")
        params = op.get("params") or {}
        child = apply_operator(child, operator_id, params)
    if validate:
        child = validate_genome(child, require_digest=False)
        child["content_digest"] = genome_content_digest(child)
    return child
