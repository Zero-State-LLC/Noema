"""Frontier Director — constrained enumeration + lexicographic ranking."""

from __future__ import annotations

import copy
from dataclasses import dataclass, field
from typing import Any

from noema.research.errors import (
    INSUFFICIENT_RESEARCH_INPUT,
    INVALID_GENOME,
    NOT_COMPUTABLE,
    ResearchError,
)
from noema.research.frontier.audit import make_audit_record
from noema.research.frontier.catalog import director_config, operator_ids
from noema.research.frontier.genomes import genome_content_digest, validate_genome
from noema.research.frontier.mutation import mutate_sequence
from noema.research.frontier.novelty import is_solved_near_duplicate, pairwise_diversity
from noema.research.frontier.scoring import ranking_key, score_components
from noema.world.digest import sha256_digest

# Intensity grid for bounded enumeration (closed, finite).
DEFAULT_INTENSITIES = (400, 500, 600, 700)

DIRECTOR_IMPL = {
    "name": "noema-frontier-director",
    "version": "frontier-director/0.2",
    "runtime": "noema-phase2a",
}


@dataclass
class FrontierResult:
    plan: dict[str, Any]
    candidates: list[dict[str, Any]]
    audit: list[dict[str, Any]]
    replay_context: dict[str, Any]
    selected_genomes: list[dict[str, Any]] = field(default_factory=list)
    stop_reason: str = ""
    claim_label: str = "INFERRED"


REQUIRED_REQUEST_FIELDS = (
    "request_id",
    "decision_cycle",
    "director_version",
    "world_version",
    "capability_snapshot",
    "trajectory_window",
    "targets",
    "candidate_sources",
    "budgets",
    "safety_rules",
    "research_constraints",
    "seed",
)


class FrontierDirector:
    """Bounded pure decision module. Does not touch world state."""

    def __init__(self, config: dict[str, Any] | None = None):
        self.config = config or director_config()
        self.impl_digest = sha256_digest({**DIRECTOR_IMPL, "config": self.config})

    def validate_request(self, request: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(request, dict):
            raise ResearchError(NOT_COMPUTABLE, "request must be object")
        if request.get("schema_version") not in (None, "frontier-request/0.2"):
            if request.get("schema_version") != "frontier-request/0.2":
                raise ResearchError(NOT_COMPUTABLE, "unsupported request schema")
        for f in REQUIRED_REQUEST_FIELDS:
            if f not in request or request[f] in (None, ""):
                raise ResearchError(INSUFFICIENT_RESEARCH_INPUT, f"missing required field {f}")
        if not request.get("seed"):
            raise ResearchError(INSUFFICIENT_RESEARCH_INPUT, "missing seed")
        if request.get("director_version") != "frontier-director/0.2":
            raise ResearchError(NOT_COMPUTABLE, "unsupported director_version")
        return request

    def candidate_id(
        self,
        *,
        parent_digest: str,
        mutation_operations: list[dict[str, Any]],
        world_version: str,
        director_version: str = "frontier-director/0.2",
    ) -> str:
        payload = {
            "parent_digest": parent_digest,
            "mutation_operations": mutation_operations,
            "world_version": world_version,
            "director_version": director_version,
        }
        return "fdc-" + sha256_digest(payload).removeprefix("sha256:")

    def run(
        self,
        request: dict[str, Any],
        templates: dict[str, dict[str, Any]],
        *,
        explicit_mutation_plans: list[list[dict[str, Any]]] | None = None,
        solved_novelty_vectors: list[dict[str, int]] | None = None,
    ) -> FrontierResult:
        """Enumerate → score → select. Never mutates world."""
        try:
            request = self.validate_request(request)
        except ResearchError as exc:
            return self._empty(request if isinstance(request, dict) else {}, stop_reason="NOT_COMPUTABLE", error=exc)

        input_digest = sha256_digest(request)
        config_digest = sha256_digest(self.config)
        budgets = request.get("budgets") or {}
        max_candidates = int(budgets.get("max_candidates") or self.config.get("max_candidates_enumerated") or 256)
        max_select = int(budgets.get("max_select") or self.config.get("default_select_count") or 1)
        max_risk = int(budgets.get("max_risk_class") or self.config.get("risk_class_max_admissible") or 3)
        max_cost = int(budgets.get("max_cost_millipoints") or 10_000)
        max_depth = int(self.config.get("max_mutation_depth") or 2)
        enum_budget = min(max_candidates, int(self.config.get("max_candidates_enumerated") or 256))
        seed = str(request["seed"])
        world_version = str(request["world_version"])
        solved = list(solved_novelty_vectors or [])

        candidates: list[dict[str, Any]] = []
        audit: list[dict[str, Any]] = []
        prev_audit: str | None = None
        enumerated = 0

        sources = sorted(request.get("candidate_sources") or [], key=lambda s: s.get("template_id") or "")
        for source in sources:
            tid = source["template_id"]
            template = templates.get(tid)
            if template is None:
                # try match by genome template_id field
                for g in templates.values():
                    if g.get("template_id") == tid or g.get("genome_id") == tid:
                        template = g
                        break
            if template is None:
                continue
            try:
                parent = validate_genome(template)
            except ResearchError:
                continue
            parent_digest = parent["content_digest"]
            # Request digests pin fixtures; runtime-supplied templates are authoritative
            # when the caller provides a local genome under the same template_id.

            plans = explicit_mutation_plans
            if plans is None:
                plans = self._enumerate_mutation_plans(max_depth=max_depth)
            # always include identity (no mutation) as baseline candidate source
            plan_list = [[]] + list(plans)

            for ops in plan_list:
                if enumerated >= enum_budget:
                    break
                try:
                    if ops:
                        genome = mutate_sequence(parent, ops)
                    else:
                        genome = copy.deepcopy(parent)
                        genome["content_digest"] = genome_content_digest(genome)
                        genome = validate_genome(genome)
                except ResearchError:
                    continue
                cid = self.candidate_id(
                    parent_digest=parent_digest,
                    mutation_operations=ops,
                    world_version=world_version,
                )
                enumerated += 1
                is_rep = False
                for snv in solved:
                    try:
                        if is_solved_near_duplicate(genome["novelty_vector"], snv):
                            is_rep = True
                            break
                    except ResearchError:
                        pass
                control_role = genome.get("control_role") or "none"
                if is_rep and control_role == "none":
                    disposition = "rejected"
                    reason = ["repetition_without_control"]
                    scores = score_components(genome=genome, request=request, is_repetition=True)
                elif int(genome.get("risk_class") or 0) > max_risk:
                    disposition = "rejected"
                    reason = ["risk_class_exceeded"]
                    scores = score_components(genome=genome, request=request, is_repetition=is_rep)
                else:
                    disposition = "enumerated"
                    reason = []
                    control_value = 500 if control_role != "none" else 0
                    scores = score_components(
                        genome=genome,
                        request=request,
                        is_repetition=is_rep,
                        control_value=control_value,
                    )
                    if scores["cost"] > max_cost:
                        disposition = "rejected"
                        reason = ["budget_cost"]

                entry = {
                    "schema_version": "frontier-candidate/0.2",
                    "candidate_id": cid,
                    "parent_template_id": tid,
                    "parent_digest": parent_digest,
                    "mutation_operations": ops,
                    "genome_id": genome["genome_id"],
                    "genome_digest": genome["content_digest"],
                    "genome": genome,
                    "target_capability_ids": [t["capability_id"] for t in request.get("targets") or []],
                    "score_components": scores,
                    "ranking_key": None,
                    "disposition": disposition,
                    "reason_codes": reason,
                    "control_role": control_role,
                    "risk_class": genome.get("risk_class"),
                }
                if disposition == "enumerated":
                    entry["ranking_key"] = list(ranking_key(scores, cid, seed))
                candidates.append(entry)

        # Deduplicate by genome_digest — keep lex smallest candidate_id derivation
        by_digest: dict[str, dict[str, Any]] = {}
        for c in candidates:
            gd = c["genome_digest"]
            if gd not in by_digest or c["candidate_id"] < by_digest[gd]["candidate_id"]:
                by_digest[gd] = c
        candidates = list(by_digest.values())

        admissible = [c for c in candidates if c["disposition"] == "enumerated"]
        admissible.sort(key=lambda c: tuple(c["ranking_key"] or ()))

        selected: list[dict[str, Any]] = []
        stop_reason = "requested_count"
        for c in admissible:
            if len(selected) >= max_select:
                break
            # pairwise diversity among selected
            ok = True
            for s in selected:
                try:
                    dist = pairwise_diversity(c["genome"]["novelty_vector"], s["genome"]["novelty_vector"])
                    if dist < int(self.config.get("pairwise_diversity_min") or 120):
                        ok = False
                        c["disposition"] = "skipped"
                        c["reason_codes"] = ["diversity_min"]
                        break
                except ResearchError:
                    pass
            if not ok:
                continue
            c["disposition"] = "selected"
            c["reason_codes"] = ["selected_top_rank"]
            selected.append(c)
            rec = make_audit_record(
                request_id=request["request_id"],
                record_index=len(audit),
                record_type="selection",
                input_digest=input_digest,
                director_implementation_digest=self.impl_digest,
                candidate_id=c["candidate_id"],
                score_components=c["score_components"],
                constraint_decisions=[{"rule": "risk_class_max", "result": "pass"}],
                reason_codes=c["reason_codes"],
                previous_record_digest=prev_audit,
            )
            prev_audit = rec["digest"]
            audit.append(rec)

        if not selected:
            if not admissible and not candidates:
                stop_reason = "no-safe-candidate"
            elif not admissible:
                stop_reason = "no-safe-candidate"
            else:
                stop_reason = "budget-exhausted"
            rec = make_audit_record(
                request_id=request["request_id"],
                record_index=len(audit),
                record_type="empty_plan",
                input_digest=input_digest,
                director_implementation_digest=self.impl_digest,
                candidate_id=None,
                score_components=None,
                constraint_decisions=[],
                reason_codes=[stop_reason],
                previous_record_digest=prev_audit,
            )
            audit.append(rec)

        plan = {
            "schema_version": "frontier-plan/0.2",
            "plan_id": f"fdplan.{request['request_id']}",
            "request_id": request["request_id"],
            "input_digests": {"request": input_digest, "config": config_digest},
            "selected_candidates": [
                {k: v for k, v in c.items() if k != "genome"} for c in selected
            ],
            "expected_information_gain": {
                "claim_label": "INFERRED" if selected else "NOT_COMPUTABLE",
                "components": selected[0]["score_components"] if selected else None,
            },
            "claim_label": "INFERRED" if selected else "NOT_COMPUTABLE",
            "budgets_reserved": {"candidates": max(1, len(selected))},
            "anti_repetition_constraints": {
                "solved_distance": int(self.config.get("solved_distance") or 50),
                "pairwise_diversity_min": int(self.config.get("pairwise_diversity_min") or 120),
            },
            "stop_reason": stop_reason if selected else stop_reason,
            "director_version": "frontier-director/0.2",
        }
        if selected:
            plan["stop_reason"] = "requested_count"

        replay = {
            "schema_version": "frontier-replay-context/0.2",
            "request_id": request["request_id"],
            "director_version": "frontier-director/0.2",
            "novelty_axes_version": "novelty-axes/0.2",
            "mutation_catalog_version": "mutation-catalog/0.2",
            "noise_model_version": "noise-model/0.2",
            "seed_digest": request.get("seed_digest") or sha256_digest(request["seed"]),
            "input_digests": plan["input_digests"],
            "selected_situation_digests": [c["genome_digest"] for c in selected],
            "equivalence_boundary": {
                "decision_equivalent_fields": [
                    "candidate_digest_set",
                    "dispositions",
                    "scores",
                    "selected_order",
                    "stop_reason",
                ]
            },
        }

        return FrontierResult(
            plan=plan,
            candidates=[{k: v for k, v in c.items() if k != "genome"} | {"genome_digest": c["genome_digest"]} for c in candidates],
            audit=audit,
            replay_context=replay,
            selected_genomes=[c["genome"] for c in selected],
            stop_reason=plan["stop_reason"],
            claim_label=plan["claim_label"],
        )

    def _enumerate_mutation_plans(self, *, max_depth: int) -> list[list[dict[str, Any]]]:
        """Finite plans: single-op and optional 2-op chains over closed catalog."""
        ops = sorted(operator_ids())
        plans: list[list[dict[str, Any]]] = []
        for op_id in ops:
            for intensity in DEFAULT_INTENSITIES:
                plans.append([{"operator_id": op_id, "params": {"intensity_millipoints": intensity}}])
        if max_depth >= 2:
            # bounded second layer: only first 3 ops × first 2 intensities to avoid explosion
            for op_a in ops[:4]:
                for op_b in ops[:4]:
                    if op_a == op_b:
                        continue
                    plans.append(
                        [
                            {"operator_id": op_a, "params": {"intensity_millipoints": 500}},
                            {"operator_id": op_b, "params": {"intensity_millipoints": 500}},
                        ]
                    )
        return plans

    def _empty(
        self,
        request: dict[str, Any],
        *,
        stop_reason: str,
        error: ResearchError | None = None,
    ) -> FrontierResult:
        rid = (request or {}).get("request_id") or "unknown"
        plan = {
            "schema_version": "frontier-plan/0.2",
            "plan_id": f"fdplan.{rid}.empty",
            "request_id": rid,
            "input_digests": {},
            "selected_candidates": [],
            "expected_information_gain": {"claim_label": "NOT_COMPUTABLE"},
            "claim_label": "NOT_COMPUTABLE",
            "budgets_reserved": {"candidates": 0},
            "anti_repetition_constraints": {
                "solved_distance": int(self.config.get("solved_distance") or 50),
                "pairwise_diversity_min": int(self.config.get("pairwise_diversity_min") or 120),
            },
            "stop_reason": stop_reason,
            "director_version": "frontier-director/0.2",
            "error_code": error.code if error else stop_reason,
        }
        return FrontierResult(
            plan=plan,
            candidates=[],
            audit=[],
            replay_context={"request_id": rid, "stop_reason": stop_reason},
            selected_genomes=[],
            stop_reason=stop_reason,
            claim_label="NOT_COMPUTABLE",
        )
