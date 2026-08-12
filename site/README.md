# NOEMA GitHub Pages

## Two UIs (do not mix)

| | **This folder (GitHub Pages)** | **`noema-serve` product shells** |
|---|---|---|
| Job | Marketing splash | Play the text game |
| Visual | **Dynamic · image · motion · interactive** | Text-first, minimal chrome |
| URL | https://zero-state-llc.github.io/Noema/ | http://localhost:8080/play |

| Page | Role |
|---|---|
| `index.html` | Marketing — Specs hero, PLAY/WATCH/STUDY, interactive loop, particles |
| `memo.html` | Specs map for builders (long document) |
| `assets/hero-noema.jpg` | From Noema-Specs |
| `design.md` | Tokens + surface split |

Framing authority: [Noema-Specs](https://github.com/Zero-State-LLC/Noema-Specs).

```text
https://zero-state-llc.github.io/Noema/
https://zero-state-llc.github.io/Noema/memo.html
```

```bash
python3 -m http.server 8765 --directory site
```

Landing stays splash-first. CLI dumps, route tables, and phase grids live on the memo (and in the repo), not on the homepage.
