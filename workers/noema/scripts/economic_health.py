#!/usr/bin/env python3
"""EWM Economic Health + SAR for Noema ops (maint_patrol, digest, cycles).

Drop-in usage:
  from economic_health import compute_economic_health, sar_for_ops
  health = compute_economic_health(obs_snapshot, player_list)
  if health.alerts and "HEALTHY" not in health.alerts:
      ...
"""

from dataclasses import dataclass, field
from math import sqrt
from typing import List, Dict, Any

GROUNDED = frozenset({"observed", "genesis", "inferred-from-stock"})

@dataclass
class EconomicHealth:
    stock_velocity: float = 0.0
    influence_rate: float = 0.0
    attention: float = 10.0
    org_threshold: float = 5.0
    concentration: float = 0.0
    belief_conversion: float = 0.5
    unlocked_count: int = 0
    harvest_pressure: float = 0.0
    uncertainty: float = 0.0
    grounding_pass_rate: float = 1.0
    semantic_drift: float = 0.0
    coordination_drift: float = 0.0
    behavioral_drift: float = 0.0
    asi_composite: float = 1.0
    reputation_stability: float = 1.0
    cascading_risk: float = 0.0
    alerts: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)

def compute_economic_health(snapshot: Dict[str, Any], agents: List[Dict[str, Any]]) -> EconomicHealth:
    """Compute EWM metrics (hardened).
    - Graceful missing data handling
    - Clamped values
    - Optional uncertainty estimate
    """
    if not agents:
        agents = [{"influence": 0, "attention": 8, "conversion_rate": 0.5}]

    h = EconomicHealth()
    total_inf = sum(max(0.0, float(a.get("influence", 0))) for a in agents)
    if total_inf > 0:
        top = max(max(0.0, float(a.get("influence", 0))) for a in agents)
        h.concentration = min(1.0, top / total_inf)

    mats = max(0.0, float(snapshot.get("materials", snapshot.get("global_materials", 10))))
    max_m = max(1.0, float(snapshot.get("max_materials", 18)))
    h.stock_velocity = min(2.0, (mats / max_m) * 2.0)

    cycle = max(1, int(snapshot.get("cycle", 1)))
    h.influence_rate = total_inf / cycle

    h.attention = sum(max(0.0, float(a.get("attention", 8))) for a in agents) / len(agents)
    h.org_threshold = max(1.0, float(snapshot.get("org_threshold", 5.0)))
    h.belief_conversion = sum(max(0.0, float(a.get("conversion_rate", 0.5))) for a in agents) / len(agents)
    h.unlocked_count = len(snapshot.get("unlocked", snapshot.get("unlocked_affordances", [])))
    h.harvest_pressure = max(0.0, float((snapshot.get("co_evolution") or {}).get("harvest_pressure", 0)))
    apply_asi(h, snapshot, agents)

    # Uncertainty (simple heuristic)
    h.uncertainty = min(0.4, abs(h.stock_velocity - 0.8) * 0.3 + (h.concentration - 0.3) * 0.2)

    # Alert rules (tuned for EWM)
    if h.attention < 3.0:
        h.alerts.append("LOW_ATTENTION")
        h.recommendations.append("increase WAIT or co-evo attention regen")
    if h.concentration > 0.55:
        h.alerts.append("HIGH_CONCENTRATION")
        h.recommendations.append("rebalance roles or seed more agents")
    if h.org_threshold > 4.5 and cycle > 8:
        h.alerts.append("HIGH_ORG_BARRIER")
        h.recommendations.append("endorse ATTEST or temporarily lower threshold")
    if h.stock_velocity < 0.40:
        h.alerts.append("LOW_STOCK_VELOCITY")
        h.recommendations.append("review regen_rate or harvest pressure")
    if h.harvest_pressure > 7:
        h.alerts.append("HIGH_HARVEST_PRESSURE")
        h.recommendations.append("increase WAIT cycles or boost regen")
    if h.semantic_drift > 0.6:
        h.alerts.append("HIGH_SEMANTIC_DRIFT")
        h.recommendations.append("require observed/genesis grounding on ATTEST and TRADE")
    if h.asi_composite < 0.5:
        h.alerts.append("LOW_ASI")
        h.recommendations.append("prefer grounded signals; reduce harvest_pressure")

    if not h.alerts:
        h.alerts.append("HEALTHY")

    return h

def apply_asi(h: EconomicHealth, snapshot: Dict[str, Any], agents: List[Dict[str, Any]]) -> None:
    """Semantic Evolution v0.1 ASI: equal-weight 1 - mean(subscore). Missing signals => 0 semantic drift."""
    signals = snapshot.get("signals") or snapshot.get("recent_signals") or []
    grounded = 0
    n = 0
    for s in signals:
        if not isinstance(s, dict):
            continue
        n += 1
        g = str(s.get("grounding") or s.get("@G") or "")
        if g in GROUNDED:
            grounded += 1
    h.grounding_pass_rate = 1.0 if n == 0 else grounded / n
    h.semantic_drift = 0.0 if n == 0 else max(0.0, min(1.0, 1.0 - h.grounding_pass_rate))
    h.coordination_drift = max(0.0, min(1.0, h.harvest_pressure / 8.0))
    rates = [max(0.0, float(a.get("conversion_rate", 0.5))) for a in agents]
    if len(rates) < 2:
        h.behavioral_drift = 0.0
    else:
        mean = sum(rates) / len(rates)
        var = sum((x - mean) ** 2 for x in rates) / len(rates)
        h.behavioral_drift = max(0.0, min(1.0, sqrt(var) * 2.0))
    h.asi_composite = max(0.0, min(1.0, 1.0 - (h.semantic_drift + h.coordination_drift + h.behavioral_drift) / 3.0))
    scores = snapshot.get("image_scores") or []
    nums = [float(x) for x in scores if isinstance(x, (int, float))]
    if len(nums) < 2:
        h.reputation_stability = 1.0
    else:
        mean = sum(nums) / len(nums)
        var = sum((x - mean) ** 2 for x in nums) / len(nums)
        h.reputation_stability = max(0.0, min(1.0, 1.0 - min(1.0, sqrt(var) / 4.0)))
    edges = snapshot.get("interaction_edges") or snapshot.get("edges") or []
    if isinstance(edges, list) and edges:
        low_g = 0
        for e in edges:
            if not isinstance(e, dict):
                continue
            g = str(e.get("grounding") or "")
            if g and g not in GROUNDED:
                low_g += 1
        density = min(1.0, len(edges) / 8.0)
        h.cascading_risk = max(0.0, min(1.0, density * (0.4 + 0.6 * (low_g / max(1, len(edges))))))
    else:
        h.cascading_risk = max(0.0, min(1.0, float(snapshot.get("cascading_risk") or 0)))


def sar_for_ops(health: EconomicHealth) -> Dict[str, Any]:
    """Mini SAR patch proposal for ops."""
    if "HEALTHY" in health.alerts:
        return {"patch": "no-op", "score": 1.0, "asi": round(health.asi_composite, 3)}
    semantic = None
    if "HIGH_SEMANTIC_DRIFT" in health.alerts or "LOW_ASI" in health.alerts:
        semantic = "Reduce semantic drift while maintaining stock velocity"
    return {
        "patch": health.recommendations or ["monitor"],
        "score": 0.65,
        "triggered_by": health.alerts,
        "asi": round(health.asi_composite, 3),
        "semantic_goal": semantic,
    }

def enrich_observation_with_ewm(obs: dict, health: EconomicHealth) -> dict:
    """Optionally attach health to observation for client parity / logging."""
    obs = dict(obs)
    obs["ewm_health"] = {
        "velocity": round(health.stock_velocity, 2),
        "concentration": round(health.concentration, 2),
        "org_threshold": round(health.org_threshold, 2),
        "asi": round(health.asi_composite, 2),
        "semantic_drift": round(health.semantic_drift, 2),
        "reputation_stability": round(health.reputation_stability, 2),
        "cascading_risk": round(health.cascading_risk, 2),
        "signaling_quality": round(health.grounding_pass_rate, 2),
        "drift_alerts": list(health.alerts),
        "alerts": health.alerts,
    }
    return obs

if __name__ == "__main__":
    # Self-test with EWM-tuned values
    snap = {"materials": 11.0, "cycle": 18, "org_threshold": 3.38, "unlocked": ["salvage_to_influence"], "max_materials": 18, "co_evolution": {"harvest_pressure": 0}}
    ags = [{"influence": 8, "attention": 12, "conversion_rate": 0.6}, {"influence": 5, "attention": 12, "conversion_rate": 0.55}]
    h = compute_economic_health(snap, ags)
    print("Self-test:", h)
    print("SAR:", sar_for_ops(h))
