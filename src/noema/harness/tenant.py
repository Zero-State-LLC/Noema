"""Choose a Noema tenant. Perihelion is live-only; never an implicit default."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping


TEST_PREFIX = "test.hosted-canonical."
PERIHELION_ALIASES = frozenset({"perihelion", "world.perihelion-reach", "world-01"})


@dataclass(frozen=True)
class TenantTarget:
    world_id: str
    live: bool
    isolated: bool
    command_path: str


class TenantError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def resolve_tenant(
    raw: str | None,
    *,
    live: bool = False,
    env: Mapping[str, str] | None = None,
) -> TenantTarget:
    env = env or {}
    live = live or str(env.get("NOEMA_LIVE_TENANT") or "") in {"1", "true", "TRUE", "yes"}
    value = (raw or env.get("NOEMA_TENANT") or "").strip()
    if not value:
        raise TenantError("TENANT_REQUIRED", "set --tenant or NOEMA_TENANT; never default to Perihelion")
    key = value.lower()
    if key in PERIHELION_ALIASES or key.startswith("world.perihelion"):
        if not live:
            raise TenantError(
                "LIVE_TENANT_REQUIRED",
                "Perihelion requires --live-tenant or NOEMA_LIVE_TENANT=1",
            )
        return TenantTarget("world.perihelion-reach", True, False, "/v1/command")
    if not value.startswith(TEST_PREFIX):
        raise TenantError("TENANT_INVALID", "tenant must be test.hosted-canonical.<suffix> or perihelion")
    return TenantTarget(value, False, True, "/v1/operator/test-world/command")
