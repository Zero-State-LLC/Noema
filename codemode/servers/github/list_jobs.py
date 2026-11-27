"""List the jobs (with step results) of one workflow run in a Noema repo (default: Noema)."""

from __future__ import annotations

from codemode.runtime import gh

from ._types import Job


def list_jobs(run_id: int, repo: str | None = None) -> list[Job]:
    """Latest attempt only."""
    return gh.api(
        f"repos/{gh.repo(repo, default='home_repo')}/actions/runs/{int(run_id)}/jobs",
        params={"filter": "latest", "per_page": 100},
        paginate=True,
    )
