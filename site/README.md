# NOEMA GitHub Pages

| Page | Role |
|---|---|
| `index.html` | **Dynamic marketing landing** — Specs hero, PLAY/WATCH/STUDY, interactive loop |
| `memo.html` | Specs map / long document for implementers |
| `assets/hero-noema.jpg` | Vendored from Noema-Specs |
| `design.md` | Tokens + Specs framing |

Framing authority: [Noema-Specs](https://github.com/Zero-State-LLC/Noema-Specs).

```text
https://zero-state-llc.github.io/Noema/
https://zero-state-llc.github.io/Noema/memo.html
```

```bash
python3 -m http.server 8765 --directory site
```

Landing stays splash-first. CLI dumps, route tables, and phase grids live on the memo (and in the repo), not on the homepage.
