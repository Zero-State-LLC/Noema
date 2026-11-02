# #733 isolated hosted acceptance — current gate status

Observed 2026-11-02 UTC. This is a **status checkpoint**, not a new hosted-acceptance receipt. The historical [DO-only rejection receipt](ISOLATED-733-HOSTED-EVIDENCE.md) and [staging ENTER settlement receipt](ISOLATED-733-STAGING-SETTLEMENT.md) remain bound to their original Worker versions, source commits, and **different** worlds; do not combine their observations into one end-to-end proof.

## Runtime instrumentation in review

- [PR #756](https://github.com/Zero-State-LLC/Noema/pull/756) is open at source head `23441dbb4eaebc20a3b4b6896b9941aae38c8d6c`, based on runtime `main` `53b47b3d85435cf2ffe7fc4bb940ede96315756c`. It adds an admitted test-only public WATCH target, Worker-to-DO binding, hibernated-stream fail-closed checks for configuration change/removal, and a dual-auth instance probe/reset instrument. No production route or world was changed by this PR.
- [Exact-head CI run 41408406782](https://github.com/Zero-State-LLC/Noema/actions/runs/41408406782): `build` and `Worker regression` passed; Supabase Preview was **skipped**. Local Worker suite reported 1,943 passed / 21 skipped, with typecheck passing. Two independent read-only exact-head reviews found no concrete code blocker; neither is an eligible submitted GitHub approval. The PR is `REVIEW_REQUIRED` / `BLOCKED`. The mounted HTTP→DO first-load test covers live WATCH; map and stream lack that same mounted combination, though their separate routing/DO seams are tested.
- A read-only direct query of dedicated staging project `dezykkherxlaysxyvgbs` on 2026-11-02 UTC found **zero** `noema_world_heads`, `noema_canonical_settlements`, and `noema_settled_events` rows for the proposed new target `test.hosted-canonical.733-target-20261102`. This is a **pre-command baseline**, not a post-command settlement receipt. It does not modify or supersede the older staging ENTER record for `test.hosted-canonical.733-settle-20261102`.
- The private no-route Wrangler config for the proposed Worker passed a dry-run, but lacked the staging database URL/secret binding. No deployment of the #756 head, reset, or command against the proposed target has been established. Do not use that config to claim a settlement test.

## Gates to complete before acceptance

| Gate | Current verdict | Required next observation |
|---|---|---|
| Reviewed instrument | **BLOCKED** | Eligible GitHub approval on the current PR head; required CI remains green. |
| Isolated deployment and staging binding | **UNVERIFIED** | Inspect a no-route test Worker config for the dedicated staging URL and secret binding by name, dry-run, then verify an authorized hosted deployment and fixed Worker version. |
| Genuine Durable Object reset | **UNVERIFIED** | Stable pre-reset instance nonce, one forced reset, changed nonce for the *same* DO identity at unchanged Worker version. |
| Post-command PostgreSQL settlement | **UNVERIFIED** | Mutating Agent command on that target followed by independent committed head, settlement, and event reads from the linked staging project; repeat after reset for a committing action. |
| Same-world real-browser WATCH | **UNVERIFIED** | Render the isolated Worker's public WATCH in a real browser and match its world and sequence to that same independently settled target, screening private data. |
| Full issue acceptance | **OPEN** | Reconcile R0/R3/R4 and optional C9 requirements independently; the three gates above alone do not close #733. |

Next: obtain eligible review, supply the isolated staging binding without committing credentials, then collect separate hosted reset, database, and browser receipts. Preserve the old partial receipts rather than rewriting their provenance. No #747-only approval exception transfers to #756.
