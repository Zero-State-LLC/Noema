#!/usr/bin/env python3
"""Copy Phosphor Cartography still photography into public/assets.

Marks and keys live in workers/noema/src/presentation/glyphs.ts
(legendHtml / glyphMeta). This script does not draw raster legends.
"""

from __future__ import annotations

import shutil
from pathlib import Path

SRC = Path(
    "/home/scrimshawlife/.grok/sessions/"
    "%2Fhome%2Fscrimshawlife/01a001e5-ebbe-78f2-8694-04f4b8349d83/images"
)
OUT = Path(__file__).resolve().parents[1] / "public" / "assets"

STILLS = {
    "1.jpg": "hero-phosphor.jpg",
    "9.jpg": "watch-spectator.jpg",
    "5.jpg": "play-chamber.jpg",
    "7.jpg": "study-traces.jpg",
    "3.jpg": "topology-bg.jpg",
    "6.jpg": "anomaly-signal.jpg",
    "8.jpg": "og-social.jpg",
}


def copy_stills() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for src_name, dest_name in STILLS.items():
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


if __name__ == "__main__":
    main()
