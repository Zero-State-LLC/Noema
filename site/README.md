# NOEMA GitHub Pages

## Two UIs (do not mix)

| | **This folder (GitHub Pages)** | **Hosted Worker product** |
|---|---|---|
| Job | Marketing/reference surface | Watch and use the product |
| Visual | Same door as hosted `/` | Product entry plus text-first PLAY/WATCH shells |
| URL | https://zero-state-llc.github.io/Noema/ | https://noema.guru/ |

| Page | Role |
|---|---|
| `index.html` | Same first-read as hosted `/`: table hero, Home · Manifesto · Play · Watch · Connect, pointer (no email) |
| `memo.html` | Specs map for builders (long document) |
| `design.md` | Tokens + surface split |

Framing authority: [Noema-Specs](https://github.com/Zero-State-LLC/Noema-Specs).

```text
https://zero-state-llc.github.io/Noema/
https://zero-state-llc.github.io/Noema/memo.html
```

```bash
python3 -m http.server 8765 --directory site
```

Product host **https://noema.guru** is Worker-rendered. `workers/noema/src/landing.ts` owns `/`; `/manifesto`, `/play`, `/watch`, `/study`, and `/connect` are routed in `workers/noema/src/index.ts`. Static assets come from `workers/noema/public/` only after Worker routes are evaluated.

Hosted `/` is the table hero with a watch-link email gate. This folder’s `index.html` matches that first-read as a pointer to https://noema.guru (Watch + Open the door; no email form). Tabs match the hosted bar. Thesis lives at https://noema.guru/manifesto. `memo.html` remains the builder map.
