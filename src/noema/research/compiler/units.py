"""Unit manifest + dependency closure."""

from __future__ import annotations

from typing import Any

from noema.research.compiler.catalog import LAYER_ORDER
from noema.world.digest import sha256_digest


def validate_unit_manifest(manifest: dict[str, Any]) -> dict[str, Any]:
    if manifest.get("schema_version") != "compiler-unit-manifest/0.5":
        # allow fixture
        if "units" not in manifest:
            raise ValueError("unit manifest requires units")
    units = list(manifest.get("units") or [])
    for u in units:
        if not u.get("unit_id"):
            raise ValueError("unit_id required")
        if u.get("protected") and u.get("eligible_for_removal"):
            # protected units must not be eligible
            u["eligible_for_removal"] = False
    out = dict(manifest)
    body = {k: v for k, v in out.items() if k != "digest"}
    out["digest"] = sha256_digest(body)
    return out


def units_by_layer(units: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    buckets: dict[str, list[dict[str, Any]]] = {layer: [] for layer in LAYER_ORDER}
    for u in units:
        layer = u.get("layer") or "METADATA"
        if layer not in buckets:
            buckets[layer] = []
        buckets[layer].append(u)
    for layer in buckets:
        buckets[layer].sort(key=lambda x: x["unit_id"])
    return buckets


def dependency_closure(
    remove_ids: set[str],
    units: list[dict[str, Any]],
    edges: list[dict[str, Any]] | None = None,
) -> tuple[set[str], set[str]]:
    """Return (final_remove_set, rejected_protected).

    If a retained unit depends on a removed unit, also remove the dependent if eligible;
    if protected, reject the proposal (return rejected).
    """
    by_id = {u["unit_id"]: u for u in units}
    # edges: {from: dependent, to: dependency} or source/target style
    deps: dict[str, set[str]] = {u["unit_id"]: set(u.get("dependencies") or []) for u in units}
    for e in edges or []:
        src = e.get("from") or e.get("source") or e.get("dependent")
        dst = e.get("to") or e.get("target") or e.get("dependency")
        if src and dst:
            deps.setdefault(src, set()).add(dst)

    remove = set(remove_ids)
    rejected: set[str] = set()
    changed = True
    while changed:
        changed = False
        for uid, unit in by_id.items():
            if uid in remove:
                continue
            needed = deps.get(uid) or set()
            if needed & remove:
                if unit.get("protected") or not unit.get("eligible_for_removal", True):
                    rejected.add(uid)
                else:
                    remove.add(uid)
                    changed = True
    return remove, rejected


def build_dependency_graph(compile_id: str, units: list[dict[str, Any]]) -> dict[str, Any]:
    nodes = []
    edges = []
    for u in units:
        nodes.append(
            {
                "dependency_id": f"dep.{u['unit_id']}",
                "unit_id": u["unit_id"],
                "class": u.get("unit_type") or "UNKNOWN",
                "required": bool(u.get("protected")),
                "removable": bool(u.get("eligible_for_removal")),
            }
        )
        for d in u.get("dependencies") or []:
            edges.append({"from": u["unit_id"], "to": d})
    graph = {
        "schema_version": "phenomenon-dependency-graph/0.5",
        "graph_id": f"depgraph.{compile_id}",
        "compile_id": compile_id,
        "nodes": nodes,
        "edges": edges,
        "closure_rules_version": "dependency-closure/0.5",
    }
    graph["digest"] = sha256_digest({k: v for k, v in graph.items() if k != "digest"})
    return graph
