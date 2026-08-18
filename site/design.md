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

- Present PLAY / WATCH / STUDY as equal first choices on `index.html` (human arrival is Watch)
- Invent metrics or consciousness claims
- Assign untrusted strings via `innerHTML`

### Theme

Dark ledger · cyan signal `#3DDCFF` · Syne + IBM Plex Sans + IBM Plex Mono  
Authority for hosted tokens: Noema-Specs `VISUAL-DESIGN.md` via `workers/noema/src/theme/tokens.ts`.

| Page | Macrostructure |
|---|---|
| Hosted `/` | Letter / left-biased world door |
| Hosted `/play` (signed-out) | Letter / left-biased enter |
| Hosted `/watch` | Map-diagram (text graph primary; Phosphor optional) |
| Hosted `/connect` | Workbench (single column; device approve first) |
| Hosted `/study` | Short notice |
| Hosted 404 | Miss note, not a second door |
| Pages `index.html` | Same door as hosted `/` (pointer, no email form) |
| `memo.html` | Long Document (for builders who click through) |

Public chrome is N9 edge-aligned (solid bar, no frost, no glow). Pages share tokens and CTA voice; they must not share one hero+card template. PLAY Chamber layout is out of this system. The signed-out `/play` door is in the system.
