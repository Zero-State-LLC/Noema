"""List issues (not PRs) in a Noema repo, with optional state, label and since filters; default repo is the board (Noema-Specs)."""

from __future__ import annotations

from codemode.runtime import gh

from ._types import Issue


def list_issues(
    repo: str | None = None,
    *,
    state: str = "open",
    labels: list[str] | None = None,
    since: str | None = None,
    limit: int = 500,
) -> list[Issue]:
    """state: open|closed|all. labels: all must match. since: ISO 8601 updated-after."""
    rows = gh.api(
        f"repos/{gh.repo(repo)}/issues",
        params={"state": state, "labels": ",".join(labels) if labels else None, "since": since, "per_page": 100},
        paginate=True,
    )
    return [r for r in rows if "pull_request" not in r][:limit]
