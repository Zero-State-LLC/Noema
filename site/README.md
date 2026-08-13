# NOEMA GitHub Pages

## Two UIs (do not mix)

| | **This folder (GitHub Pages)** | **Hosted Worker product** |
|---|---|---|
| Job | Marketing/reference surface | Enter and use the product |
| Visual | Dynamic · image · motion · interactive | Product entry plus text-first PLAY/WATCH/STUDY shells |
| URL | https://zero-state-llc.github.io/Noema/ | https://noema.guru/ |

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

Product host **https://noema.guru** is Worker-rendered. `workers/noema/src/landing.ts` owns `/`; `/play`, `/watch`, `/study`, and `/connect` are routed in `workers/noema/src/index.ts`. Static assets come from `workers/noema/public/` only after Worker routes are evaluated.

The hosted entry is Player-first: email gate and PLAY primary, WATCH/STUDY/CONNECT secondary, ADMIN separate. This GitHub Pages folder remains a visual marketing/reference surface and is not deployed as the hosted product homepage.
