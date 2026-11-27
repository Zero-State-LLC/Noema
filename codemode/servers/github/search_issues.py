"""Search issues (or PRs, with is:pr) across all four Noema repos with GitHub search syntax, e.g. 'is:open label:ready-for-agent'."""

from __future__ import annotations

import re
from typing import Any

from codemode.runtime import config, gh


def search_issues(query: str, *, limit: int = 100) -> list[dict[str, Any]]:
    """Adds is:issue unless the query names is:issue/is:pr/type:, and repo: qualifiers unless it names a repo or org."""
    if not re.search(r"\b(is:(issue|pr|pull-request)|type:(issue|pr))\b", query):
        query += " is:issue"
    if "repo:" not in query and "org:" not in query:
        query += " " + " ".join(f"repo:{r}" for r in config()["repos"])
    rows = gh.api("search/issues", params={"q": query, "per_page": 100}, paginate=limit > 100)
    items = rows if isinstance(rows, list) else rows.get("items", [])
    return items[:limit]
