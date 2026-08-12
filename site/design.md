# Design — NOEMA Runtime site

Locked system for `site/` (GitHub Pages). Distinct from Zero State paper/highway marketing; NOEMA uses a dark ledger splash.

## Genre

**Modern-minimal / atmospheric-dark.** Cinematic restraint. One chromatic accent.

## Theme (tokens)

| Token | Value | Role |
|---|---|---|
| `--ink` | `#0a0e14` | Page void |
| `--ink-2` | `#121820` | Raised surface |
| `--panel` | `#161d28` | Panels |
| `--line` | `#2c3544` | Rules |
| `--bone` | `#e6e1d4` | Primary text |
| `--muted` | `#9a9486` | Secondary text |
| `--accent` | `#c4784a` | **Sole** chromatic signal (copper) |
| `--accent-ink` | `#0a0e14` | Text on accent fills |
| `--ok` | `#6b9b6e` | Status only |

No violet, no ice multi-accent rainbow. Links use `--accent`.

## Typography

- **Display:** Fraunces — roman only on headings
- **Body:** Source Sans 3
- **Mono:** IBM Plex Mono — meta and code only
- Ceiling: three families

## Macrostructure family

| Page | Macrostructure | Path |
|---|---|---|
| Home | **Marquee Hero** (marketing splash) | `index.html` |
| Specs map | **Long Document** | `memo.html` |

Home is a **landing page**, not a repo tour. Deep technical detail lives on the memo and on GitHub.

## Nav / footer

- Nav: edge-minimal — wordmark + Start · Specs · Memo · GitHub
- Footer: dense colophon (Ft4)

## Hard bans (Hallmark)

- No section mono eyebrows on every block
- No equal 3-column feature-card grids
- No thick left colour side-stripes
- No infinite auto-marquee
- No glass sticky header blur
- No italic emphasis word inside `h1`
- No re-drawn OS browser chrome
- No invented metrics / fake social proof
- No dumping CLI transcripts or JSON blobs on the landing page

## Stamp

```css
/* Hallmark · macrostructure: Marquee Hero | Long Document · genre: modern-minimal · theme: noema-ledger-dark · accent: copper · design-system: site/design.md */
```
