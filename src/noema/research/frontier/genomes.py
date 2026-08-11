"""Situation Genome validation and content identity."""

from __future__ import annotations

from typing import Any

from noema.research.errors import INVALID_GENOME, UNSUPPORTED_VERSION, ResearchError
from noema.world.digest import sha256_digest

SCHEMA_VERSION = "situation-genome/0.2"
NOVELTY_AXES = (
    "semantic",
    "causal",
    "social_topology",
    "temporal",
    "tool",
    "epistemic",
    "goal_structure",
    "resource",
    "constraint",
)
FORBIDDEN_FORCED_FIELDS = (
    "forced_agent_action",
    "scripted_response",
    "required_agent_action",
    "force_outcome",
    "scripted_agent_actions",
)


def genome_body(genome: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in genome.items() if k != "content_digest"}


def genome_content_digest(genome: dict[str, Any]) -> str:
    return sha256_digest(genome_body(genome))


def validate_genome(genome: dict[str, Any], *, require_digest: bool = True) -> dict[str, Any]:
    """Structural validation against situation-genome/0.2 (no jsonschema dep)."""
    if not isinstance(genome, dict):
        raise ResearchError(INVALID_GENOME, "genome must be an object")
    if genome.get("schema_version") != SCHEMA_VERSION:
        raise ResearchError(
            UNSUPPORTED_VERSION,
            f"unsupported genome schema_version {genome.get('schema_version')}",
        )
    for field in ("genome_id", "genome_version", "world_rules_version", "template_id"):
        if not genome.get(field):
            raise ResearchError(INVALID_GENOME, f"missing required field {field}")
    if "risk_class" not in genome or not isinstance(genome["risk_class"], int):
        raise ResearchError(INVALID_GENOME, "risk_class required integer 0..4")
    if not (0 <= int(genome["risk_class"]) <= 4):
        raise ResearchError(INVALID_GENOME, "risk_class out of range")
    control = genome.get("control_role", "none")
    if control not in ("none", "positive-control", "negative-control", "regression"):
        raise ResearchError(INVALID_GENOME, f"invalid control_role {control}")

    nv = genome.get("novelty_vector")
    if not isinstance(nv, dict):
        raise ResearchError(INVALID_GENOME, "novelty_vector required")
    for axis in NOVELTY_AXES:
        if axis not in nv:
            raise ResearchError(INVALID_GENOME, f"novelty_vector missing axis {axis}")
        val = nv[axis]
        if not isinstance(val, int) or val < 0 or val > 1000:
            raise ResearchError(INVALID_GENOME, f"novelty axis {axis} must be millipoints 0..1000")

    # No forced agent outcomes
    flat = json_flatten(genome)
    for bad in FORBIDDEN_FORCED_FIELDS:
        if bad in flat and flat[bad] not in (None, False, [], {}):
            # allow explicit false under goal_structure.no_scripted_agent_actions
            if bad == "scripted_agent_actions":
                continue
            raise ResearchError(INVALID_GENOME, f"forced outcome field rejected: {bad}")
    gs = genome.get("goal_structure") or {}
    if gs.get("no_scripted_agent_actions") is False:
        raise ResearchError(INVALID_GENOME, "genome must not require scripted agent actions")
    if "required_agent_action" in gs or "forced_agent_action" in gs:
        raise ResearchError(INVALID_GENOME, "genome has forbidden agent action field")

    dig = genome_content_digest(genome)
    if require_digest:
        recorded = genome.get("content_digest")
        if recorded and recorded != dig:
            raise ResearchError(INVALID_GENOME, "content_digest mismatch")
    out = dict(genome)
    out["content_digest"] = dig
    return out


def json_flatten(value: Any, prefix: str = "") -> dict[str, Any]:
    out: dict[str, Any] = {}
    if isinstance(value, dict):
        for k, v in value.items():
            key = f"{prefix}.{k}" if prefix else str(k)
            out[str(k)] = v
            out.update(json_flatten(v, key))
    return out


def public_genome_view(genome: dict[str, Any]) -> dict[str, Any]:
    """Player-safe view — strips research-private fields per visibility_policy."""
    forbidden = set((genome.get("visibility_policy") or {}).get("player_forbidden") or [])
    default_forbidden = {
        "target_capabilities",
        "novelty_vector",
        "control_role",
        "selection_rationale",
        "content_digest",
        "provenance",
    }
    strip = forbidden | default_forbidden
    view = {k: v for k, v in genome.items() if k not in strip}
    # never expose research targeting
    view.pop("target_capability_ids", None)
    return view
