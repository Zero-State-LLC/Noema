# Issue #555 isolated A-B-A rollback evidence

- Verdict: **PASS**
- Executed: 2026-08-25T01:30:55.560Z
- Worker: `noema-rollback-rehearsal-555-20260825-r3`
- URL: https://noema-rollback-rehearsal-555-20260825-r3.zer0state-noema.workers.dev
- World: `test.hosted-canonical.ewm-cutover`
- Source commit: `1de9f45aec398f66ab78bc89575d5cf02dc9ef5a`
- Wrangler: `4.123.0`; workerd: `1.20260811.1`; Node: `v22.23.0`
- A version: `81848c65-ee74-4338-9a96-1145d54fbbea`
- B version: `2a30f7c5-e2ea-473f-9977-fd57cd974169`
- Rolled back active version: `81848c65-ee74-4338-9a96-1145d54fbbea`

## Durable state pins

| point | sequence | state digest | history digest | settlement |
|---|---:|---|---|---|
| A before B | 1 | `sha256:24dd9abddff7c1d4813eb598ae7fcb1f882db2f714032cb46c09b6d120f03fbf` | `sha256:5b19b8f6953c27311465ce79fa4882c5b32d332afdf9a4d71ad1d11c587865a8` | ACTIVE/HEALTHY |
| B | 1 | `sha256:24dd9abddff7c1d4813eb598ae7fcb1f882db2f714032cb46c09b6d120f03fbf` | `sha256:5b19b8f6953c27311465ce79fa4882c5b32d332afdf9a4d71ad1d11c587865a8` | ACTIVE/HEALTHY |
| rollback A | 1 | `sha256:24dd9abddff7c1d4813eb598ae7fcb1f882db2f714032cb46c09b6d120f03fbf` | `sha256:5b19b8f6953c27311465ce79fa4882c5b32d332afdf9a4d71ad1d11c587865a8` | ACTIVE/HEALTHY |

A, B, and immediate rollback A matched for Genesis, cycle-0 digest, sequence/cycle, canonical state digest, ordered history digest, and history head. The idempotent ENTER replay also returned the stored response without changing semantic state.

## Isolation and production non-impact

- Dedicated Worker service name and Durable Object namespace only.
- `workers.dev` only. No routes, custom domains, cron, email, Supabase, KV, D1, R2, queues, or production service bindings.
- Fresh per-run signing/admin secrets were uploaded from an ephemeral file and are not present in this receipt.
- The isolated admin overview reported `canonical_head.head_present=false`, proving no external production canonical store was bound. The Durable Object canonical `state_digest` is the rehearsal head.
- Production identity before and after: `{"worker_version_id":"d9aab067-e3ca-447c-bb8b-fccc59729bbf","version_world_id":"world.perihelion-reach-3","ready_world_id":"world.perihelion-reach-3","genesis_id":"genesis.94d0961984b2b4f8"}`

## Recovery behavior

Rollback immediately restored A at 100% traffic. Health and readiness were healthy, the pre-B state was intact without manual recovery, an idempotent replay remained stable, and a new WAIT mutation advanced the isolated world to sequence 4.

## Exact commands

```text
$ npx wrangler whoami
$ npx wrangler deploy --config /home/scrimshawlife/.jcode/scratch/noema-fresh-remote-20260824/Noema/workers/noema/wrangler.rollback-rehearsal.jsonc --name noema-rollback-rehearsal-555-20260825-r3 --tag issue-555-a --message Issue #555 isolated rollback rehearsal phase A --var NOEMA_ENV:test --var NOEMA_PROTOCOL_VERSION:1 --var DEFAULT_WORLD_ID:test.hosted-canonical.ewm-cutover --var ROLLBACK_REHEARSAL_PHASE:A --secrets-file <ephemeral-secrets-file>
$ npx wrangler deploy --config /home/scrimshawlife/.jcode/scratch/noema-fresh-remote-20260824/Noema/workers/noema/wrangler.rollback-rehearsal.jsonc --name noema-rollback-rehearsal-555-20260825-r3 --tag issue-555-b --message Issue #555 isolated rollback rehearsal phase B --var NOEMA_ENV:test --var NOEMA_PROTOCOL_VERSION:1 --var DEFAULT_WORLD_ID:test.hosted-canonical.ewm-cutover --var ROLLBACK_REHEARSAL_PHASE:B
$ npx wrangler rollback 81848c65-ee74-4338-9a96-1145d54fbbea --config /home/scrimshawlife/.jcode/scratch/noema-fresh-remote-20260824/Noema/workers/noema/wrangler.rollback-rehearsal.jsonc --name noema-rollback-rehearsal-555-20260825-r3 --message Issue #555 isolated A-B-A rollback rehearsal --yes
```

Machine-readable receipt: `ISOLATED-ROLLBACK-REHEARSAL-555-EVIDENCE.json`
