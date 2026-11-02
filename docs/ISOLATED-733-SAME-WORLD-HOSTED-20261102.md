# Issue #733 — same-world isolated hosted proof (bounded)

Observed 2026-11-02 UTC against merged Noema source `c8a922064af1adba4387327652db5f378ee296ca`. Machine-readable screened summary: [`ISOLATED-733-SAME-WORLD-HOSTED-20261102.json`](ISOLATED-733-SAME-WORLD-HOSTED-20261102.json). This is a new receipt for one isolated staging target; the [older DO-only](ISOLATED-733-HOSTED-EVIDENCE.md) and [earlier staging ENTER](ISOLATED-733-STAGING-SETTLEMENT.md) receipts concern different worlds/versions and remain historical.

## Identity and isolation

- Dedicated staging project `dezykkherxlaysxyvgbs`; isolated no-route `workers.dev` Worker `noema-733-acceptance-20261102`, URL `https://noema-733-acceptance-20261102.zer0state-noema.workers.dev`, deployed version `9978ab0f-e8f6-40c6-9254-d6ffc4c5f2fb`. Test-only target `test.hosted-canonical.733-target-20261102` and distinct configured default `test.hosted-canonical.733-default-20261102`. The configuration had no production route/domain and listed only the isolated `workers.dev` trigger. Wrangler's deployed secret-name readback listed exactly `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TOKEN_SIGNING_SECRET`, and `ADMIN_OPERATOR_TOKEN`. Only binding **names** are recorded; their values are excluded.
- Before deployment and immediately afterward, a readback showed the production `noema-gateway` version unchanged at `ed7790e8-38d5-41e6-8e65-2929ea4a52d3`. This is a **bounded before/after initial deployment control**, not a production readback after the subsequent target actions. A later Wrangler deployments-list attempt failed `No access` and provides no additional version evidence. The isolated public `/version` after the target actions returned `9978ab0f-e8f6-40c6-9254-d6ffc4c5f2fb`.

## Independent staging PostgreSQL and hosted reset

| Checkpoint (UTC) | Target head | Target canonical settlements | Target settled events | Distinct default world |
|---|---|---|---|---|
| Before first command, 09:44:15–16 | zero rows | zero rows | zero rows | zero rows in all three tables |
| After one ENTER_WORLD, 09:47:11 | revision 1, sequence 0, HEALTHY | one row: revision 1, sequence 0 | one row: sequence 0 | zero rows in all three tables |
| After forced reset, before committing action | revision 1, sequence 0 | one row | one row | zero rows in all three tables |
| After one post-reset MOVE east, 10:13:35–36 | revision 2, sequence 1, HEALTHY | two rows: revisions 1, 2; sequences 0, 1 | two rows: sequences 0, 1 | zero rows in all three tables |

All table values above are from separate authenticated **read-only** REST queries against the dedicated staging PostgreSQL project, not from the operator command response or a fake RPC. A further filtered read of the new sequence-1 event returned type `MOVE` with an isolated `evt.tw.*` ledger ID. Private credentials, connection strings and full database rows are excluded.

Two hosted probes of the **same named target DO** at 09:50:14–15 returned HTTP 200 with equal constructor instance IDs. Exactly one forced `evict` request followed; its HTTP 500 alone is **not** proof of a reset. A new probe at 09:50:16 returned HTTP 200 with a *different* constructor ID, while the isolated Worker version remained fixed. Only equality/difference is published; raw instance IDs remain private. This establishes a hosted instance replacement, not fixture recreation or redeployment.

A post-reset `INSPECT` returned HTTP 200 and two response events but was observation-only: the subsequent independent SQL head remained revision 1/sequence 0. At pinned source, `INSPECT` is READ (`workers/noema/src/ops.ts:10-20,230-235`), observation events use `evt.obs.*` IDs (`workers/noema/src/world-actions.ts:2282-2295,2571-2601`), and the commit filter excludes them (`workers/noema/src/settle.ts:198-202`). It is **not** counted as a repair settlement. A fresh dual-auth `OBSERVE` at 10:13:10 confirmed the same player was entered in `room.anchor`, with public east exit to `room.hall`, energy 80 and sequence 0. Exactly one dual-auth structured `MOVE` east at 10:13:20 returned HTTP 200, `ok=true`, one non-observation MOVE event and an observation in Hall at sequence 1. `MOVE` emits a ledger event (`workers/noema/src/world-actions.ts:2500-2555`); the DO commits successful mutating ledger-bearing actions through the canonical settlement path (`workers/noema/src/world-do.ts:1313-1339`). The new independent SQL rows above are the post-reset persistence proof.

## Real-browser public WATCH

A real Chromium browser loaded this isolated host's `/watch?mode=pixel` and `/watch?mode=map`. Both rendered **the exact target world**, sequence **1**, public Anchor/Hall sites and the public movement `acceptance733 entered Hall`. Separate public GETs of `/v1/watch/live` and `/v1/watch/map` returned HTTP 200, the same target, sequence 1 and `freshness=live`. This is rendered target-world WATCH, unlike the earlier receipt's browser view of its configured default world. Inspected public DOM text contained no private MESSAGE body, credential or authenticated response. It does not prove all possible hidden-data disclosures; it is the bounded observed surface.

## Limits

This receipt supports the specific **same-isolate-version hosted reset → post-reset committed staging settlement → real-browser target WATCH** chain. It does not claim production deployment/action, a later production version read, formal submitted GitHub approval, R0 PLAY presentation completion, all R3 requirements, R4 Native Interaction slices, optional C9, or full issue closeout. [#733](https://github.com/Zero-State-LLC/Noema/issues/733) remains **OPEN** pending those separate criteria. No raw authenticated responses, private entity identifiers, DO instance IDs, secrets, tokens, passwords or connection strings are published.
