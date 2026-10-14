# src/noema/research/compiler/compiler.py

- CompileSession · class · L37-L53 — class CompileSession
- Compiler · class · L56-L472 — class Compiler
- capture_as_test · method · L59-L289 — def capture_as_test( self, *, intent: dict[str, Any], lab_result: dict[str, Any], unit_manifest: dict[str, Any] | None = None, max_oracle_calls: int | None = None, title: str | None = None, ) -> CompileSession
- run_regression · method · L291-L303 — def run_regression( self, captured_test: dict[str, Any], *, agent_version: str, oracle_result: str, ) -> dict[str, Any]
- _build_captured_test · method · L305-L354 — def _build_captured_test( self, *, compile_id: str, lab_result: dict[str, Any], phenomenon: dict[str, Any], retained: list[str], units: list[dict[str, Any]], title: str, ) -> dict[str, Any]
- _build_receipt · method · L356-L389 — def _build_receipt( self, compile_id: str, request: dict[str, Any], result: dict[str, Any], status: str, ) -> dict[str, Any]
- _default_units_from_lab · method · L391-L454 — def _default_units_from_lab(self, lab_result: dict[str, Any], intent: dict[str, Any]) -> dict[str, Any]
- _failed_result · method · L456-L472 — def _failed_result(self, *, compile_id: str, status: str, reason_codes: list[str]) -> dict[str, Any]
