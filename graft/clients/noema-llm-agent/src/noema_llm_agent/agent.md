# clients/noema-llm-agent/src/noema_llm_agent/agent.py

- LocalMind · class · L35-L41 — class LocalMind
- __init__ · method · L38-L41 — def __init__(self, propose: ProposeFn) -> None
- NoemaAgent · class · L44-L110 — class NoemaAgent
- __init__ · method · L47-L49 — def __init__(self, client: ProtocolClient, llm: ProposeFn | None = None) -> None
- _parse · method · L51-L72 — def _parse(self, raw: str) -> ActionProposal
- decide · method · L74-L83 — def decide(self, observation: Observation) -> ActionProposal
- start · method · L85-L91 — async def start(self, token: str, *, world_id: str | None = None, manifest: dict[str, Any] | None = None) -> Observation
- step · method · L93-L95 — async def step(self, observation: Observation) -> ActResult
- run · method · L97-L107 — async def run(self, token: str, *, world_id: str | None = None, turns: int = 4) -> list[ActResult]
- close · method · L109-L110 — async def close(self) -> None
