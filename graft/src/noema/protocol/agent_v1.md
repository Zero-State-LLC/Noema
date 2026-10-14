# src/noema/protocol/agent_v1.py

- AgentProtocolV1 · class · L12-L185 — class AgentProtocolV1
- __init__ · method · L15-L16 — def __init__(self, runtime: NoemaRuntime)
- handle · method · L18-L51 — def handle(self, message: dict[str, Any], *, session_id: str | None = None) -> dict[str, Any]
- _hello · method · L53-L73 — def _hello(self, message: dict[str, Any]) -> dict[str, Any]
- _auth · method · L75-L114 — def _auth(self, message: dict[str, Any]) -> dict[str, Any]
- _enter · method · L116-L138 — def _enter(self, message: dict[str, Any], session_id: str) -> dict[str, Any]
- _observe · method · L140-L149 — def _observe(self, message: dict[str, Any], session_id: str) -> dict[str, Any]
- _act · method · L151-L163 — def _act(self, message: dict[str, Any], session_id: str) -> dict[str, Any]
- _error · method · L165-L185 — def _error( self, message: dict[str, Any], code: str, msg: str, *, retryable: bool = False, details: dict | None = None, ) -> dict[str, Any]
