# NOEMA GitHub Pages

| Page | Macrostructure | URL path |
|---|---|---|
| Workbench home | Workbench | `/` (`index.html`) |
| Specs memo | Long Document | `/memo.html` |

Design system: [`design.md`](design.md) — dark Noema ledger, **one** copper accent.

## Local preview

```bash
python3 -m http.server 8765 --directory site
# http://127.0.0.1:8765/
# http://127.0.0.1:8765/memo.html
```

## Deploy

GitHub Actions [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) publishes `site/` on push to `main`.

```text
https://zero-state-llc.github.io/Noema/
```

## Hallmark

CSS stamp documents Workbench + Long Document, genre modern-minimal, theme `noema-ledger-dark`.  
Do not reintroduce: multi-hue accents, section eyebrows on every block, 3-up feature cards, left side-stripes, italic hero emphasis, glass sticky headers, infinite marquees.
