"""Wait in code until every check run on a ref has completed, then return them (no polling through the conversation)."""

from __future__ import annotations

from codemode.runtime.flow import poll_until

from ._types import CheckRun
from .commit_checks import commit_checks


def wait_for_checks(
    ref: str,
    repo: str | None = None,
    *,
    timeout: float = 1800,
    interval: float = 20,
) -> list[CheckRun]:
    """Raises flow.PollTimeout (with .last = the latest check runs) if checks are still running at timeout."""
    return poll_until(
        lambda: commit_checks(ref, repo),
        lambda runs: bool(runs) and all(r.get("status") == "completed" for r in runs),
        timeout=timeout,
        interval=interval,
    )
