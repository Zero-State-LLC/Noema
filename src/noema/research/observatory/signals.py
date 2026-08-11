"""External cognition + coordination signals (artifact-based, multi-interpretation)."""

from __future__ import annotations

from typing import Any


def external_cognition_signal(
    *,
    signal_id: str,
    signal_type: str,
    artifact_entity_id: str,
    participants: list[str],
    evidence_refs: list[str],
) -> dict[str, Any]:
    return {
        "signal_id": signal_id,
        "signal_type": signal_type,
        "artifact_entity_id": artifact_entity_id,
        "participants": list(participants),
        "evidence_refs": list(evidence_refs),
        "claim_label": "INFERRED",
        # Explicit non-claims
        "internal_memory_deficiency_claim": False,
        "claim_bearing_path": "deterministic_heuristics",
    }


def coordination_signal(
    *,
    coordination_signal_id: str,
    signal_type: str,
    participants: list[str],
    evidence_refs: list[str],
    possible_interpretations: list[str] | None = None,
    confounds: list[str] | None = None,
) -> dict[str, Any]:
    if len(participants) < 2:
        raise ValueError("coordination requires multi-agent participants")
    return {
        "coordination_signal_id": coordination_signal_id,
        "signal_type": signal_type,
        "participants": list(participants),
        "evidence_refs": list(evidence_refs),
        "possible_interpretations": list(
            possible_interpretations or ["cooperation", "trade", "coincidence"]
        ),
        "confounds": list(confounds or []),
        "claim_label": "INFERRED",
        "auto_labeled_cooperation": False,
    }


def contradiction_analysis(
    *,
    contradiction_set: dict[str, Any],
    agent_behavior_refs: list[str] | None = None,
) -> dict[str, Any]:
    """Record behavior under contradiction; do not auto-resolve world truth."""
    return {
        "schema_version": "contradiction-analysis/0.3",
        "contradiction_set_id": contradiction_set.get("contradiction_set_id"),
        "agent_visible_relationship": contradiction_set.get("agent_visible_relationship"),
        "research_visible_relationship": contradiction_set.get("research_visible_relationship"),
        "agent_belief_as_observed": False,  # beliefs must not be OBSERVED
        "auto_truth_resolution": False,
        "behavior_under_contradiction_refs": list(agent_behavior_refs or []),
        "claim_label": "INFERRED",
        "world_truth_rewritten": False,
    }
