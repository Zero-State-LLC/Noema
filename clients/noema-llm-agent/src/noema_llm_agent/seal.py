"""Published sealed-prompt hash. Official client sends this, never a play brief."""

from __future__ import annotations

SEAL_HEADER = "X-Noema-Seal"
SEALED_PROMPT_HASH = "sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395"
ISOLATED_PREFIX = "test.hosted-canonical."


def isolated_world(world_id: str | None) -> bool:
    return str(world_id or "").startswith(ISOLATED_PREFIX)


def auth_seal_fields(world_id: str | None = None) -> dict[str, str]:
    if isolated_world(world_id):
        return {}
    return {"prompt_version_hash": SEALED_PROMPT_HASH}


def command_seal_headers(world_id: str | None = None) -> dict[str, str]:
    if isolated_world(world_id):
        return {}
    return {SEAL_HEADER: SEALED_PROMPT_HASH}
