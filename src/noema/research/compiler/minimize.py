"""Dependency-closed hierarchical ddmin (1-minimal, not global minimum)."""

from __future__ import annotations

from typing import Any

from noema.research.compiler.catalog import LAYER_ORDER
from noema.research.compiler.oracle import BehavioralOracle
from noema.research.compiler.units import dependency_closure, units_by_layer
from noema.world.digest import sha256_digest


def minimize(
    units: list[dict[str, Any]],
    oracle: BehavioralOracle,
    *,
    edges: list[dict[str, Any]] | None = None,
    max_oracle_calls: int = 256,
    compile_id: str = "compile",
) -> dict[str, Any]:
    """Run hierarchical ddmin + final one-unit sweep.

    Returns retained units, records, status, minimality_status.
    """
    by_id = {u["unit_id"]: u for u in units}
    retained = {u["unit_id"] for u in units}
    records: list[dict[str, Any]] = []
    budget_exhausted = False

    # source must preserve
    src = oracle.evaluate(retained)
    if src["result"] != "PRESERVED":
        return {
            "retained": sorted(retained),
            "removed": [],
            "records": records,
            "status": "INVALID_EVIDENCE",
            "minimality_status": "NOT_MINIMIZED",
            "oracle": oracle.summary(),
            "budget_exhausted": False,
        }

    def try_remove(candidate_ids: set[str], proposal_id: str) -> bool:
        nonlocal budget_exhausted, retained
        if oracle.calls >= max_oracle_calls:
            budget_exhausted = True
            return False
        removable = {
            uid
            for uid in candidate_ids
            if uid in retained
            and by_id.get(uid, {}).get("eligible_for_removal", True)
            and not by_id.get(uid, {}).get("protected")
        }
        if not removable:
            return False
        final_remove, rejected = dependency_closure(removable, units, edges)
        if rejected:
            records.append(_record(proposal_id, compile_id, removable, final_remove, "REJECTED_PROTECTED", None))
            return False
        # never remove protected via closure
        if any(by_id.get(uid, {}).get("protected") for uid in final_remove):
            records.append(_record(proposal_id, compile_id, removable, final_remove, "REJECTED_PROTECTED", None))
            return False
        proposal = retained - final_remove
        if not proposal:
            return False
        ev = oracle.evaluate(proposal)
        if ev["result"] == "PRESERVED":
            retained = proposal
            records.append(
                _record(proposal_id, compile_id, removable, final_remove, "ACCEPTED", ev["result"], ev["fixture_digest"])
            )
            return True
        # INCONCLUSIVE/INVALID/NOT_PRESERVED never authorize removal
        records.append(
            _record(
                proposal_id,
                compile_id,
                removable,
                final_remove,
                "REJECTED_ORACLE",
                ev["result"],
                ev["fixture_digest"],
            )
        )
        return False

    layers = units_by_layer(units)
    for layer in LAYER_ORDER:
        layer_units = [u for u in layers.get(layer, []) if u["unit_id"] in retained and u.get("eligible_for_removal") and not u.get("protected")]
        if not layer_units:
            continue
        # ddmin-ish: try removing half chunks, then complements, grow n
        ids = [u["unit_id"] for u in layer_units]
        n = 2
        while n <= max(len(ids), 1) and not budget_exhausted:
            chunks = _partition(ids, n)
            progressed = False
            for i, chunk in enumerate(chunks):
                if try_remove(set(chunk), f"prop.{layer}.chunk.{n}.{i}"):
                    progressed = True
                    ids = [uid for uid in ids if uid in retained]
                    n = max(n - 1, 2)
                    break
            if progressed:
                continue
            # complements
            for i, chunk in enumerate(chunks):
                complement = set(ids) - set(chunk)
                if complement and try_remove(complement, f"prop.{layer}.complement.{n}.{i}"):
                    progressed = True
                    ids = [uid for uid in ids if uid in retained]
                    break
            if progressed:
                n = max(n - 1, 2)
                continue
            if n >= len(ids):
                break
            n = min(2 * n, len(ids) or 1)

    # final one-unit sweep
    changed = True
    while changed and not budget_exhausted:
        changed = False
        remaining = sorted(
            uid
            for uid in retained
            if by_id.get(uid, {}).get("eligible_for_removal") and not by_id.get(uid, {}).get("protected")
        )
        for uid in remaining:
            if try_remove({uid}, f"prop.sweep.{uid}"):
                changed = True
                break

    removed = sorted(set(by_id) - retained)
    protected = [u["unit_id"] for u in units if u.get("protected")]
    # 1-minimal check
    one_minimal = True
    if not budget_exhausted:
        for uid in sorted(retained):
            if by_id.get(uid, {}).get("protected") or not by_id.get(uid, {}).get("eligible_for_removal", True):
                continue
            probe = retained - {uid}
            # don't burn budget excessively for status
            if oracle.calls >= max_oracle_calls:
                break
            if oracle.evaluate(probe)["result"] == "PRESERVED":
                one_minimal = False
                break

    if budget_exhausted:
        status = "BUDGET_EXHAUSTED"
        minimality = "PARTIALLY_MINIMIZED"
    elif one_minimal:
        status = "COMPILED"
        minimality = "ONE_MINIMAL"
    else:
        status = "COMPILED"
        minimality = "NOT_MINIMIZED"

    # dispositions
    dispositions = {}
    for uid in by_id:
        if uid in protected and uid in retained:
            dispositions[uid] = "PROTECTED"
        elif uid in retained:
            dispositions[uid] = "RETAINED"
        else:
            dispositions[uid] = "REMOVED"

    return {
        "retained": sorted(retained),
        "removed": removed,
        "protected": protected,
        "dispositions": dispositions,
        "records": records,
        "status": status,
        "minimality_status": minimality,
        "oracle": oracle.summary(),
        "budget_exhausted": budget_exhausted,
        "minimal_fixture_digest": oracle.fixture_digest(retained),
        "source_fixture_digest": oracle.fixture_digest(set(by_id)),
    }


def _partition(ids: list[str], n: int) -> list[list[str]]:
    if not ids:
        return []
    n = max(1, min(n, len(ids)))
    chunks: list[list[str]] = [[] for _ in range(n)]
    for i, uid in enumerate(ids):
        chunks[i % n].append(uid)
    # rebalance to contiguous-ish for stability: use slice partition
    size = len(ids)
    base, rem = divmod(size, n)
    out: list[list[str]] = []
    idx = 0
    for i in range(n):
        take = base + (1 if i < rem else 0)
        out.append(ids[idx : idx + take])
        idx += take
    return [c for c in out if c]


def _record(
    proposal_id: str,
    compile_id: str,
    candidate: set[str],
    closed: set[str],
    decision: str,
    oracle_result: str | None,
    fixture_digest: str | None = None,
) -> dict[str, Any]:
    body = {
        "schema_version": "minimization-record/0.5",
        "compile_id": compile_id,
        "proposal_id": proposal_id,
        "candidate_removed_units": sorted(candidate),
        "dependency_closure_units": sorted(closed - candidate),
        "decision": decision,
        "oracle_result": oracle_result,
        "fixture_digest": fixture_digest,
    }
    body["proposal_digest"] = sha256_digest(body)
    return body


def reject_over_minimization(proposal_remove: set[str], protected: set[str]) -> bool:
    """True if proposal would remove protected units (must not accept)."""
    return bool(proposal_remove & protected)
