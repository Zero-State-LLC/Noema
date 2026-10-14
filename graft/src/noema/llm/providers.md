# src/noema/llm/providers.py

- StaticProposer · class · L16-L24 — class StaticProposer
- __call__ · method · L19-L24 — def __call__(self, context: dict[str, Any]) -> dict[str, Any]
- OpenAICompatibleProposer · class · L27-L70 — class OpenAICompatibleProposer
- __init__ · method · L28-L39 — def __init__( self, *, base_url: str, model: str, api_key: str | None = None, http_post=None, ) -> None
- __call__ · method · L41-L56 — def __call__(self, context: dict[str, Any]) -> str
- _post · method · L58-L70 — def _post(self, body: dict[str, Any]) -> dict[str, Any]
