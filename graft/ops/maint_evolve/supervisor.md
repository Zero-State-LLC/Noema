# ops/maint_evolve/supervisor.py

- _write_proposed_reason · function · L15-L18 — def _write_proposed_reason(root: Path, exc: BaseException) -> None
- apply_candidate · function · L21-L38 — def apply_candidate(root: Path, candidate) -> bool
- run_shift · function · L41-L74 — def run_shift( *, root: Path, ready: dict, look: dict, spawn_patrol: bool, digest: dict | None = None, sar: dict | None = None, ) -> dict
- parse_supervisor_args · function · L77-L88 — def parse_supervisor_args(argv: list[str] | None = None) -> argparse.Namespace
- fetch_ready · function · L91-L99 — def fetch_ready(server: str, opener=None) -> dict
- run_supervisor · function · L102-L126 — def run_supervisor( *, argv: list[str] | None = None, ready: dict | None = None, look: dict | None = None, spawn_patrol_cb=None, probe_cb=None, ) -> dict
- main · function · L129-L135 — def main(argv: list[str] | None = None) -> int
