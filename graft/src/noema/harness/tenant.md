# src/noema/harness/tenant.py

- TenantTarget · class · L14-L18 — class TenantTarget
- TenantError · class · L21-L25 — class TenantError(Exception)
- __init__ · method · L22-L25 — def __init__(self, code: str, message: str) -> None
- resolve_tenant · function · L28-L49 — def resolve_tenant( raw: str | None, *, live: bool = False, env: Mapping[str, str] | None = None, ) -> TenantTarget
