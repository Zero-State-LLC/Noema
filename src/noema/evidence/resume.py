"""Bounded resume / acknowledgement delivery windows (RFC-0003 §8, OPERATIONS #12).

Non-canonical bookkeeping: references only already-committed observation/event
positions. Never authorizes mutation. Redelivery never creates world events.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


class ResumeWindowError(ValueError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass
class ResumeWindow:
    """Per (world_id, principal_id, stream_id, session_epoch) delivery cursor."""

    world_id: str
    principal_id: str
    stream_id: str = "observations"
    session_epoch: int = 1
    max_window: int = 256
    # highest contiguous delivered sequence (committed only)
    high_water: int = 0
    # retained committed sequences available for redelivery
    retained: list[int] = field(default_factory=list)

    def key(self) -> str:
        return f"{self.world_id}|{self.principal_id}|{self.stream_id}|{self.session_epoch}"

    def acknowledge(self, sequence: int, *, committed_max: int) -> None:
        """Cumulative ack up to sequence; sequence must be ≤ committed head."""
        if sequence < 0:
            raise ResumeWindowError("INVALID_ACK", "sequence must be >= 0")
        if sequence > committed_max:
            raise ResumeWindowError(
                "ACK_UNCOMMITTED",
                f"ack {sequence} exceeds committed head {committed_max}",
            )
        if sequence < self.high_water:
            # cumulative — lower ack is ignored (already covered)
            return
        self.high_water = sequence
        # drop retained below high_water
        self.retained = [s for s in self.retained if s > self.high_water]
        self._trim()

    def offer_committed(self, sequence: int, *, committed_max: int) -> None:
        """Record a newly committed position for possible redelivery."""
        if sequence > committed_max:
            raise ResumeWindowError(
                "OFFER_UNCOMMITTED",
                f"cannot retain uncommitted sequence {sequence}",
            )
        if sequence <= self.high_water:
            return
        if sequence not in self.retained:
            self.retained.append(sequence)
            self.retained.sort()
        self._trim()

    def resume_from(self, sequence: int) -> list[int]:
        """Return retained sequences strictly after `sequence` for redelivery.

        If the requested position is no longer retained, raise RESYNC_REQUIRED.
        """
        if not self.retained and sequence < self.high_water:
            # everything below high_water was acked and dropped — ok empty
            if sequence >= self.high_water:
                return []
        if sequence < self.high_water - self.max_window:
            raise ResumeWindowError(
                "RESYNC_REQUIRED",
                "requested resume position is outside bounded redelivery window",
            )
        # If client asks for a gap we no longer hold
        if self.retained and sequence + 1 < min(self.retained) and sequence < self.high_water:
            # still within ack continuum
            pass
        if self.retained and sequence < min(self.retained) - 1 and sequence >= self.high_water:
            raise ResumeWindowError(
                "RESYNC_REQUIRED",
                "requested position no longer retained",
            )
        return [s for s in self.retained if s > sequence]

    def _trim(self) -> None:
        if len(self.retained) > self.max_window:
            # keep highest sequences
            self.retained = self.retained[-self.max_window :]

    def snapshot(self) -> dict[str, Any]:
        return {
            "world_id": self.world_id,
            "principal_id": self.principal_id,
            "stream_id": self.stream_id,
            "session_epoch": self.session_epoch,
            "max_window": self.max_window,
            "high_water": self.high_water,
            "retained": list(self.retained),
            "mutation_authorized": False,
        }


class ResumeRegistry:
    """In-process registry of bounded delivery windows (non-canonical)."""

    def __init__(self, *, default_max_window: int = 256):
        self.default_max_window = default_max_window
        self._windows: dict[str, ResumeWindow] = {}

    def get_or_create(
        self,
        *,
        world_id: str,
        principal_id: str,
        stream_id: str = "observations",
        session_epoch: int = 1,
    ) -> ResumeWindow:
        w = ResumeWindow(
            world_id=world_id,
            principal_id=principal_id,
            stream_id=stream_id,
            session_epoch=session_epoch,
            max_window=self.default_max_window,
        )
        key = w.key()
        if key not in self._windows:
            self._windows[key] = w
        return self._windows[key]

    def verify_bounds(self) -> list[str]:
        """Return problems if any window exceeds max or references negative seq."""
        problems: list[str] = []
        for w in self._windows.values():
            if len(w.retained) > w.max_window:
                problems.append(f"window overflow {w.key()}")
            if any(s < 0 for s in w.retained):
                problems.append(f"negative sequence in {w.key()}")
            if w.high_water < 0:
                problems.append(f"negative high_water in {w.key()}")
        return problems
