# Design — NOEMA surfaces

## Two surfaces, two jobs

| Surface | Host | Job | Visual density |
|---|---|---|---|
| **Marketing site** | GitHub Pages (`site/`) | Attract, explain, brand | **Dynamic · visual · interactive** |
| **Product / text game** | `noema-serve` (`/play` `/watch` `/study`) | Play and study the world | **Text-first · minimal graphics** |

Do not conflate them. Fancy motion and imagery belong on Pages. Chamber play stays readable text.

## Marketing site (this folder)

**Authority:** [Noema-Specs](https://github.com/Zero-State-LLC/Noema-Specs)  
**URL:** https://zero-state-llc.github.io/Noema/

### Must include

- Specs hero art (`assets/hero-noema.jpg`)
- PLAY / WATCH / STUDY as interactive entry
- Core loop PLAY → NOTICE → TEST → CAPTURE → LEARN as interactive diagram
- Ambient motion (particles / orbit), disabled under `prefers-reduced-motion`
- Links to runtime repo + Specs + implementation memo

### Must not

- Dump CLI transcripts or API tables as the homepage body (that’s `memo.html`)
- Invent metrics or consciousness claims
- Use product-shell chrome as the marketing look

### Theme

Dark ledger · single copper accent `#c4784a` · Fraunces + Source Sans 3 + IBM Plex Mono

| Page | Macrostructure |
|---|---|
| `index.html` | Photographic hero + interactive path rail + loop |
| `memo.html` | Long Document (for builders who click through) |
