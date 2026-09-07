"""CI command-boundary regressions, using only the declared Python dev deps.

The probes execute the workflow's literal run steps with isolated failing tools.
They verify shell failure propagation, not the hosted GitHub Actions scheduler.
Real runtime suites remain separate CI steps, not substitutes for these probes.
"""
from __future__ import annotations

from pathlib import Path
import re
import subprocess

import pytest

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github/workflows/ci.yml"


def _run_steps(workflow: str | None = None) -> list[str]:
    # Deliberately support only literal inline/block run steps used by this file.
    # No YAML dependency is needed for this narrow workflow contract.
    lines = (WORKFLOW.read_text() if workflow is None else workflow).splitlines()
    commands = []
    for index, line in enumerate(lines):
        match = re.fullmatch(r"(\s*)run: (.*)", line)
        if not match:
            continue
        indent, value = match.groups()
        if value == "|":
            block = []
            for following in lines[index + 1:]:
                if following.strip() and len(following) - len(following.lstrip()) <= len(indent):
                    break
                block.append(following)
            commands.append("\n".join(block))
        else:
            commands.append(value)
    return commands


@pytest.mark.parametrize("command", [
    "npm test -- --maxWorkers=1 --no-file-parallelism",
    "npm run typecheck",
    "python -m pytest -q -ra",
])
@pytest.mark.parametrize("exit_code", [0, 37])
def test_runtime_ci_executes_checks_and_preserves_failure(tmp_path: Path, command: str, exit_code: int):
    steps = [step for step in _run_steps() if command in step]
    assert len(steps) == 1, f"CI must execute exactly one complete check: {command}"
    workflow = WORKFLOW.read_text()
    assert "continue-on-error:" not in workflow, "runtime failures must fail CI"
    conditions = re.findall(r"^\s*if: (.*)$", workflow, re.MULTILINE)
    assert conditions == ["${{ !cancelled() }}"], "only failure-aware typecheck may be conditional"
    assert "if: ${{ !cancelled() }}\n      run: npm run typecheck" in workflow

    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    log = tmp_path / "commands.log"
    # Only command-boundary doubles: no production modules or fixtures replaced.
    for tool in ("npm", "python"):
        executable = bin_dir / tool
        executable.write_text(
            '#!/bin/bash\n'
            'command="$(basename "$0") $*"\n'
            'printf "%s\\n" "$command" >> "$PROBE_LOG"\n'
            'if [[ "$command" == "$PROBE_COMMAND" ]]; then exit "$PROBE_EXIT"; fi\n'
            'exit 0\n'
        )
        executable.chmod(0o755)
    result = subprocess.run(
        ["bash", "--noprofile", "--norc", "-e", "-o", "pipefail", "-c", steps[0]],
        cwd=tmp_path,
        env={"PATH": f"{bin_dir}:/usr/bin:/bin", "PROBE_LOG": str(log),
             "PROBE_COMMAND": command, "PROBE_EXIT": str(exit_code)},
        capture_output=True,
        text=True,
        timeout=10,
    )
    assert log.exists(), f"CI did not execute {command}: {result.stderr}"
    assert command in log.read_text().splitlines()
    assert result.returncode == exit_code, result.stderr


@pytest.mark.parametrize("job", ["build", "worker"])
def test_worker_ci_provisions_the_declared_specs_pin(tmp_path: Path, job: str):
    import json
    import sys

    jobs = dict(re.findall(r"^  (\w+):\n(.*?)(?=^  \w+:\n|\Z)",
                           WORKFLOW.read_text().split("\njobs:\n", 1)[1], re.MULTILINE | re.DOTALL))
    steps = [step for step in _run_steps(jobs[job]) if "git clone" in step]
    assert len(steps) == 1, f"{job} CI must provision the pinned sibling Specs checkout"
    pin = "1234567890abcdef1234567890abcdef12345678"
    (tmp_path / "spec-compat.json").write_text(json.dumps({"specs": {"commit": pin}}))
    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    git = bin_dir / "git"
    git.write_text('#!/bin/bash\nprintf "%s\\n" "$*" >> "$PROBE_LOG"\n')
    git.chmod(0o755)
    log = tmp_path / "git.log"
    result = subprocess.run(
        ["bash", "--noprofile", "--norc", "-e", "-o", "pipefail", "-c", steps[0]],
        cwd=tmp_path,
        env={"PATH": f"{bin_dir}:{Path(sys.executable).parent}:/usr/bin:/bin",
             "GITHUB_WORKSPACE": str(tmp_path), "PROBE_LOG": str(log)},
        capture_output=True, text=True, timeout=10,
    )
    assert result.returncode == 0, result.stderr
    calls = log.read_text().splitlines()
    assert calls == [
        f"clone --quiet --filter=blob:none https://github.com/Zero-State-LLC/Noema-Specs.git {tmp_path}/../Noema-Specs",
        f"-C {tmp_path}/../Noema-Specs checkout --quiet {pin}",
    ]
