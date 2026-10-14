# clients/noema-llm-agent/src/noema_llm_agent/cognition.py

- PrivateCognitionError · class · L29-L31 — class PrivateCognitionError(RuntimeError)
- __init__ · method · L30-L31 — def __init__(self, message: str = "private cognition must not cross the gateway") -> None
- contains_private · function · L34-L48 — def contains_private(value: Any, depth: int = 0, *, in_arguments: bool = False) -> bool
- assert_public · function · L51-L64 — def assert_public(value: Any, *, allow_auth_token: bool = False) -> None
