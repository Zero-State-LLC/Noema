"""Wait in code for CI on several repo:branch pairs (or every open PR in the Noema repos); print one line each.

Run:    python3 codemode/run.py codemode/skills/ci_watch/ci_watch.py Noema:feat/x Noema-Specs:feat/y
        python3 codemode/run.py codemode/skills/ci_watch/ci_watch.py --open-prs [--timeout 240]
Import: from codemode.skills.ci_watch.ci_watch import watch
"""

from __future__ import annotations

import sys
from typing import Any

from codemode.runtime import config
from codemode.runtime.flow import PollTimeout, poll_until
from codemode.servers.github import commit_checks, list_pulls

OK = ("success", "skipped", "neutral")


def targets_from_open_prs() -> list[tuple[str, str, int | None]]:
    out: list[tuple[str, str, int | None]] = []
    for repo in config()["repos"]:
        for pr in list_pulls(repo):
            head = pr["head"]
            out.append((repo.split("/", 1)[1], head.get("sha") or head["ref"], pr["number"]))
    return out


def watch(targets: list[tuple[str, str, int | None]], timeout: float = 240, interval: float = 20) -> list[dict[str, Any]]:
    """Poll until every target's check runs have completed (or timeout); return one summary per target."""

    def snap() -> dict[tuple[str, str, int | None], list[dict[str, Any]]]:
        return {t: commit_checks(t[1], t[0]) for t in targets}

    def done(d: dict[Any, list[dict[str, Any]]]) -> bool:
        return all(runs and all(r["status"] == "completed" for r in runs) for runs in d.values())

    try:
        res = poll_until(snap, done, timeout=timeout, interval=interval)
    except PollTimeout as t:
        res = t.last
    out = []
    for (repo, ref, num), runs in res.items():
        failed = [r["name"] for r in runs if r["status"] == "completed" and r.get("conclusion") not in OK]
        running = [r["name"] for r in runs if r["status"] != "completed"]
        out.append({"repo": repo, "ref": ref, "pr": num, "checks": len(runs), "failed": failed, "running": running})
    return out


def render(rows: list[dict[str, Any]]) -> str:
    lines = []
    for r in rows:
        name = f"{r['repo']}{'#' + str(r['pr']) if r['pr'] else ''} {r['ref']}"
        if r["failed"]:
            state = f"FAILED: {', '.join(r['failed'])} (digest: ci_failure_digest.py --repo {r['repo']} --branch {r['ref']})"
        elif r["running"] or not r["checks"]:
            state = f"still running: {', '.join(r['running']) or 'no checks yet'}"
        else:
            state = "all green"
        lines.append(f"{name}: {r['checks']} checks; {state}")
    return "\n".join(lines) or "nothing to watch"


if __name__ == "__main__":
    args = sys.argv[1:]
    timeout = float(args[args.index("--timeout") + 1]) if "--timeout" in args else 240
    pairs = [a for a in args if ":" in a and not a.startswith("--")]
    targets = targets_from_open_prs() if "--open-prs" in args else [(p.split(":", 1)[0], p.split(":", 1)[1], None) for p in pairs]
    print(render(watch(targets, timeout=timeout)))
