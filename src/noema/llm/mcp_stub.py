"""MCP tool descriptors. Results never include tokens or prompts."""

from __future__ import annotations

from typing import Any

MCP_TOOLS = [
    {
        "name": "noema.observe",
        "description": "Permissioned OBSERVE of the current tenant. No credentials returned.",
    },
    {
        "name": "noema.act",
        "description": "Validate and submit a Player proposal {action, target_id, arguments}.",
    },
    {
        "name": "noema.status",
        "description": "Tenant, cycle, room, last classification. Never tokens.",
    },
]


def mcp_status(*, tenant_id: str, cycle: Any, room_id: Any, classification: str | None) -> dict[str, Any]:
    return {
        "tenant_id": tenant_id,
        "cycle": cycle,
        "room_id": room_id,
        "classification": classification,
    }
