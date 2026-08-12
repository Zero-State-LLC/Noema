"""Operator surfaces: verify, backup, restore (Specs OPERATIONS.md)."""

from noema.ops.backup import backup_world, restore_world
from noema.ops.manifest import build_runtime_manifest, configuration_digest
from noema.ops.verify import VerifyResult, verify_world

__all__ = [
    "VerifyResult",
    "backup_world",
    "build_runtime_manifest",
    "configuration_digest",
    "restore_world",
    "verify_world",
]
