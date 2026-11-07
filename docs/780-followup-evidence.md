# #780 follow-up evidence: landed packets and review frontier

**Status: OPEN; bounded local evidence, not whole-S2 acceptance.** This supplements the #815 snapshot with the five landed packets below. The separate #815 audit remains an immutable source-pinned snapshot; its source-only candidate wording is not the current disposition of these repaired cases.

### Landed follow-up evidence

| Packet | Reviewed head → merge | Concrete bound | Current file tests |
|---|---|---|---|
| [#816](https://github.com/Zero-State-LLC/Noema/pull/816) — Reconstruction publication repair | `f632c5b5324d78040265ee866fa857ff8601aee9` → `4e98f9845b32c6f677635157061a43749760bc7e` | Advertised retained-record publication now selects the existing reconstruction ID rather than creating a second public record. Author/refusal/replay bounds remain local. | [16](https://github.com/Zero-State-LLC/Noema/blob/642d71bc8423e2533c4c4a9f55becff7c2a2e551/workers/noema/test/agent-reconstruct.test.ts) |
| [#817](https://github.com/Zero-State-LLC/Noema/pull/817) — Distant ATTEST availability repair | `ac537d4ab0a2a32b27d4656b39bb8de2919c0e35` → `3a30be62325f89a2e253f4aa0d11d140d4b1450a` | Distant subjects remain discoverable but unavailable, with locality reason before affordability; equivalent local controls succeed. Existing executor locality policy was preserved, not broadened. | [11](https://github.com/Zero-State-LLC/Noema/blob/642d71bc8423e2533c4c4a9f55becff7c2a2e551/workers/noema/test/isolated-attest.test.ts) |
| [#818](https://github.com/Zero-State-LLC/Noema/pull/818) — ATTEST boundary coverage | `cafc8ebedc1b50d6758942eae4479919abc14967` → `fd87f53e222b82889a1ff7b5a9fd94ea90035077` | Ten initially-green boundary cases plus private guard sensitivity. These are coverage, not ten product repairs. | [10](https://github.com/Zero-State-LLC/Noema/blob/642d71bc8423e2533c4c4a9f55becff7c2a2e551/workers/noema/test/attest-boundaries-next10.test.ts) |
| [#819](https://github.com/Zero-State-LLC/Noema/pull/819) — BUILD/ACCESS example-copy repair | `0c40e99b77a4732d631bd0cafb62693f6a526849` → `648a942fb016804ac3dd9ee3dba4504ca9b6f8e7` | Four actual grammar/copy repairs: VEST to, SHARE with, CONNECT to, and room-allow applies_to. Ten cases cover grammar and bounded ACCESS reducer authority/effects; BUILD parsing alone did not certify execution. | [10](https://github.com/Zero-State-LLC/Noema/blob/642d71bc8423e2533c4c4a9f55becff7c2a2e551/workers/noema/test/topic-help-grammar-next10.test.ts) |
| [#820](https://github.com/Zero-State-LLC/Noema/pull/820) — BUILD execution coverage | `0a37934ef5292169a72594ee6dd15d00be4e9cf1` → `642d71bc8423e2533c4c4a9f55becff7c2a2e551` | Ten initially-green developer-command cases follow rendered SHARE/VEST/CONNECT HELP through retained identities, owner/office/steward refusals, costs, connected fake settlement and replay. Two setup corrections were not product defects. | [10](https://github.com/Zero-State-LLC/Noema/blob/642d71bc8423e2533c4c4a9f55becff7c2a2e551/workers/noema/test/build-topic-execution-next10.test.ts) |

Fresh local replay against a tree identical to merged main `642d71bc8423e2533c4c4a9f55becff7c2a2e551`: **57 passed /0 skipped across 5 existing evidence files**. This is their current combined test count, not 57 newly added tests. No production files were changed for this reconciliation. [Exact #820 merge main CI42354709367](https://github.com/Zero-State-LLC/Noema/actions/runs/42354709367) passed build and Worker regression. The #820 full-suite receipt is 2,250 passed /21 skipped; that full suite was not rerun as part of this reconciliation.

### Published review frontier — #821 is not landed

[Draft PR #821](https://github.com/Zero-State-LLC/Noema/pull/821) contains the two locally completed proposed tickets **P25-R** and **P25-S** (local labels, not assigned GitHub issue numbers). Reviewed head `5256315c690f502c31a18eb2868467aef46dcc5a`; base/main `642d71bc8423e2533c4c4a9f55becff7c2a2e551`. Its six cases are in [clarification-materiality-next.test.ts](https://github.com/Zero-State-LLC/Noema/blob/5256315c690f502c31a18eb2868467aef46dcc5a/workers/noema/test/clarification-materiality-next.test.ts).

- P25-R: unchanged choices, chosen-recipient departure and recycled label each require the exact body-reentry response, with no MESSAGE replay, new settlement or bounded canonical delta.
- P25-S: canonical numeric INSPECT target, same-ID seal refusal and exact expiry with fresh-pick success. Active-seal cases returned FORBIDDEN. Direct handle/seal/cycle interventions establish local read-time behavior, not live authority or scheduling.
- Six tests and fixture match the saved plan, all initially GREEN with no production repair. Six private baseline/assertion-RED/restored-GREEN probes were inspected. MESSAGE reversals first detect UNKNOWN_COMMAND vs required INVALID_REQUEST; they do not independently prove an unauthorized body send.
- Exact-head parent post-review: **6 focused; 142 affected passed; 2,256 full passed /21 skipped**, including served-asset build. Typecheck/graph/diff PASS. Independent technical PASS (6/142 and typecheck/diff) and Spec PASS (6 and typecheck); these are not submitted eligible approvals.
- [Exact-head CI42360586054](https://github.com/Zero-State-LLC/Noema/actions/runs/42360586054): build and Worker regression passed. **Draft/OPEN means not merged, not deployed and not acceptance-certified.**

### Historical census is preserved

The #815 inventory remains pinned to its original source and retains **46 producers: 4 PROBE_PASS /40 FIXTURE_GATE /2 SOURCE_ONLY**, plus 15 topic comparisons, three retained helper chains and four clarification classes. This follow-up does not rescan templates, rewrite its machine verdicts or treat topic-help execution as proof that each matching structured affordance producer is safe. Historical report/ledger/matrix states remain historical; these later packets are separate bounded evidence, not an automatic all-family promotion.

### Remaining necessary work

| Row | Current disposition and next gate |
|---|---|
| T2.1/T2.2 | Owner applicability decision for retained first-paint/mapping helpers, or a maintained served caller followed through its actual surface. Existing bounded source tracing is not dead-code or browser proof. Preserve RFC-0120 retirement; World Service talk is not Player MESSAGE. |
| T2.3 | Reconstruction-publication and distant-ATTEST candidates have reproduced repairs, plus their bounded regression packets. Exact remaining producer/variant fixtures still need authority, affordability, alias/label and canonical-target proof; no whole-family clearance follows. |
| T2.4 | Four BUILD/ACCESS dictionary defects are repaired. #819 establishes selected grammar and ACCESS local authority/effects; #820 adds selected BUILD SHARE/VEST/CONNECT execution. Other forms, target variants and authority/cost states still require instantiated examples; a dictionary is not a current-availability promise. |
| T2.5 | #821 adds reviewed local recipient-departure/recycled-label and entity-seal/expiry evidence, pending landing; it makes no fingerprint change. Office-authority revocation and movement access-policy clarification still need concrete public fixtures and applicable decisions. Require an actual unintended successful/wrong-target pick before a fingerprint repair; normal executor refusal is safe. |

### Limits and disposition

Local developer reducer/retained-target and connected fake-settlement proof is not external canonical SQL, actual object persistence/restart, hosted scheduler, browser/WATCH or response-wide certification. B10.07 establishes personal-owner gate ordering, not unauthorized VEST success; B10.09 checks hidden outbound exit and one-way eligibility, not every hidden-room predicate. Later SHARE capacity and full BUILD catalogue/treasury/authority variants remain outside the packet.

Independent technical and Spec PASS are review evidence, not eligible submitted GitHub approvals. Each landed administrator exception was scoped to that PR only. No prior exception, source merge or skipped Supabase Preview grants hosted acceptance or future authority. Known inferred graph test-registration edges are generator advisories, not application calls.

All 49 matrix acceptance states and existing follow-ups are preserved. #780 and #733 remain OPEN. No closure, deployment, new hosted campaign or acceptance-state upgrade is implied.

## Tracking surfaces

[Repository evidence kanban](../KANBAN.md) records landed, review and blocked work. On the configured [GitHub Projects #18](https://github.com/orgs/Zero-State-LLC/projects/18), the existing authenticated browser added the existing repository records and set **#780 to In Progress** and **#821 to Review**. Both statuses were verified after independent page reloads. The CLI credential lacks Projects scope, but browser account access works; no credential or security-setting change was required. Collaboration-automation success alone does not prove insertion, because the workflow downgrades board errors to warnings. This report certifies only those two scoped board entries, not a complete board mirror.
