# src/noema/llm/adapter.py

- redacted_context · function · L14-L29 — def redacted_context(context: dict[str, Any]) -> dict[str, Any]
- LlmProposeAdapter · class · L32-L49 — class LlmProposeAdapter
- __init__ · method · L33-L37 — def __init__(self, propose: ProposeFn, *, fallback: str = "WAIT") -> None
- decide · method · L39-L49 — def decide(self, context: dict[str, Any]) -> ActionProposal | None
