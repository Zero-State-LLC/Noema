# NOEMA GitHub Pages

## Two UIs (do not mix)

| | **This folder (GitHub Pages)** | **Hosted Worker product** |
|---|---|---|
| Job | Marketing/reference surface | Enter and use the product |
| Visual | Same door as hosted `/` | Product entry plus text-first PLAY/WATCH shells |
| URL | https://zero-state-llc.github.io/Noema/ | https://noema.guru/ |

| Page | Role |
|---|---|
| `index.html` | World door — Perihelion Reach, enter noema.guru |
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

The hosted entry is Player-first: email gate and PLAY primary, WATCH/CONNECT secondary, ADMIN separate. This folder’s `index.html` is a door to https://noema.guru. `memo.html` remains the builder map.
