# Issue #715 isolated A-B-A rollback evidence (#717 successor)

- Verdict: **NOT_COMPUTABLE**
- Executed: 2026-09-20T23:28:25Z
- Stopped: before any isolated `wrangler deploy`
- Intended Worker: `noema-rollback-rehearsal-gatef-75d468c7-20260920`
- URL: not created
- World (intended, not activated): `test.hosted-canonical.ewm-cutover`
- Successor commit: `75d468c750aeb04490969f33d2cc13ad7e85a3a5`
- Live production source (unchanged): `630652e6772d4fbc340cf155a33fd628163709d9`
- Wrangler CLI used for whoami: `4.123.0`; Node: `v22.14.0`
- A version: **not minted**
- B version: **not minted**
- Rolled back active version: **not executed**

## Why the run stopped

The kit requires Wrangler identity on account `315fb44b61212825452aad0ca566ea42` before the first isolated deploy (`rollback-rehearsal.mjs` `whoami` pin). This Cloud Agent does not have that identity.

Exact whoami result:

```text
$ npx wrangler@4.123.0 whoami
You are not authenticated. Please run `wrangler login`.
```

Acknowledgement was ready (`NOEMA_ROLLBACK_REHEARSAL=I_ACKNOWLEDGE_ISOLATED_A_B_A`). It was not used to start a deploy. The script writes an ephemeral secrets file, then calls `wrangler whoami`, then deploys. Running it without auth would fail at whoami after creating that file. The whoami check above is enough. No secrets file was written.

## Durable state pins

| point | sequence | state digest | history digest | settlement |
|---|---:|---|---|---|
| A before B | — | **NOT_COMPUTABLE** | **NOT_COMPUTABLE** | not deployed |
| B | — | **NOT_COMPUTABLE** | **NOT_COMPUTABLE** | not deployed |
| rollback A | — | **NOT_COMPUTABLE** | **NOT_COMPUTABLE** | not executed |

No isolated Genesis, ENTER, idempotent replay, or recovery WAIT ran. Digests were not invented.

## Honesty — method

Preferred method was dual-SHA isolated deploy:

1. A′ from tree `630652e6` (live production source)
2. B′ from tree `75d468c7` (#717)
3. Rollback to the A′ version
4. Idempotent replay + fresh WAIT
5. Re-check production `/version`

The stock script (`workers/noema/scripts/rollback-rehearsal.mjs` `deployPhase`) deploys A and B from the **same checkout**. A and B differ only by `ROLLBACK_REHEARSAL_PHASE`, tag, and the A-only `--secrets-file`. That is a metadata-phase rehearsal, not a two-SHA source compare.

Because auth was missing, **neither** dual-SHA nor same-tree stock rehearsal ran.

| Label | Value |
|---|---|
| Stock A/B meaning if it had run on `75d468c7` | Same-source metadata phases, not `630652e6` vs `75d468c7` |
| Dual-SHA digest compare | **NOT_COMPUTABLE** (not measured) |
| Rollback continuity | **NOT_COMPUTABLE** (isolated Worker never existed) |
| Gate F GO | **not claimed** |

## Honesty — `workers/noema` delta (`630652e6`..`75d468c7`)

`git diff --stat` for `workers/noema`:

```text
 workers/noema/package-lock.json | 278 ++++++++++++++++++----------------------
 workers/noema/package.json      |   3 +
 2 files changed, 131 insertions(+), 150 deletions(-)
```

`workers/noema/src` is empty in that range. #717 adds:

```json
"overrides": {
  "sharp": "0.35.4"
}
```

Lockfile blob SHAs:

| Tree | `workers/noema/package-lock.json` |
|---|---|
| `630652e6` | `c96234da2ef76d5ebd6b25187f5e06f30c4e8d8f` |
| `75d468c7` | `24599088b4912fa30056e6a4ad24c9d9b291ec42` |

Full patch: [workers-noema-630652e6-75d468c7.diff](workers-noema-630652e6-75d468c7.diff).

Repo-wide the same range also changes `spec-compat.json` (pin metadata from #716). That file is not Worker runtime source.

Rehearsal config SHA on this checkout matches the #555 receipt (`sha256:03c5b358c57b8c7d02a3e884b205d092ee2120793832de675fac333b68edd636`). The lockfile SHA does not (`sha256:95ac47f0f581c994440f9ec6b4c381e893ca0516566f743721305c3dfca14cab`).

## Isolation and production non-impact

- No isolated Worker service was created. Intended name starts with `noema-rollback-rehearsal-` and is unique for this run.
- Intended config remains `wrangler.rollback-rehearsal.jsonc`: `workers_dev: true`, no routes, custom domains, cron, email, Supabase, KV, D1, R2, queues, or service bindings.
- Production checks were GET `/health`, `/ready`, `/version` only.
- Production identity before and after: `{"worker_version_id":"ac6813da-1e0a-4f0c-8566-d9346b4baed5","version_world_id":"world.perihelion-reach-3","ready_world_id":"world.perihelion-reach-3","genesis_id":"genesis.94d0961984b2b4f8"}`

## Recovery behavior

Not executed. Isolated rollback and post-rollback WAIT were not reached.

## Exact commands

```text
$ npx wrangler@4.123.0 whoami
# STOPPED. Output: You are not authenticated. Please run `wrangler login`.
# Not run:
# NOEMA_ROLLBACK_REHEARSAL=I_ACKNOWLEDGE_ISOLATED_A_B_A \
# WORKER_NAME=noema-rollback-rehearsal-gatef-75d468c7-20260920 \
# npm run rehearse:rollback
```

Machine-readable receipt: `ISOLATED-ROLLBACK-REHEARSAL-717-EVIDENCE.json`
