# src/noema/harness/loop.py

- Adapter · class · L22-L30 — class Adapter(Protocol)
- decide · method · L30-L30 — def decide(self, context: dict[str, Any]) -> ActionProposal | None
- CircuitBreaker · class · L33-L51 — class CircuitBreaker
- __init__ · method · L34-L38 — def __init__(self, max_consecutive_failures: int) -> None
- record_success · method · L40-L41 — def record_success(self) -> None
- record_failure · method · L43-L47 — def record_failure(self, reason: str) -> None
- trip · method · L49-L51 — def trip(self, reason: str) -> None
- HeadlessHarness · class · L54-L262 — class HeadlessHarness
- __init__ · method · L55-L78 — def __init__( self, client: GatewayClient, adapter: Adapter | AdapterStrategy, # v3.2.1 accepts the deep AdapterStrategy policy: HarnessPolicy | None = None, memory: WorkingMemory | None = None, *, initial_observation: dict[str, Any] | None = None, world_status: str | None = None, call_model=None, ) -> None
- stop · method · L80-L82 — def stop(self) -> None
- run_turn · method · L84-L139 — def run_turn(self) -> TurnResult
- _act · method · L141-L147 — def _act(self, proposal: ActionProposal) -> TurnResult
- run_unattended · method · L149-L226 — def run_unattended(self, max_turns: int = 8, *, enter: bool = True) -> UnattendedRun
- _build_report · method · L228-L262 — def _build_report(self, turns: list[TurnResult]) -> dict[str, Any]
- ScriptedOnce · class · L265-L274 — class ScriptedOnce
- __init__ · method · L266-L268 — def __init__(self, proposal: ActionProposal) -> None
- decide · method · L270-L274 — def decide(self, _context: dict[str, Any]) -> ActionProposal | None
