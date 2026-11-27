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


# document machines (.agents/docs.py) ---------------------------------------

_dspec = importlib.util.spec_from_file_location("docs_machine", ROOT / ".agents" / "docs.py")
assert _dspec and _dspec.loader
dm = importlib.util.module_from_spec(_dspec)
sys.modules["docs_machine"] = dm
_dspec.loader.exec_module(dm)


def test_docs_machine_check_passes() -> None:
    assert dm.check() == []


def test_bare_adr_is_accepted_and_moves_forward_only() -> None:
    adr = json.loads((ROOT / ".agents" / "lifecycles.json").read_text())["kinds"]["adr"]
    assert dm.normalize(dm.status_text("# Title\n\nWe decided X.\n", adr["status"]) or adr["default"], adr) == "accepted"
    assert dm.normalize(dm.status_text("Status: Accepted (operator-selected)\n", adr["status"]), adr) == "accepted"
    assert dm.forward(adr, "accepted", "superseded") and not dm.forward(adr, "superseded", "accepted")


def test_gate_entries_and_mirror_drift(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    gate = {"title": "Gate", "entries": {"file": "D.md", "heading": "^## (?P<id>G-\\d+): .*, (?P<status>[A-Z_ ]+)$"},
            "states": ["BLOCKED", "APPROVED"], "aliases": {"BLOCKED": ["blocked"], "APPROVED": ["approved"]}, "next": {"BLOCKED": ["APPROVED"], "APPROVED": []}}
    assert dm.entries(gate, "## G-001: Spark writer, BLOCKED\n") == {"G-001": "BLOCKED"}
    monkeypatch.setattr(dm, "ROOT", tmp_path)
    (tmp_path / "SKILL.md").write_text("## Stop\n\nStop on INCIDENT.\n\n## Next\n")
    procs = {"play": {"stop": ["INCIDENT", "SEAL_MISMATCH"]}}
    errs = dm._mirror_errors(procs, {"file": "SKILL.md", "section": "## Stop", "mentions": "play.stop"})
    assert errs == ["SKILL.md ## Stop: does not mention 'SEAL_MISMATCH' (play.stop)"]


# runbook machines -----------------------------------------------------------


@pytest.fixture()
def runbooks(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(dm, "_run_path", lambda: tmp_path / "procedure.json")
    return json.loads((ROOT / ".agents" / "procedures.json").read_text())


def test_733_live_phases_need_the_users_go(runbooks) -> None:
    dm.run_cmd(runbooks, ["run", "ACCEPTANCE_733"])
    with pytest.raises(dm.DocsError, match="user's own words"):
        dm.run_cmd(runbooks, ["step", "--evidence", "I ran setup myself"])  # operator step
    dm.run_cmd(runbooks, ["step", "--user-said", "setup done, booleans all true"])
    dm.run_cmd(runbooks, ["step", "--evidence", "plan lists deploy, g1, g2, ac17, g3, r0"])
    with pytest.raises(dm.DocsError, match="own go"):
        dm.run_cmd(runbooks, ["step", "--evidence", "deployed"])
    assert "Step 4/10 G1" in dm.run_cmd(runbooks, ["step", "--user-said", "go for deploy"])


def test_genesis_is_human_only_and_activation_is_irreversible(runbooks) -> None:
    rb = runbooks["runbooks"]["GENESIS_ACTIVATION"]
    assert all(dm.step_gate(rb, i)["kind"] == "user_yes" for i in range(len(rb["steps"])))
    dm.run_cmd(runbooks, ["run", "GENESIS_ACTIVATION"])
    for _ in range(7):
        dm.run_cmd(runbooks, ["step", "--user-said", "done"])
    with pytest.raises(dm.DocsError, match="must match"):
        dm.run_cmd(runbooks, ["step", "--user-said", "looks fine"])  # APPROVE needs an approval
    assert "IRREVERSIBLE" in dm.run_cmd(runbooks, ["step", "--user-said", "I approve this activation"])


def test_runbook_drift_is_caught(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    rb = json.loads((ROOT / ".agents" / "procedures.json").read_text())["runbooks"]
    (tmp_path / "docs").mkdir()
    text = (ROOT / "docs" / "SUCCESSOR-CUTOVER-RUNBOOK.md").read_text()
    (tmp_path / "docs" / "SUCCESSOR-CUTOVER-RUNBOOK.md").write_text(
        text.replace("- Do not PLAY `world-01`.\n", "").replace("4. Older-world", "4. Newer-world")
    )
    monkeypatch.setattr(dm, "ROOT", tmp_path)
    errs = dm._runbook_errors("SUCCESSOR_CUTOVER", rb["SUCCESSOR_CUTOVER"])
    assert any("never line 'Do not PLAY `world-01`.'" in e for e in errs)
    assert any("numbered steps" in e for e in errs)


def test_operator_smoke_admin_and_live_steps_need_the_user(runbooks) -> None:
    rb = runbooks["runbooks"]["OPERATOR_SMOKE"]
    gated = {st["id"] for i, st in enumerate(rb["steps"]) if dm.step_gate(rb, i)["kind"] == "user_yes"}
    assert {"ADMIN_LOGIN", "MINT_TOKENS", "ENTER_LOOK_LEAVE", "DIGEST_TICK", "RESEED_HIDDEN"} <= gated
    assert {"READY", "FIRST_PROBE", "WATCH_NO_SEEDS"}.isdisjoint(gated)  # read-only probes


def test_plan_done_must_show_in_its_design_spec() -> None:
    lc = json.loads((ROOT / ".agents" / "lifecycles.json").read_text())
    plan, spec = lc["kinds"]["sp_plan"], lc["kinds"]["sp_spec"]
    assert dm.normalize(dm.status_text("> **Status: Partially superseded** — Reconciled", plan["status"]), plan) == "partially superseded"
    assert dm.normalize("approved design — not implemented", spec) == "approved"  # negation never reads as implemented
    assert dm.normalize("implemented (plan done, reconciled). Was: approved — implementing", spec) == "implemented"
    import re
    m = re.search(plan["requires"][0]["field"], "| `docs/superpowers/specs/2026-08-21-maint-evolve-design.md` | Already on main |", re.M)
    assert m and m.group(1) == "2026-08-21-maint-evolve-design.md"


# review fixes (Codex on #972/#473/#56) ----------------------------------------


def test_nested_interruptions_unwind_one_level(m) -> None:
    am.go(m, "IMPLEMENT", evidence="x")
    am.go(m, "AWAITING_USER", evidence="asked to rotate a secret")
    am.go(m, "ESCALATED", evidence="CI broke while waiting")
    assert am.go(m, "back", evidence="bug #1 filed") == "AWAITING_USER"  # still waiting for the user's words
    assert am.go(m, "back", user_said="no, leave it") == "IMPLEMENT"
    assert am.read_state(m)["stack"] == []


def test_escalated_procedure_can_be_resolved_and_rerun(runbooks) -> None:
    dm.run_cmd(runbooks, ["run", "OPERATOR_SMOKE"])
    dm.run_cmd(runbooks, ["escalate", "--evidence", "/ready shows INCIDENT"])
    with pytest.raises(dm.DocsError, match="resolve"):
        dm.run_cmd(runbooks, ["run", "OPERATOR_SMOKE"])
    with pytest.raises(dm.DocsError, match="own words"):
        dm.run_cmd(runbooks, ["resolve", "--evidence", "fixed"])
    assert "resolved" in dm.run_cmd(runbooks, ["resolve", "--user-said", "recovered, carry on"])
    assert "Step 1/9 READY" in dm.run_cmd(runbooks, ["run", "OPERATOR_SMOKE"])


def test_empty_index_still_reports_missing_entries(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    (tmp_path / "docs" / "adr").mkdir(parents=True)
    (tmp_path / "docs" / "adr" / "0001-x.md").write_text("# X\n\nStatus: accepted\n")
    (tmp_path / "docs" / "adr" / "README.md").write_text("| ADR | Title | Status |\n| --- | --- | --- |\n")
    monkeypatch.setattr(dm, "ROOT", tmp_path)
    kind = {"title": "ADR", "files": "docs/adr/[0-9]*.md", "status": ["^status:\\s*(.+)$"], "states": ["accepted"],
            "aliases": {"accepted": ["accepted"]}, "next": {"accepted": []},
            "index": {"file": "docs/adr/README.md", "row": "^\\|\\s*\\[ADR-\\d+\\]\\((?P<file>[^)]+)\\)\\s*\\|[^|]*\\|\\s*(?P<status>[^|]+?)\\s*\\|"}}
    keys = [v["key"] for v in dm.lifecycle_violations({"kinds": {"adr": kind}})]
    assert keys == ["adr:0001-x.md:not_in_index"]
