"""Post a comment on an issue or PR in a Noema repo; dry_run=True by default, and PII placeholders are never mapped back into public text."""

from __future__ import annotations

from typing import Any

from codemode.runtime import gh
from codemode.runtime.privacy import has_placeholders


def comment_on_issue(number: int, body: str, repo: str | None = None, *, dry_run: bool = True) -> dict[str, Any]:
    """Board updates are pre-authorized in AGENTS.md; still, pass dry_run=False deliberately.

    Refuses bodies containing [EMAIL_n]/[PHONE_n]/[NAME_n]: issue comments are public,
    so personal data stays out rather than being mapped back.
    """
    if has_placeholders(body):
        raise ValueError("comment body contains PII placeholders; issues are public, so remove them instead of mapping back")
    full = gh.repo(repo)
    request = {"repo": full, "number": int(number), "body": body}
    if dry_run:
        return {"dry_run": True, **request}
    created = gh.api(f"repos/{full}/issues/{int(number)}/comments", method="POST", body={"body": body})
    return {"dry_run": False, "id": created.get("id"), "html_url": created.get("html_url")}
