# Local second-repairer provenance acceptance

## Intent and scope

Close the local maintenance-plate replacement gap in the existing public
`npm run acceptance:mud:local` workflow. This is server conformance tooling, not
new product behavior or hosted acceptance. The existing Mini Chamber seed has
exactly two non-regenerating material units for two repairers
(`workers/noema/src/mini-chamber.ts:76-116`). The previous runner harvested both
with the builder and verified only that builder's plate across one restart.

Use those same two units through canonical Agent commands, one per repairer.
Do not change genesis, seed supply, budgets, runtime writers, CLI admission,
credentials, cleanup policy, or hosted state. Preserve all 49 existing named
acceptance checks and their existing notice/MOVE/expiry/LEAVE guarantees.

## Pre-implementation requirement-to-check map

| ID | Requirement | Acceptance check and required observation |
| --- | --- | --- |
| R1 | Legal finite supply and provenance | Two different Agents each HARVEST one of the existing material units and REPAIR the same relay through real Worker HTTP. Canonical transfer/update events identify the source, amount and latest repairer. Existing exact five-budget costs are asserted. No injected state or stock refill. |
| R2 | Replacement, not additive stale attribution | Fresh authorized LOOK and anonymous WATCH after the second repair each contain exactly one maintenance plate naming the witness and no plate naming the builder. Authored notice bodies remain excluded from WATCH. |
| R3 | Cached history cannot revert current provenance | Replay a retained repair identity and require its exact original response. Fresh independent observations around replay prove latest attribution and no second repair/debit, except the normal LOOK attention cost. If the first actor's post-LEAVE admission prevents replay, use the second writer's retained identity and document that narrower coverage rather than bypassing admission. |
| R4 | Latest attribution survives actual persistence boundary | Stop the owned server, start a different process with the same isolated name/config/storage, then require fresh LOOK and WATCH to retain only the latest plate and unchanged cycle. This is actual local workerd restart, not JSON rehydration or hosted SQL evidence. |
| R5 | Existing lifecycle and failure cleanup stay intact | All prior 49 named checks still pass. Separately run public interruption acceptance and independently verify every recorded owned group is absent, both ports closed and local signing file removed. |
| R6 | Integrated and published result is source-bound | Read the scoped implementation diff, run the whole Worker suite and generated/committed typechecks, verify CI checkout identity and source equivalence, publish to existing draft #856, compare changed remote blobs and verify all nine protected clone baselines. |

Pure assertion negative controls should reject stale, duplicate and absent plate
attribution where a small helper makes that invariant reusable. Such controls
are synthetic and do not substitute for R1-R5's real public command path.

## Budget interpretation

The current material HARVEST consumes energy 2 and compute 1, fills one unit of
hold (free storage -1), and credits influence 0.5 (`world-actions.ts:4014-4106`).
The next command's `ensurePlayer` calls `cloneBudgets`, which floors existing
fractional values (`world-actions.ts:795-823`, `actions.ts:609-617`). Consequently
the following REPAIR observation includes influence -0.5 normalization, not an
additional repair cost. Its canonical `BUDGET_CONSUMED.cost_paid` remains energy
3, compute 2 and storage 1. Consuming that cargo restores free storage by one.
Acceptance must distinguish observed normalization from the committed cost event
and must not change either runtime behavior to make the check pass.

## Evidence status

The pre-implementation map was committed as `4a3aba2`, before implementation
`f27003b` and the coordinator's first-writer strengthening `ad9ec93`. The complete
public workflow was then executed against clean committed
`00b383eb9b1bd3401031812dad4bc2ff785947e8` on November 11, 2026.

| ID | Observed result |
| --- | --- |
| R1 | Passed. The actual receipt records stock 2, then two different Agents each harvesting 1 and repairing the same relay, leaving stock 0. Both HARVEST and REPAIR cost events and all five observed budget deltas match the existing behavior described above. Canonical ENTITY_UPDATE identifies each actor, latest public handle and repair cycle. |
| R2 | Passed. Three successful fresh authenticated LOOKs and three anonymous WATCH reads after replacement each contain exactly one witness plate and no builder plate. The four authored notice sources remain absent. These reads occur after replacement, after stale replay and after another real restart. |
| R3 | Passed. The departed builder's retained repair identity returns the exact original response both before and after replacement. Three separate fresh builder LOOKs remain refused with NOT_IN_WORLD and unchanged budgets. Fresh witness LOOK around stale replay preserves location/traces and all budgets except LOOK attention 1. No actor is re-entered to bypass admission. |
| R4 | Passed. Three distinct owned process IDs are recorded. The third process opens the same isolated storage and fresh LOOK/WATCH retain only the witness plate, exhausted source and unchanged cycle. Restart changes no budgets except the fresh LOOK attention cost. |
| R5 | Passed. All 49 original named checks are present within the expanded 81-check workflow, with 45 bounded records. The separate actual npm SIGTERM workflow passes 8 checks and retains its expected failed inner receipt. Coordinator follow-up independently observes ESRCH for recorded groups, refused connections on both ports, and absent signing files for both workflows. |
| R6 | Full local Worker suite passed: 297 files, 2,712 tests. Focused admission/assertion coverage passed 38 tests, including five explicitly synthetic unique/stale/duplicate/missing-plate controls. Both actual generated-type and committed-declaration typechecks passed. Only the tool-generated declaration drift was restored. Final remote/CI publication attestations are recorded separately in the PR evidence packet. |

Source-bound local artifacts, retained privately under the scratch evidence root:

- Normal: `coordinator-clean/mud-local-7aGtZp/receipt.json`.
- Interruption: `coordinator-interruption/mud-interruption-Tf1JqI/interruption-receipt.json`.
- Per-requirement independent readback: `coordinator-provenance-verification.json`.
- Separate interruption teardown: `coordinator-interruption-verification.json`.
- Complete local suite: `full-worker.log`.

The root is `noema-mud-second-repair-20261111` in the operator's private scratch
directory. Retained runtime state and signing values are not public evidence.
One dirty development attempt failed because the assertion omitted the existing
fractional influence normalization (`40 !== 40.5`). That failed receipt is retained
as `worker/mud-local-aak6EE/receipt.json`, not counted as a passing run or recast as
a runtime defect. The runtime was not changed to satisfy the assertion. Dirty
worker/coordinator development passes are separate from the clean-head result.

## Remaining gates

Independent review of draft #856, WAIT/TRACES contract decisions, human first
reads, actual assistive-technology testing, proxy-study authorization, and
hosted design/campaign authority remain separate. No merge or deployment is
part of this local acceptance increment. No positive public rumor writer,
organizational ownership lifecycle, SQL settlement or hosted eviction is proved.
