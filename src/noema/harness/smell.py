"""Pinned smells that switch play → debug. Quiet WAIT is not a smell."""

from __future__ import annotations

from dataclasses import dataclass

from noema.harness.types import FailureClass, TurnResult

SETTLEMENT_CODES = frozenset({"NONCONTIGUOUS_SEQUENCE", "DUPLICATE_EVENT_CONFLICT"})


@dataclass(frozen=True)
class Smell:
    kind: str
    detail: str


def _error_code(turn: TurnResult) -> str:
    err = (turn.result.error if turn.result else None) or {}
    return str(err.get("code") or "")


def _room(turn: TurnResult) -> str | None:
    obs = turn.result.observation if turn.result else None
    if not isinstance(obs, dict):
        return None
    loc = obs.get("location") if isinstance(obs.get("location"), dict) else {}
    room = loc.get("room_id")
    return str(room) if room else None


def _entity_ids(turn: TurnResult) -> set[str]:
    obs = turn.result.observation if turn.result else None
    if not isinstance(obs, dict):
        return set()
    loc = obs.get("location") if isinstance(obs.get("location"), dict) else {}
    found: set[str] = set()
    for ent in list(loc.get("entities") or obs.get("entities") or []):
        if isinstance(ent, dict) and ent.get("entity_id"):
            found.add(str(ent["entity_id"]))
    return found


def detect_smell(turn: TurnResult, previous_room: str | None) -> Smell | None:
    command = (turn.proposal.action if turn.proposal else "") or ""
    name = command.upper()
    code = _error_code(turn)
    failure = turn.failure or (turn.result.failure if turn.result else None)
    http = turn.result.http_status if turn.result else None

    if failure == FailureClass.AUTH_REQUIRED or http == 401 or code in {"AUTH_REQUIRED", "NOT_AUTHORIZED"}:
        return Smell("auth", code or "AUTH_REQUIRED")
    if failure == FailureClass.WORLD_INCIDENT or code == "WORLD_INCIDENT":
        return Smell("incident", code or "WORLD_INCIDENT")
    if failure == FailureClass.SETTLEMENT_FAILURE or code in SETTLEMENT_CODES:
        return Smell("settlement", code or "SETTLEMENT_FAILURE")
    if name == "WAIT" and turn.ok:
        return None
    if not turn.ok or (isinstance(http, int) and http >= 400):
        return Smell("command_rejected", code or (failure.value if failure else "rejected"))
    if name == "MOVE" and previous_room and _room(turn) == previous_room:
        return Smell("contradiction", f"MOVE stayed in {previous_room}")
    if name == "INSPECT" and turn.proposal:
        target = str(turn.proposal.target_id or (turn.proposal.arguments or {}).get("entity_id") or "")
        if target and target not in _entity_ids(turn):
            return Smell("contradiction", f"INSPECT missing {target}")
    return None
