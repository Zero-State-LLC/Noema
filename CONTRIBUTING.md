# Contributing

Authorized contributors and agents only.


## Licensing and contributions

This repository uses the Zero State Proprietary License v1.0 (ZSPL-1.0) for original Zero State materials. See [`LICENSE`](LICENSE) and [`LICENSE_POLICY.md`](LICENSE_POLICY.md).

Contributions are limited to authorized Zero State contributors and agents unless a separate written agreement is approved. Zero State may require a contributor license agreement, intellectual-property assignment, work-for-hire agreement, or other written agreement before accepting an external contribution. Do not add third-party code or assets without documenting their license and preserving required notices.

## Graft context index

`graft/` is a committed codebase-context graph ([Graft](https://www.npmjs.com/package/@nanonets/graft)) used by coding agents (Cursor, Claude Code, AGENTS.md). It covers the whole repo, including the watch surface in `workers/noema/src/watch*.ts`.

To refresh it after code changes (Node >= 22.12):

```bash
npm i -g @nanonets/graft
graft telemetry disable   # optional: opt out of anonymous usage stats
graft build               # regenerates graft/ (graft/.cache/ stays local)
graft check               # fails if graft/ is stale
```

Commit the updated `graft/` with your change.
