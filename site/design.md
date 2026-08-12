# Design — NOEMA Runtime site

Locked system for `site/` (GitHub Pages). Distinct from Zero State marketing paper/highway; this is the engine-room surface for the runtime pin.

## Genre

**Modern-minimal / workbench-dark.** Quiet, structural, exact. One chromatic accent.

## Theme (tokens)

| Token | Value | Role |
|---|---|---|
| `--ink` | `#0a0e14` | Page void |
| `--ink-2` | `#121820` | Raised surface |
| `--panel` | `#161d28` | Frames / tables |
| `--line` | `#2c3544` | Rules |
| `--bone` | `#e6e1d4` | Primary text |
| `--muted` | `#9a9486` | Secondary text |
| `--accent` | `#c4784a` | **Sole** chromatic signal (copper) |
| `--accent-ink` | `#0a0e14` | Text on accent fills |
| `--ok` | `#6b9b6e` | Status only (verify pass) — not decorative accent |

No violet, no ice-cyan accent, no multi-hue chip rainbow. Links use `--accent`. Mono labels use `--muted`.

## Typography

- **Display:** Fraunces (serif), roman only — never italic in headings
- **Body:** Source Sans 3
- **Mono:** IBM Plex Mono — code, paths, meta, table heads only
- Ceiling: three families

## Macrostructure family

| Page | Macrostructure | Path |
|---|---|---|
| Home | **Workbench** | `index.html` |
| Specs map | **Long Document** | `memo.html` |

## Nav / footer

- Nav: edge-minimal — wordmark + few destinations (Repo, Specs, Start, Memo). No 10-link SaaS bar.
- Footer: dense colophon (Ft4), not four-column Product/Company/Legal.

## Hard bans (Hallmark)

- No section mono eyebrows on every block
- No equal 3-column feature-card grids
- No thick left colour side-stripes on cards
- No infinite auto-marquee without pause
- No glass sticky header blur
- No italic emphasis word inside `h1`
- No re-drawn OS browser chrome (traffic lights / fake title bars)
- No invented metrics

## Stamp

CSS must open with:

```css
/* Hallmark · macrostructure: Workbench | Long Document · genre: modern-minimal · theme: noema-ledger-dark · accent: copper · design-system: site/design.md · pre-emit critique: P4 H4 E4 S4 R4 V4 · contrast: pass · nav: edge-minimal · footer: Ft4 · slop: remediated · mobile: pass */
```
