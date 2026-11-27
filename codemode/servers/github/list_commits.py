"""List recent commits on a branch of a Noema repo (default: main on Noema); author names are registered for tokenizing."""

from __future__ import annotations

from codemode.runtime import gh
from codemode.runtime.privacy import register_names

from ._types import Commit


def list_commits(ref: str = "main", repo: str | None = None, *, since: str | None = None, limit: int = 50) -> list[Commit]:
    """Data stays raw in your script; printed author names come out as [NAME_n], emails as [EMAIL_n]."""
    rows = gh.api(
        f"repos/{gh.repo(repo, default='home_repo')}/commits",
        params={"sha": ref, "since": since, "per_page": min(limit, 100)},
    )[:limit]
    register_names(
        [p.get("name", "") for r in rows for p in (r.get("commit", {}).get("author") or {}, r.get("commit", {}).get("committer") or {})]
    )
    return rows
