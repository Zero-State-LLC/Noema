# #733 isolated hosted acceptance — current gate status

Observed 2026-11-02 UTC. This is a **status checkpoint**, not a new hosted-acceptance receipt. The historical [DO-only rejection receipt](ISOLATED-733-HOSTED-EVIDENCE.md) and [staging ENTER settlement receipt](ISOLATED-733-STAGING-SETTLEMENT.md) remain bound to their original Worker versions, source commits, and **different** worlds; do not combine their observations into one end-to-end proof.

## Runtime instrumentation merged; hosted acceptance remains open

- [PR #756](https://github.com/Zero-State-LLC/Noema/pull/756) merged at `038512f6ca9284522945968cf9f57c23b9a85909` from reviewed source head `8845b380dc321801d5e93a7b72132f9a5849ed60`. It adds an admitted test-only public WATCH target, Worker-to-DO binding, hibernated-stream fail-closed checks for configuration change/removal, and a dual-auth instance probe/reset instrument. Five later test-only commits cover mounted map/stream first load, retained-world mismatch rejection, socket acceptance, and serialized target attachment. No production route or world was changed by this PR.
- At `8845b38`, local Worker tests reported 1,947 passed / 21 skipped and typecheck passed. [Exact-head PR CI run 41415875073](https://github.com/Zero-State-LLC/Noema/actions/runs/41415875073) passed `build` and `Worker regression`; Supabase Preview was **skipped**. Two independent read-only current-head technical reviews found no concrete blocker and the prior mounted-stream review thread was reconciled. There was **no eligible submitted GitHub approval**: the operator authorized a scoped administrator bypass of the review rule. Neither review nor bypass establishes hosted acceptance. Main-push CI for merge `038512f6` was in progress at this checkpoint. Earlier [CI run 41408406782](https://github.com/Zero-State-LLC/Noema/actions/runs/41408406782), local 1,943 passed / 21 skipped, and two technical reviews apply only to historical `23441db`.
- A read-only direct query of dedicated staging project `dezykkherxlaysxyvgbs` on 2026-11-02 UTC found **zero** `noema_world_heads`, `noema_canonical_settlements`, and `noema_settled_events` rows for the proposed new target `test.hosted-canonical.733-target-20261102`. This is a **pre-command baseline**, not a post-command settlement receipt. It does not modify or supersede the older staging ENTER record for `test.hosted-canonical.733-settle-20261102`.
- The private no-route Wrangler config for the proposed Worker passed a dry-run, but lacked the staging database URL/secret binding. No deployment of the #756 head, reset, or command against the proposed target has been established. Do not use that config to claim a settlement test.

## Gates to complete before acceptance

| Gate | Current verdict | Required next observation |
|---|---|---|
| Reviewed instrument | **MERGED; hosted UNVERIFIED** | PR #756 merged with a documented administrator review-rule bypass after independent technical review and exact-head required CI. This is instrumentation, not a hosted gate receipt. |
| Isolated deployment and staging binding | **UNVERIFIED** | Inspect a no-route test Worker config for the dedicated staging URL and secret binding by name, dry-run, then verify an authorized hosted deployment and fixed Worker version. |
| Genuine Durable Object reset | **UNVERIFIED** | Stable pre-reset instance nonce, one forced reset, changed nonce for the *same* DO identity at unchanged Worker version. |
| Post-command PostgreSQL settlement | **UNVERIFIED** | Mutating Agent command on that target followed by independent committed head, settlement, and event reads from the linked staging project; repeat after reset for a committing action. |
| Same-world real-browser WATCH | **UNVERIFIED** | Render the isolated Worker's public WATCH in a real browser and match its world and sequence to that same independently settled target, screening private data. |
| Full issue acceptance | **OPEN** | Reconcile R0/R3/R4 and optional C9 requirements independently; the three gates above alone do not close #733. |

Next: verify the isolated staging binding without committing credentials, then collect separate hosted reset, database, and browser receipts after a guarded no-route deployment. Preserve the old partial receipts rather than rewriting their provenance. The operator's scoped administrator review-rule bypass for #756 did not count as a submitted approval and does not itself authorize a hosted-acceptance claim.
