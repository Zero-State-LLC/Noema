"""Download the full plain-text log of one Actions job (often 100 KB+): filter it in code with shape.grep_log."""

from __future__ import annotations

from codemode.runtime import gh


def job_log(job_id: int, repo: str | None = None) -> str:
    """Raw log text. Never print it whole."""
    return gh.api(f"repos/{gh.repo(repo, default='home_repo')}/actions/jobs/{int(job_id)}/logs", raw=True)
