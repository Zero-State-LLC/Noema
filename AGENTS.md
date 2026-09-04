# AGENTS.md

Canonical multi-agent contract for this repository. Other adapters (`CLAUDE.md`)
point here — do not duplicate rules.

This repo hosts **two runtimes of the same world engine plus supporting pieces**
(see `README.md`). They are independent — do not treat them as one product.

```text
SERVER   Zero-State-LLC/Noema
CLIENT   scrimshawlife-ctrl/noema-client
SPECS    Zero-State-LLC/Noema-Specs
```

Do not add first-party agent-client functionality to this repository unless it is
server/protocol conformance code. Official client implementation belongs in
`scrimshawlife-ctrl/noema-client`.

| Component | Path | Toolchain | Standard commands |
|---|---|---|---|
| Offline Chamber / conformance runtime (primary) | `src/noema` | Python ≥3.11 | see `README.md` "Quick start" / `pyproject.toml` `[project.scripts]` |
| Official Controller client | [scrimshawlife-ctrl/noema-client](https://github.com/scrimshawlife-ctrl/noema-client) | Python ≥3.11 | `pipx install noema-client` then `noema connect` |
| In-repo harness (deprecated product client; server conformance only) | `src/noema/harness`, `clients/noema-llm-agent` | Python ≥3.11 | keep for CI; do not extend as the product client |
| Hosted product Stage 0 (Cloudflare Worker + Durable Object) | `workers/noema` | Node | see `workers/noema/README.md` / `workers/noema/package.json` scripts |
| Marketing site (static) | `site/` | none | `python3 -m http.server 8765 --directory site` |

Observed environment and local-dev traps: [`docs/AGENT-GOTCHAS.md`](docs/AGENT-GOTCHAS.md).
Do not invent new gotchas.

## Critical invariants

- Two runtimes are independent. Chamber `noema-serve` (`:8080` `/play/action`) is
  not the hosted Worker (`:8787` / `POST /v1/command`).
- Hosted inhabit is agents-only (RFC-0120). Humans watch. Admin is never a Player.
  Do not put humans on `POST /v1/command` or Durable Object `/command`.
- Public tabs are **Home · Manifesto · Watch · Connect**. Do not put Play back on
  the bar.
- Do not PLAY `world-01`. Do not recreate closed LCA-2 packets.
- Isolated tests and Chamber (dev tooling) may still move. RFC-0120 identity
  remains constitution. Hosted alpha is THAWED.

## Deploy

Pin-on-publish is dispatch-only (`.github/workflows/deploy-worker-pin-pr.yml`).
It requires `acknowledge=I_ACKNOWLEDGE_PRODUCTION_DEPLOY_AND_PIN` from `main`.
Do not add `push` / `pull_request` triggers. Do not dispatch unless the user
explicitly says **deploy**. Cloudflare MCP can list and read Workers; it is not a
production deploy path and cannot publish.

## Escalation

If CI or tests look wrong, open a labeled defect (`bug`). Do not edit tests or
fixtures to force green. Do not reward-hack.

<!-- graft:start -->
## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->
