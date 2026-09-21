# Issue #555 isolated A-B-A rollback evidence

- Verdict: **PASS**
- Executed: 2026-09-20T23:40:45.610Z
- Worker: `noema-rollback-rehearsal-gatef-75d468c7-20260920-r2`
- URL: https://noema-rollback-rehearsal-gatef-75d468c7-20260920-r2.zer0state-noema.workers.dev
- World: `test.hosted-canonical.ewm-cutover`
- Source commit: `75d468c750aeb04490969f33d2cc13ad7e85a3a5`
- Wrangler: `4.123.0`; workerd: `1.20260811.1`; Node: `v24.21.0`
- A version: `7e749359-c2e0-445a-ba4d-3ef9002bba56`
- B version: `c847fdc7-755d-4cab-94a4-7a8f32701256`
- Rolled back active version: `7e749359-c2e0-445a-ba4d-3ef9002bba56`

## Durable state pins

| point | sequence | state digest | history digest | settlement |
|---|---:|---|---|---|
| A before B | 1 | `sha256:4249c808c36bdd47ea7000eb5fd036631880bdd9da987d5023366ce8f63724fa` | `sha256:c451d963a754f9ae7ef8340a3936d93f10edd19f4ae2b186630c6885ba02b9ba` | ACTIVE/HEALTHY |
| B | 1 | `sha256:4249c808c36bdd47ea7000eb5fd036631880bdd9da987d5023366ce8f63724fa` | `sha256:c451d963a754f9ae7ef8340a3936d93f10edd19f4ae2b186630c6885ba02b9ba` | ACTIVE/HEALTHY |
| rollback A | 1 | `sha256:4249c808c36bdd47ea7000eb5fd036631880bdd9da987d5023366ce8f63724fa` | `sha256:c451d963a754f9ae7ef8340a3936d93f10edd19f4ae2b186630c6885ba02b9ba` | ACTIVE/HEALTHY |

A, B, and immediate rollback A matched for Genesis, cycle-0 digest, sequence/cycle, canonical state digest, ordered history digest, and history head. The idempotent ENTER replay also returned the stored response without changing semantic state.

## Isolation and production non-impact

- Dedicated Worker service name and Durable Object namespace only.
- `workers.dev` only. No routes, custom domains, cron, email, Supabase, KV, D1, R2, queues, or production service bindings.
- Fresh per-run signing/admin secrets were uploaded from an ephemeral file and are not present in this receipt.
- The isolated admin overview reported `canonical_head.head_present=false`, proving no external production canonical store was bound. The Durable Object canonical `state_digest` is the rehearsal head.
- Production identity before and after: `{"worker_version_id":"ac6813da-1e0a-4f0c-8566-d9346b4baed5","version_world_id":"world.perihelion-reach-3","ready_world_id":"world.perihelion-reach-3","genesis_id":"genesis.94d0961984b2b4f8"}`

## Recovery behavior

Rollback immediately restored A at 100% traffic. Health and readiness were healthy, the pre-B state was intact without manual recovery, an idempotent replay remained stable, and a new WAIT mutation advanced the isolated world to sequence 4.

## Exact commands

```text
$ npx wrangler whoami
$ npx wrangler deploy --config /workspace/noema-aba-75d468c7/workers/noema/wrangler.rollback-rehearsal.jsonc --name noema-rollback-rehearsal-gatef-75d468c7-20260920-r2 --tag issue-555-a --message Issue #555 isolated rollback rehearsal phase A --var NOEMA_ENV:test --var NOEMA_PROTOCOL_VERSION:1 --var DEFAULT_WORLD_ID:test.hosted-canonical.ewm-cutover --var ROLLBACK_REHEARSAL_PHASE:A --secrets-file <ephemeral-secrets-file>
$ npx wrangler deploy --config /workspace/noema-aba-75d468c7/workers/noema/wrangler.rollback-rehearsal.jsonc --name noema-rollback-rehearsal-gatef-75d468c7-20260920-r2 --tag issue-555-b --message Issue #555 isolated rollback rehearsal phase B --var NOEMA_ENV:test --var NOEMA_PROTOCOL_VERSION:1 --var DEFAULT_WORLD_ID:test.hosted-canonical.ewm-cutover --var ROLLBACK_REHEARSAL_PHASE:B
$ npx wrangler rollback 7e749359-c2e0-445a-ba4d-3ef9002bba56 --config /workspace/noema-aba-75d468c7/workers/noema/wrangler.rollback-rehearsal.jsonc --name noema-rollback-rehearsal-gatef-75d468c7-20260920-r2 --message Issue #555 isolated A-B-A rollback rehearsal --yes
```

Machine-readable receipt: `ISOLATED-ROLLBACK-REHEARSAL-717-EVIDENCE.json`
