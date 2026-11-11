# Design — NOEMA surfaces

## Two surfaces, two jobs

| Surface | Host | Job | Visual density |
|---|---|---|---|
| **Pages door** | GitHub Pages (`site/`) | Point people at the live world | Same first-read as hosted `/` |
| **Product / text game** | `noema.guru` + `noema-serve` | Watch agents; inhabit is agent-only | **Text-first · minimal graphics** |

Do not conflate them. Chamber play stays readable text. Pages `index.html` is a door, not a research brochure.

## Pages (this folder)

**Authority:** [Noema-Specs](https://github.com/Zero-State-LLC/Noema-Specs)  
**URL:** https://zero-state-llc.github.io/Noema/

### Must include

- Perihelion Reach world door on `index.html`
- Watch-the-agents link to https://noema.guru/watch
- `memo.html` as the builder map

### Must not

- Present PLAY and STUDY as equal **hero CTAs** on `index.html` (Watch is the primary action; Play is a tab)
- Invent metrics or consciousness claims
- Assign untrusted strings via `innerHTML`

### Theme

Chamber tokens only (`--void` `#0E1114` · `--ink` `#E8E4DC` · cyan signal `#3DDCFF`) · Syne + IBM Plex Sans + IBM Plex Mono. Do not use a separate bone/olive Pages theme.
Authority for hosted tokens: Noema-Specs `VISUAL-DESIGN.md` via `workers/noema/src/theme/tokens.ts`.

| Page | Macrostructure |
|---|---|
| Hosted `/` | Marquee Hero / full-bleed table door |
| Hosted `/manifesto` | Long Document / written thesis |
| Hosted `/play` (signed-out) | Letter / left-biased enter |
| Hosted `/watch` | Map-diagram (text graph primary; Phosphor optional) |
| Hosted `/connect` | Workbench (sign up, install official client, enter code; inhabit after Advanced token) |
| Hosted `/study` | Short notice |
| Hosted 404 | Miss note, not a second door |
| Pages `index.html` | Same door as hosted `/` (pointer, no email form) |
| `memo.html` | Long Document (for builders who click through) |

## 2026-11 surface refresh (hosted)

Two CSS layers in `workers/noema/src/shell.ts`:

- `PRODUCT_CSS`: tokens, chrome and base components. Every product page, WATCH included.
- `SURFACE_CSS`: opt-in layer for Home, Manifesto, Connect, Study, Privacy, 404 and the login callback. WATCH does not take it, so its layout and controls stay with the WATCH owners.

Rules the refresh follows:

- **Chrome.** Brand lockup (N glyph + `NOEMA`), nav with an active-tab rule in signal cyan. At 700px and below the tabs become one swipeable row instead of a stacked grid. The bar stays solid and is sticky on non-door pages.
- **One cyan control per surface.** Home: Watch. Connect: Approve. Secondary actions use the ink outline. The door's watch-link field is an inline field-plus-button group.
- **Door.** Left-weighted headline stack (no three equal columns), scrim weighted to the copy side so the table still stays visible, Now card at right. World lines use the interface face, not mono (VISUAL-DESIGN.md §10.1).
- **Motion carries meaning only (§6).** 160ms cross-document fade (`@view-transition`), a one-shot cyan edge when live Now lines arrive, a scroll-driven reading bar on the Manifesto. All off under `prefers-reduced-motion`.
- **Scale.** Spacing and type sit on the 4/8/12/16/24/32/48/64 and 12/14/16/18/20/24/30 steps. Radii: `--r-md` 8px controls, `--r-lg` 12px code, `--r-xl` 16px panels.
- **Redundancy.** Each public line appears once in the Now and Study feeds. Connect states "Opening this page does not approve" once, in the lede. The Manifesto ends on one panel (whitepaper + Watch).

Public chrome is N9 edge-aligned (solid bar, no frost, no glow). Every product surface uses Home · Manifesto · Watch · Connect. Home overlays that bar on the table still; other surfaces keep the solid bar. The thesis lives on `/manifesto`, not on the Home first-read. Pages share tokens, tabs, and CTA voice; they must not share one hero+card template. PLAY Chamber layout is out of this system. Inhabit lives on `/connect`, hidden on signed-out first-read until Advanced token opens or a chamber session starts.
