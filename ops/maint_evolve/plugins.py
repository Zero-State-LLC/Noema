from __future__ import annotations

import hashlib
import importlib
import sys
from pathlib import Path

# Enabled plugins may expose after_look(obs) -> list[str] hints only.
# They must not send HTTP, hold tokens, or choose verbs for patrol to execute.


def write_proposed(proposed_dir: Path, name: str, source: str, why: str) -> Path:
    """Write a proposed plugin (.py + sidecar .md with content hash). Never imported."""
    proposed_dir = Path(proposed_dir)
    proposed_dir.mkdir(parents=True, exist_ok=True)
    py_path = proposed_dir / f"{name}.py"
    md_path = proposed_dir / f"{name}.md"
    digest = hashlib.sha256(source.encode("utf-8")).hexdigest()
    py_path.write_text(source, encoding="utf-8")
    md_path.write_text(
        f"why: {why}\ncontent_hash: sha256:{digest}\ntests_run: none\n",
        encoding="utf-8",
    )
    return py_path


def load_enabled_hints(enabled_dir: Path, obs: dict) -> list[str]:
    """Import after_look from plugins/enabled only; never add proposed to sys.path."""
    enabled_dir = Path(enabled_dir)
    if not enabled_dir.is_dir():
        return []

    hints: list[str] = []
    # Copy sys.path and prepend enabled_dir only (never proposed/).
    path_copy = [str(enabled_dir.resolve()), *sys.path]
    saved_path = sys.path[:]
    loaded: list[str] = []
    try:
        sys.path[:] = path_copy
        for py in sorted(enabled_dir.glob("*.py")):
            if py.name.startswith("_"):
                continue
            mod_name = py.stem
            sys.modules.pop(mod_name, None)
            mod = importlib.import_module(mod_name)
            loaded.append(mod_name)
            after = getattr(mod, "after_look", None)
            if not callable(after):
                continue
            raw = after(obs)
            hints.extend(_coerce_hints(raw))
    finally:
        sys.path[:] = saved_path
        for mod_name in loaded:
            sys.modules.pop(mod_name, None)
    return hints


def _coerce_hints(raw: object) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, str):
        return [raw]
    if isinstance(raw, (list, tuple)):
        return [str(x) for x in raw]
    return [str(raw)]
