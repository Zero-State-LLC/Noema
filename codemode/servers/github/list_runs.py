"""List GitHub Actions workflow runs in a Noema repo (default: Noema), filtered by branch, status or workflow."""

from __future__ import annotations

from codemode.runtime import gh

from ._types import WorkflowRun


def list_runs(
    repo: str | None = None,
    *,
    branch: str | None = None,
    status: str | None = None,
    workflow: str | None = None,
    limit: int = 50,
) -> list[WorkflowRun]:
    """status: completed|in_progress|queued|success|failure|cancelled. workflow: file name like ci.yml."""
    base = f"repos/{gh.repo(repo, default='home_repo')}/actions"
    path = f"{base}/workflows/{workflow}/runs" if workflow else f"{base}/runs"
    rows = gh.api(path, params={"branch": branch, "status": status, "per_page": min(limit, 100)})
    return rows.get("workflow_runs", [])[:limit]
