# src/noema/harness/adapters.py

- ScriptedAdapter · class · L18-L25 — class ScriptedAdapter
- __init__ · method · L19-L20 — def __init__(self, steps: list[ActionProposal]) -> None
- decide · method · L22-L25 — def decide(self, _context: dict[str, Any]) -> ActionProposal | None
- _quiet_room · function · L28-L38 — def _quiet_room(canonical: dict[str, Any]) -> bool
- move_direction · function · L41-L50 — def move_direction(aff: dict[str, Any]) -> str | None
- FirstValidAffordanceAdapter · class · L53-L90 — class FirstValidAffordanceAdapter
- decide · method · L56-L90 — def decide(self, context: dict[str, Any]) -> ActionProposal | None
- AdapterStrategy · class · L102-L108 — class AdapterStrategy(ABC)
- decide · method · L106-L108 — def decide(self, context: dict[str, Any]) -> Optional[ActionProposal]
- ScriptedStrategy · class · L111-L120 — class ScriptedStrategy(AdapterStrategy)
- __init__ · method · L114-L115 — def __init__(self, steps: list[Any]) -> None
- decide · method · L117-L120 — def decide(self, _context: dict[str, Any]) -> Optional[ActionProposal]
- LlmStrategy · class · L123-L139 — class LlmStrategy(AdapterStrategy)
- decide · method · L126-L139 — def decide(self, context: dict[str, Any]) -> Optional[ActionProposal]: # Placeholder: LLM-driven decision logic # In production, this would consult an LLM provider
- DebugStrategy · class · L142-L172 — class DebugStrategy(AdapterStrategy)
- __init__ · method · L148-L160 — def __init__(self, failed: ActionProposal | None = None) -> None
- remaining · method · L162-L163 — def remaining(self) -> int
- decide · method · L165-L172 — def decide(self, _context: dict[str, Any]) -> Optional[ActionProposal]
