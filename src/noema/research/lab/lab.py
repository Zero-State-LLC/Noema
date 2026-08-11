"""Lab orchestrator — isolated experiments from Observatory candidates / intents."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from noema.research.lab.audit import make_lab_audit
from noema.research.lab.errors import BUDGET_EXHAUSTED, INVALID_EXPERIMENT, LabError, NOT_COMPUTABLE
from noema.research.lab.experiment import validate_experiment
from noema.research.lab.fork import create_fork
from noema.research.lab.intent import compile_intent_to_design, simple_lifecycle, study_reason, validate_intent
from noema.research.lab.intervention import apply_intervention, validate_counterfactual_record, validate_intervention
from noema.research.lab.plan import topological_run_order, validate_plan
from noema.research.lab.result import build_lab_result, gate_capture_as_test, simple_result_projection
from noema.research.lab.runs import execute_run
from noema.world.state import WorldState


@dataclass
class LabSessionResult:
    experiment: dict[str, Any]
    plan: dict[str, Any] | None
    fork: dict[str, Any] | None
    runs: list[dict[str, Any]] = field(default_factory=list)
    result: dict[str, Any] | None = None
    audit: list[dict[str, Any]] = field(default_factory=list)
    simple_projection: dict[str, Any] | None = None
    production_sequence_before: int = 0
    production_sequence_after: int = 0
    status: str = "COMPLETE"


class Lab:
    """Research Lab. All mutations confined to experimental forks."""

    def run_from_intent(
        self,
        *,
        intent: dict[str, Any],
        source_state: WorldState,
        interventions: list[dict[str, Any]],
        agent_id: str | None = None,
        trajectory_id: str | None = None,
        plan: dict[str, Any] | None = None,
        confounds: list[str] | None = None,
        max_runs: int | None = None,
    ) -> LabSessionResult:
        intent = validate_intent(intent)
        design = compile_intent_to_design(
            intent,
            world_id=source_state.world_id,
            world_version=source_state.world_version,
            agent_id=agent_id or source_state.world_id,
            trajectory_id=trajectory_id,
        )
        return self.run_experiment(
            experiment=design,
            source_state=source_state,
            interventions=interventions,
            agent_id=agent_id or design["identity"].get("agent_id") or "agent.unknown",
            plan=plan,
            confounds=confounds,
            max_runs=max_runs,
            source_intent_id=intent["intent_record_id"],
        )

    def run_experiment(
        self,
        *,
        experiment: dict[str, Any],
        source_state: WorldState,
        interventions: list[dict[str, Any]],
        agent_id: str,
        plan: dict[str, Any] | None = None,
        confounds: list[str] | None = None,
        max_runs: int | None = None,
        source_intent_id: str | None = None,
        counterevidence: list[str] | None = None,
    ) -> LabSessionResult:
        seq_before = int(source_state.sequence)
        exp = validate_experiment(experiment)
        for iv in interventions:
            validate_intervention(iv)

        audit: list[dict[str, Any]] = []
        prev = None
        a0 = make_lab_audit(
            audit_id=f"audit.{exp['experiment_id']}.0",
            experiment_id=exp["experiment_id"],
            event_kind="DESIGN_VALIDATION",
            previous_state="DRAFT",
            new_state="VALIDATED",
            reason_code="DESIGN_OK",
            evidence_refs=[exp["experiment_id"]],
            previous_digest=prev,
            cycle=source_state.cycle,
        )
        prev = a0["digest"]
        audit.append(a0)

        fork = create_fork(experiment_id=exp["experiment_id"], source_state=source_state)
        a1 = make_lab_audit(
            audit_id=f"audit.{exp['experiment_id']}.1",
            experiment_id=exp["experiment_id"],
            event_kind="FORK_CREATED",
            previous_state="VALIDATED",
            new_state="RUNNING",
            reason_code="FORK_ISOLATED",
            evidence_refs=[fork["fork_id"]],
            previous_digest=prev,
            cycle=source_state.cycle,
        )
        prev = a1["digest"]
        audit.append(a1)

        if plan is None:
            plan = {
                "schema_version": "experiment-plan/0.4",
                "plan_id": f"plan.{exp['experiment_id']}",
                "experiment_id": exp["experiment_id"],
                "runs": [
                    {"run_id": f"run.baseline.{exp['experiment_id']}", "run_role": "BASELINE", "order": 0},
                    {
                        "run_id": f"run.sham.{exp['experiment_id']}",
                        "run_role": "SHAM_CONTROL",
                        "order": 1,
                        "depends_on": [f"run.baseline.{exp['experiment_id']}"],
                    },
                    {
                        "run_id": f"run.intervention.{exp['experiment_id']}",
                        "run_role": "INTERVENTION",
                        "order": 2,
                        "depends_on": [f"run.baseline.{exp['experiment_id']}"],
                    },
                    {
                        "run_id": f"run.replication.{exp['experiment_id']}",
                        "run_role": "REPLICATION",
                        "order": 3,
                        "depends_on": [f"run.intervention.{exp['experiment_id']}"],
                    },
                ],
                "analysis": {"required_controls_pass": True},
                "max_concurrent_runs": 1,
            }
        plan = validate_plan(plan)
        ordered = topological_run_order(plan)
        budget = max_runs if max_runs is not None else int((exp.get("budgets") or {}).get("max_runs") or 16)
        budget_partial = False
        runs: list[dict[str, Any]] = []
        for i, rspec in enumerate(ordered):
            if i >= budget:
                budget_partial = True
                audit.append(
                    make_lab_audit(
                        audit_id=f"audit.{exp['experiment_id']}.budget",
                        experiment_id=exp["experiment_id"],
                        event_kind="BUDGET_EXHAUSTED",
                        previous_state="RUNNING",
                        new_state="PARTIAL",
                        reason_code=BUDGET_EXHAUSTED,
                        evidence_refs=[r["run_id"] for r in runs],
                        previous_digest=prev,
                        cycle=source_state.cycle,
                    )
                )
                break
            try:
                run = execute_run(
                    run_spec={**rspec, "experiment_id": exp["experiment_id"], "schema_version": "experiment-run/0.4"},
                    source_state=source_state,
                    interventions=interventions if rspec.get("run_role") in (
                        "INTERVENTION",
                        "REPLICATION",
                        "GENERALIZATION",
                        "VERSION_DIFFERENTIAL",
                    )
                    else [],
                    agent_id=agent_id,
                )
                runs.append(run)
            except LabError as exc:
                if exc.code == NOT_COMPUTABLE:
                    runs.append(
                        {
                            "run_id": rspec.get("run_id"),
                            "experiment_id": exp["experiment_id"],
                            "run_role": rspec.get("run_role"),
                            "status": "NOT_COMPUTABLE",
                            "error_code": exc.code,
                            "measures": {},
                            "production_mutated": False,
                        }
                    )
                else:
                    raise

        result = build_lab_result(
            lab_result_id=f"labres.{exp['experiment_id']}",
            experiment_id=exp["experiment_id"],
            source_candidate_ids=list((exp.get("identity") or {}).get("source_candidate_ids") or []),
            runs=runs,
            confounds=confounds,
            counterevidence=counterevidence,
            source_intent_id=source_intent_id or exp.get("source_intent_id") or (exp.get("identity") or {}).get("source_intent_id"),
            budget_partial=budget_partial,
        )
        a_end = make_lab_audit(
            audit_id=f"audit.{exp['experiment_id']}.end",
            experiment_id=exp["experiment_id"],
            event_kind="RESULT_CLASSIFICATION",
            previous_state="RUNNING" if not budget_partial else "PARTIAL",
            new_state="COMPLETE" if not budget_partial else "PARTIAL",
            reason_code="ALL_RUNS_FINISHED" if not budget_partial else BUDGET_EXHAUSTED,
            evidence_refs=[result["lab_result_id"]],
            previous_digest=audit[-1]["digest"] if audit else None,
            cycle=source_state.cycle,
        )
        audit.append(a_end)

        projection = simple_result_projection(result, question=exp.get("question"))
        # production isolation check — source_state object may be a clone read; sequence identity checked by caller
        seq_after = int(source_state.sequence)
        return LabSessionResult(
            experiment=exp,
            plan=plan,
            fork=fork,
            runs=runs,
            result=result,
            audit=audit,
            simple_projection=projection,
            production_sequence_before=seq_before,
            production_sequence_after=seq_after,
            status=result.get("execution_status") or "COMPLETE",
        )

    def capture_gate(self, result: dict[str, Any]) -> dict[str, Any]:
        return gate_capture_as_test(result)

    def study_view(self, session: LabSessionResult) -> dict[str, Any]:
        return {
            "lifecycle": simple_lifecycle(session.status if session.status != "COMPLETE" else "COMPLETE"),
            "simple_projection": session.simple_projection,
            "reason_examples": {k: study_reason(k) for k in ("CAPTURE_NOT_READY", "UNSUPPORTED_LESION", "BUDGET_EXHAUSTED")},
            "production_isolated": session.production_sequence_before == session.production_sequence_after
            and all(not r.get("production_mutated") for r in session.runs),
        }
