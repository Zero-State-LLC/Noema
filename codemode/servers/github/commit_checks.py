"""Check runs (CI results) for a branch, tag or SHA in a Noema repo (default: main on Noema)."""

from __future__ import annotations

from codemode.runtime import gh

from ._types import CheckRun


def commit_checks(ref: str = "main", repo: str | None = None) -> list[CheckRun]:
    """Latest check run per check name for the commit that ref points to."""
    return gh.api(
        f"repos/{gh.repo(repo, default='home_repo')}/commits/{ref}/check-runs",
        params={"filter": "latest", "per_page": 100},
        paginate=True,
    )
