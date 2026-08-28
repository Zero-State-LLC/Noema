from __future__ import annotations

import json
from pathlib import Path

import importlib.util

_spec = importlib.util.spec_from_file_location("provenance_report", Path(__file__).parents[1] / "scripts" / "provenance_report.py")
_module = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(_module)
build_report = _module.build_report
main = _module.main


def write_json(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value), encoding="utf-8")


def test_report_is_deterministic_redacted_and_preserves_historical_pointer(tmp_path: Path):
    specs = tmp_path / "current-state.v1.yaml"
    specs.write_text("""as_of: 2026-08-25\nevidence_commits:\n  production_implements_specs: old-spec\n  live_worker_version_id: old-worker\n""", encoding="utf-8")
    compat = tmp_path / "spec-compat.json"
    write_json(compat, {"hosted_live": {"worker_version_id": "old-worker", "specs_git": "new-spec", "source_commit": "a" * 40, "version_evidence": {"worker_version_id": "old-worker", "source_commit": "a" * 40, "api_token": "secret"}}})
    version = tmp_path / "version.json"
    write_json(version, {"worker_version_id": "live-worker", "deployed_at": "2026-08-25T00:00:00Z", "world_id": "world"})
    ready = tmp_path / "ready.json"
    write_json(ready, {"world_id": "world", "genesis_id": "genesis"})

    first = build_report(specs, compat, version, ready)
    second = build_report(specs, compat, version, ready)
    assert first == second
    assert first["status"] == "MISMATCH"
    assert first["sources"]["specs_current_state"]["pointers"]["live_worker_version_id"] == "old-worker"
    assert first["sources"]["runtime_spec_compat"]["pointers"]["hosted_live"]["version_evidence"]["api_token"] == "[REDACTED]"
    assert any(m["classification"] == "historical_vs_current_deployment" for m in first["mismatches"])


def test_main_fails_internal_unsupported_worker_source_pair(tmp_path: Path, capsys):
    specs = tmp_path / "s.yaml"
    specs.write_text("production_implements_specs: s\n", encoding="utf-8")
    compat = tmp_path / "c.json"
    write_json(compat, {"hosted_live": {"worker_version_id": "w1", "source_commit": "a" * 40, "version_evidence": {"worker_version_id": "w2", "source_commit": "a" * 40}}})
    version = tmp_path / "v.json"
    write_json(version, {"worker_version_id": "w1", "deployed_at": "2026-01-01T00:00:00Z"})
    ready = tmp_path / "r.json"
    write_json(ready, {"world_id": "w", "genesis_id": "g"})
    assert main(["--specs", str(specs), "--compat", str(compat), "--version", str(version), "--ready", str(ready)]) == 2
    assert "unsupported Worker/source" in capsys.readouterr().err


def test_report_reads_real_nested_current_state_commit_pointers(tmp_path: Path):
    specs = tmp_path / "current-state.v1.yaml"
    specs.write_text(
        """as_of: 2026-08-24
evidence_commits:
  production_alpha_specs: abcdef0
  production_alpha_site: 1234567
  advanced_worker_runtime: fedcba9
""",
        encoding="utf-8",
    )
    compat = tmp_path / "spec-compat.json"
    write_json(compat, {"hosted_live": {
        "worker_version_id": "worker-1",
        "world_id": "world-1",
        "genesis_id": "genesis-1",
        "specs_git": "abcdef0123456789abcdef0123456789abcdef01",
        "source_commit": "0000000000000000000000000000000000000000",
        "version_evidence": {
            "worker_version_id": "worker-1",
            "source_commit": "0000000000000000000000000000000000000000",
        },
    }})
    version = tmp_path / "version.json"
    write_json(version, {"worker_version_id": "worker-1", "world_id": "world-1"})
    ready = tmp_path / "ready.json"
    write_json(ready, {"world": {"world_id": "world-1", "genesis_id": "genesis-1"}})

    report = build_report(specs, compat, version, ready)

    pointers = report["sources"]["specs_current_state"]["pointers"]
    assert pointers["production_alpha_specs"] == "abcdef0"
    assert pointers["advanced_worker_runtime"] == "fedcba9"
    assert not any(m["field"] == "specs_git" for m in report["mismatches"])
    assert any(m["classification"] == "historical_vs_current_runtime" for m in report["mismatches"])
