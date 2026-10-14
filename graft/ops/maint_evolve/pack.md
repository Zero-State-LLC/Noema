# ops/maint_evolve/pack.py

- PackError · class · L18-L19 — class PackError(ValueError)
- validate_pack · function · L22-L43 — def validate_pack(data: object) -> dict
- load_pack · function · L46-L53 — def load_pack(path: Path | None) -> dict
- atomic_replace · function · L56-L72 — def atomic_replace(path: Path, data: dict) -> None
- derive_candidate · function · L75-L96 — def derive_candidate(look: dict, sar: dict | None, digest: dict | None, current: dict) -> dict
