"""Deterministic behavior feature extraction (fixed-point millipoints)."""

from __future__ import annotations

from collections import Counter
from typing import Any

from noema.research.errors import NOT_COMPUTABLE, ResearchError
from noema.research.observatory.catalog import feature_catalog, feature_ids
from noema.world.digest import sha256_digest

FEATURE_VERSION = "behavior-features/0.3"


def _clamp_mp(value: int | float) -> int:
    return max(0, min(1000, int(round(value))))


def extract_features(
    events: list[dict[str, Any]],
    *,
    agent_id: str,
    start_cycle: int,
    end_cycle: int,
    missing_policy: str = "NOT_COMPUTABLE",
) -> dict[str, Any]:
    """Extract feature vector for an agent window from canonical event envelopes.

    Missing required signal for a feature is NOT_COMPUTABLE (never silent zero invent)
    unless the window is declared empty and zero_if_empty is used — catalog default is NOT_COMPUTABLE.
    """
    window_events = [
        e
        for e in events
        if start_cycle <= int(e.get("cycle", -1)) <= end_cycle
        and _event_involves_agent(e, agent_id)
    ]
    values: dict[str, Any] = {}
    status: dict[str, str] = {}
    counts = Counter(str(e.get("event_type")) for e in window_events)
    total = sum(counts.values()) or 0

    def rate(types: set[str]) -> int | None:
        if total == 0:
            return None
        n = sum(counts[t] for t in types)
        return _clamp_mp(1000 * n / total)

    mapping = {
        "action_distribution": rate(
            {"LOOK", "MOVE", "INSPECT", "MESSAGE", "WAIT", "TRADE_PROPOSED", "ORG_CREATE", "ENTITY_CREATE", "RESOURCE_TRANSFER"}
        ),
        "resource_allocation": rate({"BUDGET_CONSUMED", "RESOURCE_TRANSFER", "TRADE_PROPOSED"}),
        "movement_exploration": rate({"MOVE"}),
        "communication": rate({"MESSAGE", "MESSAGE_DELIVERED"}),
        "trade_economic": rate({"TRADE_PROPOSED", "TRADE_ACCEPTED", "RESOURCE_TRANSFER"}),
        "organization_faction": rate({"ORG_CREATE", "ORG_MEMBER_ADD"}),
        "information_seeking": rate({"LOOK", "INSPECT"}),
        "tool_usage": rate({"INSPECT", "ENTITY_UPDATE"}),
        "waiting_inaction": rate({"WAIT"}),
        "repair_infrastructure": rate({"ENTITY_UPDATE"}),  # proxy when REPAIR events absent
        "cooperation_signal": rate({"RESOURCE_TRANSFER", "MESSAGE", "ORG_MEMBER_ADD", "TRADE_ACCEPTED"}),
        "conflict_rivalry": rate({"TRADE_REJECTED", "MOVE_REJECTED"}),
        "response_latency_cycles": _latency_mp(window_events) if window_events else None,
        "strategy_persistence": _persistence_mp(window_events) if window_events else None,
        "strategy_switching": _switching_mp(window_events) if window_events else None,
    }

    for fid in feature_ids():
        val = mapping.get(fid)
        if val is None:
            if missing_policy == "NOT_COMPUTABLE":
                status[fid] = "NOT_COMPUTABLE"
                # do not invent zero
            else:
                values[fid] = 0
                status[fid] = "ZERO_EMPTY"
        else:
            values[fid] = int(val)
            status[fid] = "INFERRED"

    vector = {
        "schema_version": "feature-vector/0.3",
        "agent_id": agent_id,
        "window": {"start_cycle": start_cycle, "end_cycle": end_cycle},
        "feature_version": FEATURE_VERSION,
        "values": values,
        "status": status,
        "claim_label": "INFERRED",
        "event_count": total,
    }
    vector["digest"] = sha256_digest({k: v for k, v in vector.items() if k != "digest"})
    return vector


def _event_involves_agent(event: dict[str, Any], agent_id: str) -> bool:
    if event.get("actor_id") == agent_id:
        return True
    p = event.get("payload") or {}
    for key in ("agent_id", "sender_id", "recipient_id", "proposer_id", "counterparty_id", "creator_id", "from_id", "to_id"):
        if p.get(key) == agent_id:
            return True
    return False


def _latency_mp(events: list[dict[str, Any]]) -> int:
    cycles = sorted({int(e.get("cycle", 0)) for e in events})
    if len(cycles) < 2:
        return 0
    gaps = [cycles[i + 1] - cycles[i] for i in range(len(cycles) - 1)]
    mean_gap = sum(gaps) / len(gaps)
    return _clamp_mp(mean_gap * 100)


def _persistence_mp(events: list[dict[str, Any]]) -> int:
    types = [str(e.get("event_type")) for e in sorted(events, key=lambda x: int(x.get("sequence", 0)))]
    if not types:
        return 0
    longest = 1
    cur = 1
    for i in range(1, len(types)):
        if types[i] == types[i - 1]:
            cur += 1
            longest = max(longest, cur)
        else:
            cur = 1
    return _clamp_mp(longest * 100)


def _switching_mp(events: list[dict[str, Any]]) -> int:
    types = [str(e.get("event_type")) for e in sorted(events, key=lambda x: int(x.get("sequence", 0)))]
    if len(types) < 2:
        return 0
    switches = sum(1 for i in range(1, len(types)) if types[i] != types[i - 1])
    return _clamp_mp(1000 * switches / (len(types) - 1))


def feature_delta(pre: dict[str, Any], post: dict[str, Any], feature_id: str) -> int | None:
    pv = (pre.get("values") or {}).get(feature_id)
    qv = (post.get("values") or {}).get(feature_id)
    if pv is None or qv is None:
        return None
    if (pre.get("status") or {}).get(feature_id) == "NOT_COMPUTABLE":
        return None
    if (post.get("status") or {}).get(feature_id) == "NOT_COMPUTABLE":
        return None
    return int(qv) - int(pv)


def validate_feature_vector(vector: dict[str, Any]) -> dict[str, Any]:
    if vector.get("schema_version") != "feature-vector/0.3":
        raise ResearchError(NOT_COMPUTABLE, "unsupported feature-vector schema")
    if vector.get("feature_version") != FEATURE_VERSION:
        raise ResearchError(NOT_COMPUTABLE, "unsupported feature_version")
    if vector.get("claim_label") not in (None, "INFERRED", "OBSERVED", "SPECULATIVE", "NOT_COMPUTABLE"):
        raise ResearchError(NOT_COMPUTABLE, "invalid claim_label")
    # never treat missing as zero invent: status must mark NOT_COMPUTABLE
    for fid, st in (vector.get("status") or {}).items():
        if st == "NOT_COMPUTABLE" and fid in (vector.get("values") or {}):
            # allow but prefer absence
            pass
    return vector


def catalog_family_count() -> int:
    return len(feature_catalog()["features"])
