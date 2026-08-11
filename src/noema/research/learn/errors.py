"""LEARN reason codes."""

from __future__ import annotations

from noema.actions.errors import ActionError


class LearnError(ActionError):
    pass


INVALID_BEHAVIOR = "INVALID_BEHAVIOR"
INVALID_EDGE = "INVALID_EDGE"
UNSUPPORTED_INFERENCE = "UNSUPPORTED_INFERENCE"
MISSING_EVIDENCE = "MISSING_EVIDENCE"
POLICY_DENIED = "POLICY_DENIED"
