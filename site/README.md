# NOEMA GitHub Pages site

Static reference site for the NOEMA Runtime modular monolith.

## Local preview

```bash
# from repo root
python -m http.server 8765 --directory site
# open http://127.0.0.1:8765/
```

## Deploy

GitHub Actions workflow [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) publishes the `site/` directory to GitHub Pages on push to `main` (when `site/**` changes) or via **workflow_dispatch**.

One-time repo settings:

1. **Settings → Pages → Build and deployment**
2. Source: **GitHub Actions**

Public URL (org/user pages pattern):

```text
https://zero-state-llc.github.io/Noema/
```

## Content ownership

| Area | Source of truth |
|---|---|
| Normative behavior | Noema-Specs + runtime code |
| Version pin | `spec-compat.json` |
| This site | Marketing / operator overview only |

When bumping phases, update hero pin strings in `index.html` to match `spec-compat.json`.
