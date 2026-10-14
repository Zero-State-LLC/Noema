# src/noema/harness/auth.py

- StaticTokenProvider · class · L15-L23 — class StaticTokenProvider
- __init__ · method · L16-L17 — def __init__(self, token: str) -> None
- reveal · method · L19-L20 — def reveal(self) -> str
- __repr__ · method · L22-L23 — def __repr__(self) -> str
- EnvTokenProvider · class · L26-L34 — class EnvTokenProvider
- reveal · method · L27-L31 — def reveal(self) -> str
- __repr__ · method · L33-L34 — def __repr__(self) -> str
- DeviceEnrollmentProvider · class · L37-L113 — class DeviceEnrollmentProvider
- __init__ · method · L40-L57 — def __init__( self, base_url: str, *, runtime: str = "openclaw", http: HttpFn, sleep: Callable[[float], None] | None = None, announce: Callable[[str], None] | None = None, ) -> None
- start · method · L59-L84 — def start(self) -> dict[str, Any]
- poll_until_ready · method · L86-L105 — def poll_until_ready(self) -> None
- reveal · method · L107-L110 — def reveal(self) -> str
- __repr__ · method · L112-L113 — def __repr__(self) -> str
- start_device · function · L116-L124 — def start_device(base: str, runtime: str = "openclaw", http: HttpFn | None = None) -> dict[str, Any]
- poll_device_token · function · L127-L135 — def poll_device_token(base: str, device_code: str, http: HttpFn | None = None) -> dict[str, Any]
- enroll_device · function · L138-L156 — def enroll_device( base: str, runtime: str = "openclaw", http: HttpFn | None = None, sleep=None, announce=None, ) -> str
- resolve_token · function · L159-L169 — def resolve_token( base: str, existing: str | None, runtime: str = "openclaw", http: HttpFn | None = None, sleep=None, announce=None, ) -> str
