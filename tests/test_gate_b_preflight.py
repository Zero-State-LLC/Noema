from __future__ import annotations

import subprocess

from noema.cli.preflight import build_preflight


def clean_repo(tmp_path):
    subprocess.run(["git", "init", "-q"], cwd=tmp_path, check=True)
    return tmp_path


def candidate(**overrides):
    value = {
        "pins": {"worker_source": "src-1", "worker_version": "worker-1", "specs_commit": "spec-1"},
        "versions": {"runtime": "0.12", "spec": "lca-2", "clients": {"controller-a": "1", "controller-b": "1", "controller-c": "1"}},
        "worker": {"source_pin": "src-1", "version_pin": "worker-1"},
        "world": {"world_id": "world.perihelion", "genesis": "genesis.1", "seal": "seal.1", "room": "room.main", "status": "ACTIVE"},
        "health": {"status": "ok", "settlement_health": "HEALTHY"},
        "test_evidence": {"worker_tests": "green", "worker_typecheck": "green"},
        "participants": [{"label": f"controller-{x}", "independent_control_receipt": "receipt-{x}", "reconnect_tested": True} for x in "abc"],
        "operator_receipts": [{"label": "controller-a", "approved": True}],
        "canonical_head": {"sequence": 1, "digest": "sha256:1"},
    }
    value.update(overrides)
    return value


def test_preflight_is_deterministic_and_open_when_all_gates_pass(tmp_path):
    repo = clean_repo(tmp_path)
    first = build_preflight(candidate(), repository=repo)
    second = build_preflight(candidate(), repository=repo)
    assert first == second
    assert first["verdict"] == "OPEN"
    assert first["run_id"].startswith("run.lca2.")


def test_preflight_blocks_missing_population_and_approval(tmp_path):
    result = build_preflight(candidate(participants=[], operator_receipts=[]), repository=clean_repo(tmp_path))
    assert result["verdict"] == "BLOCKED"
    assert "fewer_than_three_independent_participant_receipts" in result["verdict_reasons"]
    assert "enrollment_approval_evidence_absent" in result["verdict_reasons"]


def test_preflight_redacts_secrets_and_blocks_unhealthy_worker(tmp_path):
    value = candidate(test_evidence={"worker_tests": "failed", "worker_typecheck": "green"})
    value["operator_token"] = "do-not-print"
    value["email"] = "person@example.com"
    result = build_preflight(value, repository=clean_repo(tmp_path))
    assert result["verdict"] == "BLOCKED"
    assert "worker_tests_not_green" in result["verdict_reasons"]
    assert "do-not-print" not in str(result)
    assert "person@example.com" not in str(result)


def test_preflight_blocks_incident_world_and_dirty_repository(tmp_path):
    (tmp_path / "untracked").write_text("x")
    result = build_preflight(candidate(world={"status": "INCIDENT"}), repository=tmp_path)
    assert result["verdict"] == "BLOCKED"
    assert "world_blocked" in result["verdict_reasons"]
    assert "repository_dirty" in result["verdict_reasons"]
