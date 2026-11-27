"""Digest a failed GitHub Actions run in a Noema repo: failing tests, assertion and location, from 100 KB+ logs.

Run:    python3 codemode/run.py codemode/skills/ci_failure_digest/ci_failure_digest.py [--repo Noema] [--run ID] [--branch B]
Import: from codemode.skills.ci_failure_digest.ci_failure_digest import digest
"""

from __future__ import annotations

import re
import sys
from typing import Any

from codemode.runtime.flow import retry
from codemode.runtime.gh import repo as full_repo
from codemode.runtime.shape import clean_log, grep_log
from codemode.servers.github import job_log, list_jobs, list_runs

_VITEST_FAIL = re.compile(r"^\s*FAIL\s+(\S+)\s+>\s+(.*)$")
_PYTEST_FAIL = re.compile(r"^FAILED\s+(\S+?)::(\S+)(?:\s+-\s+(.*))?$")
_ERROR = re.compile(r"^\s*((?:\w+\.)*\w*(?:Error|Exception)\b.*|E\s{2,}.*)$")
_WHERE = re.compile(r"❯\s+(?:\w+\s+)?(\S+:\d+)(?::\d+)?\s*$")
_SUMMARY = re.compile(r"^\s*(Test Files|Tests)\s+\d.*|^=+ .*\b(failed|error)\b.* in [\d.]+s.*=+$")


def parse_failures(lines: list[str]) -> list[dict[str, str]]:
    """Failing tests from vitest or pytest output: file, test, error, where."""
    failures: list[dict[str, str]] = []
    current: dict[str, str] | None = None
    for line in lines:
        m = _VITEST_FAIL.match(line)
        if m:
            current = {"file": m.group(1), "test": m.group(2).strip(), "error": "", "where": ""}
            failures.append(current)
            continue
        m = _PYTEST_FAIL.match(line.strip())
        if m:
            failures.append({"file": m.group(1), "test": m.group(2), "error": m.group(3) or "", "where": m.group(1)})
            current = None
            continue
        if current is None:
            continue
        if not current["error"] and _ERROR.match(line):
            current["error"] = line.strip()
        elif not current["where"]:
            w = _WHERE.search(line)
            if w and w.group(1).startswith(current["file"].split(":")[0]):
                current["where"] = w.group(1)
        if line.strip().startswith("⎯"):
            current = None
    seen, unique = set(), []
    for f in failures:
        key = (f["file"], f["test"])
        if key not in seen:
            seen.add(key)
            unique.append(f)
    return unique


def digest(repo: str | None = None, run_id: int | None = None, branch: str | None = None) -> dict[str, Any]:
    """Structured digest of the latest failed run (or run_id). Data only; print what you need."""
    full = full_repo(repo, default="home_repo")
    if run_id is None:
        runs = list_runs(full, status="failure", branch=branch, limit=1)
        if not runs:
            return {"repo": full, "run": None, "jobs": []}
        run = runs[0]
    else:
        run = next((r for r in list_runs(full, limit=100) if r["id"] == int(run_id)), {"id": int(run_id)})
    jobs = []
    for job in list_jobs(run["id"], full):
        if job.get("conclusion") != "failure":
            continue
        text = retry(lambda j=job: job_log(j["id"], full), attempts=3, delay=2)
        lines = clean_log(text)
        jobs.append(
            {
                "name": job["name"],
                "url": job.get("html_url"),
                "failed_steps": [s["name"] for s in job.get("steps", []) if s.get("conclusion") == "failure"],
                "log_bytes": len(text),
                "log_lines": len(lines),
                "summary": [line.strip() for line in lines if _SUMMARY.match(line)][:3],
                "failures": parse_failures(lines),
                "errors": [] if parse_failures(lines) else grep_log(lines, [r"##\[error\]"], max_lines=10),
            }
        )
    return {"repo": full, "run": run, "jobs": jobs}


def render(d: dict[str, Any], max_failures: int = 15) -> str:
    run = d["run"]
    if not run:
        return f"{d['repo']}: no failed runs"
    out = [
        f"{d['repo']} run {run['id']} ({run.get('name', '?')}) on {run.get('head_branch', '?')} "
        f"at {run.get('created_at', '?')}: {len(d['jobs'])} failed job(s)"
    ]
    for job in d["jobs"]:
        steps = ", ".join(job["failed_steps"]) or "?"
        out.append(f"- {job['name']} | failed step: {steps} | log {job['log_bytes'] // 1024} KB / {job['log_lines']} lines")
        out += [f"    {s}" for s in job["summary"]]
        for f in job["failures"][:max_failures]:
            out.append(f"    {f['where'] or f['file']}  {f['test'][:110]}")
            if f["error"]:
                out.append(f"        {f['error'][:160]}")
        if len(job["failures"]) > max_failures:
            out.append(f"    … {len(job['failures']) - max_failures} more failures")
        out += [f"    {e[:160]}" for e in job["errors"]]
    return "\n".join(out)


def _arg(flag: str) -> str | None:
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else None


if __name__ == "__main__":
    run_arg = _arg("--run")
    print(render(digest(_arg("--repo"), int(run_arg) if run_arg else None, _arg("--branch"))))
