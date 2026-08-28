from __future__ import annotations

import hashlib
import json
import os
import signal
import socket
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

import pytest

import noema.cli.cohort as cohort_module
from noema.cli.cohort import build_report, prepare, run_cohort, verify_cohort


CLIENT_REPO_ENV = "NOEMA_OFFICIAL_CLIENT_REPO"
LOCAL_ADMIN_SECRET = "cohort-local-admin-secret"
LOCAL_SIGNING_SECRET = "cohort-local-signing-secret"
WORLD_ID = "test.hosted-canonical.cohort-e2e"


def _post(base: str, path: str, body: dict, headers: dict[str, str] | None = None) -> dict:
    request = urllib.request.Request(
        base + path,
        data=json.dumps(body).encode("utf-8"),
        headers={"content-type": "application/json", **(headers or {})},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.load(response)


def _free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _wait_for_worker(base: str, process: subprocess.Popen[bytes], log_path: Path) -> None:
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if process.poll() is not None:
            pytest.fail(f"local Worker exited early ({process.returncode}):\n{log_path.read_text(errors='replace')}")
        try:
            with urllib.request.urlopen(base + "/health", timeout=1) as response:
                if response.status == 200:
                    return
        except (OSError, urllib.error.URLError):
            time.sleep(0.1)
    pytest.fail(f"local Worker did not become ready:\n{log_path.read_text(errors='replace')}")


def _client_checkout() -> tuple[Path, Path]:
    raw = os.environ.get(CLIENT_REPO_ENV)
    if not raw:
        pytest.skip(f"set {CLIENT_REPO_ENV} to an official noema-client checkout to run the genuine local E2E")
    checkout = Path(raw).expanduser().resolve()
    executable = checkout / ".venv" / "bin" / "noema"
    if not executable.is_file():
        pytest.skip(f"official client console script missing: {executable}")
    probe = subprocess.run(
        [str(checkout / ".venv" / "bin" / "python"), "-c", "import noema_client; print(noema_client.__file__)"],
        check=True,
        capture_output=True,
        text=True,
    )
    package_file = Path(probe.stdout.strip()).resolve()
    if checkout not in package_file.parents:
        pytest.fail(f"client console environment imports {package_file}, not checkout {checkout}")
    return checkout, executable.resolve()


def _observer_hook(directory: Path) -> None:
    directory.mkdir()
    (directory / "sitecustomize.py").write_text(
        r'''from __future__ import annotations

import hashlib
import json
import os
import pathlib
import sys
import urllib.request

label = os.environ.get("NOEMA_COHORT_LABEL")
if label:
    model_dir = pathlib.Path(os.environ["NOEMA_MODEL_CONTEXT_DIR"])
    history_dir = pathlib.Path(os.environ["NOEMA_ACTION_HISTORY_DIR"])
    model_dir.mkdir(parents=True, exist_ok=True)
    history_dir.mkdir(parents=True, exist_ok=True)

    import noema_client
    from noema_client.adapters.scripted import FirstValidAffordanceAdapter

    original_decide = FirstValidAffordanceAdapter.decide

    def observed_decide(self, context):
        encoded = json.dumps(context, sort_keys=True, separators=(",", ":"), default=str).encode()
        record = {
            "label": label,
            "pid": os.getpid(),
            "package": str(pathlib.Path(noema_client.__file__).resolve()),
            "context_bytes": len(encoded),
            "context_digest": "sha256:" + hashlib.sha256(encoded).hexdigest(),
        }
        (model_dir / "context.json").write_text(json.dumps(record, sort_keys=True))
        return original_decide(self, context)

    FirstValidAffordanceAdapter.decide = observed_decide

    original_open = urllib.request.OpenerDirector.open

    def observed_open(self, request, *args, **kwargs):
        if isinstance(request, urllib.request.Request) and request.full_url.endswith("/v1/operator/test-world/command"):
            body = json.loads((request.data or b"{}").decode())
            record = {
                "label": label,
                "pid": os.getpid(),
                "command": body.get("command"),
                "request_id": body.get("request_id"),
                "idempotency_key": body.get("idempotency_key"),
                "world_id": body.get("world_id"),
            }
            with (history_dir / "commands.jsonl").open("a", encoding="utf-8") as stream:
                stream.write(json.dumps(record, sort_keys=True) + "\n")
        return original_open(self, request, *args, **kwargs)

    urllib.request.OpenerDirector.open = observed_open
''',
        encoding="utf-8",
    )


def _preflight() -> dict:
    return {
        "pins": {"worker_source": "local", "worker_version": "local", "specs_commit": "local"},
        "versions": {
            "runtime": "local",
            "spec": "lca-2",
            "clients": {"controller-a": "local", "controller-b": "local", "controller-c": "local"},
        },
        "worker": {"source_pin": "local", "version_pin": "local"},
        "world": {
            "world_id": WORLD_ID,
            "genesis": "local",
            "seal": "isolated",
            "room": "local",
            "status": "ACTIVE",
        },
        "health": {"status": "ok", "settlement_health": "HEALTHY"},
        "test_evidence": {"worker_tests": "green", "worker_typecheck": "green"},
        "canonical_head": {"sequence": 1, "digest": "sha256:local"},
    }


def test_local_worker_runs_exactly_three_real_official_clients_without_gate_b_claim(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    checkout, client_executable = _client_checkout()
    repository = tmp_path / "clean-repository"
    repository.mkdir()
    subprocess.run(["git", "init", "-q"], cwd=repository, check=True)

    worker_dir = Path(__file__).resolve().parents[1] / "workers" / "noema"
    wrangler = worker_dir / "node_modules" / ".bin" / "wrangler"
    if not wrangler.is_file():
        pytest.skip("Worker dependencies are not installed; run npm ci in workers/noema")

    port = _free_port()
    base = f"http://127.0.0.1:{port}"
    worker_log = tmp_path / "worker.log"
    with worker_log.open("wb") as log:
        worker = subprocess.Popen(
            [
                str(wrangler),
                "dev",
                "--local",
                "--port",
                str(port),
                "--persist-to",
                str(tmp_path / "worker-state"),
                "--var",
                "NOEMA_ENV:local",
                "--var",
                f"TOKEN_SIGNING_SECRET:{LOCAL_SIGNING_SECRET}",
                "--var",
                f"ADMIN_OPERATOR_TOKEN:{LOCAL_ADMIN_SECRET}",
            ],
            cwd=worker_dir,
            stdin=subprocess.DEVNULL,
            stdout=log,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )
    try:
        _wait_for_worker(base, worker, worker_log)
        admin_jwt = _post(base, "/v1/admin/session", {"admin_token": LOCAL_ADMIN_SECRET})["access_token"]

        config = {
            "schema_version": "noema-lca2-cohort-config/1.0",
            "server": base,
            "world_id": WORLD_ID,
            "repository": str(repository),
            "max_log_bytes": 8192,
            "process_timeout_seconds": 30,
            "preflight": _preflight(),
            "participants": [
                {
                    "label": f"controller-{suffix}",
                    "decision_context": f"local-model-{suffix}",
                    "argv": [
                        str(client_executable),
                        "--server",
                        "{server}",
                        "--config-dir",
                        "{credential_dir}",
                        "--transport",
                        "http",
                        "--isolated",
                        "--world-id",
                        "{world_id}",
                        "play",
                        "--max-actions",
                        "1",
                        "--json",
                    ],
                }
                for suffix in "abc"
            ],
        }
        config_path = tmp_path / "cohort.json"
        config_path.write_text(json.dumps(config), encoding="utf-8")
        run_dir = tmp_path / "run"
        prepare(config_path, run_dir, mode="isolated")
        manifest = json.loads((run_dir / "manifest.json").read_text())
        for path_key in (
            "work_dir",
            "config_dir",
            "credential_dir",
            "model_context_dir",
            "action_history_dir",
            "idempotency_dir",
        ):
            assert len({participant["paths"][path_key] for participant in manifest["participants"]}) == 3

        credential_digests: set[str] = set()
        player_ids: set[str] = set()
        controller_ids: set[str] = set()
        for participant in manifest["participants"]:
            label = participant["label"]
            minted = _post(
                base,
                "/v1/admin/controller-token",
                {"handle": f"local-{label}", "controller_type": "agent", "expires_in": 1800},
                {"authorization": f"Bearer {admin_jwt}"},
            )
            credential = {
                "access_token": minted["access_token"],
                "player_id": minted["player_id"],
                "controller_id": minted["controller_id"],
                "controller_type": "agent",
                "server": base,
                "world_id": WORLD_ID,
                "protocol": "agent-protocol/v1",
            }
            path = Path(participant["paths"]["credential_dir"]) / "credential.json"
            path.write_text(json.dumps(credential), encoding="utf-8")
            path.chmod(0o600)
            credential_digests.add(hashlib.sha256(path.read_bytes()).hexdigest())
            player_ids.add(minted["player_id"])
            controller_ids.add(minted["controller_id"])

        assert len(credential_digests) == len(player_ids) == len(controller_ids) == 3

        observer_dir = tmp_path / "observer"
        _observer_hook(observer_dir)
        monkeypatch.setenv("PYTHONPATH", str(observer_dir))
        original_environment = cohort_module._process_environment

        def local_isolated_environment(participant: dict, *, mode: str) -> dict[str, str]:
            env = original_environment(participant, mode=mode)
            env["NOEMA_ADMIN_TOKEN"] = admin_jwt
            return env

        monkeypatch.setattr(cohort_module, "_process_environment", local_isolated_environment)
        code, result = run_cohort(run_dir, mode="isolated")
        assert code == 0
        assert result["status"] == "SIMULATED"

        state = json.loads((run_dir / "state.json").read_text())
        assert len(state["processes"]) == 3
        assert [row["status"] for row in state["processes"]] == ["SUCCEEDED"] * 3

        context_records = []
        histories = []
        for participant in manifest["participants"]:
            paths = participant["paths"]
            context = json.loads((Path(paths["model_context_dir"]) / "context.json").read_text())
            history = [
                json.loads(line)
                for line in (Path(paths["action_history_dir"]) / "commands.jsonl").read_text().splitlines()
            ]
            context_records.append(context)
            histories.append(history)
            assert context["label"] == participant["label"]
            assert checkout in Path(context["package"]).parents
            assert context["context_bytes"] > 0
            assert [row["command"] for row in history[:2]] == ["ENTER_WORLD", "OBSERVE"]
            assert len(history) == 3
            assert history[-1]["command"] not in {None, "ENTER_WORLD", "OBSERVE"}
            assert all(row["label"] == participant["label"] and row["world_id"] == WORLD_ID for row in history)

        assert len({row["pid"] for row in context_records}) == 3
        assert len({row["context_digest"] for row in context_records}) == 3
        assert len({row["request_id"] for history in histories for row in history}) == 9
        assert len({row["idempotency_key"] for history in histories for row in history}) == 9

        verify_code, verification = verify_cohort(run_dir)
        assert verify_code == 1
        assert verification["verdict"] == "NOT_COMPUTABLE"
        assert verification["claim_boundary"]["external_independence"] == "NOT_CLAIMED"
        assert "isolated_or_simulated_run_cannot_complete" in verification["verdict_reasons"]
        report = json.dumps(build_report(run_dir), sort_keys=True)
        assert admin_jwt not in report
        assert all(json.loads((Path(p["paths"]["credential_dir"]) / "credential.json").read_text())["access_token"] not in report for p in manifest["participants"])
    finally:
        if worker.poll() is None:
            os.killpg(worker.pid, signal.SIGTERM)
            try:
                worker.wait(timeout=10)
            except subprocess.TimeoutExpired:
                os.killpg(worker.pid, signal.SIGKILL)
                worker.wait(timeout=5)
