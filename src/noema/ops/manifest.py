"""Runtime manifest + non-secret configuration digests."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from noema.world.digest import sha256_digest


def load_spec_compat(path: Path | None = None) -> dict[str, Any]:
    candidates: list[Path] = []
    if path:
        candidates.append(path)
    here = Path(__file__).resolve()
    candidates.extend(
        [
            here.parents[3] / "spec-compat.json",
            Path.cwd() / "spec-compat.json",
        ]
    )
    for p in candidates:
        if p.is_file():
            return json.loads(p.read_text(encoding="utf-8"))
    return {}


def configuration_digest(config: dict[str, Any] | None = None) -> str:
    """Digest of resolved non-secret settings (empty object when none provided)."""
    body = config if config is not None else {"profile": "local-default", "secrets": False}
    return sha256_digest(body)


def build_runtime_manifest(
    *,
    store_meta: dict[str, str],
    ledger_head: str | None,
    snapshot_head: str | None,
    current_cycle: int,
    sequence: int,
    backend: str,
    spec_compat: dict[str, Any] | None = None,
    config: dict[str, Any] | None = None,
    objects_path: str | None = None,
) -> dict[str, Any]:
    """Build a runtime-manifest/1.0 shaped document from store + pin."""
    compat = spec_compat if spec_compat is not None else load_spec_compat()
    versions = compat.get("versions") or {}
    product = str(compat.get("runtime_version") or "0.1.0")
    # Spec pin label is our product's specs pin; fall back to freeze label.
    specs = compat.get("specs") or {}
    spec_version = str(specs.get("pin_label") or specs.get("commit") or "v0.1")

    head = ledger_head or store_meta.get("ledger_head") or ""
    if head and not str(head).startswith("sha256:"):
        head = f"sha256:{head}" if head else ""

    snap = snapshot_head or store_meta.get("state_digest") or ""
    if snap and not str(snap).startswith("sha256:"):
        snap = f"sha256:{snap}"

    # Empty ledger at genesis: use a fixed empty digest for schema pattern compliance.
    empty = sha256_digest({})
    if not head:
        head = empty
    if not snap:
        snap = empty

    seed = store_meta.get("seed") or ""
    seed_digest = sha256_digest({"seed": seed}) if seed else empty

    return {
        "schema_version": "runtime-manifest/1.0",
        "product_version": product,
        "spec_version": spec_version,
        "world_rules_version": versions.get("world_rules") or "world/v1",
        "agent_protocol_version": versions.get("agent_protocol") or "agent-protocol/v1",
        "event_catalog_version": versions.get("event_catalog")
        or store_meta.get("catalog_version")
        or "event-catalog/0.1",
        "event_schema_version": versions.get("event_schema") or "event-schema/v1",
        "replay_protocol_version": "replay-protocol/v1",
        "mud_command_version": "mud-command/v1",
        "world_id": store_meta.get("world_id") or "world.unknown",
        "world_version": store_meta.get("world_version") or "0",
        "world_seed": seed or None,
        "world_seed_digest": seed_digest,
        "configuration_digest": configuration_digest(config),
        "current_cycle": int(current_cycle),
        "ledger_head": head,
        "snapshot_head": snap,
        "emitted_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "persistence": {
            "backend": backend,
            "sequence": int(sequence),
            "objects_path": objects_path or "./var/objects",
        },
        "writer_fence_audit": store_meta.get("writer_token") or "",
    }
