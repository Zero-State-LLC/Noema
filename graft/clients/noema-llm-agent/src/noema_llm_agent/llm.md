# clients/noema-llm-agent/src/noema_llm_agent/llm.py

- SupportsPropose · class · L12-L13 — class SupportsPropose(Protocol)
- __call__ · method · L13-L13 — def __call__(self, context: dict[str, Any]) -> str
- StaticProposer · class · L25-L30 — class StaticProposer
- __call__ · method · L26-L30 — def __call__(self, context: dict[str, Any]) -> str
- OpenAICompatibleProposer · class · L33-L55 — class OpenAICompatibleProposer
- __init__ · method · L34-L41 — def __init__(self, *, base_url: str, model: str, api_key: str | None = None) -> None
- __call__ · method · L43-L55 — def __call__(self, context: dict[str, Any]) -> str
- make_llm · function · L58-L84 — def make_llm( provider: str = "none", *, base_url: str | None = None, model: str | None = None, api_key: str | None = None, ) -> ProposeFn
