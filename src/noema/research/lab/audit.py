"""Append-only Lab audit chain."""

from __future__ import annotations

from typing import Any

from noema.world.digest import sha256_digest


def make_lab_audit(
    *,
    audit_id: str,
    experiment_id: str,
    event_kind: str,
    previous_state: str | None,
    new_state: str,
    reason_code: str,
    actor: str = "system.lab",
    evidence_refs: list[str] | None = None,
    previous_digest: str | None = None,
    cycle: int | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "schema_version": "lab-audit/0.4",
        "audit_id": audit_id,
        "experiment_id": experiment_id,
        "event_kind": event_kind,
        "previous_state": previous_state,
        "new_state": new_state,
        "reason_code": reason_code,
        "actor": actor,
        "actor_or_system": actor,
        "evidence_refs": list(evidence_refs or []),
        "previous_digest": previous_digest,
        "cycle": cycle,
        "claim_label": "OBSERVED",
    }
    body["digest"] = sha256_digest({k: v for k, v in body.items() if k != "digest"})
    return body
