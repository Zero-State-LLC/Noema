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

## Evidence status

This map was recorded before the second-repairer implementation. Results are
pending and must be filled from actual receipts, not inferred from inspection.
Keep failed attempts and identify dirty runs separately from clean committed
head evidence. Never publish retained signing values or bearer credentials.

## Remaining gates

Independent review of draft #856, WAIT/TRACES contract decisions, human first
reads, actual assistive-technology testing, proxy-study authorization, and
hosted design/campaign authority remain separate. No merge or deployment is
part of this local acceptance increment. No positive public rumor writer,
organizational ownership lifecycle, SQL settlement or hosted eviction is proved.
