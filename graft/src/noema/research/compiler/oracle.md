# src/noema/research/compiler/oracle.py

- BehavioralOracle · class · L12-L79 — class BehavioralOracle
- __init__ · method · L19-L25 — def __init__(self, *, protected_ids: set[str], required_ids: set[str] | None = None)
- fixture_digest · method · L27-L28 — def fixture_digest(self, retained_unit_ids: list[str] | set[str]) -> str
- evaluate · method · L30-L69 — def evaluate( self, retained_unit_ids: list[str] | set[str], *, force: str | None = None, ) -> dict[str, Any]
- summary · method · L71-L79 — def summary(self) -> dict[str, int]
