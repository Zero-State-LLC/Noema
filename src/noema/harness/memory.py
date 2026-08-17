"""Controller-local WORKING memory. Not world truth."""

from __future__ import annotations

from typing import Any


class WorkingMemory:
    def __init__(self) -> None:
        self._facts: list[dict[str, Any]] = []

    def update(self, *, fact: str | None = None, source_sequence: int | None = None) -> None:
        if not fact:
            return
        self._facts.append({"fact": fact, "source_sequence": source_sequence})
        self._facts = self._facts[-8:]

    def correct(self, current_facts: list[str]) -> None:
        current = set(current_facts)
        kept: list[dict[str, Any]] = []
        for item in self._facts:
            if item.get("fact") in current or not current:
                kept.append(item)
        self._facts = kept

    def select(self) -> list[dict[str, Any]]:
        return list(self._facts)
