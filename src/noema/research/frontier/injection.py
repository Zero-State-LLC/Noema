"""Build SITUATION_INJECTED events — never mutates world directly."""

from __future__ import annotations

from typing import Any

from noema.world.digest import event_body_digest


def build_situation_injected_event(
    *,
    world_id: str,
    cycle: int,
    sequence: int,
    previous_digest: str | None,
    situation_id: str,
    genome: dict[str, Any],
    score_components: dict[str, Any],
    selection_score: float = 1.0,
    seed_stream_id: str | None = None,
    plan_id: str | None = None,
    actor_id: str = "frontier.director",
    event_id: str | None = None,
    occurred_at: str | None = None,
) -> dict[str, Any]:
    streams = genome.get("seed_streams") or {}
    sid = seed_stream_id or streams.get("frontier") or "frontier.seed.runtime"
    # score_components in event may be normalized floats in fixtures; we keep millipoint ints
    # and also provide 0-1 float view for fixture-compatible payload.
    float_components = {
        k: (v / 1000.0 if isinstance(v, int) and k != "risk_class" else v)
        for k, v in (score_components or {}).items()
        if k in ("uncertainty", "novelty", "discrimination", "coverage_gain", "failure_relevance", "cost", "risk")
    }
    event: dict[str, Any] = {
        "schema_version": "world-event/1.0",
        "event_id": event_id or f"evt.frontier.{situation_id}",
        "event_type": "SITUATION_INJECTED",
        "world_id": world_id,
        "cycle": int(cycle),
        "sequence": int(sequence),
        "actor_id": actor_id,
        "payload": {
            "situation_id": situation_id,
            "genome_id": genome["genome_id"],
            "genome_version": str(genome.get("genome_version") or "0"),
            "target_room_ids": list(genome.get("affected_rooms") or []),
            "selection_score": float(selection_score),
            "score_components": float_components or {
                "uncertainty": float(score_components.get("uncertainty", 0)) / 1000.0,
                "novelty": float(score_components.get("novelty", 0)) / 1000.0,
                "discrimination": float(score_components.get("discrimination", 0)) / 1000.0,
            },
            "seed_stream_id": sid,
        },
        "provenance": {
            "protocol": "frontier-director/0.2",
            "source": "runtime-frontier",
            "plan_id": plan_id,
            "genome_digest": genome.get("content_digest"),
        },
        "previous_digest": previous_digest,
    }
    if occurred_at:
        event["occurred_at"] = occurred_at
    event["digest"] = event_body_digest(event)
    return event


def build_follow_on_entity_update(
    *,
    world_id: str,
    cycle: int,
    sequence: int,
    previous_digest: str | None,
    entity_id: str,
    set_map: dict[str, Any],
    situation_id: str,
    event_id: str | None = None,
) -> dict[str, Any]:
    event: dict[str, Any] = {
        "schema_version": "world-event/1.0",
        "event_id": event_id or f"evt.frontier.followon.{entity_id}.{sequence}",
        "event_type": "ENTITY_UPDATE",
        "world_id": world_id,
        "cycle": int(cycle),
        "sequence": int(sequence),
        "actor_id": "system",
        "payload": {
            "entity_id": entity_id,
            "set": set_map,
            "unset": [],
        },
        "provenance": {
            "source": "runtime-frontier",
            "caused_by_situation": situation_id,
        },
        "previous_digest": previous_digest,
    }
    event["digest"] = event_body_digest(event)
    return event
