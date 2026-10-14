# src/noema/harness/transport.py

- TokenProvider · class · L15-L16 — class TokenProvider(Protocol)
- reveal · method · L16-L16 — def reveal(self) -> str
- _ipv4_opener · function · L19-L26 — def _ipv4_opener() -> urllib.request.OpenerDirector
- getaddrinfo_ipv4 · function · L22-L23 — def getaddrinfo_ipv4(host, port, family=0, type=0, proto=0, flags=0): # noqa: A002
- default_http · function · L32-L61 — def default_http( method: str, url: str, body: dict | None = None, token: str | None = None, headers: dict[str, str] | None = None, ) -> dict
- classify · function · L64-L87 — def classify(payload: dict[str, Any], http_status: int | None) -> FailureClass | None
- call_http · function · L90-L101 — def call_http( fn: Callable[..., dict[str, Any]], method: str, url: str, body: dict | None, token: str | None, headers: dict[str, str] | None = None, ) -> dict[str, Any]
- GatewayClient · class · L104-L207 — class GatewayClient
- __init__ · method · L105-L123 — def __init__( self, base_url: str, token_provider: TokenProvider, *, http: Callable[..., dict[str, Any]] | None = None, runtime: str = "python-harness", command_path: str = "/v1/command", world_id: str | None = None, admin_token: str | None = None, ) -> None
- send_command · method · L125-L207 — def send_command( self, command: str, arguments: dict[str, Any] | None = None, *, idempotency_key: str | None = None, request_id: str | None = None, retries: int = 0, ) -> CommandResult
