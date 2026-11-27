"""GitHub REST through `gh api`. REST only: GraphQL is unavailable in some agent sandboxes."""

from __future__ import annotations

import json
import subprocess
from typing import Any
from urllib.parse import urlencode

from . import config, tool_env
from .privacy import detokenize

_LIST_KEYS = ("items", "workflow_runs", "check_runs", "jobs", "artifacts", "check_suites", "statuses")


class GhError(RuntimeError):
    pass


def repo(name: str | None = None, *, default: str = "board_repo") -> str:
    """Resolve 'Noema-Specs' or 'Zero-State-LLC/Noema-Specs' to the full name.

    With no name: the board repo for issues (default) or, with default="home_repo", Noema.
    """
    if not name:
        return config()[default]
    if "/" in name:
        return name
    for full in config()["repos"]:
        if full.split("/", 1)[1].lower() == name.lower():
            return full
    raise GhError(f"unknown repo {name!r}; known: {config()['repos']}")


def _flatten(pages: list[Any]) -> list[Any]:
    out: list[Any] = []
    for page in pages:
        if isinstance(page, list):
            out.extend(page)
        elif isinstance(page, dict):
            key = next((k for k in _LIST_KEYS if isinstance(page.get(k), list)), None)
            out.extend(page[key] if key else [page])
    return out


def api(
    path: str,
    *,
    method: str = "GET",
    params: dict[str, Any] | None = None,
    body: dict[str, Any] | None = None,
    paginate: bool = False,
    accept: str | None = None,
    raw: bool = False,
    timeout: float = 120,
) -> Any:
    """Call the GitHub REST API. Returns parsed JSON, a flattened list when paginating, or text when raw."""
    if method.upper() != "GET":
        from .policy import github_action, require

        require(github_action(method, path))
    params = {k: v for k, v in detokenize(params or {}).items() if v is not None}
    if params:
        path += ("&" if "?" in path else "?") + urlencode(params)
    args = ["gh", "api", detokenize(path), "--method", method]
    if accept:
        args += ["-H", f"Accept: {accept}"]
    if paginate:
        args += ["--paginate", "--slurp"]
    stdin = None
    if body is not None:
        args += ["--input", "-"]
        stdin = json.dumps(body)
    proc = subprocess.run(
        args,
        input=stdin,
        capture_output=True,
        text=True,
        timeout=timeout,
        env=tool_env("GH_TOKEN", "GITHUB_TOKEN"),
    )
    if proc.returncode != 0:
        raise GhError(f"gh api {method} {path} failed ({proc.returncode}): {proc.stderr.strip()[:500]}")
    if raw:
        return proc.stdout
    data = json.loads(proc.stdout) if proc.stdout.strip() else None
    return _flatten(data) if paginate else data
