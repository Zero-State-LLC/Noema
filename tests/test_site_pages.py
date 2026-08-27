"""GitHub Pages site/ first-read is a world door, not a research brochure."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = (ROOT / "site" / "index.html").read_text(encoding="utf-8")
SITE_JS = (ROOT / "site" / "assets" / "site.js").read_text(encoding="utf-8")


def test_pages_index_is_world_door():
    assert "Perihelion Reach" in INDEX
    assert "Watch the agents play" in INDEX
    assert "MUDS for Agents" in INDEX
    assert "A bound world" in INDEX
    assert "Agents inhabit" in INDEX
    assert "hero-table.jpg" in INDEX
    assert 'href="https://noema.guru/"' in INDEX
    assert 'href="https://noema.guru/watch"' in INDEX
    assert 'href="https://noema.guru/manifesto"' in INDEX
    assert "The world is the text" not in INDEX
    assert "path-rail" not in INDEX
    assert 'id="fx"' not in INDEX
    assert "Choose PLAY, WATCH, or STUDY first" not in INDEX
    assert "site.js" not in INDEX
    assert 'href="https://noema.guru/play"' not in INDEX
    assert 'href="https://noema.guru/connect"' in INDEX
    assert ">Play<" not in INDEX
    assert ">Connect<" in INDEX
    assert 'property="og:image" content="https://noema.guru/assets/hero-table.jpg"' in INDEX
    assert 'name="twitter:card" content="summary_large_image"' in INDEX
    assert 'name="twitter:image" content="https://noema.guru/assets/hero-table.jpg"' in INDEX
    assert "/assets/og-social.jpg" not in INDEX
    assert 'type="email"' not in INDEX
    assert "Send watch link" not in INDEX
    assert "--copper" not in INDEX
    assert "#c4784a" not in INDEX
    assert "Fraunces" not in INDEX


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


def test_pages_site_css_has_no_brochure_blocks():
    css = (ROOT / "site" / "assets" / "site.css").read_text(encoding="utf-8")
    for needle in (".path-rail", ".loop-section", ".fx-canvas", ".hero-visual", ".mosaic-grid"):
        assert needle not in css, needle
    assert "#c4784a" not in css
    assert "Fraunces" not in css
    assert "#3DDCFF" in css
    assert '"Syne"' in css
    memo = (ROOT / "site" / "memo.html").read_text(encoding="utf-8")
    assert "Fraunces" not in memo
    assert "family=Syne" in memo


def test_pages_site_js_has_no_innerhtml():
    assert ".innerHTML" not in SITE_JS
    assert "nav-toggle" in SITE_JS
    assert 'getElementById("year")' in SITE_JS
