"""v0.2 partial observability + attention degradation (observation projection only)."""

from __future__ import annotations

from typing import Any

from noema.research.frontier.catalog import attention_projection


def attention_band(attention: float | int) -> str:
    cfg = attention_projection()
    a = float(attention)
    if a >= float(cfg["threshold_full"]):
        return "full"
    if a >= float(cfg["threshold_reduced"]):
        return "reduced"
    if a >= float(cfg["threshold_minimal"]):
        return "minimal"
    return "none"


def project_look(
    *,
    room: dict[str, Any],
    attention: float | int,
    co_located: list[str],
    cycle: int,
    hidden_research: dict[str, Any] | None = None,
) -> dict[str, Any]:
    band = attention_band(attention)
    if band == "none":
        return {
            "resolution": "none",
            "quality_class": "insufficient_attention",
            "observed_at_cycle": cycle,
            "error": "BUDGET_EXCEEDED",
        }
    base: dict[str, Any] = {
        "room_id": room.get("room_id"),
        "name": room.get("name"),
        "observed_at_cycle": cycle,
        "resolution": band,
        "quality_class": "full" if band == "full" else "degraded",
        "staleness_cycles": 0,
    }
    if band == "full":
        base["description"] = room.get("description")
        base["entity_ids"] = list(room.get("entity_ids") or [])
        base["exits"] = room.get("exits")  # may be empty; caller fills
        base["co_located_display_names"] = list(co_located)
        if room.get("condition") is not None:
            base["condition"] = room.get("condition")
    elif band == "reduced":
        base["co_located_display_names"] = list(co_located)
        # omit exact condition
        base["exits.direction"] = True
    else:  # minimal
        pass
    # never leak research hidden fields into agent obs
    if hidden_research:
        for k in ("target_capabilities", "novelty_vector", "selection_rationale", "control_role"):
            base.pop(k, None)
    return base


def project_inspect(
    *,
    entity: dict[str, Any],
    attention: float | int,
    cycle: int,
    private_evidence: list[str] | None = None,
    agent_id: str | None = None,
    asymmetric_private_agents: list[str] | None = None,
) -> dict[str, Any]:
    band = attention_band(attention)
    if band == "none":
        return {
            "resolution": "none",
            "quality_class": "insufficient_attention",
            "observed_at_cycle": cycle,
            "error": "BUDGET_EXCEEDED",
        }
    props = entity.get("properties") or {}
    out: dict[str, Any] = {
        "entity_id": entity.get("entity_id"),
        "label": props.get("label") or entity.get("entity_id"),
        "observed_at_cycle": cycle,
        "resolution": band,
        "quality_class": "full" if band == "full" else "degraded",
    }
    if band == "full":
        out["entity_type"] = entity.get("entity_type")
        out["condition"] = (entity.get("state") or {}).get("condition")
        out["state"] = dict(entity.get("state") or {})
    elif band == "reduced":
        out["entity_type"] = entity.get("entity_type")
        cond = (entity.get("state") or {}).get("condition")
        if isinstance(cond, (int, float)):
            # banded condition, not exact
            out["condition_band"] = "degraded" if float(cond) < 50 else "stable"
        # omit exact condition
    # private evidence only to listed agents
    if private_evidence and agent_id and asymmetric_private_agents and agent_id in asymmetric_private_agents:
        out["private_evidence"] = list(private_evidence)
    return out
