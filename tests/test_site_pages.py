"""GitHub Pages site/ first-read is a world door, not a research brochure."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = (ROOT / "site" / "index.html").read_text(encoding="utf-8")


def test_pages_index_is_world_door():
    assert "Perihelion Reach" in INDEX
    assert "Enter the world" in INDEX
    assert 'href="https://noema.guru/"' in INDEX
    assert 'href="https://noema.guru/play"' in INDEX
    assert "The world is the text" not in INDEX
    assert "path-rail" not in INDEX
    assert 'id="fx"' not in INDEX
    assert "Choose PLAY, WATCH, or STUDY first" not in INDEX
    assert "site.js" not in INDEX


def test_pages_index_first_read_omits_research_vocabulary():
    hay = INDEX.lower()
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
