"""Behavior node identity (K01)."""

from __future__ import annotations

from typing import Any

from noema.research.learn.errors import INVALID_BEHAVIOR, MISSING_EVIDENCE, LearnError
from noema.world.digest import sha256_digest

SCHEMA = "behavior-node/0.7"
CLAIM_LABELS = ("OBSERVED", "INFERRED", "SPECULATIVE", "NOT_COMPUTABLE")


def behavior_body(node: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in node.items() if k != "digest"}


def behavior_digest(node: dict[str, Any]) -> str:
    return sha256_digest(behavior_body(node))


def validate_behavior_node(node: dict[str, Any], *, require_digest: bool = True) -> dict[str, Any]:
    if node.get("schema_version") != SCHEMA:
        raise LearnError(INVALID_BEHAVIOR, f"unsupported behavior-node schema {node.get('schema_version')}")
    for f in ("behavior_id", "title", "description", "source_captured_test_ids", "claim_label", "known_limits", "provenance"):
        if f not in node or node[f] in (None, ""):
            raise LearnError(INVALID_BEHAVIOR, f"behavior missing {f}")
    if not node["source_captured_test_ids"]:
        raise LearnError(MISSING_EVIDENCE, "behavior requires source_captured_test_ids")
    if node["claim_label"] not in CLAIM_LABELS:
        raise LearnError(INVALID_BEHAVIOR, f"invalid claim_label {node['claim_label']}")
    if node["claim_label"] == "SPECULATIVE":
        # speculative may exist but must not be ordinary LEARN facts without flag
        pass
    dig = behavior_digest(node)
    if require_digest and node.get("digest") and node["digest"] != dig:
        raise LearnError(INVALID_BEHAVIOR, "behavior digest mismatch")
    out = dict(node)
    out["digest"] = dig
    out.setdefault("status", "ACTIVE")
    return out


def behavior_from_captured_test(
    captured: dict[str, Any],
    *,
    lab_result_id: str | None = None,
    compile_id: str | None = None,
    known_limits: list[str] | None = None,
) -> dict[str, Any]:
    """Derive a BEHAVIOR node from a captured test (evidence-backed)."""
    ctid = captured.get("captured_test_id") or "ctest.unknown"
    title = captured.get("title") or ctid
    node = {
        "schema_version": SCHEMA,
        "behavior_id": f"behavior.{ctid.removeprefix('ctest.')}",
        "title": title,
        "description": captured.get("description") or title,
        "behavioral_signature_ref": f"{ctid}#behavioral_signature",
        "source_captured_test_ids": [ctid],
        "source_candidate_ids": list(captured.get("source_candidate_ids") or []),
        "claim_label": captured.get("claim_label") or "INFERRED",
        "status": "ACTIVE",
        "known_limits": list(known_limits or captured.get("known_limits") or ["Within tested conditions only"]),
        "provenance": {
            "source_lab_result_id": lab_result_id or captured.get("source_lab_result_id"),
            "source_compile_id": compile_id or captured.get("source_compile_id"),
            "domain": "capability-graph/0.7",
            "canonicalization": "noema-jcs/1",
        },
    }
    node["digest"] = behavior_digest(node)
    return node
