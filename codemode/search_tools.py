#!/usr/bin/env python3
"""Find code-mode tools and saved skills by name or keyword, without loading every definition.

    python3 codemode/search_tools.py ci log            # names + one-line descriptions
    python3 codemode/search_tools.py issues --names    # names only
    python3 codemode/search_tools.py job_log --full    # the matching files' source
    python3 codemode/search_tools.py                   # list everything (one line each)

Skills (codemode/skills/*/SKILL.md) are listed first: reuse before writing new code.
Reads files with `ast`; nothing is imported or called.
"""

from __future__ import annotations

import ast
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

KIT = Path(__file__).resolve().parent
Detail = Literal["names", "description", "full"]


@dataclass
class Entry:
    kind: str  # "skill" or "tool"
    name: str  # skill:<name> or <server>.<tool>
    summary: str
    signature: str
    path: Path

    def render(self, detail: Detail) -> str:
        rel = self.path.relative_to(KIT.parent)
        if detail == "names":
            return self.name
        if detail == "full":
            return f"=== {self.name}  ({rel})\n{self.path.read_text(encoding='utf-8').rstrip()}\n"
        sig = f"  {self.signature}" if self.signature else ""
        return f"{self.name}{sig}\n    {self.summary}  [{rel}]"


def _tool(path: Path) -> Entry:
    tree = ast.parse(path.read_text(encoding="utf-8"))
    summary = (ast.get_docstring(tree) or "").strip().splitlines()[0:1]
    signature = ""
    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and node.name == path.stem:
            signature = f"{node.name}({ast.unparse(node.args)})"
            if node.returns is not None:
                signature += f" -> {ast.unparse(node.returns)}"
    return Entry("tool", f"{path.parent.name}.{path.stem}", summary[0] if summary else "", signature, path)


def _skill(path: Path) -> Entry:
    text = path.read_text(encoding="utf-8")
    meta = dict(re.findall(r"^(name|description):\s*(.+)$", text.split("---", 2)[1] if text.startswith("---") else "", re.M))
    name = meta.get("name", path.parent.name)
    return Entry("skill", f"skill:{name}", meta.get("description", "").strip(), "", path)


def index() -> list[Entry]:
    skills = [_skill(p) for p in sorted((KIT / "skills").glob("*/SKILL.md"))]
    tools = [
        _tool(p)
        for p in sorted((KIT / "servers").glob("*/*.py"))
        if not p.stem.startswith("_") and p.stem != "__init__"
    ]
    return skills + tools


def search_tools(query: str = "", detail: Detail = "description", limit: int = 15) -> list[str]:
    """Rank tools and skills by keyword hits in name (x3) and description; skills win ties."""
    words = [w for w in re.split(r"[\s,]+", query.lower()) if w]
    scored = []
    for e in index():
        hay_name, hay_text = e.name.lower().replace("_", " "), e.summary.lower()
        score = sum(3 * (w in hay_name or w in e.name.lower()) + (w in hay_text) for w in words)
        if score or not words:
            scored.append((score + (0.5 if e.kind == "skill" else 0), e))
    scored.sort(key=lambda x: -x[0])
    return [e.render(detail) for _, e in scored[:limit]]


def main(argv: list[str]) -> int:
    if argv and argv[0] in ("-h", "--help"):
        print(__doc__.strip())
        return 0
    detail: Detail = "names" if "--names" in argv else "full" if "--full" in argv else "description"
    query = " ".join(a for a in argv if not a.startswith("--"))
    hits = search_tools(query, detail, limit=5 if detail == "full" else 50 if not query else 15)
    print("\n".join(hits) if hits else f"no tools or skills match {query!r}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
