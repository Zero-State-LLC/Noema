# tests/test_runtime_ci_workflow.py

- _run_steps · function · L19-L38 — def _run_steps(workflow: str | None = None) -> list[str]: # Deliberately support only literal inline/block run steps used by this file. # No YAML dependency is needed for this narrow workflow contract.
- test_runtime_ci_executes_checks_and_preserves_failure · function · L47-L81 — def test_runtime_ci_executes_checks_and_preserves_failure(tmp_path: Path, command: str, exit_code: int)
- test_worker_ci_provisions_the_declared_specs_pin · function · L85-L113 — def test_worker_ci_provisions_the_declared_specs_pin(tmp_path: Path, job: str)
- test_python_ci_enables_official_client_boundaries · function · L116-L134 — def test_python_ci_enables_official_client_boundaries()
