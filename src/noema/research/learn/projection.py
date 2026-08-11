"""LEARN progressive disclosure projections (K10–K11)."""

from __future__ import annotations

from typing import Any

from noema.world.digest import sha256_digest

EDGE_SIMPLE_BUCKETS = {
    "REPRODUCED_BY": "reproduced_by",
    "DEPENDS_ON": "depends_on",
    "FAILS_WITHOUT": "fails_when",
    "GENERALIZES_TO": "works_in",
    "OBSERVED_IN": "works_in",
    "DIFFERS_ACROSS_VERSION": "differs_across_versions",
}


def simple_learn_view(
    behavior: dict[str, Any],
    edges: list[dict[str, Any]],
    *,
    not_tested: list[str] | None = None,
) -> dict[str, Any]:
    buckets: dict[str, list[str]] = {
        "reproduced_by": [],
        "depends_on": [],
        "works_in": [],
        "fails_when": [],
        "differs_across_versions": [],
    }
    evidence: set[str] = set(behavior.get("source_captured_test_ids") or [])
    for e in edges:
        if e.get("claim_label") == "SPECULATIVE":
            continue  # not ordinary LEARN facts
        if e.get("relationship_status") == "INSUFFICIENT":
            continue
        bucket = EDGE_SIMPLE_BUCKETS.get(e["edge_type"])
        if not bucket:
            continue
        label = e.get("simple_label") or e.get("target_ref")
        if e.get("relationship_status") == "CONTESTED":
            label = f"{label} (contested)"
        if label not in buckets[bucket]:
            buckets[bucket].append(label)
        for ref in e.get("evidence_refs") or []:
            evidence.add(str(ref))

    claim = behavior.get("claim_label") or "INFERRED"
    # simple display never strengthens
    claim_display = {
        "OBSERVED": "Observed",
        "INFERRED": "Evidence suggests",
        "SPECULATIVE": "Speculative",
        "NOT_COMPUTABLE": "Not computable",
    }.get(claim, claim)

    view = {
        "schema_version": "experience-view/1.0",
        "view_id": f"view.learn.{behavior['behavior_id']}.simple",
        "mode": "STUDY",
        "audience": "researcher",
        "disclosure_level": "SIMPLE",
        "canonical_source_refs": [behavior["behavior_id"], "capability-graph/0.7.0"],
        "presentation": {
            "title": "LEARN",
            "behavior_title": behavior.get("title"),
            "reproduced_by": buckets["reproduced_by"],
            "depends_on": buckets["depends_on"],
            "works_in": buckets["works_in"],
            "fails_when": buckets["fails_when"],
            "differs_across_versions": buckets["differs_across_versions"],
            "not_yet_tested": list(not_tested or []),
            "evidence_count": f"{len(evidence)} captured/research evidence refs",
            "claim_label_display": claim_display,
        },
        "allowed_actions": ["VIEW_EVIDENCE", "COMPARE_VERSIONS", "TECHNICAL_DETAILS"],
        "research_detail": True,
        "canonical_claim_label": claim,
        "mutates_world": False,
        "same_record": True,
    }
    view["digest"] = sha256_digest({k: v for k, v in view.items() if k != "digest"})
    return view


def advanced_learn_view(behavior: dict[str, Any], edges: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "schema_version": "experience-view/1.0",
        "view_id": f"view.learn.{behavior['behavior_id']}.advanced",
        "mode": "STUDY",
        "audience": "researcher",
        "disclosure_level": "ADVANCED",
        "canonical_source_refs": [behavior["behavior_id"], *[e["edge_id"] for e in edges]],
        "presentation": {
            "behavior_id": behavior["behavior_id"],
            "edges": [
                {
                    "edge_id": e["edge_id"],
                    "edge_type": e["edge_type"],
                    "target_ref": e["target_ref"],
                    "claim_label": e["claim_label"],
                    "relationship_status": e["relationship_status"],
                    "tested_boundary": e.get("tested_boundary"),
                    "evidence_refs": e.get("evidence_refs"),
                    "counterevidence_refs": e.get("counterevidence_refs"),
                }
                for e in edges
            ],
            "known_limits": behavior.get("known_limits"),
            "provenance": behavior.get("provenance"),
        },
        "canonical_claim_label": behavior.get("claim_label"),
        "same_record": True,
        "mutates_world": False,
    }


def agent_version_view(behavior_id: str, edges: list[dict[str, Any]], *, not_tested_versions: list[str] | None = None) -> dict[str, Any]:
    """Distinguish reproduced / not reproduced / not tested."""
    reproduced = []
    not_reproduced = []
    for e in edges:
        if e["edge_type"] == "REPRODUCED_BY" and e.get("relationship_status") == "SUPPORTED":
            reproduced.append(e.get("simple_label") or e["target_ref"])
        if e["edge_type"] == "DIFFERS_ACROSS_VERSION":
            not_reproduced.append(e.get("simple_label") or e["target_ref"])
    return {
        "behavior_id": behavior_id,
        "reproduced": reproduced,
        "not_reproduced": not_reproduced,
        "not_tested": list(not_tested_versions or []),
        "distinct_categories": True,
        "not_tested_is_not_failed": True,
    }


def not_tested_record(*, behavior_id: str, context_ref: str, simple_label: str) -> dict[str, Any]:
    return {
        "behavior_id": behavior_id,
        "context_ref": context_ref,
        "status": "NOT_TESTED",
        "distinct_from": "FAILED",
        "simple_label": simple_label,
    }
