"""Phenomenon Compiler orchestrator — research partition only."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from noema.research.compiler.admission import admit_lab_result
from noema.research.compiler.audit import audit_root, make_compiler_audit
from noema.research.compiler.errors import (
    BUDGET_EXHAUSTED,
    CompilerError,
    NOT_READY,
    OVER_MINIMIZATION,
)
from noema.research.compiler.intent import compile_intent_to_request, validate_capture_intent
from noema.research.compiler.minimize import deep_minimize, minimize, reject_over_minimization  # v3.2.1: deep_minimize is the recommended consolidated interface
from noema.research.compiler.oracle import BehavioralOracle
from noema.research.compiler.projection import (
    advanced_capture_view,
    regression_result,
    reproducibility_view,
    simple_capture_view,
)
from noema.research.compiler.units import build_dependency_graph, validate_unit_manifest
from noema.world.digest import sha256_digest

COMPILER_VERSION = "phenomenon-compiler/0.5.0"
COMPILER_IMPL = {
    "version": COMPILER_VERSION,
    "runtime": "noema-phase4",
    "canonicalization": "noema-jcs/1",
}


@dataclass
class CompileSession:
    intent: dict[str, Any] | None = None
    request: dict[str, Any] | None = None
    admission: dict[str, Any] | None = None
    phenomenon: dict[str, Any] | None = None
    unit_manifest: dict[str, Any] | None = None
    dependency_graph: dict[str, Any] | None = None
    minimization: dict[str, Any] | None = None
    compiler_result: dict[str, Any] | None = None
    receipt: dict[str, Any] | None = None
    captured_test: dict[str, Any] | None = None
    audit: list[dict[str, Any]] = field(default_factory=list)
    simple_view: dict[str, Any] | None = None
    advanced_view: dict[str, Any] | None = None
    reproducibility_view: dict[str, Any] | None = None
    status: str = "FAILED"
    production_mutated: bool = False


class Compiler:
    """CAPTURE AS TEST pipeline. Never mutates production world truth."""

    def capture_as_test(
        self,
        *,
        intent: dict[str, Any],
        lab_result: dict[str, Any],
        unit_manifest: dict[str, Any] | None = None,
        max_oracle_calls: int | None = None,
        title: str | None = None,
    ) -> CompileSession:
        session = CompileSession(production_mutated=False)
        audit: list[dict[str, Any]] = []
        prev = None

        try:
            intent = validate_capture_intent(intent)
            session.intent = intent
            admission = admit_lab_result(lab_result)
            session.admission = admission
        except CompilerError as exc:
            session.status = exc.code
            session.compiler_result = self._failed_result(
                compile_id=f"compile.failed.{intent.get('capture_intent_id', 'x') if isinstance(intent, dict) else 'x'}",
                status=exc.code if exc.code != NOT_READY else "NOT_READY",
                reason_codes=[exc.code],
            )
            session.simple_view = simple_capture_view(
                captured_test=None,
                compiler_result=session.compiler_result,
                required_labels=[],
                removed_labels=[],
                reason_codes=[exc.code],
            )
            return session

        a0 = make_compiler_audit(
            compile_id="pending",
            record_index=0,
            phase="ADMISSION",
            previous_digest=None,
            decision="ADMITTED",
            extra={"lab_result_id": lab_result["lab_result_id"]},
        )
        # will rewrite compile_id after request

        if unit_manifest is None:
            unit_manifest = self._default_units_from_lab(lab_result, intent)
        unit_manifest = validate_unit_manifest(unit_manifest)
        session.unit_manifest = unit_manifest
        units = list(unit_manifest.get("units") or [])

        request = compile_intent_to_request(intent, lab_result, units=units)
        if max_oracle_calls is not None:
            request["budgets"]["max_oracle_calls"] = int(max_oracle_calls)
            request["digest"] = sha256_digest({k: v for k, v in request.items() if k != "digest"})
        session.request = request
        compile_id = request["compile_id"]

        a0 = make_compiler_audit(
            compile_id=compile_id,
            record_index=0,
            phase="ADMISSION",
            previous_digest=None,
            decision="ADMITTED",
            extra={"lab_result_id": lab_result["lab_result_id"]},
        )
        prev = a0["digest"]
        audit.append(a0)

        phenomenon = {
            "schema_version": "phenomenon-candidate/0.5",
            "phenomenon_candidate_id": f"phen.{compile_id}",
            "source_lab_result_id": lab_result["lab_result_id"],
            "source_candidate_ids": list(lab_result.get("source_candidate_ids") or []),
            "source_experiment_ids": [lab_result.get("experiment_id")],
            "title": title or intent.get("optional_title") or "Captured behavior",
            "behavior_definition": request["target_behavior"],
            "observable_features": [],
            "required_outcome_boundary": request["equivalence_boundary"],
            "known_supporting_conditions": list(lab_result.get("supporting_evidence") or [])[:5],
            "known_counterconditions": list(lab_result.get("counterevidence") or [])[:5],
            "known_confounds": list(lab_result.get("confounds") or []),
            "generalization_boundary": "SCENARIO_FAMILY",
            "claim_label": lab_result.get("claim_label") or "INFERRED",
        }
        phenomenon["digest"] = sha256_digest({k: v for k, v in phenomenon.items() if k != "digest"})
        session.phenomenon = phenomenon

        graph = build_dependency_graph(compile_id, units)
        session.dependency_graph = graph

        protected = {u["unit_id"] for u in units if u.get("protected")}
        required = set(protected)
        oracle = BehavioralOracle(protected_ids=protected, required_ids=required)
        budget = int((request.get("budgets") or {}).get("max_oracle_calls") or 256)

        # over-min protection sample: refuse removing protected
        if reject_over_minimization(protected, protected):
            pass  # structural true; enforced in deep_minimize

        # v3.2.1: use the deep consolidated interface
        minimization = deep_minimize(
            units,
            oracle,
            edges=graph.get("edges"),
            max_oracle_calls=budget,
            compile_id=compile_id,
        )
        session.minimization = minimization

        for i, rec in enumerate(minimization.get("records") or []):
            a = make_compiler_audit(
                compile_id=compile_id,
                record_index=len(audit),
                phase="MINIMIZATION",
                previous_digest=prev,
                proposal_id=rec.get("proposal_id"),
                removed_unit_ids=rec.get("candidate_removed_units"),
                oracle_result=rec.get("oracle_result"),
                decision=rec.get("decision"),
            )
            prev = a["digest"]
            audit.append(a)

        status = minimization["status"]
        if status == "BUDGET_EXHAUSTED":
            promotion = "NOT_PROMOTABLE"
            reason_codes = [BUDGET_EXHAUSTED]
            captured = None
        elif status != "COMPILED":
            promotion = "NOT_PROMOTABLE"
            reason_codes = [status]
            captured = None
        else:
            promotion = "PROMOTABLE"
            reason_codes = ["COMPILED_OK"]
            captured = self._build_captured_test(
                compile_id=compile_id,
                lab_result=lab_result,
                phenomenon=phenomenon,
                retained=minimization["retained"],
                units=units,
                title=phenomenon["title"],
            )

        # update unit dispositions on manifest copy
        dispositions = minimization.get("dispositions") or {}
        for u in units:
            u["final_disposition"] = dispositions.get(u["unit_id"], u.get("final_disposition"))

        result = {
            "schema_version": "compiler-result/0.5",
            "compiler_result_id": f"cresult.{compile_id.removeprefix('compile.')}",
            "compile_id": compile_id,
            "status": status if status != "COMPILED" else "COMPILED",
            "source_digest": minimization.get("source_fixture_digest"),
            "minimal_fixture_digest": minimization.get("minimal_fixture_digest"),
            "target_digest": sha256_digest(request.get("target_behavior") or {}),
            "boundary_digest": sha256_digest(request.get("equivalence_boundary") or {}),
            "unit_counts": {
                "source": len(units),
                "retained": len(minimization["retained"]),
                "removed": len(minimization["removed"]),
                "protected": len(minimization.get("protected") or []),
            },
            "oracle_counts": minimization.get("oracle") or {},
            "minimality_status": minimization.get("minimality_status"),
            "promotion_status": promotion,
            "captured_test_id": (captured or {}).get("captured_test_id"),
            "reason_codes": reason_codes,
            "supporting_evidence": list(lab_result.get("supporting_evidence") or [])[:5],
            "counterevidence": list(lab_result.get("counterevidence") or [])[:5],
            "confounds": list(lab_result.get("confounds") or []),
            "claim_label": lab_result.get("claim_label") or "INFERRED",
            "world_truth": False,
            "creates_fixture": False,
            "production_mutated": False,
            "canonicalization": "noema-jcs/1",
        }
        # attach audit root before final digest
        result["audit_root_digest"] = audit_root(audit)
        result["digest"] = sha256_digest({k: v for k, v in result.items() if k != "digest"})
        session.compiler_result = result

        receipt = self._build_receipt(compile_id, request, result, status if status != "COMPILED" else "COMPILED")
        session.receipt = receipt

        a_end = make_compiler_audit(
            compile_id=compile_id,
            record_index=len(audit),
            phase="RESULT",
            previous_digest=prev,
            decision=status,
            extra={"compiler_result_id": result["compiler_result_id"]},
        )
        audit.append(a_end)
        # refresh audit root on result
        result["audit_root_digest"] = audit_root(audit)
        result["digest"] = sha256_digest({k: v for k, v in result.items() if k != "digest"})
        session.audit = audit
        session.captured_test = captured
        session.status = result["status"]

        labels_req = [
            u.get("simple_label") or u["unit_id"]
            for u in units
            if u["unit_id"] in set(minimization["retained"]) and u.get("protected")
        ]
        labels_rm = [
            u.get("simple_label") or u["unit_id"] for u in units if u["unit_id"] in set(minimization["removed"])
        ]
        session.simple_view = simple_capture_view(
            captured_test=captured,
            compiler_result=result,
            required_labels=labels_req,
            removed_labels=labels_rm,
            reason_codes=reason_codes,
        )
        session.advanced_view = advanced_capture_view(
            captured_test=captured,
            compiler_result=result,
            request=request,
            lab_result_id=lab_result["lab_result_id"],
            confounds=list(lab_result.get("confounds") or []),
        )
        session.reproducibility_view = reproducibility_view(
            captured_test=captured,
            compiler_result=result,
            receipt=receipt,
            audit_root_digest=result["audit_root_digest"],
        )
        return session

    def run_regression(
        self,
        captured_test: dict[str, Any],
        *,
        agent_version: str,
        oracle_result: str,
    ) -> dict[str, Any]:
        return regression_result(
            captured_test_id=captured_test["captured_test_id"],
            subject_agent_version=agent_version,
            oracle_result=oracle_result,
            claim_label=captured_test.get("claim_label") or "INFERRED",
        )

    def _build_captured_test(
        self,
        *,
        compile_id: str,
        lab_result: dict[str, Any],
        phenomenon: dict[str, Any],
        retained: list[str],
        units: list[dict[str, Any]],
        title: str,
    ) -> dict[str, Any]:
        by_id = {u["unit_id"]: u for u in units}
        required_caps = []
        for uid in retained:
            u = by_id.get(uid) or {}
            if u.get("unit_type") in ("TOOL", "CHANNEL", "RESOURCE"):
                required_caps.append(u.get("simple_label") or uid)
        ct = {
            "schema_version": "captured-test/0.5",
            "captured_test_id": f"ctest.{compile_id.removeprefix('compile.')}",
            "captured_test_version": "captured-test/0.5.0",
            "title": title,
            "description": phenomenon.get("title") or title,
            "source_compile_id": compile_id,
            "source_lab_result_id": lab_result["lab_result_id"],
            "source_experiment_ids": [lab_result.get("experiment_id")],
            "source_candidate_ids": list(lab_result.get("source_candidate_ids") or []),
            "fixture_ref": f"research/compiler/{compile_id}/fixture",
            "oracle_ref": f"research/compiler/{compile_id}/oracle",
            "required_versions": {
                "world": "world/v1",
                "agent-protocol": "agent-protocol/v1",
                "compiler": COMPILER_VERSION,
                "canonicalization": "noema-jcs/1",
            },
            "required_agent_capabilities": required_caps,
            "seed_policy": "SOURCE_TRAJECTORY_SEED",
            "replication_policy": "DECLARED_PLAN_BEFORE_COMPILE",
            "behavioral_signature": {
                "feature_ids": [],
                "event_motifs": [],
                "retained_units": retained,
            },
            "generalization_boundary": "SCENARIO_FAMILY",
            "claim_label": lab_result.get("claim_label") or "INFERRED",
            "known_limits": ["Within tested conditions only", "Scenario family only"],
            "privacy_partition": "RESEARCH_ISOLATED",
            "world_truth": False,
        }
        ct["digest"] = sha256_digest({k: v for k, v in ct.items() if k != "digest"})
        return ct

    def _build_receipt(
        self,
        compile_id: str,
        request: dict[str, Any],
        result: dict[str, Any],
        status: str,
    ) -> dict[str, Any]:
        receipt = {
            "receipt_version": "phenomenon-compile-receipt/v1",
            "compile_id": compile_id,
            "status": status,
            "compiler_identity": {
                "version": COMPILER_VERSION,
                "digest": sha256_digest(COMPILER_IMPL),
            },
            "corpus_identity": {"version": "compiler-corpus/0.5.0", "digest": sha256_digest({"corpus": "runtime"})},
            "schema_bundle_identity": {
                "version": "noema-specs/v0.5.0-draft",
                "digest": sha256_digest({"schemas": "v0.5"}),
            },
            "provider_adapter_identity": {"version": "none", "digest": sha256_digest({"provider": "none"})},
            "command": ["phenomenon-compiler", "compile", "--defaults", "capture-defaults/0.5.0"],
            "command_digest": sha256_digest(["phenomenon-compiler", "compile", "--defaults", "capture-defaults/0.5.0"]),
            "normalized_input_digest": request.get("digest"),
            "source_trajectory_digest": (request.get("source_trajectory") or {}).get("trajectory_digest"),
            "target_digest": result.get("target_digest"),
            "equivalence_boundary_digest": result.get("boundary_digest"),
            "minimal_fixture_digest": result.get("minimal_fixture_digest"),
            "canonicalization": "noema-jcs/1",
            "hash_algorithm": "sha256",
            "audit_root_digest": result.get("audit_root_digest"),
        }
        receipt["digest"] = sha256_digest({k: v for k, v in receipt.items() if k != "digest"})
        return receipt

    def _default_units_from_lab(self, lab_result: dict[str, Any], intent: dict[str, Any]) -> dict[str, Any]:
        """Minimal synthetic unit set when fixture manifest not supplied."""
        units = [
            {
                "unit_id": "unit.tool.shared-ledger",
                "unit_type": "TOOL",
                "layer": "TOOLS_RESOURCES",
                "protected": True,
                "eligible_for_removal": False,
                "dependencies": [],
                "simple_label": "shared ledger",
            },
            {
                "unit_id": "unit.channel.messaging",
                "unit_type": "CHANNEL",
                "layer": "OBSERVATIONS_MESSAGES",
                "protected": True,
                "eligible_for_removal": False,
                "dependencies": [],
                "simple_label": "messaging",
            },
            {
                "unit_id": "unit.resource.scarcity",
                "unit_type": "RESOURCE",
                "layer": "TOOLS_RESOURCES",
                "protected": True,
                "eligible_for_removal": False,
                "dependencies": [],
                "simple_label": "resource scarcity",
            },
            {
                "unit_id": "unit.history.unrelated-cycles",
                "unit_type": "EVENT",
                "layer": "EVENTS_ACTIONS",
                "protected": False,
                "eligible_for_removal": True,
                "dependencies": [],
                "simple_label": "unrelated world history",
            },
            {
                "unit_id": "unit.map.peripheral-rooms",
                "unit_type": "WORLD",
                "layer": "WORLD_CONFIGURATION",
                "protected": False,
                "eligible_for_removal": True,
                "dependencies": [],
                "simple_label": "original map",
            },
            {
                "unit_id": "unit.org.unused-merchants",
                "unit_type": "ENTITY",
                "layer": "ENTITIES_AGENTS",
                "protected": False,
                "eligible_for_removal": True,
                "dependencies": [],
                "simple_label": "original organization names",
            },
        ]
        return {
            "schema_version": "compiler-unit-manifest/0.5",
            "manifest_id": f"units.{lab_result['lab_result_id']}",
            "compile_id": "pending",
            "units": units,
        }

    def _failed_result(self, *, compile_id: str, status: str, reason_codes: list[str]) -> dict[str, Any]:
        result = {
            "schema_version": "compiler-result/0.5",
            "compiler_result_id": f"cresult.{compile_id}",
            "compile_id": compile_id,
            "status": status,
            "promotion_status": "NOT_PROMOTABLE",
            "minimality_status": "NOT_MINIMIZED",
            "reason_codes": reason_codes,
            "claim_label": "NOT_COMPUTABLE",
            "world_truth": False,
            "creates_fixture": False,
            "production_mutated": False,
            "canonicalization": "noema-jcs/1",
        }
        result["digest"] = sha256_digest({k: v for k, v in result.items() if k != "digest"})
        return result
