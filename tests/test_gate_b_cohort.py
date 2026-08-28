from __future__ import annotations

import hashlib
import json
import subprocess
import threading
import time
from pathlib import Path

import pytest

from noema.cli.cohort import (
    CohortError,
    LIVE_ACK,
    build_report,
    build_parser,
    build_verification,
    classify_receipt,
    cohort_status,
    prepare,
    run_cohort,
    stop_cohort,
    verify_cohort,
)


def clean_repo(path: Path) -> Path:
    path.mkdir(exist_ok=True)
    if not (path / ".git").exists():
        subprocess.run(["git", "init", "-q"], cwd=path, check=True)
    return path


def fake_noema(tmp_path: Path) -> Path:
    binary = tmp_path / "bin" / "noema"
    binary.parent.mkdir(parents=True)
    binary.write_text(
        """#!/usr/bin/env python3
import hashlib
import json
import os
import pathlib
import sys
import time
label = os.environ["NOEMA_COHORT_LABEL"]
def digest(value):
    return "sha256:" + hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
record = {
    "label": label,
    "cwd": os.getcwd(),
    "config": os.environ["NOEMA_CONFIG_DIR"],
    "model": os.environ["NOEMA_MODEL_CONTEXT_DIR"],
    "history": os.environ["NOEMA_ACTION_HISTORY_DIR"],
    "idempotency_dir": os.environ["NOEMA_IDEMPOTENCY_DIR"],
    "namespace": os.environ["NOEMA_IDEMPOTENCY_NAMESPACE"],
    "argv": sys.argv[1:],
}
pathlib.Path("process-context.json").write_text(json.dumps(record, sort_keys=True))
print("access_token=must-not-be-retained")
print("private observation must-not-be-retained", file=sys.stderr)
if os.environ.get("FAKE_SLEEP"):
    time.sleep(float(os.environ["FAKE_SLEEP"]))
if os.environ.get("FAKE_FAIL") == label:
    raise SystemExit(7)
evidence_path = pathlib.Path(os.environ["NOEMA_COHORT_EVIDENCE_FILE"])
evidence_path.parent.mkdir(parents=True, exist_ok=True)
world_id = os.environ["NOEMA_COHORT_WORLD_ID"]
credential = pathlib.Path(os.environ["NOEMA_CONFIG_DIR"]) / "credential.json"
credential_binding = "sha256:" + hashlib.sha256(credential.read_bytes()).hexdigest() if credential.exists() else digest("isolated")
controller_reference = "controller." + label
receipts = [
    {"case": "partial_enrollment", "observed": "BLOCKED", "code": "fake"},
    {"case": "duplicate_enrollment", "observed": "REJECTED", "code": "fake"},
    {"case": "expired_enrollment", "observed": "REJECTED", "code": "fake"},
    {"case": "wrong_world", "observed": "REJECTED", "code": "fake"},
    {"case": "malformed_action", "observed": "REJECTED", "code": "fake"},
    {"case": "unauthorized_action", "observed": "REJECTED", "code": "fake"},
    {"case": "duplicate_action", "observed": "REJECTED", "code": "fake"},
    {"case": "accepted_action", "observed": "COMPLETE", "code": "fake"},
    {"case": "reconnect", "observed": "COMPLETE", "code": "fake"},
]
evidence_path.write_text(json.dumps({
    "schema_version": "noema-lca2-participant-evidence/1.0",
    "claim_status": "OBSERVED",
    "controller_reference": controller_reference,
    "independent_control_receipt": "receipt." + label,
    "credential_binding_digest": credential_binding,
    "controller_binding_digest": digest(controller_reference),
    "contention_evidence_digest": digest("contention." + label),
    "ordering_evidence_digest": digest("ordering." + label),
    "budget_settlement_evidence_digest": digest("budget." + label),
    "acceptance_authority_digest": digest("gate-b-acceptance-authority"),
    "reconnect_tested": True,
    "onboarding_path": "official-noema-cli",
    "client_version": "fake-1",
    "world_id": world_id,
    "receipts": receipts,
}, sort_keys=True))
""",
        encoding="utf-8",
    )
    binary.chmod(0o755)
    return binary


def preflight_source() -> dict:
    return {
        "pins": {"worker_source": "src-1", "worker_version": "worker-1", "specs_commit": "spec-1"},
        "versions": {
            "runtime": "0.12",
            "spec": "lca-2",
            "clients": {"controller-a": "1", "controller-b": "1", "controller-c": "1"},
        },
        "worker": {"source_pin": "src-1", "version_pin": "worker-1"},
        "world": {
            "world_id": "world.perihelion-reach-3",
            "genesis": "genesis.1",
            "seal": "seal.1",
            "room": "room.main",
            "status": "ACTIVE",
        },
        "health": {"status": "ok", "settlement_health": "HEALTHY"},
        "test_evidence": {"worker_tests": "green", "worker_typecheck": "green"},
        "canonical_head": {"sequence": 10, "digest": "sha256:head"},
    }


def config(tmp_path: Path, binary: Path, *, mode: str = "isolated") -> dict:
    server = "http://127.0.0.1:8787" if mode == "isolated" else "https://noema.guru"
    world_id = "test.hosted-canonical.cohort" if mode == "isolated" else "world.perihelion-reach-3"
    isolated = ["--isolated"] if mode == "isolated" else []
    world_binding = ["--world-id", "{world_id}"] if mode == "isolated" else []
    return {
        "schema_version": "noema-lca2-cohort-config/1.0",
        "server": server,
        "world_id": world_id,
        "repository": str(clean_repo(tmp_path / "repo")),
        "max_log_bytes": 4096,
        "process_timeout_seconds": 10,
        "preflight": preflight_source(),
        "participants": [
            {
                "label": f"controller-{suffix}",
                "decision_context": f"decision-{suffix}",
                "argv": [
                    str(binary),
                    "--server",
                    "{server}",
                    "--config-dir",
                    "{credential_dir}",
                    *isolated,
                    *world_binding,
                    "play",
                    "--max-actions",
                    "1",
                ],
            }
            for suffix in "abc"
        ],
    }


def write_config(tmp_path: Path, value: dict) -> Path:
    path = tmp_path / "cohort.json"
    path.write_text(json.dumps(value), encoding="utf-8")
    return path


def prepared(tmp_path: Path, *, mode: str = "isolated") -> tuple[Path, dict]:
    binary = fake_noema(tmp_path)
    value = config(tmp_path, binary, mode=mode)
    run_dir = tmp_path / "run"
    prepare(write_config(tmp_path, value), run_dir, mode=mode)
    return run_dir, json.loads((run_dir / "manifest.json").read_text())


def enable_live_credentials(run_dir: Path, manifest: dict) -> None:
    approvals = run_dir / "approvals"
    approvals.mkdir(exist_ok=True)
    for participant in manifest["participants"]:
        label = participant["label"]
        path = Path(participant["paths"]["credential_dir"]) / "credential.json"
        path.write_text(json.dumps({"access_token": "fake-private-token-" + label}), encoding="utf-8")
        path.chmod(0o600)
        credential_binding = "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()
        controller_reference = "controller." + label
        approval = {
            "schema_version": "noema-lca2-human-approval/1.0",
            "run_id": manifest["run_id"],
            "label": label,
            "approved": True,
            "enrollment_status": "COMPLETE",
            "approval_receipt": "approval." + label,
            "independent_control_receipt": "receipt." + label,
            "credential_binding_digest": credential_binding,
            "controller_binding_digest": "sha256:" + hashlib.sha256(
                json.dumps(controller_reference, sort_keys=True, separators=(",", ":")).encode()
            ).hexdigest(),
        }
        (approvals / f"{label}.json").write_text(json.dumps(approval), encoding="utf-8")


def test_prepare_creates_exactly_three_independent_private_contexts_and_is_idempotent(tmp_path: Path):
    run_dir, manifest = prepared(tmp_path)
    assert len(manifest["participants"]) == 3
    namespaces = {p["idempotency_namespace"] for p in manifest["participants"]}
    argv = {tuple(p["argv"]) for p in manifest["participants"]}
    assert len(namespaces) == len(argv) == 3
    for directory in ("work_dir", "config_dir", "credential_dir", "model_context_dir", "action_history_dir", "idempotency_dir", "log_dir"):
        paths = [Path(p["paths"][directory]) for p in manifest["participants"]]
        assert len(set(paths)) == 3
        assert all(path.is_dir() for path in paths)
    result = prepare(tmp_path / "cohort.json", run_dir, mode="isolated")
    assert result["status"] == "PREPARED"


@pytest.mark.parametrize(
    "mutate, message",
    [
        (lambda value: value.update(participants=value["participants"][:2]), "exactly three"),
        (
            lambda value: value["participants"][1].update(decision_context="decision-a"),
            "decision_context",
        ),
        (
            lambda value: value["participants"][0].update(prompt="private"),
            "private cognition",
        ),
        (
            lambda value: value["participants"][0].update(
                argv=["noema", "--isolated", "playwright", "play"]
            ),
            "browser automation",
        ),
        (
            lambda value: value["participants"][0].update(
                argv=["noema", "--isolated", "connect", "play"]
            ),
            "automate enrollment",
        ),
    ],
)
def test_prepare_rejects_unsafe_or_shared_process_definitions(tmp_path: Path, mutate, message: str):
    binary = fake_noema(tmp_path)
    value = config(tmp_path, binary)
    mutate(value)
    with pytest.raises(CohortError, match=message):
        prepare(write_config(tmp_path, value), tmp_path / "run", mode="isolated")


def test_isolated_categorically_rejects_noema_guru(tmp_path: Path):
    value = config(tmp_path, fake_noema(tmp_path))
    value["server"] = "https://noema.guru"
    with pytest.raises(CohortError, match="categorically cannot target"):
        prepare(write_config(tmp_path, value), tmp_path / "run", mode="isolated")


def test_prepare_rejects_relative_basename_spoof_and_wrong_rendered_server(tmp_path: Path):
    value = config(tmp_path, fake_noema(tmp_path))
    value["participants"][0]["argv"][0] = "spoof/noema"
    with pytest.raises(CohortError, match="absolute executable"):
        prepare(write_config(tmp_path, value), tmp_path / "spoof-run", mode="isolated")

    value = config(tmp_path / "server", fake_noema(tmp_path / "server"), mode="live")
    value["participants"][0]["argv"][2] = "http://127.0.0.1:8787"
    with pytest.raises(CohortError, match="server binding"):
        prepare(write_config(tmp_path / "server", value), tmp_path / "server-run", mode="live")


def test_manifest_edit_after_prepare_fails_integrity_check(tmp_path: Path):
    run_dir, _ = prepared(tmp_path)
    manifest_path = run_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    manifest["server"] = "https://noema.guru"
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    with pytest.raises(CohortError, match="integrity check failed"):
        cohort_status(run_dir)


def test_client_executable_edit_after_prepare_fails_integrity_check(tmp_path: Path):
    binary = fake_noema(tmp_path)
    value = config(tmp_path, binary)
    run_dir = tmp_path / "run"
    prepare(write_config(tmp_path, value), run_dir, mode="isolated")
    binary.write_text("#!/bin/sh\nexit 0\n", encoding="utf-8")
    binary.chmod(0o755)
    with pytest.raises(CohortError, match="client executable integrity check failed"):
        run_cohort(run_dir, mode="isolated")


def test_prepare_rejects_duplicate_rendered_argv_and_shared_environment_source(tmp_path: Path):
    binary = fake_noema(tmp_path)
    value = config(tmp_path, binary)
    for participant in value["participants"]:
        participant["argv"] = [str(binary), "--server", "{server}", "--isolated", "play"]
    with pytest.raises(CohortError, match="independent rendered argv"):
        prepare(write_config(tmp_path, value), tmp_path / "run", mode="isolated")

    value = config(tmp_path, binary)
    for participant in value["participants"]:
        participant["env_from"] = {"MODEL_API_KEY": "SHARED_MODEL_KEY"}
    with pytest.raises(CohortError, match="source variables must be independent"):
        prepare(write_config(tmp_path, value), tmp_path / "run-2", mode="isolated")


def test_mode_guards_fail_closed(tmp_path: Path):
    binary = fake_noema(tmp_path)
    value = config(tmp_path, binary)
    value["world_id"] = "world.perihelion-reach-3"
    with pytest.raises(CohortError, match="test.hosted-canonical"):
        prepare(write_config(tmp_path, value), tmp_path / "run", mode="isolated")

    value = config(tmp_path, binary, mode="live")
    value["server"] = "https://preview.example"
    with pytest.raises(CohortError, match="pinned to https://noema.guru"):
        prepare(write_config(tmp_path, value), tmp_path / "run-live", mode="live")

    value = config(tmp_path, binary, mode="live")
    value["participants"][0]["argv"][5:5] = ["--world-id", "world.perihelion-reach-3"]
    with pytest.raises(CohortError, match="omit --world-id"):
        prepare(write_config(tmp_path, value), tmp_path / "run-live-world", mode="live")

    value = config(tmp_path, binary)
    value["participants"][0]["env_from"] = {"NOEMA_ADMIN_TOKEN": "CONTROLLER_A_ADMIN_TOKEN"}
    with pytest.raises(CohortError, match="admin, service-role"):
        prepare(write_config(tmp_path, value), tmp_path / "run-privileged", mode="isolated")


def test_cli_has_required_noema_lca_cohort_commands():
    parser = build_parser()
    assert parser.parse_args([
        "cohort", "prepare", "--mode", "isolated", "--config", "/tmp/config", "--run-dir", "/tmp/run"
    ]).cohort_command == "prepare"
    assert parser.parse_args(["cohort", "run", "isolated", "--run-dir", "/tmp/run"]).run_mode == "isolated"
    assert parser.parse_args([
        "cohort", "run", "live", "--run-dir", "/tmp/run", "--ack", LIVE_ACK
    ]).run_mode == "live"
    for command in ("status", "stop", "verify", "report"):
        assert parser.parse_args(["cohort", command, "--run-dir", "/tmp/run"]).cohort_command == command


def test_live_run_pauses_for_exact_ack_human_approval_and_private_credentials(tmp_path: Path):
    run_dir, manifest = prepared(tmp_path, mode="live")
    code, result = run_cohort(run_dir, mode="live", ack="wrong")
    assert code == 3
    assert result["status"] == "AWAITING_HUMAN_APPROVAL"
    assert sorted(result["missing_credential_labels"]) == ["controller-a", "controller-b", "controller-c"]
    assert all(process["pid"] is None for process in json.loads((run_dir / "state.json").read_text())["processes"])

    enable_live_credentials(run_dir, manifest)
    code, result = run_cohort(run_dir, mode="live", ack="wrong")
    assert code == 3
    assert result["required_ack"] == LIVE_ACK


def test_isolated_end_to_end_runs_three_processes_and_never_completes(tmp_path: Path):
    run_dir, manifest = prepared(tmp_path)
    code, result = run_cohort(run_dir, mode="isolated")
    assert code == 0
    assert result["status"] == "SIMULATED"

    state = json.loads((run_dir / "state.json").read_text())
    assert [p["status"] for p in state["processes"]] == ["SUCCEEDED"] * 3
    contexts = []
    for participant in manifest["participants"]:
        context = json.loads((Path(participant["paths"]["work_dir"]) / "process-context.json").read_text())
        contexts.append(context)
        log_path = Path(participant["paths"]["log_dir"]) / "process.json"
        assert log_path.stat().st_size <= manifest["max_log_bytes"]
        log = json.loads(log_path.read_text())
        assert log["content_retained"] is False
        assert "must-not-be-retained" not in log_path.read_text()
    assert len({row["cwd"] for row in contexts}) == 3
    assert len({row["config"] for row in contexts}) == 3
    assert len({row["model"] for row in contexts}) == 3
    assert len({row["history"] for row in contexts}) == 3
    assert len({row["idempotency_dir"] for row in contexts}) == 3
    assert len({row["namespace"] for row in contexts}) == 3

    verify_code, verification = verify_cohort(run_dir)
    assert verify_code == 1
    assert verification["verdict"] == "NOT_COMPUTABLE"
    assert "isolated_or_simulated_run_cannot_complete" in verification["verdict_reasons"]
    assert verification["claim_boundary"]["external_independence"] == "NOT_CLAIMED"
    first = build_report(run_dir)
    second = build_report(run_dir)
    assert first == second
    assert "fake-private-token" not in json.dumps(first)
    assert "must-not-be-retained" not in json.dumps(first)


def test_process_crash_is_classified_without_restart(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    binary = fake_noema(tmp_path)
    value = config(tmp_path, binary)
    value["participants"][1]["env_from"] = {"FAKE_FAIL": "FAIL_A"}
    run_dir = tmp_path / "run"
    prepare(write_config(tmp_path, value), run_dir, mode="isolated")
    monkeypatch.setenv("FAIL_A", "controller-b")
    code, result = run_cohort(run_dir, mode="isolated")
    assert code == 1
    assert result["status"] == "FAILED"
    state = json.loads((run_dir / "state.json").read_text())
    assert [p["status"] for p in state["processes"]].count("CRASHED") == 1
    assert state["reason"] == "participant_process_crashed"
    assert build_verification(run_dir)["verdict"] == "REJECTED"

    monkeypatch.setenv("FAIL_A", "none")
    reconnect_code, reconnect = run_cohort(run_dir, mode="isolated")
    assert reconnect_code == 0
    assert reconnect["status"] == "SIMULATED"
    assert [p["status"] for p in json.loads((run_dir / "state.json").read_text())["processes"]] == [
        "SUCCEEDED",
        "SUCCEEDED",
        "SUCCEEDED",
    ]


def test_stop_cancels_all_running_process_groups(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    binary = fake_noema(tmp_path)
    value = config(tmp_path, binary)
    for suffix in "abc":
        monkeypatch.setenv(f"SLEEP_{suffix.upper()}", "5")
    for participant, suffix in zip(value["participants"], "abc", strict=True):
        participant["env_from"] = {"FAKE_SLEEP": f"SLEEP_{suffix.upper()}"}
    run_dir = tmp_path / "run"
    prepare(write_config(tmp_path, value), run_dir, mode="isolated")

    outcome: dict = {}

    def target() -> None:
        outcome["value"] = run_cohort(run_dir, mode="isolated")

    thread = threading.Thread(target=target)
    thread.start()
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        if cohort_status(run_dir)["status"] == "RUNNING":
            break
        time.sleep(0.02)
    stopped = stop_cohort(run_dir, grace_seconds=0.1)
    thread.join(timeout=5)
    assert not thread.is_alive()
    assert stopped["cancellation_requested"] is True
    assert outcome["value"][0] == 130
    assert outcome["value"][1]["status"] == "CANCELLED"


def test_fake_live_run_only_completes_with_observed_distinct_receipts_and_open_preflight(tmp_path: Path):
    run_dir, manifest = prepared(tmp_path, mode="live")
    enable_live_credentials(run_dir, manifest)
    code, result = run_cohort(run_dir, mode="live", ack=LIVE_ACK)
    assert code == 0
    assert result["status"] == "SUCCEEDED"
    verify_code, verification = verify_cohort(run_dir)
    assert verify_code == 0
    assert verification["verdict"] == "COMPLETE"
    assert verification["preflight"]["verdict"] == "OPEN"
    rendered_report = json.dumps(build_report(run_dir), sort_keys=True)
    assert "receipt.controller-a" not in rendered_report
    assert "independent_control_receipt_digest" in rendered_report

    evidence = Path(manifest["participants"][2]["paths"]["evidence_dir"]) / "participant.json"
    row = json.loads(evidence.read_text())
    row["independent_control_receipt"] = "receipt.controller-a"
    evidence.write_text(json.dumps(row), encoding="utf-8")
    blocked = build_verification(run_dir)
    assert blocked["verdict"] == "REJECTED"
    assert "three_distinct_external_independence_receipts_required" in blocked["verdict_reasons"]



@pytest.mark.parametrize(
    ("case", "status"),
    [
        ("partial_enrollment", "BLOCKED"),
        ("duplicate_enrollment", "REJECTED"),
        ("expired_enrollment", "REJECTED"),
        ("wrong_world", "REJECTED"),
        ("malformed_action", "REJECTED"),
        ("unauthorized_action", "REJECTED"),
        ("duplicate_action", "REJECTED"),
    ],
)
def test_receipt_classifier_uses_only_allowed_fail_closed_statuses(case: str, status: str):
    assert classify_receipt({"case": case, "observed": status, "code": "x"}) == {
        "case": case,
        "status": status,
        "matched": True,
        "code": "x",
    }
    mismatch = classify_receipt({"case": "accepted_action", "observed": "OPEN", "code": "x"})
    assert mismatch["status"] == "COMPLETE"
    assert mismatch["matched"] is False
    assert classify_receipt({"case": "unknown", "observed": "COMPLETE"})["status"] == "REJECTED"


def test_critical_preflight_failure_rejects_before_process_spawn(tmp_path: Path):
    run_dir, manifest = prepared(tmp_path)
    (Path(manifest["repository"]) / "dirty").write_text("x", encoding="utf-8")
    code, result = run_cohort(run_dir, mode="isolated")
    assert code == 2
    assert result["verdict"] == "REJECTED"
    assert "repository_dirty" in result["reasons"]
    assert not any(
        (Path(participant["paths"]["work_dir"]) / "process-context.json").exists()
        for participant in manifest["participants"]
    )


@pytest.mark.parametrize(
    ("mutate", "reason"),
    [
        (lambda value: value["preflight"]["health"].update(status="INCIDENT"), "world_blocked"),
        (lambda value: value["preflight"]["pins"].pop("specs_commit"), "pins_missing_or_disagree"),
        (lambda value: value["preflight"].update(canonical_head={"sequence": 10}), "canonical_head_incomplete"),
    ],
)
def test_preflight_health_pin_and_head_fail_closed(tmp_path: Path, mutate, reason: str):
    binary = fake_noema(tmp_path)
    value = config(tmp_path, binary)
    mutate(value)
    run_dir = tmp_path / "run"
    prepare(write_config(tmp_path, value), run_dir, mode="isolated")
    code, result = run_cohort(run_dir, mode="isolated")
    assert code == 2
    assert result["verdict"] == "REJECTED"
    assert reason in result["reasons"]


def test_live_rejects_shared_credentials_and_blocks_partial_approval(tmp_path: Path):
    run_dir, manifest = prepared(tmp_path, mode="live")
    enable_live_credentials(run_dir, manifest)
    first_credential = Path(manifest["participants"][0]["paths"]["credential_dir"]) / "credential.json"
    for participant in manifest["participants"][1:]:
        credential = Path(participant["paths"]["credential_dir"]) / "credential.json"
        credential.write_bytes(first_credential.read_bytes())
        credential.chmod(0o600)
    code, result = run_cohort(run_dir, mode="live", ack=LIVE_ACK)
    assert code == 2
    assert result["verdict"] == "REJECTED"
    assert result["shared_credentials"] is True

    run_dir, manifest = prepared(tmp_path / "partial", mode="live")
    enable_live_credentials(run_dir, manifest)
    approval = run_dir / "approvals" / "controller-b.json"
    row = json.loads(approval.read_text())
    row["enrollment_status"] = "PARTIAL"
    approval.write_text(json.dumps(row), encoding="utf-8")
    code, result = run_cohort(run_dir, mode="live", ack=LIVE_ACK)
    assert code == 3
    assert result["verdict"] == "BLOCKED"
    assert "controller-b:partial_enrollment" in result["approval_reasons"]


@pytest.mark.parametrize(("status", "approved"), [("DUPLICATE", True), ("EXPIRED", True), ("DUPLICATE", False), ("EXPIRED", False)])
def test_live_rejects_duplicate_or_expired_enrollment_receipts(tmp_path: Path, status: str, approved: bool):
    run_dir, manifest = prepared(tmp_path, mode="live")
    enable_live_credentials(run_dir, manifest)
    approval = run_dir / "approvals" / "controller-b.json"
    row = json.loads(approval.read_text())
    row["enrollment_status"] = status
    row["approved"] = approved
    approval.write_text(json.dumps(row), encoding="utf-8")
    code, result = run_cohort(run_dir, mode="live", ack=LIVE_ACK)
    assert code == 2
    assert result["verdict"] == "REJECTED"
    assert f"controller-b:{status.lower()}_enrollment" in result["approval_reasons"]


def test_live_rejects_approval_binding_mismatch(tmp_path: Path):
    run_dir, manifest = prepared(tmp_path, mode="live")
    enable_live_credentials(run_dir, manifest)
    approval = run_dir / "approvals" / "controller-b.json"
    row = json.loads(approval.read_text())
    row["credential_binding_digest"] = "sha256:" + "0" * 64
    approval.write_text(json.dumps(row), encoding="utf-8")
    code, result = run_cohort(run_dir, mode="live", ack=LIVE_ACK)
    assert code == 2
    assert "controller-b:credential_binding_mismatch" in result["approval_reasons"]


@pytest.mark.parametrize(
    "field",
    ["contention_evidence_digest", "ordering_evidence_digest", "budget_settlement_evidence_digest", "acceptance_authority_digest"],
)
def test_live_complete_requires_acceptance_authority_evidence(tmp_path: Path, field: str):
    run_dir, manifest = prepared(tmp_path, mode="live")
    enable_live_credentials(run_dir, manifest)
    run_cohort(run_dir, mode="live", ack=LIVE_ACK)
    evidence = Path(manifest["participants"][0]["paths"]["evidence_dir"]) / "participant.json"
    row = json.loads(evidence.read_text())
    row.pop(field)
    evidence.write_text(json.dumps(row), encoding="utf-8")
    verification = build_verification(run_dir)
    assert verification["verdict"] == "BLOCKED"
    assert f"controller-a:{field}_missing_or_invalid" in verification["verdict_reasons"]


def test_live_rejects_duplicate_human_approval_receipts(tmp_path: Path):
    run_dir, manifest = prepared(tmp_path, mode="live")
    enable_live_credentials(run_dir, manifest)
    first = json.loads((run_dir / "approvals" / "controller-a.json").read_text())
    second_path = run_dir / "approvals" / "controller-b.json"
    second = json.loads(second_path.read_text())
    second["approval_receipt"] = first["approval_receipt"]
    second_path.write_text(json.dumps(second), encoding="utf-8")
    code, result = run_cohort(run_dir, mode="live", ack=LIVE_ACK)
    assert code == 2
    assert result["verdict"] == "REJECTED"
    assert "duplicate_human_or_independence_receipt" in result["approval_reasons"]


def test_live_verification_blocks_missing_negative_case_and_rejects_mismatch(tmp_path: Path):
    run_dir, manifest = prepared(tmp_path, mode="live")
    enable_live_credentials(run_dir, manifest)
    run_cohort(run_dir, mode="live", ack=LIVE_ACK)
    evidence_paths = [
        Path(participant["paths"]["evidence_dir"]) / "participant.json"
        for participant in manifest["participants"]
    ]
    for evidence in evidence_paths:
        row = json.loads(evidence.read_text())
        row["receipts"] = [receipt for receipt in row["receipts"] if receipt["case"] != "wrong_world"]
        evidence.write_text(json.dumps(row), encoding="utf-8")
    blocked = build_verification(run_dir)
    assert blocked["verdict"] == "BLOCKED"
    assert "negative_receipt_missing:wrong_world" in blocked["verdict_reasons"]

    evidence = evidence_paths[0]
    row = json.loads(evidence.read_text())
    row["receipts"].append({"case": "wrong_world", "observed": "OPEN", "code": "fake"})
    evidence.write_text(json.dumps(row), encoding="utf-8")
    rejected = build_verification(run_dir)
    assert rejected["verdict"] == "REJECTED"
    assert "controller-a:receipt_classification_mismatch" in rejected["verdict_reasons"]


def test_invalid_or_private_participant_evidence_blocks_and_is_not_projected(tmp_path: Path):
    run_dir, manifest = prepared(tmp_path, mode="live")
    enable_live_credentials(run_dir, manifest)
    run_cohort(run_dir, mode="live", ack=LIVE_ACK)
    evidence = Path(manifest["participants"][0]["paths"]["evidence_dir"]) / "participant.json"
    row = json.loads(evidence.read_text())
    row["private_observation"] = "hidden"
    evidence.write_text(json.dumps(row), encoding="utf-8")
    verification = build_verification(run_dir)
    assert verification["verdict"] == "REJECTED"
    assert "controller-a:participant_evidence_invalid" in verification["verdict_reasons"]
    assert verification["participants"][0]["evidence"] is None
