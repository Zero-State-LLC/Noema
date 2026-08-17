"""Preventive proposal validation. NOEMA remains final authority."""

from __future__ import annotations

from noema.harness.errors import HarnessError
from noema.harness.policy import HarnessPolicy
from noema.harness.types import ActionProposal, FailureClass, NoemaState, ValidatedAction

_DIRECT = {
    "LOOK": ("LOOK", False),
    "OBSERVE": ("OBSERVE", False),
    "WAIT": ("WAIT", False),
    "ENTER_WORLD": ("ENTER_WORLD", True),
    "LEAVE_WORLD": ("LEAVE_WORLD", False),
    "MOVE": ("MOVE", True),
    "INSPECT": ("INSPECT", False),
    "MESSAGE": ("MESSAGE", True),
    "TRADE": ("TRADE", True),
}

_COMMIT = {
    "REPAIR": "REPAIR",
    "HARVEST": "HARVEST",
    "ORG_CREATE": "ORG_CREATE",
    "ORG_MEMBER_ADD": "ORG_MEMBER_ADD",
    "ORG_MEMBER_REMOVE": "ORG_MEMBER_REMOVE",
    "CONTEST": "CONTEST_DECLARE",
    "CONTEST_DECLARE": "CONTEST_DECLARE",
    "CONTEST_DEFEND": "CONTEST_DEFEND",
    "AGREEMENT": "AGREEMENT_FORM",
    "AGREEMENT_FORM": "AGREEMENT_FORM",
    "AGREEMENT_TERMINATE": "AGREEMENT_TERMINATE",
    "ACCESS": "ACCESS_POLICY",
    "ACCESS_POLICY": "ACCESS_POLICY",
}


def _visible_targets(state: NoemaState) -> set[str]:
    found: set[str] = set()
    for ent in state.entities:
        if isinstance(ent, dict) and ent.get("entity_id"):
            found.add(str(ent["entity_id"]))
    loc = state.location or {}
    for exit_ in loc.get("exits") or []:
        if isinstance(exit_, dict):
            if exit_.get("direction"):
                found.add(str(exit_["direction"]))
            if exit_.get("to_room_id"):
                found.add(str(exit_["to_room_id"]))
    for aff in state.affordances:
        if aff.get("target_id"):
            found.add(str(aff["target_id"]))
    return found


def _known(state: NoemaState, action: str) -> bool:
    name = action.upper()
    if name in state.available_actions:
        return True
    if any(str(a.get("action") or a.get("operation") or "").upper() == name for a in state.affordances):
        return True
    if name in {"ENTER_WORLD", "OBSERVE", "LOOK", "WAIT"}:
        return True
    return False


def validate_proposal(
    proposal: ActionProposal,
    state: NoemaState,
    policy: HarnessPolicy,
) -> ValidatedAction:
    action = (proposal.action or "").upper()
    if not action:
        raise HarnessError(FailureClass.INVALID_PROPOSAL, "INVALID_PROPOSAL", "missing action")
    if not policy.permits(action):
        raise HarnessError(FailureClass.INVALID_PROPOSAL, "POLICY_DENIED", f"{action} gated by harness policy")
    if not _known(state, action):
        raise HarnessError(FailureClass.INVALID_PROPOSAL, "INVALID_PROPOSAL", f"{action} is not advertised")
    args = dict(proposal.arguments or {})
    target = proposal.target_id
    if action in _DIRECT:
        command, mutating = _DIRECT[action]
        if action == "MOVE":
            direction = args.get("direction") or target
            if not direction:
                raise HarnessError(FailureClass.INVALID_PROPOSAL, "INVALID_PROPOSAL", "MOVE requires direction")
            if target and target not in _visible_targets(state) and "direction" not in (proposal.arguments or {}):
                # Scripted MOVE with explicit direction argument is allowed during ENTER/LOOK/MOVE smoke
                # when state is empty; once state exists, require a visible exit unless only direction is given.
                if state.available_actions or state.entities or (state.location or {}).get("exits"):
                    if str(direction) not in _visible_targets(state):
                        raise HarnessError(FailureClass.INVALID_PROPOSAL, "INVALID_PROPOSAL", "target not visible")
            args = {**args, "direction": direction}
        elif action == "INSPECT":
            entity_id = args.get("entity_id") or target
            if entity_id:
                if state.entities or state.affordances:
                    if str(entity_id) not in _visible_targets(state):
                        raise HarnessError(FailureClass.INVALID_PROPOSAL, "INVALID_PROPOSAL", "target not visible")
                args = {**args, "entity_id": entity_id}
        return ValidatedAction(command=command, arguments=args, mutating=mutating)
    if action in _COMMIT:
        if target and (state.entities or state.affordances) and str(target) not in _visible_targets(state):
            raise HarnessError(FailureClass.INVALID_PROPOSAL, "INVALID_PROPOSAL", "target not visible")
        operation = _COMMIT[action]
        mapped = {"operation": operation, **args}
        if target and "entity_id" not in mapped:
            mapped["entity_id"] = target
        return ValidatedAction(command="COMMIT", arguments=mapped, mutating=True)
    raise HarnessError(FailureClass.INVALID_PROPOSAL, "INVALID_PROPOSAL", f"unknown action {action}")
