"""Session helpers. World status is not Player identity."""

from __future__ import annotations

from noema.harness.types import FailureClass


def mutation_block(world_status: str | None) -> FailureClass | None:
    status = (world_status or "").upper()
    if status == "PAUSED":
        return FailureClass.WORLD_PAUSED
    if status == "INCIDENT":
        return FailureClass.WORLD_INCIDENT
    if status in {"PREVIEW", "ARCHIVED"}:
        return FailureClass.WORLD_NOT_READY
    return None
