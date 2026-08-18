"""Protocol error taxonomy."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ProtocolError(Exception):
    code: str
    message: str
    retryable: bool = False
    retry_after: float | None = None

    def __str__(self) -> str:
        return f"{self.code}: {self.message}"


FATAL_CODES = frozenset(
    {
        "NO_COMPATIBLE_PROTOCOL",
        "NOT_AUTHORIZED",
        "PRIVATE_COGNITION_FORBIDDEN",
        "WORLD_INCIDENT",
    }
)

RESUME_CODES = frozenset({"RESUME_POSITION_EXPIRED", "RESUME_POSITION_INVALID"})
