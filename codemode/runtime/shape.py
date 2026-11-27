"""Filter and aggregate big tool results in code; print only what the task needs."""

from __future__ import annotations

import re
from collections import Counter
from typing import Any, Callable, Iterable

_ANSI = re.compile(r"\x1b\[[0-9;?]*[A-Za-z]|\[[0-9;]{1,12}m")
_TS = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z ")


def get(row: Any, path: str, default: Any = None) -> Any:
    """Dotted lookup: get(issue, "user.login"), get(run, "head_commit.id")."""
    cur = row
    for part in path.split("."):
        if isinstance(cur, dict):
            cur = cur.get(part, default)
        elif isinstance(cur, list) and part.isdigit() and int(part) < len(cur):
            cur = cur[int(part)]
        else:
            return default
    return cur


def pick(rows: Iterable[dict[str, Any]], *fields: str) -> list[dict[str, Any]]:
    """Keep only the named (dotted) fields of each row."""
    return [{f: get(r, f) for f in fields} for r in rows]


def count_by(rows: Iterable[Any], key: str | Callable[[Any], Any]) -> list[tuple[Any, int]]:
    """Counts per key, most common first. A key returning a list counts each item."""
    counter: Counter[Any] = Counter()
    for row in rows:
        value = key(row) if callable(key) else get(row, key)
        for item in value if isinstance(value, (list, tuple, set)) else [value]:
            counter[item] += 1
    return counter.most_common()


def table(rows: list[dict[str, Any]], fields: list[str] | None = None, *, limit: int = 30, width: int = 60) -> str:
    """Plain-text table, truncated to `limit` rows and `width` chars per cell."""
    if not rows:
        return "(no rows)"
    fields = fields or list(rows[0])

    def cell(v: Any) -> str:
        s = "" if v is None else str(v).replace("\n", " ")
        return s if len(s) <= width else s[: width - 1] + "…"

    body = [[cell(get(r, f)) for f in fields] for r in rows[:limit]]
    widths = [max(len(f), *(len(row[i]) for row in body)) for i, f in enumerate(fields)]
    lines = ["  ".join(f.ljust(w) for f, w in zip(fields, widths))]
    lines += ["  ".join(c.ljust(w) for c, w in zip(row, widths)) for row in body]
    if len(rows) > limit:
        lines.append(f"… {len(rows) - limit} more rows")
    return "\n".join(lines)


def clean_log(text: str) -> list[str]:
    """Strip ANSI colour codes and GitHub Actions timestamps; return lines."""
    return [_TS.sub("", _ANSI.sub("", line)) for line in text.splitlines()]


def grep_log(
    text: str | list[str],
    patterns: list[str],
    *,
    context: int = 0,
    max_lines: int = 60,
    ignore_case: bool = True,
) -> list[str]:
    """Lines matching any pattern, with optional context, capped at max_lines."""
    lines = clean_log(text) if isinstance(text, str) else text
    rx = re.compile("|".join(f"(?:{p})" for p in patterns), re.I if ignore_case else 0)
    keep: set[int] = set()
    for i, line in enumerate(lines):
        if rx.search(line):
            keep.update(range(max(0, i - context), min(len(lines), i + context + 1)))
    out = [lines[i] for i in sorted(keep)]
    if len(out) > max_lines:
        out = out[:max_lines] + [f"… {len(out) - max_lines} more matching lines"]
    return out
