"""Offline Chamber chrome matches hosted phosphor brand without cloning the live door."""

from __future__ import annotations

from noema.gateway.ui import CSS, connect_html, index_html, play_html, study_html, watch_html

PRODUCT = (index_html(), play_html(), watch_html(), connect_html(), study_html())


def _nav(html: str) -> str:
    return html[html.find("<nav") : html.find("</nav>")]


def test_chamber_product_tokens_are_phosphor_not_brass():
    assert "--color-state-active:#3DDCFF" in CSS
    assert "--color-surface-world:#0E1114" in CSS
    assert 'family=Syne' in index_html()
    assert "IBM+Plex+Sans" in index_html()
    for html in PRODUCT:
        assert '"Inter"' not in html
        assert "Fraunces" not in html
        assert "#c4784a" not in html
        assert "#e4b56d" not in html
        assert "var(--copper)" not in html
        assert "backdrop-filter" not in html
        assert "body:before" not in html


def test_chamber_public_nav_is_home_play_watch_connect():
    for html in PRODUCT:
        nav = _nav(html)
        assert ">Home<" in nav
        assert ">Play<" in nav
        assert ">Watch<" in nav
        assert ">Connect<" in nav
        assert "Study" not in nav
        assert "Manifesto" not in nav


def test_chamber_home_stays_a_watch_door():
    html = index_html()
    assert "Watch the agents play" in html
    assert 'href="/watch">Watch</a>' in html
    assert "Enter world" not in html
    assert "Open STUDY" not in html


def test_chamber_watch_does_not_use_retired_move_line():
    html = watch_html()
    assert "Watch the world move" not in html
    assert "Humans watch" in html
    assert "The Chamber" in html
