"""Compiler admission gates — READY Lab results only."""

from __future__ import annotations

from typing import Any

from noema.research.compiler.errors import (
    CONTROL_FAILED,
    CONTROL_REQUIRED,
    INVALID_EVIDENCE,
    NOT_COMPUTABLE,
    NOT_READY,
    PRIVACY_PARTITION,
    CompilerError,
)


def admit_lab_result(lab_result: dict[str, Any], *, export_class: str = "RESEARCH_ISOLATED") -> dict[str, Any]:
    """Return admission record or raise CompilerError with stable reason_code."""
    if not lab_result.get("lab_result_id"):
        raise CompilerError(INVALID_EVIDENCE, "lab_result_id required")
    readiness = lab_result.get("compiler_readiness")
    if readiness != "READY":
        raise CompilerError(
            NOT_READY,
            "compiler_readiness must be READY",
            details={"compiler_readiness": readiness, "reason_code": NOT_READY},
        )
    controls = lab_result.get("control_outcomes") or {}
    if not controls:
        raise CompilerError(CONTROL_REQUIRED, "required controls missing")
    for role, outcome in controls.items():
        if outcome == "FAIL":
            raise CompilerError(CONTROL_FAILED, f"required control failed: {role}")
        if outcome not in ("PASS", "OK", "PASSED"):
            # unknown outcomes still block promotion path
            if outcome in ("MISSING", "PENDING", None):
                raise CompilerError(CONTROL_REQUIRED, f"control not complete: {role}")
    if lab_result.get("execution_status") not in ("COMPLETE", "OK", None):
        if lab_result.get("execution_status") in ("FAILED", "ABORTED"):
            raise CompilerError(INVALID_EVIDENCE, "lab execution not complete")
    if export_class == "PUBLIC" and lab_result.get("visibility_partition") == "research":
        # private evidence cannot promote to public without partition
        if lab_result.get("contains_private_evidence") is True or lab_result.get("privacy_blocked"):
            raise CompilerError(PRIVACY_PARTITION, "cannot create public test from private evidence")
    if not lab_result.get("source_candidate_ids"):
        raise CompilerError(NOT_COMPUTABLE, "missing source candidates")
    return {
        "admitted": True,
        "lab_result_id": lab_result["lab_result_id"],
        "compiler_readiness": "READY",
        "export_class": export_class,
        "claim_label": lab_result.get("claim_label") or "INFERRED",
    }
