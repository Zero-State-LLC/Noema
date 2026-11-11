"""S2 semantic equivalence against real local workerd and the pinned official client.

No cohort, provider, hosted world, human text grammar, WAIT, or TRACES policy.
The second principal exists only to test presence and private-message boundaries.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import secrets
import shutil
import signal
import socket
import subprocess
import time
import urllib.error
import urllib.request

import pytest


CLIENT_PIN = "0a20e2e94b087d3cdc6da7e8b46a67f008fe80a3"

# Executed by the installed client's interpreter, not an in-repo consumer copy.
CLIENT_CHECK = r"""
import importlib.metadata
import json
from pathlib import Path
import sys
import urllib.request

import noema_client
from noema_client.client import NoemaClient
from noema_client.errors import NoemaActionRejected
from noema_client.types import ActionProposal

cfg = json.load(sys.stdin)
assert Path(cfg["checkout"]) in Path(noema_client.__file__).resolve().parents
assert importlib.metadata.version("noema-client") == "0.1.21"
secrets = [cfg["admin_secret"], cfg["signing"]]
def post(path, body, token=None):
    headers = {"content-type": "application/json"}
    if token:
        headers["authorization"] = "Bearer " + token
    req = urllib.request.Request(cfg["base"] + path, data=json.dumps(body).encode(), headers=headers)
    with urllib.request.urlopen(req, timeout=10) as response:
        return json.load(response)

admin = post("/v1/admin/session", {"admin_token": cfg["admin_secret"]})["access_token"]
secrets.append(admin)
clients = []
ids = []
checks = []
pressure_observations = []
def equivalent(client):
    obs = client.observation
    raw = obs.raw
    ctx = client.model_context()
    canonical = ctx["canonical"]
    assert "play_text" not in ctx and "play_text" not in canonical
    loc = canonical["location"]
    assert loc == raw["location"]
    assert loc["name"] and loc["description"] and loc["exits"]
    assert canonical["entities"] == loc["entities"]
    if "pressure" in raw:
        assert loc["condition"] == raw["pressure"]
        if raw["pressure"]:
            assert isinstance(loc["condition"], str) and loc["condition"].strip()
            pressure_observations.append(loc["room_id"])
    assert set(canonical["resources"]) == {"attention", "compute", "energy", "influence", "storage"}
    assert canonical["resources"] == raw["budgets"]
    assert canonical["players_here"] == raw["players_here"]
    assert canonical["self"] not in {p["player_id"] for p in canonical["players_here"]}
    assert canonical["available_actions"] == raw["available_actions"]
    assert canonical["affordances"] == raw["affordances"]
    assert canonical["affordances"] and "MOVE" in canonical["available_actions"]
    assert canonical["last_consequence"] == raw.get("consequence")
    blob = json.dumps(ctx, sort_keys=True)
    serialized = json.dumps(raw, sort_keys=True)
    assert all(secret not in blob and secret not in serialized for secret in secrets)
    assert "access_token" not in blob and "admin_token" not in blob
    return ctx

try:
    for suffix in ("a", "b"):
        minted = post("/v1/admin/controller-token", {
            "handle": "semantic-" + suffix, "controller_type": "agent", "expires_in": 1800,
        }, admin)
        secrets.append(minted["access_token"])
        ids.append(minted["player_id"])
        home = Path(cfg["root"]) / suffix
        home.mkdir(mode=0o700)
        credential = {k: minted[k] for k in ("access_token", "player_id", "controller_id")}
        credential.update(controller_type="agent", server=cfg["base"], world_id=cfg["world"], protocol="agent-protocol/v1")
        path = home / "credential.json"
        path.write_text(json.dumps(credential))
        path.chmod(0o600)
        client = NoemaClient(server=cfg["base"], isolated=cfg["isolated"], world_id=cfg["world"],
                             config_home=home, admin_token=admin if cfg["isolated"] else None, transport="http")
        clients.append(client)
        client.connect()
        assert client.session.transport == "http"
        assert client.session.seal_sent is (not cfg["isolated"])
        client.observe()
    assert ids[0] != ids[1]
    a, b = clients
    a.observe()
    initial = equivalent(a)
    assert initial["canonical"]["entities"], "entry seed must expose real entities"
    equivalent(b)
    assert {p["player_id"] for p in initial["canonical"]["players_here"]} == {ids[1]}
    checks.append("place/entities/exits/five budgets/actions/raw structured affordances/secret exclusion")
    marker = "private-semantic-message-" + Path(cfg["root"]).name
    sent = a.act(ActionProposal(action="MESSAGE", target_id=ids[0], arguments={"text": marker}))
    assert sent.ok, "self MESSAGE rejected"
    a.observe()
    assert marker in json.dumps(equivalent(a))
    b.observe()
    assert marker not in json.dumps(equivalent(b))
    with urllib.request.urlopen(cfg["base"] + "/v1/watch/live", timeout=10) as response:
        watch = json.load(response)
    if cfg["isolated"]:
        assert watch["world_id"] == cfg["watch_world"] != cfg["world"]
        checks.append("NOTCOVERED: same-world public WATCH privacy on isolated route; WATCH uses a different world")
    else:
        assert watch["world_id"] == cfg["world"]
        assert marker not in json.dumps(watch)
        checks.append("same-world public WATCH excludes the private message")
    assert all(secret not in json.dumps(watch) for secret in secrets)
    checks.append("self MESSAGE in private model context, absent other same-world principal")
    a.observe()
    old_room = a.observation.location["room_id"]
    moves = [aff for aff in a.observation.raw["affordances"] if aff["action"] == "MOVE"]
    assert moves, "real seed must advertise MOVE"
    direction = a.observation.location["exits"][0]["direction"]
    proposal = ActionProposal(action="MOVE", arguments={"direction": direction})
    moved = a.act(proposal, idempotency_key="semantic-move", request_id="semantic-move")
    assert moved.ok, "advertised MOVE rejected"
    moved_context = equivalent(a)
    assert moved_context["canonical"]["location"]["room_id"] != old_room
    assert moved_context["canonical"]["last_consequence"] == moved.observation["consequence"]
    assert moved_context["canonical"]["last_consequence"]
    # Always exercise the public API, including its deterministic rejection of
    # a direction no longer visible after MOVE. Never silently skip the call.
    exits = a.observation.location["exits"]
    still_visible = direction in {exit["direction"] for exit in exits}
    before_replay = a.observe()
    try:
        replay = a.act(proposal, idempotency_key="semantic-move", request_id="semantic-move")
    except NoemaActionRejected as exc:
        assert not still_visible
        assert exc.code == "INVALID_PROPOSAL"
        replay_outcome = "client_rejected_INVALID_PROPOSAL"
        checks.append("public client MOVE replay deterministically rejected: INVALID_PROPOSAL (direction no longer visible)")
        checks.append("NOTCOVERED: server idempotent MOVE replay; public client rejected before transport")
    else:
        assert still_visible
        assert replay.ok and replay.observation == moved.observation
        replay_outcome = "server_replayed_identical_observation"
        checks.append("public client idempotent MOVE replay")
    a.observe()
    assert a.observation.location["room_id"] == before_replay.location["room_id"]
    assert a.observation.sequence == before_replay.sequence
    assert a.observation.resources == before_replay.resources
    checks.append("replay/rejection leaves room, sequence and all budgets unchanged")
    b.observe()
    assert ids[1] not in {p["player_id"] for p in equivalent(a)["canonical"]["players_here"]}
    assert ids[0] not in {p["player_id"] for p in equivalent(b)["canonical"]["players_here"]}
    checks.append("legal MOVE updates place and structured consequence, remote presence excluded")
    assert pressure_observations, "canonical seed must exercise a positive pressure band"
    checks.append("positive nonempty raw pressure equals canonical nested location.condition")
    print(json.dumps({
        "checks": checks, "local_only": True, "isolated": cfg["isolated"],
        "normal_seal_sent": not cfg["isolated"],
        "positive_pressure_observations": len(pressure_observations),
        "watch_same_world": watch["world_id"] == cfg["world"],
        "replay_outcome": replay_outcome,
    }))
finally:
    for client in clients:
        client.close()
"""


def _port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _listening(port: int) -> bool:
    with socket.socket() as sock:
        sock.settimeout(0.2)
        return sock.connect_ex(("127.0.0.1", port)) == 0


def _group_exists(pgid: int) -> bool:
    try:
        os.killpg(pgid, 0)
    except ProcessLookupError:
        return False
    return True


def _stop_owned_worker(worker: subprocess.Popen, ports: tuple[int, int]) -> None:
    """Only the new session/group we created is within cleanup authority."""
    try:
        os.killpg(worker.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    try:
        worker.wait(timeout=10)
    except subprocess.TimeoutExpired:
        pass
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline and _group_exists(worker.pid):
        time.sleep(0.1)
    if _group_exists(worker.pid):
        try:
            os.killpg(worker.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
    worker.wait(timeout=10)
    deadline = time.monotonic() + 10
    while time.monotonic() < deadline and (
        _group_exists(worker.pid) or any(_listening(p) for p in ports)
    ):
        time.sleep(0.1)
    assert not _group_exists(worker.pid), "owned Worker process group remains"
    assert not any(_listening(p) for p in ports), "owned Worker ports remain open"


@pytest.mark.parametrize(
    "isolated", [False, True], ids=["default-agent-http", "isolated-agent-http"]
)
def test_s2_agent_semantics_with_pinned_official_client(
    tmp_path: Path, isolated: bool
) -> None:
    raw = os.environ.get("NOEMA_OFFICIAL_CLIENT_REPO")
    if not raw:
        pytest.skip(
            "optional local E2E requires NOEMA_OFFICIAL_CLIENT_REPO at the official CI pin"
        )
    checkout = Path(raw).expanduser().resolve()
    python = checkout / ".venv/bin/python"
    assert python.is_file(), "enabled official client environment missing"
    head = subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=checkout, text=True
    ).strip()
    assert head == CLIENT_PIN, "official client must use the exact CI pin"
    assert not subprocess.check_output(
        ["git", "diff", "HEAD", "--", "src/noema_client", "pyproject.toml"],
        cwd=checkout,
        text=True,
    ).strip(), (
        "official consumer source must match the pin, not a dirty editable install"
    )
    worker_dir = Path(__file__).resolve().parents[1] / "workers/noema"
    wrangler = worker_dir / "node_modules/wrangler/bin/wrangler.js"
    node = shutil.which("node")
    assert node and wrangler.is_file(), (
        "enabled E2E requires installed Node and Worker dependencies"
    )
    tmp_path.chmod(0o700)
    run_id = secrets.token_hex(8)
    world = (
        f"test.hosted-canonical.semantic-{run_id}"
        if isolated
        else f"world.semantic-local-{run_id}"
    )
    signing, admin_secret = secrets.token_hex(32), secrets.token_hex(32)
    config = {
        "name": f"noema-semantic-{run_id}",
        "main": str(worker_dir / "src/index.ts"),
        "compatibility_date": "2026-08-01",
        "compatibility_flags": ["nodejs_compat"],
        "vars": {
            "NOEMA_ENV": "local",
            "NOEMA_PROTOCOL_VERSION": "1",
            "DEFAULT_WORLD_ID": f"test.hosted-canonical.watch-{run_id}"
            if isolated
            else world,
        },
        "durable_objects": {
            "bindings": [{"name": "WORLD_DO", "class_name": "NoemaWorldDO"}]
        },
        "migrations": [{"tag": "v1", "new_classes": ["NoemaWorldDO"]}],
    }
    config_path = tmp_path / "wrangler.json"
    config_path.write_text(json.dumps(config))
    dev_vars = tmp_path / ".dev.vars"
    dev_vars.write_text(
        f'TOKEN_SIGNING_SECRET="{signing}"\nADMIN_OPERATOR_TOKEN="{admin_secret}"\n'
    )
    dev_vars.chmod(0o600)
    env = {
        "PATH": f"{Path(node).parent}:/usr/bin:/bin",
        "CI": "true",
        "WRANGLER_SEND_METRICS": "false",
        "WRANGLER_LOG": "error",
        "WRANGLER_WRITE_LOGS": "false",
        "WRANGLER_LOG_SANITIZE": "true",
        "CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV": "false",
    }
    for name, subdir in (
        ("HOME", "home"),
        ("XDG_CONFIG_HOME", "config"),
        ("TMPDIR", "tmp"),
    ):
        directory = tmp_path / subdir
        directory.mkdir(mode=0o700)
        env[name] = str(directory)
    if os.environ.get("NOEMA_ESBUILD"):
        env["ESBUILD_BINARY_PATH"] = os.environ["NOEMA_ESBUILD"]
    port, inspector = _port(), _port()
    while inspector == port:
        inspector = _port()
    base = f"http://127.0.0.1:{port}"
    log_path = tmp_path / "worker.log"
    worker = None
    try:
        with log_path.open("wb") as log:
            worker = subprocess.Popen(
                [
                    node,
                    str(wrangler),
                    "dev",
                    "--config",
                    str(config_path),
                    "--local",
                    "--ip",
                    "127.0.0.1",
                    "--port",
                    str(port),
                    "--inspector-ip",
                    "127.0.0.1",
                    "--inspector-port",
                    str(inspector),
                    "--persist-to",
                    str(tmp_path / "storage"),
                    "--no-show-interactive-dev-session",
                    "--log-level",
                    "error",
                ],
                cwd=tmp_path,
                env=env,
                stdin=subprocess.DEVNULL,
                stdout=log,
                stderr=subprocess.STDOUT,
                start_new_session=True,
            )
        deadline = time.monotonic() + 60
        ready = False
        while time.monotonic() < deadline and worker.poll() is None:
            try:
                with urllib.request.urlopen(base + "/health", timeout=1) as response:
                    health = json.load(response)
                assert (
                    health["env"] == "local"
                    and health["world_id"] == config["vars"]["DEFAULT_WORLD_ID"]
                )
                ready = True
                break
            except (OSError, urllib.error.URLError):
                time.sleep(0.1)
        assert ready, f"owned Worker not ready, private diagnostics: {log_path}"
        result = subprocess.run(
            [str(python), "-c", CLIENT_CHECK],
            input=json.dumps(
                {
                    "checkout": str(checkout),
                    "base": base,
                    "root": str(tmp_path),
                    "world": world,
                    "isolated": isolated,
                    "watch_world": config["vars"]["DEFAULT_WORLD_ID"],
                    "admin_secret": admin_secret,
                    "signing": signing,
                }
            ),
            text=True,
            capture_output=True,
            timeout=90,
            cwd=tmp_path,
            env=env,
        )
        # Retain sanitized client diagnostics, never credentials, on failure too.
        output = result.stdout + result.stderr
        for secret in (signing, admin_secret):
            output = output.replace(secret, "[REDACTED]")
        import re

        output = re.sub(
            r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+",
            "[REDACTED_JWT]",
            output,
        )
        (tmp_path / "client.log").write_text(output)
        assert result.returncode == 0, (
            f"official client semantic assertions failed:\n{output}"
        )
        receipt = json.loads(result.stdout)
        assert receipt["local_only"] and len(receipt["checks"]) >= 4
        (tmp_path / "checks.json").write_text(json.dumps(receipt, indent=2))
    finally:
        try:
            if worker is not None:
                _stop_owned_worker(worker, (port, inspector))
        finally:
            dev_vars.unlink(missing_ok=True)
            assert not dev_vars.exists(), "private signing file remains"
            for suffix in ("a", "b"):
                credential_path = tmp_path / suffix / "credential.json"
                credential_path.unlink(missing_ok=True)
                assert not credential_path.exists(), "private credential file remains"
        (tmp_path / "cleanup.json").write_text(
            json.dumps(
                {
                    "pid": worker.pid if worker is not None else None,
                    "process_group": worker.pid if worker is not None else None,
                    "port": port,
                    "inspector_port": inspector,
                    "process_group_gone": True,
                    "application_port_closed": True,
                    "inspector_port_closed": True,
                    "signing_file_removed": True,
                    "credential_files_removed": True,
                },
                indent=2,
            )
        )
