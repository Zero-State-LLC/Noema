"""Observatory research redaction for PLAY/WATCH."""

from __future__ import annotations

from typing import Any

from noema.research.frontier.redaction import redact_public_projection

OBS_PRIVATE = frozenset(
    {
        "anomaly_score",
        "anomaly_candidate_id",
        "capability_candidate",
        "capability_candidate_id",
        "detector_confidence",
        "detector_id",
        "deviation_components",
        "shift_candidate_id",
        "behavior_shift",
        "feature_vector",
        "baseline_id",
        "robust_z_millipoints",
    }
)


def redact_observatory_public(view: dict[str, Any]) -> dict[str, Any]:
    cleaned = redact_public_projection(view)
    return _strip(cleaned)


def _strip(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: _strip(v) for k, v in value.items() if k not in OBS_PRIVATE}
    if isinstance(value, list):
        return [_strip(x) for x in value]
    return value


def observatory_research_overlay(
    *,
    anomaly_id: str | None,
    shift_id: str | None,
    capability_id: str | None,
    detector_id: str | None,
    deviation_components: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "schema_version": "observatory-research-overlay/0.3",
        "visibility": "research",
        "noncanonical": True,
        "anomaly_candidate_id": anomaly_id,
        "shift_candidate_id": shift_id,
        "capability_candidate_id": capability_id,
        "detector_id": detector_id,
        "deviation_components": deviation_components or {},
        "must_not_reach_players": True,
    }


def public_behavior_summary(
    *,
    world_id: str,
    cycle: int,
    event_ids: list[str],
    narrative: str,
) -> dict[str, Any]:
    return {
        "schema_version": "spectator-projection/1.0",
        "projection_id": "organization_response",
        "world_id": world_id,
        "cycle": cycle,
        "source_event_ids": list(event_ids),
        "visibility": "public",
        "fields": {
            "summary": narrative,
            "must_not_include": ["anomaly_score", "capability_candidate", "detector_confidence"],
        },
        "redactions": ["research_metrics"],
        "narrative": narrative,
        "mutates_world": False,
    }
