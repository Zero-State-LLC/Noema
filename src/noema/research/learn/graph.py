"""Rebuildable capability-graph projection (disposable index)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from noema.research.learn.edges import edges_from_research_artifacts, validate_edge
from noema.research.learn.nodes import behavior_from_captured_test, validate_behavior_node
from noema.research.learn.projection import (
    advanced_learn_view,
    agent_version_view,
    not_tested_record,
    simple_learn_view,
)
from noema.world.digest import sha256_digest


@dataclass
class LearnProjection:
    graph: dict[str, Any]
    behaviors: list[dict[str, Any]] = field(default_factory=list)
    edges: list[dict[str, Any]] = field(default_factory=list)
    simple_views: list[dict[str, Any]] = field(default_factory=list)
    advanced_views: list[dict[str, Any]] = field(default_factory=list)
    not_tested: list[dict[str, Any]] = field(default_factory=list)
    rebuildable: bool = True


class LearnGraph:
    """Derived LEARN index. Never mutates production world or source evidence."""

    def __init__(self) -> None:
        self.behaviors: dict[str, dict[str, Any]] = {}
        self.edges: dict[str, dict[str, Any]] = {}
        self.not_tested: list[dict[str, Any]] = []
        self.generated_from: list[str] = []

    def clear(self) -> None:
        self.behaviors.clear()
        self.edges.clear()
        self.not_tested.clear()
        self.generated_from.clear()

    def ingest_captured_test(
        self,
        captured: dict[str, Any],
        *,
        lab_result: dict[str, Any] | None = None,
        regression_results: list[dict[str, Any]] | None = None,
        source_ref: str | None = None,
        not_tested_contexts: list[dict[str, str]] | None = None,
    ) -> dict[str, Any]:
        node = behavior_from_captured_test(
            captured,
            lab_result_id=(lab_result or {}).get("lab_result_id"),
            compile_id=captured.get("source_compile_id"),
        )
        node = validate_behavior_node(node, require_digest=False)
        self.behaviors[node["behavior_id"]] = node
        if source_ref:
            self.generated_from.append(source_ref)
        else:
            self.generated_from.append(captured.get("captured_test_id") or "captured")

        derived = edges_from_research_artifacts(
            behavior_id=node["behavior_id"],
            captured_test=captured,
            lab_result=lab_result,
            regression_results=regression_results,
        )
        for e in derived:
            self.edges[e["edge_id"]] = e
        if lab_result:
            self.generated_from.append(lab_result.get("lab_result_id") or "lab")
        for reg in regression_results or []:
            self.generated_from.append(reg.get("regression_result_id") or "regr")

        for nt in not_tested_contexts or []:
            self.not_tested.append(
                not_tested_record(
                    behavior_id=node["behavior_id"],
                    context_ref=nt["context_ref"],
                    simple_label=nt.get("simple_label") or nt["context_ref"],
                )
            )
        return node

    def add_edge(self, edge: dict[str, Any]) -> dict[str, Any]:
        e = validate_edge(edge)
        # contested merge: if same edge_id exists, keep both evidence sets
        existing = self.edges.get(e["edge_id"])
        if existing and existing.get("relationship_status") == "CONTESTED":
            e = existing
        self.edges[e["edge_id"]] = e
        return e

    def mark_contested(self, edge_id: str, counterevidence_refs: list[str]) -> dict[str, Any]:
        e = dict(self.edges[edge_id])
        e["relationship_status"] = "CONTESTED"
        refs = list(e.get("counterevidence_refs") or [])
        for r in counterevidence_refs:
            if r not in refs:
                refs.append(r)
        e["counterevidence_refs"] = refs
        e.pop("digest", None)
        e = validate_edge(e, require_digest=False)
        self.edges[edge_id] = e
        return e

    def build_graph_projection(self) -> dict[str, Any]:
        gen_from = sorted(set(self.generated_from)) or ["empty"]
        graph = {
            "schema_version": "capability-graph/0.7",
            "graph_version": "capability-graph/0.7.0",
            "generated_from": gen_from,
            "behavior_node_ids": sorted(self.behaviors.keys()),
            "edge_ids": sorted(self.edges.keys()),
            "generated_at_cycle": 0,
            "rebuildable": True,
            "mutable_source_of_truth": False,
            "domain": "capability-graph/0.7",
            "canonicalization": "noema-jcs/1",
        }
        graph["digest"] = sha256_digest({k: v for k, v in graph.items() if k != "digest"})
        return graph

    def project(self) -> LearnProjection:
        graph = self.build_graph_projection()
        simples = []
        advanceds = []
        for bid, node in sorted(self.behaviors.items()):
            bedges = [e for e in self.edges.values() if e["source_ref"] == bid]
            bedges.sort(key=lambda e: e["edge_id"])
            nts = [n["simple_label"] for n in self.not_tested if n["behavior_id"] == bid]
            simples.append(simple_learn_view(node, bedges, not_tested=nts))
            advanceds.append(advanced_learn_view(node, bedges))
        return LearnProjection(
            graph=graph,
            behaviors=list(self.behaviors.values()),
            edges=list(self.edges.values()),
            simple_views=simples,
            advanced_views=advanceds,
            not_tested=list(self.not_tested),
            rebuildable=True,
        )

    def rebuild_from_sources(
        self,
        sources: list[dict[str, Any]],
    ) -> LearnProjection:
        """Drop index and rebuild from immutable source evidence payloads.

        Each source item: {captured_test, lab_result?, regressions?, source_ref?, not_tested?}
        """
        self.clear()
        for src in sources:
            self.ingest_captured_test(
                src["captured_test"],
                lab_result=src.get("lab_result"),
                regression_results=src.get("regressions"),
                source_ref=src.get("source_ref"),
                not_tested_contexts=src.get("not_tested"),
            )
            for edge in src.get("edges") or []:
                self.add_edge(edge)
        return self.project()

    def agent_versions(self, behavior_id: str) -> dict[str, Any]:
        bedges = [e for e in self.edges.values() if e["source_ref"] == behavior_id]
        nts = [n["simple_label"] for n in self.not_tested if n["behavior_id"] == behavior_id]
        return agent_version_view(behavior_id, bedges, not_tested_versions=nts)
