"""Stable research / Frontier reason codes."""

from __future__ import annotations

from noema.actions.errors import ActionError


INVALID_GENOME = "INVALID_GENOME"
UNSUPPORTED_VERSION = "UNSUPPORTED_VERSION"
INVALID_MUTATION = "INVALID_MUTATION"
INSUFFICIENT_RESEARCH_INPUT = "INSUFFICIENT_RESEARCH_INPUT"
POLICY_DENIED = "POLICY_DENIED"
INJECTION_REJECTED = "INJECTION_REJECTED"
NOT_COMPUTABLE = "NOT_COMPUTABLE"
INVALID_EVIDENCE = "INVALID_EVIDENCE"
FRONTIER_NOT_READY = "FRONTIER_NOT_READY"


class ResearchError(ActionError):
    """Research-layer error (does not corrupt world truth)."""
