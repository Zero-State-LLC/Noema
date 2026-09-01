"""Cross-repo guard: skip locally, fail loudly in CI.

Several Chamber conformance tests read fixtures from Noema-Specs checked out
beside this repo and guard themselves with `pytest.skip` so a bare clone still
runs. That is right locally and wrong in CI, where the checkout is supposed to
be there: a missing one turns the suite green while the ADR-005 conformance
checks quietly stop running.

Measured before this existed: with Noema-Specs absent the Python suite reports
`531 passed, 7 skipped` and exits zero. Three of those skips are the cross-repo
conformance tests -- seed-replay equivalence against the published fixtures and
the event-catalog check. The other four are legitimately optional (Postgres, and
the cohort E2E that needs an official-client checkout).

The Worker suite had the same hole and closed it in Noema #609; this is the
Python half of that fix. CI clones Noema-Specs pinned to `spec-compat.json`
`specs.commit`, so a lagging pin can also make an artifact vanish -- which is
exactly how the RFC-0129 conformance suite would have skipped in CI (#608).
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest

__all__ = ["require_specs"]


def require_specs(path: Path, what: str) -> None:
    """Skip when `path` is missing locally; fail when missing under CI.

    `what` names the artifact in the failure so the cause is actionable
    rather than a bare path.
    """
    if path.exists():
        return
    message = (
        f"Noema-Specs artifact missing: {what} at {path}. "
        "CI clones Noema-Specs at spec-compat.json `specs.commit`, not main. "
        "If the artifact landed in Specs after that commit, advance the pin; "
        "otherwise fix the path. Skipping here would pass while checking nothing."
    )
    if os.environ.get("CI"):
        pytest.fail(message, pytrace=False)
    pytest.skip(message)
