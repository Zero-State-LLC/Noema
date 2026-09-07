"""Device receipt boundary tests. No external network, enrollment, or gameplay."""
from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

import pytest

from noema.cli import cohort
from test_gate_b_cohort import config, fake_noema, prepared, write_config


@pytest.fixture
def official_device_credentials(tmp_path, monkeypatch):
    """Execute the pinned release, not a copy of its persistence implementation."""
    checkout = os.environ.get("NOEMA_OFFICIAL_CLIENT_REPO")
    esbuild = os.environ.get("NOEMA_ESBUILD")
    if not checkout or not esbuild:
        pytest.skip("set NOEMA_OFFICIAL_CLIENT_REPO (0.1.21 export) and NOEMA_ESBUILD")
    monkeypatch.syspath_prepend(str(Path(checkout) / "src"))
    from noema_client import __file__ as client_file, __version__
    assert __version__ == "0.1.21"
    assert Path(checkout).resolve() in Path(client_file).resolve().parents
    monkeypatch.delenv("NOEMA_TOKEN", raising=False)
    monkeypatch.delenv("NOEMA_ADMIN_TOKEN", raising=False)
    from noema_client.client import NoemaClient

    root = Path(__file__).resolve().parents[1]
    bundle = tmp_path / "device-fixture.mjs"
    subprocess.run([esbuild, str(root / "tests/fixtures/cohort_device_receipts.ts"),
                    "--bundle", "--platform=node", "--format=esm", f"--outfile={bundle}"],
                   check=True, capture_output=True)
    response = subprocess.run(["node", str(bundle)], check=True, capture_output=True)
    fixture = json.loads(response.stdout)
    assert fixture["vectors"] == [
        ["ctrl.fixture", "7bcaf7fca5d7c67dd6ab1523611dc7e204803188b70f10c10ee087baf431d763"],
        ["ctrl.agent.abc123", "ca3d23060598e1de5ed851bbf9af52c821e8280135b1aca693d1dd19b70f23ea"],
    ]
    assert cohort._digest("ctrl.fixture") == "sha256:366985eaa03875ef2ddea0e3ce8c0e7491e9888c5b86eb6e42440fc9b9eba8d9"
    assert cohort._digest("ctrl.agent.abc123") == "sha256:fa5f3b58a9a8d3da8d688e7e7b98ec6b7ff580745edfb8dfecccc866409bd6e0"
    configuration = config(tmp_path, fake_noema(tmp_path), mode="live")
    # Deliberately unproven baseline stops run_cohort after the real binding
    # preflight, before any client process can spawn or submit gameplay.
    configuration["preflight"]["test_evidence"]["worker_tests"] = "not-run"
    run_dir = tmp_path / "run"
    cohort.prepare(write_config(tmp_path, configuration), run_dir, mode="live")
    manifest = json.loads((run_dir / "manifest.json").read_text())
    inputs = []
    for participant, enrollment in zip(manifest["participants"], fixture["enrollments"], strict=True):
        def http(method, url, body, headers):
            if url.endswith("/.well-known/noema-agent.json"):
                return fixture["discovery"]
            if url.endswith("/v1/auth/device"):
                return enrollment["start"]
            assert url.endswith("/v1/auth/device/token")
            assert body == {"device_code": enrollment["start"]["device_code"]}
            return enrollment["token"]

        directory = Path(participant["paths"]["credential_dir"])
        client = NoemaClient("http://127.0.0.1", config_home=directory, http=http, transport="http")
        client.connect(auto_enter=False)
        persisted = json.loads((directory / "credential.json").read_text())
        assert persisted["controller_id"] == enrollment["token"]["controller_id"]
        # 0.1.21 connect retains start metadata, not poll's distinct Player ID.
        assert persisted["player_id"] is None
        assert persisted["access_token"] == enrollment["token"]["access_token"]
        assert "approval_receipt" not in persisted
        receipt = {key: enrollment["approval"][key] for key in (
            "approved", "enrollment_status", "controller_id", "player_id",
            "approval_receipt", "independent_control_receipt", "controller_binding_digest",
        )}
        for key in ("controller_id", "player_id", "approval_receipt", "independent_control_receipt", "controller_binding_digest"):
            assert receipt[key] == enrollment["token"][key]
        source = run_dir / f"{participant['label']}.device.json"
        source.write_text(json.dumps({"run_id": manifest["run_id"], "label": participant["label"],
                                     "device_receipt": receipt}))
        source.chmod(0o600)
        inputs.append(source)
    return run_dir, manifest, inputs


def test_device_response_release_persistence_to_cohort_approval(official_device_credentials, capsys):
    run_dir, manifest, inputs = official_device_credentials
    for participant, source in zip(manifest["participants"], inputs, strict=True):
        original = json.loads(source.read_text())["device_receipt"]
        assert cohort.main(["cohort", "bind-device-receipt", "--run-dir", str(run_dir),
                            "--label", participant["label"], "--receipt", str(source)]) == 0
        approval = json.loads((run_dir / "approvals" / f"{participant['label']}.json").read_text())
        retained = json.loads((run_dir / "approvals" / f"{participant['label']}.device.json").read_text())
        assert retained["device_receipt"] == original
        assert approval["schema_version"] == cohort.HUMAN_APPROVAL_SCHEMA
        assert approval["controller_binding_digest"] != "sha256:" + original["controller_binding_digest"]
    # Exercise run_cohort's actual credential comparison, then stop at the
    # deliberately blocked baseline. This is not a live/gate acceptance run.
    code, result = cohort.run_cohort(run_dir, mode="live", ack=cohort.LIVE_ACK)
    assert code == 2
    assert result["reasons"] == ["worker_tests_not_green"]
    assert json.loads((run_dir / "human-approval.json").read_text())["verdict"] == "OPEN"
    assert all(p["pid"] is None for p in json.loads((run_dir / "state.json").read_text())["processes"])
    approvals = cohort._load_human_approvals(run_dir, manifest)
    assert approvals["verdict"] == "OPEN"
    for participant, approval in zip(manifest["participants"], approvals["approvals"], strict=True):
        directory = Path(participant["paths"]["credential_dir"])
        assert approval["credential_binding_digest"] == cohort._credential_marker(directory)
        assert approval["controller_binding_digest"] == cohort._credential_controller_binding(directory)
    output = capsys.readouterr()
    assert "access_token" not in output.out + output.err
    assert "eyJ" not in output.out + output.err


def test_distinct_persisted_player_is_not_a_second_controller(official_device_credentials):
    from noema_client.config import load_credential, save_credential

    run_dir, manifest, inputs = official_device_credentials
    participant = manifest["participants"][0]
    directory = Path(participant["paths"]["credential_dir"])
    credential = load_credential(directory)
    credential.player_id = json.loads(inputs[0].read_text())["device_receipt"]["player_id"]
    save_credential(credential, directory)
    cohort.bind_device_receipt(run_dir, label=participant["label"], receipt_path=inputs[0])


@pytest.mark.parametrize("attack", [
    "missing_digest", "wrong_digest", "wrong_player", "wrong_controller", "wrong_run",
    "wrong_label", "missing_receipt", "expired", "denied", "secret", "wrong_claim",
    "missing_credential", "missing_token", "malformed_token", "truncated_token", "empty_signature",
])
def test_device_adapter_fails_closed(official_device_credentials, attack, capsys):
    run_dir, manifest, inputs = official_device_credentials
    source = json.loads(inputs[0].read_text())
    receipt = source["device_receipt"]
    if attack == "missing_digest":
        receipt.pop("controller_binding_digest")
    elif attack == "wrong_digest":
        receipt["controller_binding_digest"] = "0" * 64
    elif attack == "wrong_player":
        receipt["player_id"] = "player.other"
    elif attack == "wrong_controller":
        receipt["controller_id"] = "ctrl.other"
    elif attack == "wrong_run":
        source["run_id"] = "run.other"
    elif attack == "wrong_label":
        source["label"] = "controller-b"
    elif attack == "missing_receipt":
        receipt["approval_receipt"] = ""
    elif attack == "expired":
        receipt["enrollment_status"] = "EXPIRED"
    elif attack == "denied":
        receipt["approved"] = False
    elif attack == "secret":
        receipt["access_token"] = "never-print-this-private-value"
    else:
        credential_path = Path(manifest["participants"][0]["paths"]["credential_dir"]) / "credential.json"
        credential = json.loads(credential_path.read_text())
        if attack == "missing_credential":
            credential_path.unlink()
        else:
            if attack == "wrong_claim":
                credential["controller_id"] = "ctrl.other"
            elif attack == "missing_token":
                credential.pop("access_token")
            elif attack == "truncated_token":
                credential["access_token"] = credential["access_token"].rsplit(".", 1)[0]
            elif attack == "empty_signature":
                credential["access_token"] = credential["access_token"].rsplit(".", 1)[0] + "."
            else:
                credential["access_token"] = "invalid.jwt.payload"
            credential_path.write_text(json.dumps(credential))
    inputs[0].write_text(json.dumps(source))
    assert cohort.main(["cohort", "bind-device-receipt", "--run-dir", str(run_dir),
                        "--label", "controller-a", "--receipt", str(inputs[0])]) == 2
    assert not (run_dir / "approvals/controller-a.json").exists()
    assert not (run_dir / "approvals/controller-a.device.json").exists()
    output = capsys.readouterr()
    assert "never-print-this-private-value" not in output.out + output.err
    assert "eyJ" not in output.out + output.err


def test_device_receipt_replay_does_not_overwrite_evidence(official_device_credentials):
    run_dir, manifest, inputs = official_device_credentials
    cohort.bind_device_receipt(run_dir, label="controller-a", receipt_path=inputs[0])
    paths = [run_dir / "approvals/controller-a.json", run_dir / "approvals/controller-a.device.json"]
    before = [path.read_bytes() for path in paths]
    with pytest.raises(cohort.CohortError, match="replay"):
        cohort.bind_device_receipt(run_dir, label="controller-a", receipt_path=inputs[0])
    assert [path.read_bytes() for path in paths] == before


def test_concurrent_device_receipt_binding_has_one_winner(official_device_credentials):
    from concurrent.futures import ThreadPoolExecutor

    run_dir, manifest, inputs = official_device_credentials

    def bind_once():
        try:
            return cohort.bind_device_receipt(run_dir, label="controller-a", receipt_path=inputs[0])["status"]
        except cohort.CohortError:
            return "REJECTED"

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: bind_once(), range(2)))
    assert sorted(results) == ["BOUND", "REJECTED"]
    for name in ("controller-a.json", "controller-a.device.json"):
        path = run_dir / "approvals" / name
        assert path.stat().st_mode & 0o777 == 0o600
        assert json.loads(path.read_text())["run_id"] == manifest["run_id"]


@pytest.mark.parametrize("key", ["approval_receipt", "independent_control_receipt"])
def test_device_adapter_rejects_duplicate_receipt_references(official_device_credentials, key):
    run_dir, manifest, inputs = official_device_credentials
    cohort.bind_device_receipt(run_dir, label="controller-a", receipt_path=inputs[0])
    first, second = [json.loads(path.read_text()) for path in inputs[:2]]
    second["device_receipt"][key] = first["device_receipt"][key]
    inputs[1].write_text(json.dumps(second))
    with pytest.raises(cohort.CohortError, match="duplicate"):
        cohort.bind_device_receipt(run_dir, label="controller-b", receipt_path=inputs[1])
    assert not (run_dir / "approvals/controller-b.json").exists()


@pytest.mark.parametrize("attack", ["replay_run", "file_changed", "duplicate_controller"])
def test_bound_approvals_fail_closed_at_cohort_preflight(official_device_credentials, attack):
    run_dir, manifest, inputs = official_device_credentials
    for participant, source in zip(manifest["participants"], inputs, strict=True):
        cohort.bind_device_receipt(run_dir, label=participant["label"], receipt_path=source)
    approval_path = run_dir / "approvals/controller-b.json"
    approval = json.loads(approval_path.read_text())
    directory = Path(manifest["participants"][1]["paths"]["credential_dir"])
    credential = directory / "credential.json"
    if attack == "replay_run":
        approval["run_id"] = "run.other"
    elif attack == "file_changed":
        credential.write_text(credential.read_text() + "\n")
    else:
        first = Path(manifest["participants"][0]["paths"]["credential_dir"]) / "credential.json"
        credential.write_bytes(first.read_bytes() + b"\n")
        approval["credential_binding_digest"] = cohort._credential_marker(directory)
        approval["controller_binding_digest"] = cohort._credential_controller_binding(directory)
    approval_path.write_text(json.dumps(approval))
    code, result = cohort.run_cohort(run_dir, mode="live", ack=cohort.LIVE_ACK)
    assert code == 2
    assert result["verdict"] == "REJECTED"
    assert not (run_dir / "human-approval.json").exists()
    assert all(p["pid"] is None for p in json.loads((run_dir / "state.json").read_text())["processes"])


@pytest.fixture
def synthetic_device_input(tmp_path):
    """Always-on local invariants, not release/Worker integration evidence."""
    import base64

    run_dir, manifest = prepared(tmp_path, mode="live")
    claims = {"controller_id": "ctrl.fixture", "player_id": "player.fixture",
              "controller_type": "agent", "amr": "device_enrollment"}
    encoded = base64.urlsafe_b64encode(json.dumps(claims).encode()).decode().rstrip("=")
    directory = Path(manifest["participants"][0]["paths"]["credential_dir"])
    credential = directory / "credential.json"
    credential.write_text(json.dumps({"controller_id": "ctrl.fixture", "access_token": f"e30.{encoded}.fixture"}))
    credential.chmod(0o600)
    source = run_dir / "source.json"
    source.write_text(json.dumps({
        "run_id": manifest["run_id"], "label": "controller-a", "device_receipt": {
            "approved": True, "enrollment_status": "COMPLETE",
            "controller_id": "ctrl.fixture", "player_id": "player.fixture",
            "approval_receipt": "approval." + "A" * 43, "independent_control_receipt": "receipt." + "B" * 43,
            "controller_binding_digest": "7bcaf7fca5d7c67dd6ab1523611dc7e204803188b70f10c10ee087baf431d763",
        },
    }))
    source.chmod(0o600)
    return run_dir, source


def test_missing_device_binding_is_always_rejected(synthetic_device_input):
    run_dir, source = synthetic_device_input
    value = json.loads(source.read_text())
    value["device_receipt"].pop("controller_binding_digest")
    source.write_text(json.dumps(value))
    with pytest.raises(cohort.CohortError, match="complete non-secret"):
        cohort.bind_device_receipt(run_dir, label="controller-a", receipt_path=source)
    assert not (run_dir / "approvals/controller-a.json").exists()


def test_interrupted_sidecar_write_requires_review_not_rebinding(synthetic_device_input):
    run_dir, source = synthetic_device_input
    retained = run_dir / "approvals/controller-a.device.json"
    retained.write_bytes(source.read_bytes())
    retained.chmod(0o600)
    before = retained.read_bytes()
    with pytest.raises(cohort.CohortError, match="replay"):
        cohort.bind_device_receipt(run_dir, label="controller-a", receipt_path=source)
    assert retained.read_bytes() == before
    assert not (run_dir / "approvals/controller-a.json").exists()
