"""Closed capability-edge taxonomy (K02–K09)."""

from __future__ import annotations

from typing import Any

from noema.research.learn.errors import INVALID_EDGE, MISSING_EVIDENCE, UNSUPPORTED_INFERENCE, LearnError
from noema.world.digest import sha256_digest

SCHEMA = "capability-edge/0.7"
EDGE_TYPES = (
    "OBSERVED_IN",
    "REPRODUCED_BY",
    "DEPENDS_ON",
    "FAILS_WITHOUT",
    "GENERALIZES_TO",
    "DIFFERS_ACROSS_VERSION",
)
TARGET_CLASSES = ("AGENT_VERSION", "CONDITION", "CONTEXT", "BEHAVIOR")
RELATIONSHIP_STATUS = ("SUPPORTED", "CONTESTED", "INSUFFICIENT")
CLAIM_LABELS = ("OBSERVED", "INFERRED", "SPECULATIVE", "NOT_COMPUTABLE")


def edge_body(edge: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in edge.items() if k != "digest"}


def edge_digest(edge: dict[str, Any]) -> str:
    return sha256_digest(edge_body(edge))


def validate_edge(edge: dict[str, Any], *, require_digest: bool = True) -> dict[str, Any]:
    if edge.get("schema_version") != SCHEMA:
        raise LearnError(INVALID_EDGE, f"unsupported edge schema {edge.get('schema_version')}")
    for f in (
        "edge_id",
        "edge_type",
        "source_ref",
        "target_ref",
        "target_class",
        "evidence_refs",
        "claim_label",
        "tested_boundary",
        "relationship_status",
    ):
        if f not in edge:
            raise LearnError(INVALID_EDGE, f"edge missing {f}")
    if edge["edge_type"] not in EDGE_TYPES:
        raise LearnError(UNSUPPORTED_INFERENCE, f"edge_type not in closed taxonomy: {edge['edge_type']}")
    if edge["target_class"] not in TARGET_CLASSES:
        raise LearnError(INVALID_EDGE, f"target_class not allowed: {edge['target_class']}")
    if not edge["evidence_refs"]:
        raise LearnError(MISSING_EVIDENCE, "edge requires evidence_refs")
    if edge["claim_label"] not in CLAIM_LABELS:
        raise LearnError(INVALID_EDGE, f"invalid claim_label {edge['claim_label']}")
    if edge["claim_label"] == "NOT_COMPUTABLE":
        raise LearnError(UNSUPPORTED_INFERENCE, "NOT_COMPUTABLE must not create an edge")
    if edge["relationship_status"] not in RELATIONSHIP_STATUS:
        raise LearnError(INVALID_EDGE, f"invalid relationship_status {edge['relationship_status']}")
    if edge["relationship_status"] == "CONTESTED" and not edge.get("counterevidence_refs"):
        # contested should retain counterevidence
        raise LearnError(INVALID_EDGE, "CONTESTED edges require counterevidence_refs")
    # tested boundary required non-empty for DEPENDS_ON / GENERALIZES_TO / FAILS_WITHOUT
    if edge["edge_type"] in ("DEPENDS_ON", "GENERALIZES_TO", "FAILS_WITHOUT"):
        if not edge.get("tested_boundary"):
            raise LearnError(INVALID_EDGE, f"{edge['edge_type']} requires tested_boundary")
    dig = edge_digest(edge)
    if require_digest and edge.get("digest") and edge["digest"] != dig:
        raise LearnError(INVALID_EDGE, "edge digest mismatch")
    out = dict(edge)
    out["digest"] = dig
    out.setdefault("version", "capability-graph/0.7")
    out.setdefault("known_confounds", [])
    out.setdefault("counterevidence_refs", out.get("counterevidence_refs") or [])
    return out


def make_edge(
    *,
    edge_id: str,
    edge_type: str,
    source_ref: str,
    target_ref: str,
    target_class: str,
    evidence_refs: list[str],
    claim_label: str,
    tested_boundary: dict[str, Any],
    relationship_status: str = "SUPPORTED",
    simple_label: str | None = None,
    counterevidence_refs: list[str] | None = None,
    known_confounds: list[str] | None = None,
) -> dict[str, Any]:
    edge = {
        "schema_version": SCHEMA,
        "edge_id": edge_id,
        "edge_type": edge_type,
        "source_ref": source_ref,
        "target_ref": target_ref,
        "target_class": target_class,
        "evidence_refs": list(evidence_refs),
        "claim_label": claim_label,
        "relationship_status": relationship_status,
        "tested_boundary": dict(tested_boundary),
        "known_confounds": list(known_confounds or []),
        "counterevidence_refs": list(counterevidence_refs or []),
        "simple_label": simple_label or target_ref,
        "version": "capability-graph/0.7",
    }
    return validate_edge(edge, require_digest=False)


def reject_transitive_edge(a_to_b: dict[str, Any], b_to_c: dict[str, Any]) -> None:
    """Explicitly forbid inventing A→C from A→B and B→C."""
    raise LearnError(
        UNSUPPORTED_INFERENCE,
        f"no transitive edge from {a_to_b.get('edge_id')} + {b_to_c.get('edge_id')}",
    )


def edges_from_research_artifacts(
    *,
    behavior_id: str,
    captured_test: dict[str, Any] | None = None,
    lab_result: dict[str, Any] | None = None,
    regression_results: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """Deterministically derive closed edges from settled research artifacts."""
    edges: list[dict[str, Any]] = []
    ctid = (captured_test or {}).get("captured_test_id")
    if captured_test and ctid:
        # OBSERVED_IN scenario family from capture
        edges.append(
            make_edge(
                edge_id=f"edge.obs.{ctid}",
                edge_type="OBSERVED_IN",
                source_ref=behavior_id,
                target_ref=f"context.capture.{ctid}",
                target_class="CONTEXT",
                evidence_refs=[ctid],
                claim_label="OBSERVED",
                tested_boundary={"captured_test_id": ctid},
                simple_label="capture context",
            )
        )
        for cap in captured_test.get("required_agent_capabilities") or []:
            edges.append(
                make_edge(
                    edge_id=f"edge.dep.{_slug(cap)}",
                    edge_type="DEPENDS_ON",
                    source_ref=behavior_id,
                    target_ref=f"condition.{_slug(cap)}",
                    target_class="CONDITION",
                    evidence_refs=[ctid, (lab_result or {}).get("lab_result_id") or "lab"],
                    claim_label="INFERRED",
                    tested_boundary={"captured_test_id": ctid, "condition": cap},
                    simple_label=str(cap),
                )
            )

    if lab_result:
        # FAILS_WITHOUT from DEGRADED interventions
        for iid, outcome in (lab_result.get("intervention_outcomes") or {}).items():
            if outcome == "DEGRADED":
                edges.append(
                    make_edge(
                        edge_id=f"edge.fail.{_slug(iid)}",
                        edge_type="FAILS_WITHOUT",
                        source_ref=behavior_id,
                        target_ref=f"condition.{_slug(iid)}",
                        target_class="CONDITION",
                        evidence_refs=[lab_result.get("lab_result_id") or "lab"],
                        claim_label="INFERRED",
                        tested_boundary={
                            "lab_result_id": lab_result.get("lab_result_id"),
                            "intervention_id": iid,
                            "outcome": outcome,
                        },
                        simple_label=str(iid),
                    )
                )
        # GENERALIZES_TO placeholder from generalization outcomes that are not NOT_COMPARABLE
        for ctx, outcome in (lab_result.get("generalization_outcomes") or {}).items():
            if outcome not in ("NOT_COMPARABLE", "NOT_TESTED", None):
                edges.append(
                    make_edge(
                        edge_id=f"edge.gen.{_slug(ctx)}",
                        edge_type="GENERALIZES_TO",
                        source_ref=behavior_id,
                        target_ref=f"context.{_slug(ctx)}",
                        target_class="CONTEXT",
                        evidence_refs=[lab_result.get("lab_result_id") or "lab"],
                        claim_label="OBSERVED",
                        tested_boundary={"context": ctx, "outcome": outcome},
                        simple_label=str(ctx),
                    )
                )

    for reg in regression_results or []:
        agent = (reg.get("subject_identity") or {}).get("agent_version") or "agent.unknown"
        ctest = reg.get("captured_test_id") or ctid or "ctest"
        outcome = reg.get("outcome") or reg.get("status") or reg.get("oracle_result")
        if outcome in ("PASS", "PRESERVED", "REPRODUCED"):
            edges.append(
                make_edge(
                    edge_id=f"edge.repro.{_slug(agent)}",
                    edge_type="REPRODUCED_BY",
                    source_ref=behavior_id,
                    target_ref=agent,
                    target_class="AGENT_VERSION",
                    evidence_refs=[reg.get("regression_result_id") or "regr", ctest],
                    claim_label="OBSERVED",
                    tested_boundary={"captured_test_id": ctest, "agent_version": agent},
                    simple_label=agent,
                )
            )
        elif outcome in ("FAIL", "NOT_PRESERVED", "NOT_REPRODUCED"):
            edges.append(
                make_edge(
                    edge_id=f"edge.ver.diff.{_slug(agent)}",
                    edge_type="DIFFERS_ACROSS_VERSION",
                    source_ref=behavior_id,
                    target_ref=agent,
                    target_class="AGENT_VERSION",
                    evidence_refs=[reg.get("regression_result_id") or "regr"],
                    claim_label="OBSERVED",
                    tested_boundary={"captured_test_id": ctest, "agent_version": agent, "outcome": "FAIL"},
                    simple_label=agent,
                )
            )
    return edges


def _slug(value: str) -> str:
    return "".join(ch if ch.isalnum() or ch in ".-_" else "-" for ch in str(value)).strip("-")[:64]
