"""Get one issue by number, optionally with its comments; default repo is the board (Noema-Specs)."""

from __future__ import annotations

from typing import Any

from codemode.runtime import gh


def get_issue(number: int, repo: str | None = None, *, comments: bool = False) -> dict[str, Any]:
    """Returns the issue; with comments=True adds a "comment_list" key holding every comment."""
    full = gh.repo(repo)
    issue: dict[str, Any] = gh.api(f"repos/{full}/issues/{int(number)}")
    if comments:
        issue["comment_list"] = gh.api(f"repos/{full}/issues/{int(number)}/comments", params={"per_page": 100}, paginate=True)
    return issue
