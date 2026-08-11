"""Append-only compiler audit chain (RFC-0003 digests)."""

from __future__ import annotations

from typing import Any

from noema.world.digest import sha256_digest


def make_compiler_audit(
    *,
    compile_id: str,
    record_index: int,
    phase: str,
    previous_digest: str | None,
    proposal_id: str | None = None,
    removed_unit_ids: list[str] | None = None,
    oracle_result: str | None = None,
    decision: str | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "schema_version": "compiler-audit-record/0.5",
        "audit_version": "compiler-audit/0.5.0",
        "compile_id": compile_id,
        "record_index": record_index,
        "phase": phase,
        "proposal_id": proposal_id,
        "removed_unit_ids": list(removed_unit_ids or []),
        "oracle_result": oracle_result,
        "decision": decision,
        "previous_digest": previous_digest,
        "canonicalization": "noema-jcs/1",
        "claim_label": "OBSERVED",
    }
    if extra:
        body.update(extra)
    body["digest"] = sha256_digest({k: v for k, v in body.items() if k != "digest"})
    return body


def audit_root(records: list[dict[str, Any]]) -> str:
    if not records:
        return sha256_digest({"audit": []})
    return records[-1]["digest"]
