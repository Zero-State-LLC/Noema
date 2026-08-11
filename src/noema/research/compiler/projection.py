"""Progressive disclosure projections of the same captured test."""

from __future__ import annotations

from typing import Any

from noema.research.compiler.catalog import reason_message
from noema.world.digest import sha256_digest


def simple_capture_view(
    *,
    captured_test: dict[str, Any] | None,
    compiler_result: dict[str, Any],
    required_labels: list[str],
    removed_labels: list[str],
    reason_codes: list[str] | None = None,
) -> dict[str, Any]:
    status = compiler_result.get("status")
    if status == "COMPILED" and captured_test:
        codes = reason_codes or ["COMPILED_OK"]
        msg = reason_message(codes[0])
        title = captured_test.get("title") or "Captured test"
        return {
            "schema_version": "experience-view/1.0",
            "mode": "STUDY",
            "audience": "researcher",
            "disclosure_level": "SIMPLE",
            "canonical_source_refs": [
                captured_test.get("captured_test_id"),
                compiler_result.get("compiler_result_id"),
                compiler_result.get("compile_id"),
            ],
            "presentation": {
                "title": "CAPTURED TEST",
                "phenomenon_title": title,
                "message": msg.get("simple_message") or "Captured successfully.",
                "required": required_labels,
                "removed": removed_labels,
                "validation": f"{compiler_result.get('oracle_counts', {}).get('preserved', 0)} oracle preserved calls",
                "boundary": "This test represents a family of similar scenarios under declared conditions.",
                "limitations": list(captured_test.get("known_limits") or ["Within tested conditions only"]),
                "next_action": msg.get("next_action") or "RUN_TEST",
            },
            "claim_label": captured_test.get("claim_label") or compiler_result.get("claim_label") or "INFERRED",
            "status": status,
            "mutates_world": False,
            "same_record": True,
        }
    # failure / not ready / budget
    code = (reason_codes or compiler_result.get("reason_codes") or ["NOT_COMPUTABLE"])[0]
    msg = reason_message(code)
    return {
        "schema_version": "experience-view/1.0",
        "mode": "STUDY",
        "audience": "researcher",
        "disclosure_level": "SIMPLE",
        "canonical_source_refs": [compiler_result.get("compile_id")],
        "presentation": {
            "title": "Capture incomplete",
            "message": msg.get("simple_message"),
            "next_action": msg.get("next_action"),
            "status": status,
        },
        "claim_label": compiler_result.get("claim_label") or "NOT_COMPUTABLE",
        "status": status,
        "mutates_world": False,
        "same_record": True,
    }


def advanced_capture_view(
    *,
    captured_test: dict[str, Any] | None,
    compiler_result: dict[str, Any],
    request: dict[str, Any],
    lab_result_id: str,
    confounds: list[str],
) -> dict[str, Any]:
    return {
        "schema_version": "experience-view/1.0",
        "mode": "STUDY",
        "audience": "researcher",
        "disclosure_level": "ADVANCED",
        "canonical_source_refs": [
            (captured_test or {}).get("captured_test_id"),
            compiler_result.get("compiler_result_id"),
            request.get("compile_id"),
            lab_result_id,
        ],
        "presentation": {
            "compile_id": request.get("compile_id"),
            "minimality_status": compiler_result.get("minimality_status"),
            "promotion_status": compiler_result.get("promotion_status"),
            "unit_counts": compiler_result.get("unit_counts"),
            "oracle_counts": compiler_result.get("oracle_counts"),
            "confounds": confounds,
            "generalization_boundary": (captured_test or {}).get("generalization_boundary") or "SCENARIO_FAMILY",
            "target_behavior": request.get("target_behavior"),
        },
        "claim_label": (captured_test or {}).get("claim_label") or compiler_result.get("claim_label") or "INFERRED",
        "status": compiler_result.get("status"),
        "same_record": True,
        "mutates_world": False,
    }


def reproducibility_view(
    *,
    captured_test: dict[str, Any] | None,
    compiler_result: dict[str, Any],
    receipt: dict[str, Any],
    audit_root_digest: str,
) -> dict[str, Any]:
    return {
        "schema_version": "experience-view/1.0",
        "mode": "STUDY",
        "audience": "reproducibility",
        "disclosure_level": "REPRODUCIBILITY",
        "canonical_source_refs": [
            (captured_test or {}).get("captured_test_id"),
            compiler_result.get("compile_id"),
            receipt.get("compile_id"),
        ],
        "presentation": {
            "digests": {
                "compiler_result": compiler_result.get("digest"),
                "captured_test": (captured_test or {}).get("digest"),
                "receipt": receipt.get("digest"),
                "audit_root": audit_root_digest,
                "minimal_fixture": compiler_result.get("minimal_fixture_digest"),
                "source_fixture": compiler_result.get("source_digest"),
            },
            "versions": (captured_test or {}).get("required_versions")
            or {"canonicalization": "noema-jcs/1", "compiler": "phenomenon-compiler/0.5.0"},
            "receipt_version": receipt.get("receipt_version"),
        },
        "claim_label": (captured_test or {}).get("claim_label") or "INFERRED",
        "same_record": True,
        "mutates_world": False,
    }


def regression_result(
    *,
    captured_test_id: str,
    subject_agent_version: str,
    oracle_result: str,
    claim_label: str = "INFERRED",
) -> dict[str, Any]:
    status = "PASS" if oracle_result == "PRESERVED" else "FAIL"
    return {
        "schema_version": "regression-result/0.5",
        "regression_result_id": f"regr.{captured_test_id}.{subject_agent_version}",
        "captured_test_id": captured_test_id,
        "subject_identity": {"agent_version": subject_agent_version},
        "oracle_result": oracle_result,
        "status": status,
        "claim_label": claim_label,
        "not_a_global_ranking": True,
        "generalization_boundary": "SCENARIO_FAMILY",
        "silent_family_generalization": False,
    }
