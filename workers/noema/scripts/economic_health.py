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

# Alerts that describe agent/semantic drift, as opposed to world-economy health.
DRIFT_ALERTS = frozenset({"CASCADING_RISK", "BEHAVIORAL_DRIFT_UNOBSERVED", "SEMANTIC_DRIFT", "COORDINATION_DRIFT"})


def _forman_cascading_risk(edges: List[Any]) -> float:
    """Forman F(e)=4-deg(u)-deg(v); risk = max(forman, density*low_g). Same as curvature.ts."""
    raw = [e for e in edges if isinstance(e, dict) and e.get("from") and e.get("to") and e.get("from") != e.get("to")]
    # Parity with curvature.ts: malformed edges are not evidence of risk. The old
    # fallback counted them, so garbage input inflated density_risk here while
    # the TS twin returned 0 for the same input.
    if not raw:
        return 0.0
    low_g = 0
    for e in raw:
        g = str(e.get("grounding") or "")
        if g and g not in GROUNDED:
            low_g += 1
    n = max(1, len(raw))
    density = min(1.0, len(raw) / 8.0)
    density_risk = density * (0.4 + 0.6 * (low_g / n))
    seen = set()
    uniq = []
    deg = {}
    for e in raw:
        a, b = str(e.get("from")), str(e.get("to"))
        if not a or not b or a == b:
            continue
        key = (a, b) if a < b else (b, a)
        if key in seen:
            continue
        seen.add(key)
        uniq.append((a, b))
        deg[a] = deg.get(a, 0) + 1
        deg[b] = deg.get(b, 0) + 1
    forman_risk = 0.0
    if len(uniq) >= 2:
        mean = sum(4 - deg[u] - deg[v] for u, v in uniq) / len(uniq)
        forman_risk = max(0.0, min(1.0, -mean / 8.0))
    return max(0.0, min(1.0, max(forman_risk, density_risk)))

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
    scar_persistence: float = 0.0
    reconstruction_fidelity: float = 0.0
    path_dependence_index: float = 0.0
    historical_alignment: float = 1.0
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

    # LOOK cannot see other purses; the snapshot says so. Under occupancy
    # weighting concentration is 1/n by construction, not a measurement.
    concentration_observed = not bool(snapshot.get("occupancy_weighted"))

    # Uncertainty (simple heuristic). Clamped at 0 — a low-concentration world
    # previously produced negative uncertainty.
    conc_term = (h.concentration - 0.3) * 0.2 if concentration_observed else 0.0
    h.uncertainty = max(0.0, min(0.4, abs(h.stock_velocity - 0.8) * 0.3 + conc_term))

    # Alert rules (tuned for EWM)
    if h.attention < 3.0:
        h.alerts.append("LOW_ATTENTION")
        h.recommendations.append("increase WAIT or co-evo attention regen")
    if concentration_observed and h.concentration > 0.55:
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
    # The producer declares whether conversion behaviour was observable at all;
    # do not infer it from value equality (identical real rates are a valid
    # measurement of no drift). LOOK cannot publish conversion, so its snapshot
    # sets conversion_observed=False and the term reads "not measured", not 0.
    if snapshot.get("conversion_observed") is False:
        h.behavioral_drift = 0.0
        if "BEHAVIORAL_DRIFT_UNOBSERVED" not in h.alerts:
            h.alerts.append("BEHAVIORAL_DRIFT_UNOBSERVED")
    elif len(rates) < 2:
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
        h.cascading_risk = _forman_cascading_risk(edges)
    else:
        h.cascading_risk = max(0.0, min(1.0, float(snapshot.get("cascading_risk") or 0)))
    scars = snapshot.get("scars") or []
    if isinstance(scars, list) and scars:
        strengths = [float(s.get("strength", 0)) for s in scars if isinstance(s, dict)]
        h.path_dependence_index = max(0.0, min(1.0, sum(strengths) / max(1, len(strengths))))
        cycle = max(1, int(snapshot.get("cycle", 1)))
        ages = [max(0.0, cycle - float(s.get("cycle_born", cycle))) for s in scars if isinstance(s, dict)]
        h.scar_persistence = sum(ages) / max(1, len(ages))
    h.reconstruction_fidelity = max(0.0, min(1.0, float(snapshot.get("reconstruction_fidelity") or 0)))
    h.historical_alignment = max(0.0, min(1.0, 1.0 - h.semantic_drift * 0.5 - h.path_dependence_index * 0.3))


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
        "scar_persistence": round(health.scar_persistence, 2),
        "reconstruction_fidelity": round(health.reconstruction_fidelity, 2),
        "path_dependence_index": round(health.path_dependence_index, 2),
        "historical_alignment": round(health.historical_alignment, 2),
        # drift_alerts is the drift subset (matching semanticAttach), not a
        # duplicate of every alert — operators read the two as different things.
        "drift_alerts": [a for a in health.alerts if a in DRIFT_ALERTS],
        "alerts": list(health.alerts),
    }
    return obs

if __name__ == "__main__":
    # Self-test with EWM-tuned values
    snap = {"materials": 11.0, "cycle": 18, "org_threshold": 3.38, "unlocked": ["salvage_to_influence"], "max_materials": 18, "co_evolution": {"harvest_pressure": 0}}
    ags = [{"influence": 8, "attention": 12, "conversion_rate": 0.6}, {"influence": 5, "attention": 12, "conversion_rate": 0.55}]
    h = compute_economic_health(snap, ags)
    print("Self-test:", h)
    print("SAR:", sar_for_ops(h))
