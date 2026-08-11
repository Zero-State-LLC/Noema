"""PLAY / WATCH / STUDY Deep Time projections (D27–D29). Lore is presentation only."""

from __future__ import annotations

from typing import Any

from noema.world.digest import sha256_digest


def play_history_view(
    *,
    subject_ids: list[str],
    title: str,
    age_label: str | None = None,
    condition: str | None = None,
    known_history: str | None = None,
    evidence: list[str] | None = None,
    unknown: str | None = None,
    claim_label: str = "INFERRED",
) -> dict[str, Any]:
    view = {
        "schema_version": "experience-view/1.0",
        "mode": "PLAY",
        "audience": "human_player",
        "disclosure_level": "SIMPLE",
        "canonical_source_refs": subject_ids,
        "presentation": {
            "title": title,
            "age": age_label,
            "condition": condition,
            "known_history": known_history,
            "evidence": evidence or [],
            "unknown": unknown,
            "message": "This place has history.",
            "no_deep_time_jargon_required": True,
        },
        "research_detail": False,
        "canonical_claim_label": claim_label,
        "lore_is_not_world_truth": True,
        "mutates_world": False,
        "same_subject_ids": True,
    }
    view["digest"] = sha256_digest({k: v for k, v in view.items() if k != "digest"})
    return view


def watch_timeline(entries: list[dict[str, str]], *, subject_ids: list[str]) -> dict[str, Any]:
    return {
        "schema_version": "experience-view/1.0",
        "mode": "WATCH",
        "audience": "public_spectator",
        "disclosure_level": "SIMPLE",
        "canonical_source_refs": subject_ids,
        "presentation": {"title": "TIMELINE", "entries": entries},
        "research_detail": False,
        "lore_is_not_world_truth": True,
        "mutates_world": False,
    }


def study_longitudinal(questions: list[str], *, subject_ids: list[str]) -> dict[str, Any]:
    return {
        "schema_version": "experience-view/1.0",
        "mode": "STUDY",
        "audience": "researcher",
        "disclosure_level": "RESEARCHER",
        "canonical_source_refs": subject_ids,
        "presentation": {
            "title": "Deep Time questions",
            "questions": questions,
            "notes": "Answers require Lab/Observatory trajectories; Deep Time provides addressable subjects.",
        },
        "research_detail": True,
        "canonical_claim_label": "INFERRED",
        "mutates_world": False,
    }
