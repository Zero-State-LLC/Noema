# src/noema/research/compiler/units.py

- validate_unit_manifest · function · L11-L26 — def validate_unit_manifest(manifest: dict[str, Any]) -> dict[str, Any]
- units_by_layer · function · L29-L38 — def units_by_layer(units: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]
- dependency_closure · function · L41-L75 — def dependency_closure( remove_ids: set[str], units: list[dict[str, Any]], edges: list[dict[str, Any]] | None = None, ) -> tuple[set[str], set[str]]
- build_dependency_graph · function · L78-L102 — def build_dependency_graph(compile_id: str, units: list[dict[str, Any]]) -> dict[str, Any]
