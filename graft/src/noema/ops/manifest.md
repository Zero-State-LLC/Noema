# src/noema/ops/manifest.py

- load_spec_compat · function · L14-L28 — def load_spec_compat(path: Path | None = None) -> dict[str, Any]
- configuration_digest · function · L31-L34 — def configuration_digest(config: dict[str, Any] | None = None) -> str
- build_runtime_manifest · function · L37-L102 — def build_runtime_manifest( *, store_meta: dict[str, str], ledger_head: str | None, snapshot_head: str | None, current_cycle: int, sequence: int, backend: str, spec_compat: dict[str, Any] | None = None, config: dict[str, Any] | None = None, objects_path: str | None = None, ) -> dict[str, Any]
