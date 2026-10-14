# src/noema/research/frontier/director.py

- FrontierResult · class · L34-L41 — class FrontierResult
- FrontierDirector · class · L60-L404 — class FrontierDirector
- __init__ · method · L63-L65 — def __init__(self, config: dict[str, Any] | None = None)
- validate_request · method · L67-L80 — def validate_request(self, request: dict[str, Any]) -> dict[str, Any]
- candidate_id · method · L82-L96 — def candidate_id( self, *, parent_digest: str, mutation_operations: list[dict[str, Any]], world_version: str, director_version: str = "frontier-director/0.2", ) -> str
- run · method · L98-L348 — def run( self, request: dict[str, Any], templates: dict[str, dict[str, Any]], *, explicit_mutation_plans: list[list[dict[str, Any]]] | None = None, solved_novelty_vectors: list[dict[str, int]] | None = None, ) -> FrontierResult
- _enumerate_mutation_plans · method · L350-L369 — def _enumerate_mutation_plans(self, *, max_depth: int) -> list[list[dict[str, Any]]]
- _empty · method · L371-L404 — def _empty( self, request: dict[str, Any], *, stop_reason: str, error: ResearchError | None = None, ) -> FrontierResult
