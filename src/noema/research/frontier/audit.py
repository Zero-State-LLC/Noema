"""Hash-chained Frontier audit records (RFC-0003 digests)."""

from __future__ import annotations

from typing import Any

from noema.world.digest import sha256_digest


def make_audit_record(
    *,
    request_id: str,
    record_index: int,
    record_type: str,
    input_digest: str,
    director_implementation_digest: str,
    candidate_id: str | None,
    score_components: dict[str, Any] | None,
    constraint_decisions: list[dict[str, Any]],
    reason_codes: list[str],
    previous_record_digest: str | None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "schema_version": "frontier-audit/0.2",
        "audit_version": "0.2",
        "request_id": request_id,
        "record_index": record_index,
        "record_type": record_type,
        "input_digest": input_digest,
        "director_implementation_digest": director_implementation_digest,
        "candidate_id": candidate_id,
        "score_components": score_components,
        "constraint_decisions": constraint_decisions,
        "reason_codes": reason_codes,
        "previous_record_digest": previous_record_digest,
        "claim_label": "INFERRED",
    }
    if extra:
        body.update(extra)
    body["digest"] = sha256_digest({k: v for k, v in body.items() if k != "digest"})
    return body
