"""Provider-neutral harness types. Players stay one class; controllers differ."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class FailureClass(str, Enum):
    RETRYABLE_TRANSPORT = "RETRYABLE_TRANSPORT"
    AUTH_REQUIRED = "AUTH_REQUIRED"
    WORLD_NOT_READY = "WORLD_NOT_READY"
    WORLD_PAUSED = "WORLD_PAUSED"
    WORLD_INCIDENT = "WORLD_INCIDENT"
    ACTION_REJECTED = "ACTION_REJECTED"
    INVALID_PROPOSAL = "INVALID_PROPOSAL"
    SETTLEMENT_FAILURE = "SETTLEMENT_FAILURE"


@dataclass
class ActionProposal:
    action: str
    target_id: str | None = None
    arguments: dict[str, Any] = field(default_factory=dict)
    intent: str | None = None
    confidence: float | None = None
    reason_summary: str | None = None


@dataclass
class ValidatedAction:
    command: str
    arguments: dict[str, Any]
    mutating: bool


@dataclass
class NoemaState:
    world: str | None = None
    cycle: int | None = None
    sequence: int | None = None
    self_id: str | None = None
    location: dict[str, Any] | None = None
    resources: dict[str, Any] | None = None
    entities: list[Any] = field(default_factory=list)
    players_here: list[Any] = field(default_factory=list)
    services: list[Any] = field(default_factory=list)
    messages: list[Any] = field(default_factory=list)
    trades: list[Any] = field(default_factory=list)
    organizations: list[Any] = field(default_factory=list)
    available_actions: list[str] = field(default_factory=list)
    affordances: list[dict[str, Any]] = field(default_factory=list)
    last_consequence: Any = None
    focus: Any = None
    situation: dict[str, Any] | None = None
    world_status: str | None = None
    world_text: list[str] = field(default_factory=list)

    def __str__(self) -> str:
        loc = (self.location or {}).get("name") or "?"
        return f"NoemaState({self.world} {self.cycle}/{self.sequence} {loc})"


@dataclass
class CommandResult:
    ok: bool
    observation: dict[str, Any] | None
    error: dict[str, Any] | None
    settled: bool | None
    provenance: dict[str, Any] | None
    http_status: int | None
    failure: FailureClass | None
    idempotency_key: str
    request_id: str
    world_status: str | None = None
    raw: dict[str, Any] | None = None


@dataclass
class TurnResult:
    ok: bool
    stopped: bool = False
    reason: str | None = None
    failure: FailureClass | None = None
    proposal: ActionProposal | None = None
    result: CommandResult | None = None


@dataclass
class UnattendedRun:
    turns: list[TurnResult]
    first_observe: dict[str, Any] | None
    orientation_ok: bool
    orientation_reason: str | None
    stopped: bool
    reason: str | None = None
    report: dict[str, Any] | None = None
