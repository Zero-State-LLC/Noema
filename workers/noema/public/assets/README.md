# Phosphor Cartography assets

Still photography is atmospheric only. Live WATCH topology is the Phosphor canvas + `watch-live/1.0` text. The 14-mark catalog and spectator key live in `src/presentation/glyphs.ts` (`legendHtml()`, `#world-key`).

| File | Use |
|------|-----|
| `hero-table.jpg` | Home full-bleed still and Open Graph / Twitter card |
| `hero-phosphor.jpg` | Legacy Home still |
| `watch-spectator.jpg` | WATCH atmosphere (not the live map) |
| `play-chamber.jpg` | PLAY door atmosphere (not the Chamber) |
| `study-traces.jpg` | STUDY still |
| `topology-bg.jpg` | Low-contrast page ground |
| `anomaly-signal.jpg` | Isolated signal |
| `og-social.jpg` | Legacy Open Graph crop — not the live card |
| `hero-noema.jpg` | Legacy OG alias of `og-social.jpg` |

`scripts/build-phosphor-assets.py` copies stills only. It does not emit raster glyph sheets or a second key. PLAY, WATCH, and Admin Watch agents use the live SVG catalog.
