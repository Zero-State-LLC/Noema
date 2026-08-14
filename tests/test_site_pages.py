"""GitHub Pages site/ first-read is a world door, not a research brochure."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = (ROOT / "site" / "index.html").read_text(encoding="utf-8")


def _first_read(html: str) -> str:
    html = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    html = re.sub(r"<style[\s\S]*?</style>", " ", html, flags=re.I)
    html = re.sub(r"<[^>]+>", " ", html)
    return html


def test_pages_index_is_world_door():
    assert "Perihelion Reach" in INDEX
    assert "Enter the world" in INDEX
    assert "https://noema.guru" in INDEX
    assert "The world is the text" not in INDEX
    assert "path-rail" not in INDEX
    assert 'id="fx"' not in INDEX
    assert "Choose PLAY, WATCH, or STUDY first" not in INDEX
    assert "site.js" not in INDEX


def test_pages_index_first_read_omits_research_vocabulary():
    hay = _first_read(INDEX).lower()
    for word in (
        "apparatus",
        "ledger",
        "conformance",
        "capability",
        "evidence boundary",
        "humans & agents",
        "stage 0",
        "notice",
        "capture",
        "research",
        "experimental",
    ):
        assert word not in hay, word
