# tests/test_mud_agent_semantics_local_e2e.py

- _port · function · L187-L190 — def _port() -> int
- _listening · function · L193-L196 — def _listening(port: int) -> bool
- _group_exists · function · L199-L204 — def _group_exists(pgid: int) -> bool
- _stop_owned_worker · function · L207-L232 — def _stop_owned_worker(worker: subprocess.Popen, ports: tuple[int, int]) -> None
- test_s2_agent_semantics_with_pinned_official_client · function · L238-L433 — def test_s2_agent_semantics_with_pinned_official_client( tmp_path: Path, isolated: bool ) -> None
