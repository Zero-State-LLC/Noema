"""Spectator / player research redaction."""

from __future__ import annotations

from typing import Any

RESEARCH_PRIVATE_KEYS = frozenset(
    {
        "target_capabilities",
        "target_capability_ids",
        "novelty_vector",
        "selection_rationale",
        "control_role",
        "genome_id",
        "plan_id",
        "candidate_id",
        "score_components",
        "research_overlay",
        "capability_target",
        "experimental_target",
    }
)


def redact_public_projection(view: dict[str, Any]) -> dict[str, Any]:
    """Deep-ish redact of research-private metadata for WATCH/PLAYER."""
    return _redact(view)


def _redact(value: Any) -> Any:
    if isinstance(value, dict):
        out = {}
        for k, v in value.items():
            if k in RESEARCH_PRIVATE_KEYS:
                continue
            if k == "fields" and isinstance(v, dict):
                out[k] = {fk: fv for fk, fv in v.items() if fk not in RESEARCH_PRIVATE_KEYS}
            else:
                out[k] = _redact(v)
        return out
    if isinstance(value, list):
        return [_redact(x) for x in value]
    return value


def research_overlay(
    *,
    genome: dict[str, Any],
    plan_id: str | None,
    target_capability_ids: list[str],
    selection_rationale: list[str],
) -> dict[str, Any]:
    return {
        "schema_version": "frontier-research-overlay/0.2",
        "visibility": "research",
        "genome_id": genome.get("genome_id"),
        "novelty_vector": genome.get("novelty_vector"),
        "target_capability_ids": list(target_capability_ids),
        "selection_rationale": list(selection_rationale),
        "control_role": genome.get("control_role"),
        "plan_id": plan_id,
        "noncanonical": True,
    }


def public_pressure_summary(*, cycle: int, world_id: str, event_ids: list[str], narrative: str) -> dict[str, Any]:
    return {
        "schema_version": "spectator-projection/1.0",
        "projection_id": "world_pressure",
        "world_id": world_id,
        "cycle": cycle,
        "source_event_ids": list(event_ids),
        "visibility": "public",
        "fields": {
            "summary": narrative,
            "must_not_include": ["target_capabilities", "novelty_vector", "selection_rationale"],
        },
        "redactions": ["research_targets"],
        "narrative": narrative,
        "mutates_world": False,
    }
