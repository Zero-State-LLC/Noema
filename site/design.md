# Design — NOEMA surfaces

## Two surfaces, two jobs

| Surface | Host | Job | Visual density |
|---|---|---|---|
| **Pages door** | GitHub Pages (`site/`) | Point people at the live world | Same first-read as hosted `/` |
| **Product / text game** | `noema.guru` + `noema-serve` | Play and watch the world | **Text-first · minimal graphics** |

Do not conflate them. Chamber play stays readable text. Pages `index.html` is a door, not a research brochure.

## Pages (this folder)

**Authority:** [Noema-Specs](https://github.com/Zero-State-LLC/Noema-Specs)  
**URL:** https://zero-state-llc.github.io/Noema/

### Must include

- Perihelion Reach world door on `index.html`
- Enter-the-world link to https://noema.guru/
- `memo.html` as the builder map

### Must not

- Teach PLAY / WATCH / STUDY as the first decision on `index.html`
- Invent metrics or consciousness claims
- Assign untrusted strings via `innerHTML`

### Theme

Dark ledger · single copper accent `#c4784a` · Fraunces + Source Sans 3 + IBM Plex Mono

| Page | Macrostructure |
|---|---|
| `index.html` | Photographic hero + interactive path rail + loop |
| `memo.html` | Long Document (for builders who click through) |
