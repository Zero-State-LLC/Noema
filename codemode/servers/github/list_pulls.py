"""List pull requests in a Noema repo (default: Noema) by state."""

from __future__ import annotations

from codemode.runtime import gh

from ._types import Pull


def list_pulls(repo: str | None = None, *, state: str = "open", limit: int = 200) -> list[Pull]:
    """state: open|closed|all. Newest first."""
    rows = gh.api(
        f"repos/{gh.repo(repo, default='home_repo')}/pulls",
        params={"state": state, "per_page": 100, "sort": "created", "direction": "desc"},
        paginate=limit > 100,
    )
    return rows[:limit]
