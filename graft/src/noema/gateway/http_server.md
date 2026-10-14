# src/noema/gateway/http_server.py

- _security_headers · function · L34-L42 — def _security_headers(*, html: bool = False) -> dict[str, str]
- _admin_session_cookie · function · L49-L54 — def _admin_session_cookie(session_id: str) -> str
- resolve_admin_seed_path · function · L57-L82 — def resolve_admin_seed_path(raw: str | None, *, cwd: Path | None = None) -> Path
- RequestEntityTooLarge · class · L85-L86 — class RequestEntityTooLarge(Exception)
- InvalidRequest · class · L89-L90 — class InvalidRequest(Exception)
- make_handler · function · L93-L556 — def make_handler(runtime: NoemaRuntime) -> type[BaseHTTPRequestHandler]
- Handler · class · L96-L553 — class Handler(BaseHTTPRequestHandler)
- log_message · method · L97-L98 — def log_message(self, fmt: str, *args: Any) -> None: # quieter tests
- _bearer_token · method · L100-L104 — def _bearer_token(self) -> str | None
- _json · method · L106-L117 — def _json(self, code: int, body: dict[str, Any], *, headers: dict[str, str] | None = None) -> None
- _html · method · L119-L127 — def _html(self, code: int, body: str) -> None
- _read_json · method · L129-L145 — def _read_json(self) -> dict[str, Any]
- _require_admin · method · L147-L200 — def _require_admin(self, candidate: str | None = None) -> str | None
- do_GET · method · L202-L279 — def do_GET(self) -> None: # noqa: N802
- do_POST · method · L281-L553 — def do_POST(self) -> None: # noqa: N802
- serve · function · L559-L562 — def serve(runtime: NoemaRuntime, host: str = "127.0.0.1", port: int = 8080) -> ThreadingHTTPServer
