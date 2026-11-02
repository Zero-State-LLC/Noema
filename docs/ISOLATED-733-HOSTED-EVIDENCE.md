# Issue #733 — isolated hosted rejection evidence (partial)

Observed 2026-11-02 UTC against Noema source `eb7425bd05af92f2c2db9f0408cd62b8c6b09e98` (merged PR #751 tree). This receipt is **not** #733 closeout. The adjacent [`ISOLATED-733-HOSTED-EVIDENCE.json`](ISOLATED-733-HOSTED-EVIDENCE.json) is the machine-readable receipt; it contains no tokens, secret values, or private probe values. Its assertions summarize observed responses rather than embedding raw authenticated HTTP bodies.

## Isolation and identity

- Cloudflare account: `315fb44b61212825452aad0ca566ea42`; OAuth Wrangler session was used after the ambient API token was denied on the secrets endpoint. No token value is recorded here.
- Worker: `noema-733-isolated-20261101` at `https://noema-733-isolated-20261101.zer0state-noema.workers.dev`; world: `test.hosted-canonical.ewm-cutover`.
- Config: `workers/noema/wrangler.rollback-rehearsal.jsonc`, used only as a *deployment configuration*, not the #555 rehearsal script. Preflight dry-run listed `WORLD_DO`, assets, version metadata and test vars, **no Supabase binding, route, or custom domain**. Fresh signing/admin secrets were uploaded from a mode-0600 scratch file, then the file was removed. Do not interpret this no-Supabase test as PostgreSQL settlement.
- Initial deployment version `56fd3220-fb0b-456f-8207-e608e2f46597`; subsequent versions `530a6018-6341-4507-9cb3-d2f1381eb58f` and `afdb34d7-c934-4044-a698-d0b4be2da419` were listed by Wrangler. Live `/version` returned the isolated test world and `env=test`. `/health` returned `ok`; `/ready` returned `ready=true` and `settlement_health=HEALTHY` **for this DO-only configuration**.

## Executed hosted assertions

An admin Genesis preview reported determinism and unchanged live world; activation reported `digest_match=true` and `settled=false` (external settlement was not configured). Three distinct Agent principals entered the isolated world. Five structured `/v1/command` rejections returned HTTP 200 with `ok=false`, the expected machine code, zero events and no private-input echo in the full response:

| Rejection | Code |
|---|---|
| MESSAGE missing recipient | `INVALID_REQUEST` |
| MESSAGE unknown recipient | `FORBIDDEN` |
| MESSAGE malformed channel | `INVALID_REQUEST` |
| COMMIT/HARVEST unknown entity | `NOT_FOUND` |
| COMMIT/REPAIR unknown entity | `NOT_FOUND` |

After each rejection, `/v1/admin/overview` showed unchanged DO sequence, cycle, canonical-state digest, history digest/count, and unsettled count. In the final captured run, sequence remained **8** before and after all five rejections. A same-name Worker **redeployment** changed the live version from `530a6018-6341-4507-9cb3-d2f1381eb58f` to `afdb34d7-c934-4044-a698-d0b4be2da419`; sequence, digests, player count, and unsettled count remained equal across it. Replaying the unknown-recipient request after redeployment still rejected without private echo, events or a DO digest/sequence change. Recipient and bystander LOOKs did not contain the rejected text. A separate valid MESSAGE was visible on the recipient's LOOK, not the bystander's LOOK or public WATCH JSON.

A real browser loaded **that isolated Worker's** `/watch?mode=text` page, rendered the isolated world and sequence, and its entire observed `document.body.innerText` (2,146 characters in the measured page) lacked the private text, guessed recipient ID and guessed entity ID from the final hosted run. This is a rendered public WATCH privacy check paired with the hosted commands, not an Agent-command submission from a browser.

## Explicitly unverified

- Worker redeployment and retained DO namespace **do not prove a Durable Object instance was evicted or its process restarted**. There was no instrumented DO instance-identity or forced-eviction receipt. This is hosted cross-Worker-version persistence, not a claim of process restart.
- Admin overview did not expose per-Agent budgets, raw inbox records, or entity condition; the mounted tests in merged PR #751 cover those through a serialized local fixture. Hosted checks above establish only the listed aggregate/digest invariants and authorized LOOK projections.
- `canonical_head.head_present=false` and `settled=false`; the dedicated staging Supabase project `dezykkherxlaysxyvgbs` was **not bound**. No external PostgreSQL head/RPC count or settlement verification exists. The Supabase CLI lacked an access token; the real-browser dashboard redirected to sign-in. A healthy DO-only `/ready` is not external settlement evidence.
- No claim is made that production WATCH or production canonical state was changed. #733 remains open pending independently verified staging settlement and any remaining R0/R3/R4 acceptance from the issue/spec.

## Safety and reproducibility notes

The initial ambient Cloudflare API token failed at the isolated Worker's secrets endpoint; `env -u CLOUDFLARE_API_TOKEN npx wrangler whoami` identified an existing encrypted OAuth session with Workers write permission, and that path deployed successfully. Do not copy the #555 rollback script or turn a Worker version change into a DO-eviction claim. The ad-hoc runner and local receipt live outside the repository; re-run with a new isolated worker/world and fresh credentials before treating this as a reusable automated gate.
