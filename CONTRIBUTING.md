# Contributing

Authorized contributors and agents only.


## Licensing and contributions

This repository uses the Zero State Proprietary License v1.0 (ZSPL-1.0) for original Zero State materials. See [`LICENSE`](LICENSE) and [`LICENSE_POLICY.md`](LICENSE_POLICY.md).

Contributions are limited to authorized Zero State contributors and agents unless a separate written agreement is approved. Zero State may require a contributor license agreement, intellectual-property assignment, work-for-hire agreement, or other written agreement before accepting an external contribution. Do not add third-party code or assets without documenting their license and preserving required notices.

## Graft context index

[Graft](https://www.npmjs.com/package/@nanonets/graft) (`@nanonets/graft`) is a codebase-context graph for coding agents. It holds linked markdown cards with exact file:line spans, and agents query it with `graft ask` / `graft map` or over MCP.

- **Where it lives:** `graft/` is committed (`graft/INDEX.md` is the entry point). `graft/.cache/` stays local and gitignored.
- **Coverage:** It indexes the code across the repo. The watch surface (Ruffian-L's area) lives in `workers/noema/src/watch.ts`, `watch-*.ts` (live, mode, map, map-gl, map-gl-stage, map-page, phosphor, theater), and `operator-watch.ts`, plus tests in `workers/noema/test/`. Its cards are under `graft/workers/noema/src/`.
- **Refresh (Node 22.12+):** `npm i -g @nanonets/graft`, then `graft build`, then commit the updated `graft/`. Opt out of telemetry with `graft telemetry disable`.
- **Check:** `graft check` fails if `graft/` is out of date with the code.
- **Agent wiring:** Cursor: `.cursor/rules/graft.mdc` and `.cursor/mcp.json` (`graft mcp`). Claude Code: `.claude/settings.json` hooks plus `.claude/helpers/graft-*.cjs` shims. Locally, `graft init --no-global` adds the MCP entry to `.mcp.json`. AGENTS.md has a Graft section too.
