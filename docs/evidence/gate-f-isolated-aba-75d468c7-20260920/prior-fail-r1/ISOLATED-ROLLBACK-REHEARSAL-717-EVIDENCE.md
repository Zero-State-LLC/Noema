# Issue #717 isolated A-B-A rollback evidence (Gate F)

- Verdict: **FAIL**
- Executed: 2026-09-20T23:35:26Z
- Worker: `noema-rollback-rehearsal-gatef-75d468c7-20260920`
- URL: https://noema-rollback-rehearsal-gatef-75d468c7-20260920.zer0state-noema.workers.dev
- World: `test.hosted-canonical.ewm-cutover`
- Source commit: `75d468c750aeb04490969f33d2cc13ad7e85a3a5`
- Node: `v24.21.0`; wrangler CLI: `4.123.0`
- A version: `5bc8bbaa-6b51-4525-90b1-25d9b0a6e763`
- B version: `(not reached)`
- A′ / rollback_active: `(not reached)`

## Failure

Phase A deploy succeeded. `POST /v1/admin/genesis/preview` returned HTTP 500 `INTERNAL` / `internal error`. Script aborted before B deploy, durable digest pins, and rollback.

## Digest match summary

NOT_COMPUTABLE — aborted before A/B/A′ durable snapshot comparisons.

## Production non-impact

- Production GET-only during this run.
- `https://noema.guru/version` after run: `worker_version_id=ac6813da-1e0a-4f0c-8566-d9346b4baed5` (still `ac6813da…`).
- Never deployed `noema-gateway` / production.

## Honesty delta

Saved `workers-noema-630652e6-to-75d468c7.diff` (sharp override 0.35.2→0.35.4 / libheif advisories). Stock rehearsal is same-tree A/B metadata phases.

Machine-readable receipt: `ISOLATED-ROLLBACK-REHEARSAL-717-EVIDENCE.json`
