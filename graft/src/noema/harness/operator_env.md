# src/noema/harness/operator_env.py

- parse_operator_env · function · L21-L34 — def parse_operator_env(text: str) -> dict[str, str]
- operator_env_paths · function · L37-L45 — def operator_env_paths(cwd: Path | None = None, env: Mapping[str, str] | None = None) -> list[Path]
- tester_env_path · function · L48-L60 — def tester_env_path(cwd: Path | None = None, env: Mapping[str, str] | None = None) -> Path
- load_operator_env · function · L63-L73 — def load_operator_env(cwd: Path | None = None, env: Mapping[str, str] | None = None) -> dict[str, str]
- jwt_unexpired · function · L76-L90 — def jwt_unexpired(token: str, *, now: int | None = None, skew: int = _JWT_REUSE_SKEW) -> bool
- persist_tester_env · function · L93-L97 — def persist_tester_env(player_token: str, admin_jwt: str, path: Path) -> None
- classify_admin_material · function · L100-L109 — def classify_admin_material(raw: str) -> str | None
- IsolatedAttach · class · L113-L116 — class IsolatedAttach
- AttachError · class · L119-L123 — class AttachError(Exception)
- __init__ · method · L120-L123 — def __init__(self, code: str, message: str) -> None
- resolve_isolated_attach · function · L126-L204 — def resolve_isolated_attach( base: str, *, env: Mapping[str, str] | None = None, cwd: Path | None = None, http=None, handle: str = "tester", ) -> IsolatedAttach
- transport · function · L169-L177 — def transport(method, url, body=None, token=None)
