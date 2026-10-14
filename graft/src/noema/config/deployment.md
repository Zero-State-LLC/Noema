# src/noema/config/deployment.py

- ConfigError · class · L77-L78 — class ConfigError(ValueError)
- configuration_digest · function · L81-L83 — def configuration_digest(config: dict[str, Any]) -> str
- default_local_config · function · L86-L179 — def default_local_config(*, port: int = 8080, host: str = "0.0.0.0") -> dict[str, Any]
- load_deployment_config · function · L182-L198 — def load_deployment_config(path: Path | str | None = None) -> dict[str, Any]
- validate_deployment_config · function · L201-L394 — def validate_deployment_config(cfg: dict[str, Any]) -> list[str]
- _no_extra · function · L397-L400 — def _no_extra(obj: dict[str, Any], allowed: set[str], prefix: str, errors: list[str]) -> None
- _walk_keys · function · L403-L413 — def _walk_keys(obj: Any, prefix: str = "") -> list[str]
