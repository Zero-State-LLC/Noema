# Isolated Cloudflare Worker rollback rehearsal

This packet executes the LCA-2 A-B-A deployment rollback check without touching production storage or routing.

## Safety model

The rehearsal is deliberately narrower than a production deploy:

- Worker service names must begin with `noema-rollback-rehearsal-`.
- The only admitted world is `test.hosted-canonical.ewm-cutover`.
- The dedicated Worker name creates a separate Worker service and Durable Object namespace.
- The rehearsal namespace is SQLite-backed (`new_sqlite_classes`) as required for Durable Objects on this isolated Cloudflare account plan; Noema continues to use the same Durable Object storage API.
- `wrangler.rollback-rehearsal.jsonc` has `workers_dev: true` and no routes, custom domains, cron, email binding, Supabase binding, KV, D1, R2, queues, or service bindings.
- `NOEMA_ENV=test` enables fresh dev controller tokens only inside the dedicated service.
- Signing and admin secrets are generated for the run, uploaded through an ephemeral mode-0600 file, never printed, and removed on exit.
- The script reads production `/health`, `/ready`, and `/version` before and after. It never sends production credentials or a non-GET production request.
- Execution requires an explicit acknowledgement environment variable. Importing the script or running tests cannot deploy.

The fixed test world name is safe to reuse across separately named rehearsal Workers because Durable Object namespaces are provisioned per Worker service. It is not a production world ID and cannot resolve into `noema-gateway` storage.

## What is verified

1. Deploy version A to a dedicated `workers.dev` service with fresh secrets.
2. Create and activate isolated Genesis, then require the normal live seal on the default command path.
3. Create durable agent state and replay the same idempotency key.
4. Record health, readiness, Genesis, cycle-0 digest, sequence/cycle, settlement state, canonical state digest, ordered history digest, and history head before B.
5. Deploy a distinct version B with the same Durable Object class lifecycle and verify every durable pin is unchanged.
6. Roll back explicitly to A and verify A is active at 100% traffic with the same durable pins.
7. Replay the original idempotency key after rollback and verify the stored response and semantic state digest remain unchanged.
8. Submit a new `WAIT` mutation to prove post-rollback write recovery.
9. Re-read production identity and fail if the live Worker version, world, or Genesis changed.

The isolated Worker intentionally has no Supabase binding. `/v1/admin/overview` must therefore report `canonical_head.head_present=false`. The Durable Object's `rollback_evidence.state_digest` is the isolated canonical head for this rehearsal. This both proves state continuity and proves the run did not reuse the production canonical settlement store.

## Exact invocation

From `workers/noema`, select the CI-pinned Node 24 runtime when it is installed, then verify the actual runtime before executing. The receipt records the exact `node -v` output rather than assuming the requested runtime exists:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
if [ -x "$HOME/.nvm/versions/node/v24.19.0/bin/node" ]; then
  export PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH"
fi
node -v

NOEMA_ROLLBACK_REHEARSAL=I_ACKNOWLEDGE_ISOLATED_A_B_A \
WORKER_NAME=noema-rollback-rehearsal-555-20260825 \
npm run rehearse:rollback
```

Optional receipt paths:

```bash
EVIDENCE_JSON=/absolute/path/evidence.json \
EVIDENCE_MD=/absolute/path/evidence.md \
NOEMA_ROLLBACK_REHEARSAL=I_ACKNOWLEDGE_ISOLATED_A_B_A \
WORKER_NAME=noema-rollback-rehearsal-<unique-suffix> \
npm run rehearse:rollback
```

The generated receipt records redacted exact commands, package/runtime pins, Worker version IDs, health/readiness payloads, and A/B/rollback state evidence.

## Preflight and local validation

```bash
npm test -- rollback-evidence.test.ts rollback-rehearsal-script.test.ts
npm run typecheck
npx wrangler deploy --config wrangler.rollback-rehearsal.jsonc --dry-run
```

Running without the explicit acknowledgement must fail before any Wrangler mutation:

```bash
npm run rehearse:rollback
```

## Rollback constraints

A and B must keep the same Durable Object class lifecycle. Cloudflare refuses rollback across a Durable Object class lifecycle change. This rehearsal changes only Worker version/config metadata between A and B, so rollback selects the recorded A version without deleting or transferring the namespace.

Do not add a route, custom domain, production binding, production secret, production world ID, or production settlement credential to this configuration. If the account, name, world, or public identity checks fail, stop and investigate rather than overriding the gate.
