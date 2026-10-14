# src/noema/research/compiler/minimize.py

- minimize · function · L13-L184 — def minimize( units: list[dict[str, Any]], oracle: BehavioralOracle, *, edges: list[dict[str, Any]] | None = None, max_oracle_calls: int = 256, compile_id: str = "compile", ) -> dict[str, Any]
- try_remove · function · L43-L87 — def try_remove(candidate_ids: set[str], proposal_id: str) -> bool
- _partition · function · L187-L203 — def _partition(ids: list[str], n: int) -> list[list[str]]
- _record · function · L206-L226 — def _record( proposal_id: str, compile_id: str, candidate: set[str], closed: set[str], decision: str, oracle_result: str | None, fixture_digest: str | None = None, ) -> dict[str, Any]
- reject_over_minimization · function · L229-L231 — def reject_over_minimization(proposal_remove: set[str], protected: set[str]) -> bool
- deep_minimize · function · L238-L260 — def deep_minimize( units: list[dict[str, Any]], oracle: BehavioralOracle, *, edges: list[dict[str, Any]] | None = None, max_oracle_calls: int = 256, compile_id: str = "compile", ) -> dict[str, Any]
