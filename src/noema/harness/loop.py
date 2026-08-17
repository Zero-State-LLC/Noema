"""OBSERVE → COMPRESS → DECIDE → VALIDATE → ACT → VERIFY → MEMORY → PACE."""

from __future__ import annotations

import time
from typing import Any, Protocol

from noema.harness.errors import HarnessError
from noema.harness.memory import WorkingMemory
from noema.harness.observe import prepare_context, to_state
from noema.harness.policy import HarnessPolicy
from noema.harness.transport import GatewayClient
from noema.harness.orientation import check_orientation_s0
from noema.harness.debug import DebugAdapter
from noema.harness.report import classify_with_model
from noema.harness.smell import detect_smell
from noema.harness.types import ActionProposal, FailureClass, NoemaState, TurnResult, UnattendedRun
from noema.harness.validate import validate_proposal


class Adapter(Protocol):
    def decide(self, context: dict[str, Any]) -> ActionProposal | None: ...


class CircuitBreaker:
    def __init__(self, max_consecutive_failures: int) -> None:
        self.max_consecutive_failures = max_consecutive_failures
        self.consecutive = 0
        self.tripped = False
        self.reason: str | None = None

    def record_success(self) -> None:
        self.consecutive = 0

    def record_failure(self, reason: str) -> None:
        self.consecutive += 1
        if self.consecutive >= self.max_consecutive_failures:
            self.tripped = True
            self.reason = reason

    def trip(self, reason: str) -> None:
        self.tripped = True
        self.reason = reason


class HeadlessHarness:
    def __init__(
        self,
        client: GatewayClient,
        adapter: Adapter,
        policy: HarnessPolicy | None = None,
        memory: WorkingMemory | None = None,
        *,
        initial_observation: dict[str, Any] | None = None,
        world_status: str | None = None,
        call_model=None,
    ) -> None:
        self.client = client
        self.adapter = adapter
        self.policy = policy or HarnessPolicy()
        self.memory = memory or WorkingMemory()
        self.breaker = CircuitBreaker(self.policy.max_consecutive_failures)
        self._observation = initial_observation
        self.world_status = world_status
        self.state: NoemaState | None = to_state(initial_observation, world_status=world_status) if initial_observation else None
        self.operator_stop = False
        self.call_model = call_model
        self.mode = "play"
        self.last_smell = None
        self.debug_probes: list[str] = []

    def stop(self) -> None:
        self.operator_stop = True
        self.breaker.trip("operator_stop")

    def run_turn(self) -> TurnResult:
        if self.operator_stop or self.breaker.tripped:
            return TurnResult(ok=False, stopped=True, reason=self.breaker.reason or "stopped")
        if self.state is None:
            self.state = to_state({}, world_status=self.world_status)
        context = prepare_context(self.state, self.memory, self.policy)
        try:
            proposal = self.adapter.decide(context)
        except Exception:
            return TurnResult(ok=False, reason="adapter_failure")
        if proposal is None:
            return TurnResult(ok=False, stopped=True, reason="no_proposal")
        try:
            validated = validate_proposal(proposal, self.state, self.policy)
        except HarnessError as exc:
            self.breaker.record_failure(exc.failure_class.value)
            return TurnResult(
                ok=False,
                stopped=self.breaker.tripped,
                reason=self.breaker.reason,
                failure=exc.failure_class,
                proposal=proposal,
            )
        if validated.mutating:
            status = (self.world_status or self.state.world_status or "").upper()
            if status == "PAUSED":
                self.breaker.trip("WORLD_PAUSED")
                return TurnResult(ok=False, stopped=True, failure=FailureClass.WORLD_PAUSED, proposal=proposal)
            if status == "INCIDENT":
                self.breaker.trip("WORLD_INCIDENT")
                return TurnResult(ok=False, stopped=True, failure=FailureClass.WORLD_INCIDENT, proposal=proposal)
        result = self.client.send_command(validated.command, validated.arguments)
        if result.failure == FailureClass.AUTH_REQUIRED and self.policy.stop_on_auth_failure:
            self.breaker.trip("auth_failure")
        if result.failure in {FailureClass.WORLD_INCIDENT, FailureClass.ACTION_REJECTED, FailureClass.SETTLEMENT_FAILURE}:
            if result.failure == FailureClass.WORLD_INCIDENT:
                self.breaker.trip("WORLD_INCIDENT")
            else:
                self.breaker.record_failure(result.failure.value)
        if result.ok:
            self.breaker.record_success()
            self._observation = result.observation or self._observation
            self.world_status = result.world_status or self.world_status
            self.state = to_state(self._observation, last_consequence=(result.observation or {}).get("consequence") if result.observation else None, world_status=self.world_status)
            if self.state.last_consequence:
                self.memory.update(fact=str(self.state.last_consequence), source_sequence=self.state.sequence)
        if self.policy.cooldown_seconds > 0:
            time.sleep(self.policy.cooldown_seconds)
        return TurnResult(
            ok=result.ok,
            stopped=self.breaker.tripped,
            reason=self.breaker.reason,
            failure=None if result.ok else result.failure,
            proposal=proposal,
            result=result,
        )

    def _act(self, proposal: ActionProposal) -> TurnResult:
        saved = self.adapter
        self.adapter = ScriptedOnce(proposal)
        try:
            return self.run_turn()
        finally:
            self.adapter = saved

    def run_unattended(self, max_turns: int = 8, *, enter: bool = True) -> UnattendedRun:
        """ENTER → first OBSERVE (S0) → advertised acts until stop or max_turns."""
        turns: list[TurnResult] = []
        first_obs: dict[str, Any] | None = None
        if enter:
            entered = self._act(ActionProposal(action="ENTER_WORLD"))
            turns.append(entered)
            if not entered.ok:
                return UnattendedRun(
                    turns=turns,
                    first_observe=None,
                    orientation_ok=False,
                    orientation_reason="ENTER_FAILED",
                    stopped=True,
                    reason=entered.reason or (entered.failure.value if entered.failure else "enter_failed"),
                )
        observed = self._act(ActionProposal(action="OBSERVE"))
        turns.append(observed)
        if observed.result and observed.result.observation:
            first_obs = observed.result.observation
        elif self._observation:
            first_obs = self._observation
        orient = check_orientation_s0(first_obs)
        if not orient.ok:
            self.breaker.trip("orientation_s0")
            return UnattendedRun(
                turns=turns,
                first_observe=first_obs,
                orientation_ok=False,
                orientation_reason=orient.reason,
                stopped=True,
                reason="orientation_s0",
            )
        previous_room = ((self.state.location or {}) if self.state else {}).get("room_id")
        previous_room = str(previous_room) if previous_room else None
        while len(turns) < max_turns:
            if self.mode == "debug" and isinstance(self.adapter, DebugAdapter) and self.adapter.remaining() == 0:
                break
            turn = self.run_turn()
            turns.append(turn)
            if self.mode == "debug" and turn.proposal:
                self.debug_probes.append(turn.proposal.action)
            smell = detect_smell(turn, previous_room)
            room_now = ((self.state.location or {}) if self.state else {}).get("room_id")
            if room_now:
                previous_room = str(room_now)
            if smell and self.mode == "play":
                self.last_smell = smell
                self.mode = "debug"
                if smell.kind == "auth":
                    self.breaker.trip("auth_failure")
                    break
                self.adapter = DebugAdapter(turn.proposal)
                if smell.kind == "incident":
                    observed = self._act(ActionProposal(action="OBSERVE"))
                    turns.append(observed)
                    self.debug_probes.append("OBSERVE")
                    self.breaker.trip("WORLD_INCIDENT")
                    break
                continue
            if turn.stopped:
                break
            if self.mode == "play" and not turn.ok:
                break
        if self.mode == "debug":
            self.breaker.trip(self.last_smell.kind if self.last_smell else "debug")
        return UnattendedRun(
            turns=turns,
            first_observe=first_obs,
            orientation_ok=True,
            orientation_reason=None,
            stopped=turns[-1].stopped if turns else True,
            reason=turns[-1].reason if turns else None,
            report=self._build_report(turns),
        )

    def _build_report(self, turns: list[TurnResult]) -> dict[str, Any]:
        last = next((t for t in reversed(turns) if t.proposal), None)
        result = last.result if last else None
        obs = (result.observation if result else None) or {}
        loc = obs.get("location") if isinstance(obs.get("location"), dict) else {}
        err = (result.error if result else None) or {}
        kind = "ok"
        summary = ""
        if self.last_smell:
            kind, summary = classify_with_model(
                {
                    "last_command": last.proposal.action if last and last.proposal else None,
                    "error": err,
                    "smell": self.last_smell.kind,
                    "detail": self.last_smell.detail,
                    "room_id": loc.get("room_id"),
                    "probes": list(self.debug_probes),
                },
                self.call_model,
            )
        return {
            "mode_at_stop": self.mode,
            "last_command": last.proposal.action if last and last.proposal else None,
            "error_code": err.get("code") if self.last_smell and self.last_smell.kind != "contradiction" else None,
            "contradiction": self.last_smell.detail if self.last_smell and self.last_smell.kind == "contradiction" else None,
            "cycle": obs.get("cycle"),
            "sequence": obs.get("sequence"),
            "room_id": loc.get("room_id"),
            "probes": list(self.debug_probes),
            "classification": kind if self.last_smell else "ok",
            "summary": summary,
        }


class ScriptedOnce:
    def __init__(self, proposal: ActionProposal) -> None:
        self._proposal = proposal
        self._used = False

    def decide(self, _context: dict[str, Any]) -> ActionProposal | None:
        if self._used:
            return None
        self._used = True
        return self._proposal
