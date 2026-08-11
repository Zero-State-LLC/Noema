"""Experiment plan DAG — explicit claim-bearing order."""

from __future__ import annotations

from typing import Any

from noema.research.lab.errors import INVALID_EXPERIMENT, LabError
from noema.world.digest import sha256_digest


def validate_plan(plan: dict[str, Any]) -> dict[str, Any]:
    if plan.get("schema_version") != "experiment-plan/0.4":
        raise LabError(INVALID_EXPERIMENT, f"unsupported plan schema {plan.get('schema_version')}")
    if not plan.get("plan_id") or not plan.get("experiment_id"):
        raise LabError(INVALID_EXPERIMENT, "plan_id and experiment_id required")
    runs = plan.get("runs") or []
    if not runs:
        raise LabError(INVALID_EXPERIMENT, "plan requires runs")
    # topological order by declared order field
    ordered = sorted(runs, key=lambda r: int(r.get("order") or 0))
    seen: set[str] = set()
    for r in ordered:
        rid = r["run_id"]
        for dep in r.get("depends_on") or []:
            if dep not in seen:
                raise LabError(INVALID_EXPERIMENT, f"plan dependency order violation: {rid} needs {dep}")
        seen.add(rid)
    body = {k: v for k, v in plan.items() if k not in ("plan_digest", "digest")}
    dig = sha256_digest(body)
    out = dict(plan)
    out["plan_digest"] = dig
    out["ordered_run_ids"] = [r["run_id"] for r in ordered]
    return out


def topological_run_order(plan: dict[str, Any]) -> list[dict[str, Any]]:
    plan = validate_plan(plan)
    return sorted(plan.get("runs") or [], key=lambda r: int(r.get("order") or 0))
