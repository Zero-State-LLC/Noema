# Phosphor Cartography assets

Still photography is atmospheric only. Live WATCH topology is the Phosphor canvas + `watch-live/1.0` text. The 14-mark catalog and spectator key live in `src/presentation/glyphs.ts` (`legendHtml()`, `#world-key`).

| File | Use |
|------|-----|
| `hero-table.jpg` | Home full-bleed still (source of `og-table.jpg`) |
| `og-table.jpg` | Open Graph / Twitter card: 1200x630 crop of `hero-table.jpg` (hero's 38% vertical bias) |
| `icon.svg`, `icon-192.png`, `icon-512.png` | Placeholder "N" mark (Syne 700, `--ink` on `--void`) for the favicon set and `site.webmanifest`; `favicon.ico` and `apple-touch-icon.png` sit at the public root |
| `hero-phosphor.jpg` | Legacy Home still |
| `play-chamber.jpg` | PLAY door atmosphere (not the Chamber) |
| `study-traces.jpg` | STUDY still |
| `topology-bg.jpg` | Low-contrast page ground |
| `anomaly-signal.jpg` | Isolated signal |
| `og-social.jpg` | Legacy Open Graph crop — not the live card |
| `hero-noema.jpg` | Legacy OG alias of `og-social.jpg` |
| `watch-map-gl.js` | MAP-only Three.js stage. Built by `npm run build:map-gl`. TEXT/PIXEL never load it. |
| `watch-stage.js` | WATCH Chamber stage (`?mode=3d`), one Three.js chunk, at most 160 KiB gzip (Noema-Specs `specify/watch-single-3d-stage.md`). Built by `npm run build:watch-stage`. Loaded only when the spectator picks 3D. |
| `THREE-LICENSE.txt` | three.js MIT license for the bundled Three.js chunks. |

`scripts/build-phosphor-assets.py` copies stills only. It does not emit raster glyph sheets or a second key. PLAY, WATCH, and Admin Watch agents use the live SVG catalog.
