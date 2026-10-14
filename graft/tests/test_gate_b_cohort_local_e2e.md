# tests/test_gate_b_cohort_local_e2e.py

- _post · function · L26-L34 — def _post(base: str, path: str, body: dict, headers: dict[str, str] | None = None) -> dict
- _free_port · function · L37-L40 — def _free_port() -> int
- _wait_for_worker · function · L43-L54 — def _wait_for_worker(base: str, process: subprocess.Popen[bytes], log_path: Path) -> None
- _client_checkout · function · L57-L74 — def _client_checkout() -> tuple[Path, Path]
- _observer_hook · function · L77-L135 — def _observer_hook(directory: Path) -> None
- _preflight · function · L138-L157 — def _preflight() -> dict
- test_local_worker_runs_exactly_three_real_official_clients_without_gate_b_claim · function · L160-L337 — def test_local_worker_runs_exactly_three_real_official_clients_without_gate_b_claim( tmp_path: Path, monkeypatch: pytest.MonkeyPatch ) -> None
- local_isolated_environment · function · L284-L287 — def local_isolated_environment(participant: dict, *, mode: str) -> dict[str, str]
