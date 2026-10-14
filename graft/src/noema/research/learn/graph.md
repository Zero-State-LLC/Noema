# src/noema/research/learn/graph.py

- LearnProjection · class · L20-L27 — class LearnProjection
- LearnGraph · class · L30-L172 — class LearnGraph
- __init__ · method · L33-L37 — def __init__(self) -> None
- clear · method · L39-L43 — def clear(self) -> None
- ingest_captured_test · method · L45-L87 — def ingest_captured_test( self, captured: dict[str, Any], *, lab_result: dict[str, Any] | None = None, regression_results: list[dict[str, Any]] | None = None, source_ref: str | None = None, not_tested_contexts: list[dict[str, str]] | None = None, ) -> dict[str, Any]
- add_edge · method · L89-L96 — def add_edge(self, edge: dict[str, Any]) -> dict[str, Any]
- mark_contested · method · L98-L109 — def mark_contested(self, edge_id: str, counterevidence_refs: list[str]) -> dict[str, Any]
- build_graph_projection · method · L111-L126 — def build_graph_projection(self) -> dict[str, Any]
- project · method · L128-L146 — def project(self) -> LearnProjection
- rebuild_from_sources · method · L148-L167 — def rebuild_from_sources( self, sources: list[dict[str, Any]], ) -> LearnProjection
- agent_versions · method · L169-L172 — def agent_versions(self, behavior_id: str) -> dict[str, Any]
