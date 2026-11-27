"""Agent workflow state machine (.agents/machine.json) and its code-mode gate."""

from __future__ import annotations

import copy
import importlib.util
import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location("agent_machine", ROOT / ".agents" / "machine.py")
assert _spec and _spec.loader
am = importlib.util.module_from_spec(_spec)
sys.modules["agent_machine"] = am  # dataclasses resolve annotations through sys.modules
_spec.loader.exec_module(am)

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from codemode.runtime import policy  # noqa: E402


@pytest.fixture()
def m(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(am, "state_dir", lambda: tmp_path / "agent-machine")
    return am.load()


def test_repo_machine_is_valid_and_agents_md_is_in_sync() -> None:
    proc = subprocess.run([sys.executable, str(ROOT / ".agents" / "machine.py"), "check"], capture_output=True, text=True)
    assert proc.returncode == 0, proc.stderr


def test_happy_path_with_guards(m) -> None:
    assert am.read_state(m)["state"] == "ORIENT"
    with pytest.raises(am.MachineError, match="needs --evidence"):
        am.go(m, "IMPLEMENT")
    assert am.go(m, "IMPLEMENT", evidence="docs-only typo fix") == "IMPLEMENT"
    assert am.go(m, "VERIFY") == "VERIFY"
    with pytest.raises(am.MachineError, match="--no-run needs --evidence"):
        am.go(m, "REVIEW", no_run=True)
    assert am.go(m, "REVIEW", no_run=True, evidence="ran in CI") == "REVIEW"
    assert am.allowed("merge", m)[0] and not am.allowed("prod_change", m)[0]
    with pytest.raises(am.MachineError, match="no transition REVIEW -> DEPLOY_APPROVED"):
        am.go(m, "DEPLOY_APPROVED", user_said="deploy")
    log = (am.state_dir() / "log.jsonl").read_text().splitlines()
    assert [json.loads(line)["to"] for line in log] == ["IMPLEMENT", "VERIFY", "REVIEW"]


def test_deploy_needs_the_users_own_word_and_resumes(m) -> None:
    am.go(m, "IMPLEMENT", evidence="x")
    am.go(m, "AWAITING_USER", evidence="summary: deploy pin abc123, staging green, rollback = previous pin")
    with pytest.raises(am.MachineError, match="must match"):
        am.go(m, "DEPLOY_APPROVED", user_said="sounds good")
    assert am.go(m, "DEPLOY_APPROVED", user_said="yes, deploy it") == "DEPLOY_APPROVED"
    assert am.allowed("prod_change", m)[0]
    assert am.go(m, "back", evidence="run 123 dispatched; recorded in NEXT.md") == "IMPLEMENT"
    assert am.read_state(m)["resume"] is None


def test_stop_needs_the_user_and_blocks_writes(m) -> None:
    am.go(m, "STOPPED", evidence="INCIDENT")
    assert am.allowed_actions(m) == ("STOPPED", ["read"])
    with pytest.raises(am.MachineError, match="no transition STOPPED -> ESCALATED"):
        am.go(m, "ESCALATED", evidence="x")
    assert am.go(m, "ORIENT", user_said="all clear, carry on") == "ORIENT"


def test_never_actions_are_never_allowed(m) -> None:
    for action in ("print_secret", "force_push_main", "disable_check"):
        assert am.allowed(action, m) == (False, f"{action} is never allowed: {m.actions[action]['text']}")


def _broken(mutate) -> list[str]:
    raw = json.loads((ROOT / ".agents" / "machine.json").read_text())
    mutate(raw)
    path = ROOT / ".agents" / "_t.json"
    try:
        path.write_text(json.dumps(raw))
        return am.validate(am.load(path))
    finally:
        path.unlink()


def test_validation_catches_unsafe_machines() -> None:
    assert any("core changed" in e for e in _broken(lambda r: r["core"]["states"]["ORIENT"].__setitem__("summary", "x")))
    assert any("never-tier" in e for e in _broken(lambda r: r["repo"]["states"]["IMPLEMENT"]["allow_extra"].append("print_secret")))

    def leak_needs_user(r):
        r["repo"]["states"]["IMPLEMENT"]["allow_extra"].append("prod_change")

    assert any("without a user_yes guard" in e for e in _broken(leak_needs_user))

    def orphan(r):
        r["repo"]["states"]["ORPHAN"] = {"summary": "x", "exits": [{"to": "ORIENT"}]}

    assert any("ORPHAN: unreachable" in e for e in _broken(orphan))


def test_overlay_cannot_rewrite_core_states() -> None:
    raw = json.loads((ROOT / ".agents" / "machine.json").read_text())
    bad = copy.deepcopy(raw)
    bad["repo"]["states"]["ORIENT"] = {"summary": "skip everything"}
    path = ROOT / ".agents" / "_t.json"
    try:
        path.write_text(json.dumps(bad))
        with pytest.raises(am.MachineError, match="may only extend core state ORIENT"):
            am.load(path)
    finally:
        path.unlink()


@pytest.mark.parametrize(
    ("method", "path", "action"),
    [
        ("POST", "repos/o/r/issues/5/comments", "docs_board"),
        ("PATCH", "repos/o/r/pulls/9", "pr"),
        ("PUT", "repos/o/r/pulls/9/merge", "merge"),
        ("POST", "repos/o/r/actions/runs/77/rerun", "pr"),
        ("POST", "repos/o/r/actions/workflows/deploy-worker-pin-pr.yml/dispatches", "prod_change"),
        ("DELETE", "repos/o/r/git/refs/heads/x", "delete"),
    ],
)
def test_codemode_maps_github_writes_to_actions(method: str, path: str, action: str) -> None:
    assert policy.github_action(method, path) == action


def test_codemode_gate_follows_agent_state(monkeypatch: pytest.MonkeyPatch) -> None:
    with pytest.raises(policy.PolicyError, match="no agent-machine action mapping"):
        policy.github_action("POST", "repos/o/r/hooks")
    monkeypatch.setenv("CODEMODE_AGENT_STATE", "STOPPED")
    monkeypatch.setenv("CODEMODE_AGENT_ALLOWED", "read")
    with pytest.raises(policy.PolicyError, match="not allowed in agent state STOPPED"):
        policy.require("docs_board")
    monkeypatch.setenv("CODEMODE_AGENT_ALLOWED", "read,docs_board")
    policy.require("docs_board")
