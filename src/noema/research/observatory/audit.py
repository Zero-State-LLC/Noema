"""Append-only Observatory audit records."""

from __future__ import annotations

from typing import Any

from noema.world.digest import sha256_digest


def make_observatory_audit(
    *,
    analysis_run_id: str,
    record_index: int,
    operation: str,
    input_digest: str,
    feature_result_digest: str | None = None,
    baseline_result_digest: str | None = None,
    detector_result: dict[str, Any] | None = None,
    previous_record_digest: str | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "schema_version": "observatory-audit/0.3",
        "analysis_run_id": analysis_run_id,
        "record_index": record_index,
        "operation": operation,
        "input_digest": input_digest,
        "feature_result_digest": feature_result_digest,
        "baseline_result_digest": baseline_result_digest,
        "detector_result": detector_result,
        "previous_record_digest": previous_record_digest,
        "claim_label": "INFERRED",
    }
    if extra:
        body.update(extra)
    body["digest"] = sha256_digest({k: v for k, v in body.items() if k != "digest"})
    return body
