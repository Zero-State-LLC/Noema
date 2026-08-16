#!/usr/bin/env python3
"""Build Phosphor Cartography glyph sheets and spectator legends.

Scene stills are copied from the session Imagine outputs. Glyphs and
legend labels are drawn here so marks stay crisp and words stay exact.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SRC = Path(
    "/home/scrimshawlife/.grok/sessions/"
    "%2Fhome%2Fscrimshawlife/01a001e5-ebbe-78f2-8694-04f4b8349d83/images"
)
OUT = Path(__file__).resolve().parents[1] / "public" / "assets"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

GROUND = (10, 14, 20, 255)
COPPER = (196, 122, 58, 255)
AMBER = (232, 160, 80, 255)
DIM = (196, 122, 58, 115)
PALE = (236, 230, 216, 255)
CYAN = (180, 210, 208, 220)
VOID = (10, 14, 20, 0)

CELL = 12
SCALE = 6
PAD = 4


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT, size)


def blank(w: int, h: int, color=VOID) -> Image.Image:
    return Image.new("RGBA", (w, h), color)


def px(draw: ImageDraw.ImageDraw, pts: list[tuple[int, int]], color) -> None:
    for x, y in pts:
        if 0 <= x < CELL and 0 <= y < CELL:
            draw.point((x, y), fill=color)


def line(draw: ImageDraw.ImageDraw, x0: int, y0: int, x1: int, y1: int, color) -> None:
    draw.line((x0, y0, x1, y1), fill=color, width=1)


def rect(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], color, fill=None) -> None:
    draw.rectangle(box, outline=color, fill=fill)


# --- 12×12 glyph bitmaps (logical pixels) ---------------------------------

def g_diamond(d, c=COPPER):
    line(d, 6, 1, 10, 6, c)
    line(d, 10, 6, 6, 10, c)
    line(d, 6, 10, 2, 6, c)
    line(d, 2, 6, 6, 1, c)


def g_chevron(d, c=PALE):
    line(d, 3, 3, 8, 6, c)
    line(d, 8, 6, 3, 9, c)
    line(d, 5, 3, 10, 6, c)
    line(d, 10, 6, 5, 9, c)


def g_fork(d, c=COPPER):
    line(d, 6, 10, 6, 6, c)
    line(d, 6, 6, 2, 2, c)
    line(d, 6, 6, 10, 2, c)


def g_broken_ring(d, c=COPPER):
    line(d, 4, 2, 8, 2, c)
    line(d, 8, 2, 10, 5, c)
    line(d, 10, 7, 8, 10, c)
    line(d, 8, 10, 4, 10, c)
    line(d, 4, 10, 2, 7, c)
    line(d, 2, 5, 4, 2, c)


def g_asymm_cross(d, c=COPPER):
    line(d, 6, 1, 6, 10, c)
    line(d, 2, 5, 10, 5, c)
    line(d, 6, 1, 8, 1, c)


def g_nested(d, c=COPPER):
    g_diamond(d, c)
    line(d, 6, 4, 8, 6, c)
    line(d, 8, 6, 6, 8, c)
    line(d, 6, 8, 4, 6, c)
    line(d, 4, 6, 6, 4, c)


def g_cut_circle(d, c=COPPER):
    line(d, 4, 2, 8, 2, c)
    line(d, 8, 2, 10, 5, c)
    line(d, 10, 5, 10, 7, c)
    line(d, 10, 7, 8, 10, c)
    line(d, 8, 10, 4, 10, c)
    line(d, 4, 10, 2, 7, c)
    line(d, 2, 7, 2, 5, c)
    line(d, 2, 5, 4, 2, c)


def g_tri(d, c=COPPER):
    line(d, 6, 2, 10, 10, c)
    line(d, 10, 10, 2, 10, c)
    line(d, 2, 10, 6, 2, c)


def g_bars(d, c=COPPER):
    line(d, 3, 4, 9, 4, c)
    line(d, 3, 7, 9, 7, c)


def g_zig(d, c=COPPER):
    line(d, 2, 8, 5, 3, c)
    line(d, 5, 3, 7, 8, c)
    line(d, 7, 8, 10, 3, c)


def g_notch_sq(d, c=COPPER):
    line(d, 2, 2, 5, 2, c)
    line(d, 7, 2, 10, 2, c)
    line(d, 10, 2, 10, 10, c)
    line(d, 10, 10, 2, 10, c)
    line(d, 2, 10, 2, 2, c)


def g_arrow(d, c=AMBER):
    line(d, 2, 6, 9, 6, c)
    line(d, 9, 6, 6, 3, c)
    line(d, 9, 6, 6, 9, c)


def g_plus_cut(d, c=COPPER):
    line(d, 6, 2, 6, 10, c)
    line(d, 2, 6, 6, 6, c)


def g_diamond_hole(d, c=COPPER):
    g_diamond(d, c)
    d.point((6, 6), fill=c)


def g_tri_dots(d, c=COPPER):
    d.point((6, 3), fill=c)
    d.point((3, 9), fill=c)
    d.point((9, 9), fill=c)


def g_bracket(d, c=COPPER):
    line(d, 4, 2, 8, 2, c)
    line(d, 4, 2, 4, 10, c)
    line(d, 4, 10, 8, 10, c)


def g_hourglass(d, c=COPPER):
    line(d, 3, 2, 9, 2, c)
    line(d, 3, 10, 9, 10, c)
    line(d, 3, 2, 9, 10, c)
    line(d, 9, 2, 3, 10, c)


def g_split(d, c=COPPER):
    line(d, 6, 1, 10, 6, c)
    line(d, 10, 6, 6, 10, c)
    line(d, 6, 1, 2, 6, c)
    line(d, 2, 6, 6, 10, c)


def g_carets(d, c=PALE):
    line(d, 3, 5, 6, 2, c)
    line(d, 6, 2, 9, 5, c)
    line(d, 3, 9, 6, 6, c)
    line(d, 6, 6, 9, 9, c)


def g_ring_stem(d, c=COPPER):
    g_cut_circle(d, c)
    line(d, 6, 10, 6, 11, c)


PLAYER = [
    ("player", g_diamond),
    ("chevron", g_chevron),
    ("fork", g_fork),
    ("broken-ring", g_broken_ring),
    ("cross", g_asymm_cross),
    ("nested", g_nested),
    ("cut-circle", g_cut_circle),
    ("tri", g_tri),
    ("bars", g_bars),
    ("zig", g_zig),
    ("notch", g_notch_sq),
    ("arrow", g_arrow),
    ("plus-cut", g_plus_cut),
    ("core", g_diamond_hole),
    ("dots", g_tri_dots),
    ("bracket", g_bracket),
    ("hourglass", g_hourglass),
    ("split", g_split),
    ("carets", g_carets),
    ("stem", g_ring_stem),
]

ENTITY = [
    ("machine", lambda d, c=COPPER: (rect(d, (2, 2, 10, 10), c), line(d, 6, 4, 6, 8, c), line(d, 4, 6, 8, 6, c))),
    ("relay", lambda d, c=COPPER: (g_diamond(d, c), line(d, 2, 6, 10, 6, c))),
    ("terminal", lambda d, c=COPPER: (rect(d, (2, 2, 10, 8), c), line(d, 3, 10, 9, 10, c))),
    ("market", lambda d, c=COPPER: (line(d, 3, 5, 6, 2, c), line(d, 6, 2, 9, 5, c), line(d, 3, 9, 6, 6, c), line(d, 6, 6, 9, 9, c))),
    ("repair", lambda d, c=COPPER: (rect(d, (2, 2, 10, 10), c), line(d, 3, 9, 9, 3, c))),
    ("gate", lambda d, c=COPPER: (line(d, 3, 10, 3, 3, c), line(d, 9, 10, 9, 3, c), line(d, 3, 3, 9, 3, c))),
    ("institution", lambda d, c=COPPER: (rect(d, (2, 2, 10, 10), c), rect(d, (4, 4, 8, 8), c))),
    ("archive", lambda d, c=COPPER: (line(d, 3, 3, 9, 3, c), line(d, 3, 6, 9, 6, c), line(d, 3, 9, 9, 9, c))),
    ("anomaly", lambda d, c=AMBER: (g_broken_ring(d, c), d.point((6, 6), fill=PALE))),
    ("unknown", lambda d, c=DIM: (line(d, 2, 6, 6, 1, c), line(d, 6, 1, 10, 6, c), line(d, 10, 6, 6, 10, c))),
    ("signal", lambda d, c=PALE: (g_cut_circle(d, c), rect(d, (4, 4, 8, 8), CYAN))),
    ("resource", lambda d, c=COPPER: (rect(d, (4, 3, 8, 7), c, fill=c), line(d, 6, 7, 6, 10, c))),
]


def render_cell(fn, color=COPPER) -> Image.Image:
    img = blank(CELL, CELL)
    d = ImageDraw.Draw(img)
    fn(d, color)
    return img.resize((CELL * SCALE, CELL * SCALE), Image.Resampling.NEAREST)


def sheet(items: list[tuple[str, object]], cols: int) -> Image.Image:
    rows = (len(items) + cols - 1) // cols
    cw = CELL * SCALE + PAD * 2
    ch = CELL * SCALE + PAD * 2
    img = blank(cols * cw, rows * ch)
    for i, (_name, fn) in enumerate(items):
        r, c = divmod(i, cols)
        cell = render_cell(fn)
        img.alpha_composite(cell, (c * cw + PAD, r * ch + PAD))
    return img


def draw_mark(canvas: Image.Image, x: int, y: int, fn, color=COPPER) -> None:
    cell = render_cell(fn, color)
    canvas.alpha_composite(cell, (x, y))


def site_known(d, c=COPPER):
    rect(d, (2, 2, 10, 10), c, fill=(*c[:3], 70))


def site_active(d, c=AMBER):
    rect(d, (2, 2, 10, 10), c, fill=(*c[:3], 140))


def site_empty(d, c=DIM):
    rect(d, (2, 2, 10, 10), c)


def site_partial(d, c=COPPER):
    line(d, 2, 2, 10, 2, c)
    line(d, 10, 2, 10, 10, c)
    line(d, 10, 10, 2, 10, c)


def route_known(d, c=DIM):
    line(d, 1, 6, 11, 6, c)


def route_uncertain(d, c=DIM):
    for x in range(1, 12, 2):
        d.point((x, 6), fill=c)


def route_active(d, c=AMBER):
    line(d, 1, 6, 11, 6, c)
    line(d, 1, 5, 11, 5, (*c[:3], 80))


def ev_move(d, c=COPPER):
    g_arrow(d, c)


def ev_trade(d, c=COPPER):
    line(d, 2, 6, 10, 6, c)
    line(d, 4, 4, 2, 6, c)
    line(d, 4, 8, 2, 6, c)
    line(d, 8, 4, 10, 6, c)
    line(d, 8, 8, 10, 6, c)


def ev_conflict(d, c=AMBER):
    line(d, 3, 3, 9, 9, c)
    line(d, 9, 3, 3, 9, c)


def ev_repair(d, c=COPPER):
    line(d, 6, 2, 6, 10, c)
    line(d, 3, 6, 9, 6, c)


def ev_signal(d, c=PALE):
    g_cut_circle(d, c)


def ev_discover(d, c=AMBER):
    g_diamond(d, c)
    d.point((6, 6), fill=PALE)


def ev_major(d, c=AMBER):
    g_broken_ring(d, c)
    d.point((6, 6), fill=PALE)


def legend_cell(fn, color=COPPER) -> Image.Image:
    img = blank(CELL, CELL)
    d = ImageDraw.Draw(img)
    fn(d, color)
    return img.resize((32, 32), Image.Resampling.NEAREST)


def row_at(canvas: Image.Image, draw: ImageDraw.ImageDraw, x: int, y: int, fn, label: str, color=COPPER) -> None:
    canvas.alpha_composite(legend_cell(fn, color), (x, y))
    draw.text((x + 40, y + 8), label, font=font(13), fill=PALE)


def section_at(draw: ImageDraw.ImageDraw, x: int, y: int, title: str, width: int) -> int:
    draw.text((x, y), title.upper(), font=font(11), fill=COPPER)
    draw.line((x, y + 16, x + width, y + 16), fill=(*COPPER[:3], 70), width=1)
    return y + 26


def build_legend() -> Image.Image:
    img = blank(760, 900, GROUND)
    d = ImageDraw.Draw(img)
    d.rectangle((8, 8, 751, 891), outline=(*COPPER[:3], 90))
    d.text((24, 20), "PUBLIC PROJECTION KEY", font=font(14), fill=AMBER)
    d.text((24, 40), "Function, not lore.", font=font(11), fill=DIM)

    left, right, col_w = 24, 392, 330
    y = section_at(d, left, 68, "A  Player", col_w)
    for fn, lab, col in (
        (g_diamond, "Player", COPPER),
        (g_chevron, "Active player", PALE),
        (g_carets, "Selected player", AMBER),
    ):
        row_at(img, d, left, y, fn, lab, col)
        y += 40

    y = section_at(d, left, y + 12, "C  Site", col_w)
    for fn, lab, col in (
        (site_known, "Known site", COPPER),
        (site_active, "Active site", AMBER),
        (site_partial, "Uncertain site", COPPER),
        (site_empty, "Quiet site", DIM),
    ):
        row_at(img, d, left, y, fn, lab, col)
        y += 40

    y = section_at(d, left, y + 12, "D  Route", col_w)
    for fn, lab, col in (
        (route_known, "Known route", DIM),
        (route_uncertain, "Uncertain route", DIM),
        (route_active, "Recent movement", AMBER),
    ):
        row_at(img, d, left, y, fn, lab, col)
        y += 40

    y = section_at(d, left, y + 12, "F  Emphasis", col_w)
    d.text((left, y + 4), "Dim    inactive", font=font(13), fill=DIM)
    d.text((left, y + 26), "Bright active", font=font(13), fill=AMBER)
    d.text((left, y + 48), "Pulse  major event", font=font(13), fill=PALE)
    d.text((left, y + 70), "Fade   recent activity", font=font(13), fill=COPPER)

    y = section_at(d, right, 68, "B  Object", col_w)
    labels = {
        "machine": "Machine",
        "relay": "Relay",
        "terminal": "Terminal",
        "market": "Market",
        "repair": "Repair station",
        "gate": "Gate",
        "institution": "Institution",
        "archive": "Archive",
        "anomaly": "Anomaly",
        "unknown": "Unknown object",
        "signal": "Signal source",
        "resource": "Resource node",
    }
    for name, fn in ENTITY:
        row_at(img, d, right, y, fn, labels[name], AMBER if name in {"anomaly", "signal"} else COPPER)
        y += 38

    y = section_at(d, right, y + 12, "E  Event", col_w)
    for fn, lab, col in (
        (ev_move, "Movement", COPPER),
        (ev_trade, "Trade", COPPER),
        (ev_conflict, "Refusal / conflict", AMBER),
        (ev_repair, "Repair", COPPER),
        (ev_signal, "Signal", PALE),
        (ev_discover, "Discovery", AMBER),
        (ev_major, "Major event", AMBER),
    ):
        row_at(img, d, right, y, fn, lab, col)
        y += 38
    return img


def build_mini() -> Image.Image:
    img = blank(1100, 168, GROUND)
    d = ImageDraw.Draw(img)
    d.rectangle((6, 6, 1093, 161), outline=(*COPPER[:3], 90))
    d.text((20, 14), "WATCH KEY", font=font(12), fill=AMBER)
    items = [
        (g_diamond, "Player", COPPER),
        (site_active, "Active site", AMBER),
        (site_partial, "Uncertain site", COPPER),
        (route_known, "Route", DIM),
        (route_active, "Recent movement", AMBER),
        (ev_signal, "Signal", PALE),
        (ev_major, "Anomaly", AMBER),
    ]
    x = 20
    for fn, lab, col in items:
        draw_mark(img, x, 48, fn, col)
        d.text((x, 130), lab, font=font(11), fill=PALE)
        x += 154
    return img


def copy_stills() -> None:
    mapping = {
        "1.jpg": "hero-phosphor.jpg",
        "9.jpg": "watch-spectator.jpg",
        "5.jpg": "play-chamber.jpg",
        "7.jpg": "study-traces.jpg",
        "3.jpg": "topology-bg.jpg",
        "6.jpg": "anomaly-signal.jpg",
        "8.jpg": "og-social.jpg",
    }
    OUT.mkdir(parents=True, exist_ok=True)
    for src_name, dest_name in mapping.items():
        src = SRC / src_name
        if not src.exists():
            raise SystemExit(f"missing still {src}")
        dest = OUT / dest_name
        shutil.copy2(src, dest)
        print("copied", dest_name, dest.stat().st_size)
    shutil.copy2(OUT / "og-social.jpg", OUT / "hero-noema.jpg")
    print("replaced hero-noema.jpg with og-social")


def main() -> None:
    copy_stills()
    players = sheet(PLAYER, 5)
    entities = sheet(ENTITY, 6)
    players.save(OUT / "glyphs-players.png")
    entities.save(OUT / "glyphs-entities.png")
    build_legend().save(OUT / "legend.png")
    build_mini().save(OUT / "legend-mini.png")
    for name in (
        "glyphs-players.png",
        "glyphs-entities.png",
        "legend.png",
        "legend-mini.png",
    ):
        print("wrote", name, (OUT / name).stat().st_size)


if __name__ == "__main__":
    main()
