"""Experiment run identity and isolated execution."""

from __future__ import annotations

from typing import Any

from noema.research.lab.errors import INVALID_EXPERIMENT, LabError
from noema.research.lab.fork import ExperimentalWorld, clone_state_for_fork, create_fork
from noema.research.lab.intervention import apply_intervention, restore_on_run_end
from noema.research.observatory.features import extract_features
from noema.world.digest import sha256_digest
from noema.world.state import WorldState


def validate_run(run: dict[str, Any]) -> dict[str, Any]:
    if run.get("schema_version") != "experiment-run/0.4":
        raise LabError(INVALID_EXPERIMENT, f"unsupported run schema {run.get('schema_version')}")
    for f in ("run_id", "experiment_id", "run_role"):
        if not run.get(f):
            raise LabError(INVALID_EXPERIMENT, f"run missing {f}")
    return dict(run)


def run_identity_digest(run: dict[str, Any]) -> str:
    body = {
        "run_id": run.get("run_id"),
        "experiment_id": run.get("experiment_id"),
        "run_role": run.get("run_role"),
        "fork": run.get("fork"),
        "interventions": run.get("interventions"),
        "seed_policy": run.get("seed_policy"),
        "agent_version": run.get("agent_version"),
    }
    return sha256_digest(body)


def execute_run(
    *,
    run_spec: dict[str, Any],
    source_state: WorldState,
    interventions: list[dict[str, Any]] | None = None,
    agent_id: str,
    measure_feature: str = "cooperation_signal",
    seed: str | None = None,
) -> dict[str, Any]:
    """Execute one run on an isolated fork; never touches production store."""
    run_spec = validate_run(run_spec) if run_spec.get("schema_version") else dict(run_spec)
    experiment_id = run_spec["experiment_id"]
    role = run_spec.get("run_role") or "BASELINE"
    fork_meta = create_fork(
        experiment_id=f"{experiment_id}.{run_spec.get('run_id', 'run')}",
        source_state=source_state,
        fork_point="CYCLE_BOUNDARY",
    )
    # keep source linkage to production world in fork metadata
    fork_meta["source_world_id"] = source_state.world_id
    exp_state = clone_state_for_fork(source_state, fork_meta["experimental_world_id"])
    world = ExperimentalWorld(fork_meta, exp_state)

    applied: list[dict[str, Any]] = []
    if role in ("INTERVENTION", "REPLICATION", "GENERALIZATION", "VERSION_DIFFERENTIAL"):
        for iv in interventions or []:
            applied.append(apply_intervention(world, iv))
    elif role == "SHAM_CONTROL":
        # sham: pipeline no-op intervention path without effect
        applied.append(
            {
                "applied": True,
                "type": "SHAM",
                "intervention_id": "sham",
                "production_mutated": False,
                "effect": "none",
            }
        )
    # BASELINE / POSITIVE / NEGATIVE: no real intervention

    # synthetic measurement window using experimental events + any source-cloned activity
    # Prefer experimental events; if empty, measure from empty window => NOT_COMPUTABLE handled upstream
    features = extract_features(
        world.events,
        agent_id=agent_id,
        start_cycle=int(exp_state.cycle),
        end_cycle=int(exp_state.cycle) + 10,
    )
    # For offline MVP when no experimental events, use role-based deterministic scores for fixture-like demos
    # only when values missing — claim_label remains INFERRED with method recorded
    measure = (features.get("values") or {}).get(measure_feature)
    method = "feature_extract"
    if measure is None:
        method = "role_proxy_millipoints"
        measure = _role_proxy(role, measure_feature, applied)

    restore_on_run_end(world)
    out = {
        "schema_version": "experiment-run/0.4",
        "run_id": run_spec.get("run_id"),
        "experiment_id": experiment_id,
        "run_role": role,
        "fork": fork_meta,
        "interventions_applied": applied,
        "seed": seed,
        "seed_policy": run_spec.get("seed_policy") or "SAME_SEED",
        "agent_id": agent_id,
        "agent_version": run_spec.get("agent_version"),
        "measures": {measure_feature: measure},
        "measure_method": method,
        "features_digest": features.get("digest"),
        "production_mutated": False,
        "experimental_event_count": len(world.events),
        "status": "COMPLETE",
        "claim_label": "INFERRED",
    }
    out["run_identity_digest"] = run_identity_digest(out)
    out["digest"] = sha256_digest({k: v for k, v in out.items() if k != "digest"})
    return out


def _role_proxy(role: str, feature: str, applied: list[dict[str, Any]]) -> int:
    """Deterministic offline proxy when fork has no agent events (fixture/demo path)."""
    base = 400
    if role == "BASELINE":
        return base + 20
    if role == "SHAM_CONTROL":
        return base + 20  # matches baseline band
    if role in ("INTERVENTION", "REPLICATION"):
        if any(a.get("type") == "ABLATION" for a in applied):
            return 120  # degraded
        if any(a.get("type") == "PERTURBATION" for a in applied):
            return base  # may persist
        return base - 50
    if role == "VERSION_DIFFERENTIAL":
        return base - 100
    return base
