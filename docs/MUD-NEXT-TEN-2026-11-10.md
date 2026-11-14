# MUD next-ten bounded closeout, 2026-11-10

This is a local implementation and evidence handoff for #733/#775/#779/#781,
not an R4 acceptance, deployment, merge or owner sign-off. User-approved scope
was ten bounded slices plus research of open questions and coordination with
existing local clones.

## Baseline and coordination

Runtime base: `8cb958bfd332e7abaf3d35cb198ec756ffe61f58`.
Reviewed code/test commits: `79e71c1`, `2718d0a`, `e43ac08`.
Pinned Specs: `b86c4b09cf75b3027d87998eff0952c2421bf52d`.

Three workers shared one clean, main-based checkout on
`fix/mud-closeout-slices-20261110`, with disjoint explicit file ownership.
The prior WAIT draft #851 was not incorporated. No existing regression assertion,
seed, Genesis, reducer contract or TTL was changed. The only runtime change is
forwarding caller-supplied optional flags through `playTextFromObservation`.
No new floor/readiness producer was invented.

Protected local work was left in place: `Noema-733`, `Noema-733-four-beat`,
`Noema-733-text-line`, `Noema-Orin`, the root `Noema-Specs`, the pinned scratch
Specs checkout, and the three prior Specs-364 checkouts. Their branches and dirty
paths were recorded before work, then checked again at handoff. No merge,
cherry-pick, branch switch, restore or cleanup was performed in those checkouts.
The pinned Specs checkout's preexisting dirty PR template was preserved.

## Historical requirement-to-check map (2026-11-10)

| Slice | Concrete check and observed result | Boundary / disposition |
| --- | --- | --- |
| 1. WAIT contract | Issue #850 re-read after implementation. It is OPEN with no owner resolution. Prior #851 CI reproduced the unchanged `ok` assertion versus proposed `wait` outcome conflict. | BLOCKED on owner decision. This branch preserves green main and does not resolve the contract by editing tests. WAIT used below only exercises existing cycle/expiry mechanics. |
| 2. Deterministic room presentation | `mud-room-contract.test.ts`: actual exported Worker/DO handlers produce identical presentation for permuted entity/exit/room insertion order, exclude hidden/private data, and retain the latest chronological board entry. Full suite passes. | Existing stable sorting needed no rewrite. Current additive TRACES placement is preserved, not a new section-policy decision. |
| 3. Optional STATUS | New true/false/absent wrapper cases pass. `e43ac08` forwards already-known `energy_floor_risk` and `play_blocked` values that the wrapper previously dropped. Actual mounted observations have neither field. | Helper compatibility fix only. No authoritative Agent-observation flag producer was found, and no low-energy threshold/readiness guess was added. Operational `/ready` already produces `play_blocked` for the configured default world; that separate surface is not automatically an authorized observation for another target. See the [decision brief](MUD-DECISIONS-2026-11-10.md). |
| 4. MOVE orientation and costs | Native mounted tests check destination, legal hints, all five budgets, hidden-route rejection, no extra LOOK event, replay and retained storage restart. Actual local `/v1/command` rejects down without debit, moves east with energy -1 and compute unchanged, and returns the original MOVE observation after a real workerd restart without moving/debiting again. | Real local HTTP/restart evidence, not hosted SQL. Energy plus a second budget is observed, not a newly invented second debit. |
| 5. C1 seed examples | Twelve new native pytest cases pass against the actual linked `examples/chamber-world/world-seed.json`: three room descriptions, local entities, exits/targets, budget vocabulary/defaults and real offline entry/projection. Input bytes remain unchanged. | Non-normative prose, condition bands, arrival balances and HAPPENED are not treated as golden reducer output. Not the hosted miniChamber or a Genesis change. |
| 6. Maintained consumer | Actual `/play` responds 308 to `/connect`. RFC-0120 and `837-s2-acceptance-contract.md` retire human PLAY and do not maintain the legacy first-paint room helper as a browser product. The maintained `/watch?mode=text` consumer was exercised below. | Applicability research complete. T1.5 room 375x812/desktop acceptance is NOT claimed. Owner must identify the maintained Agent room consumer or explicitly retire that criterion. No fake room page was built. |
| 7. Authored text safety | Actual canonical MESSAGE writes for BOARD, SHOUT, NOTICE and TRADE_NOTICE retained markup literally in authorized Agent lines/events. Actual public WATCH excludes these four sources by design. A real REPAIR plate renders in Brave as a SPAN with a single native text node, zero unsafe descendants and no page-world execution sentinel. Two visible Refreshes reconstruct fresh safe nodes. | No unsafe sink reproduced, so no speculative sanitizer change. The permitted repair handle is sanitized, not hostile authored WATCH text. This does not replace the separately bounded synthetic hostile-trace receipt from #842 or prove every browser mode. |
| 8. Invalidation | Seven new lifecycle tests cover rumor roots/locality/visibility, source removal, ownership/vacancy removal and four notice updates/expiry. Real local two-agent MESSAGE -> LOOK -> both WAIT -> committed-cycle LOOK removes all four notice lines while retaining the repair plate. | Synthetic canonical-state rumor/ownership transitions are labeled as such. A single WAIT did not advance the two-agent world; the complete actual barrier path was then exercised successfully. No new TTL was invented. |
| 9. Remaining provenance | Real canonical REPAIR residue survives actual process restart, builder LEAVE and independent witness LOOK/WATCH. Native tests also use canonical office create/assign/act/vacate with retained fake-platform storage and explicitly seed only the spatial ownership precondition. | No hosted eviction, SQL row proof, all-family provenance or R4 closure. PUBLIC office claims target the org, not a room/entity, and correctly do not become room rumors. No room-rumor writer was invented. |
| 10. Integrated validation | Coordinator reviewed all changed tests/code, reran the whole Worker suite (288 files / 2,542 tests), all 12 C1 cases, full offline suite (575 passed / 29 skipped), and actual Worker typecheck. Final graph and exact published-head CI/readback are recorded in the PR handoff. | Local offline skips: 26 official-client integration cases need the separately pinned client checkout, three need Postgres. CI is configured to provide the official client. Local skip counts are not acceptance evidence for those paths. |

## Actual local acceptance observations

Only `http://127.0.0.1:8799`, `NOEMA_ENV=local`, world
`test.hosted-canonical.next-ten`, retained isolated local state. No production
request, deployment, reseed, reset, paid run or external settlement credentials.
`settled: true` on a local response is not evidence of hosted SQL settlement.

- The actual Mini Chamber supplied two materials. A guessed `beacon` class was
  correctly rejected; no class or seed was changed to force that probe through.
- The canonical office writer emits ENTITY_CREATE with an office entity ID, not
  a bespoke office-created event. The probe was corrected without duplicating
  the successfully created office.
- A single WAIT initially left cycle 0 unchanged because a second present agent
  was not waiting. After checking the actual all-present barrier, the complete
  four-writer-to-expiry path was rerun at cycle 1 -> 2 and passed.
- Remaining material spoiled at a committed cycle. A second REPAIR correctly
  failed BUDGET_EXCEEDED. No extra supply or owned asset was injected. Real
  repair-update provenance is not credited to that failed attempt.
- The first local server hit its owned ten-minute task timeout. Browser Refresh
  truthfully showed unavailable. Restarting against retained state restored the
  real data, then both visible Refresh checks passed. Hidden tabs were not
  credited as successful refreshes.
- Brave text-mode checks used the actual mounted page at 1200x823. The trace was
  `A maintenance plate names nextten-builder-mwan94er as the last repairer.`
  Both refreshes had fresh nodes, no four forbidden notice markers, no img,
  script, iframe or event-handler descendants, and no `__nextTenXss` in the page
  JavaScript world. This is not mobile, accessibility, all-mode or hostile
  permitted-trace sink qualification.

## Reproduction and retained receipts

Project-native checks:

```sh
cd workers/noema
npm test -- --maxWorkers=1 --no-file-parallelism
npm run typecheck
# From repository root, with a compatible Python containing project dev deps:
CI=true python3 -m pytest -q tests/test_mud_projection_examples.py
CI=true python3 -m pytest tests
```

Local receipt directory: `~/.jcode/scratch/noema-mud-next-ten-20261110/`.
Receipts contain no bearer tokens. They retain actual command events and
observations, not a copied implementation or an alternate simulated server.
Their hashes establish which local observations support this handoff, not
publicly hosted or owner-accepted execution:

| Receipt | SHA-256 |
| --- | --- |
| `http-prepare.json` | `a4375272c10519baad7ff5c9c248425bec1292b33b89b4d491d4584fe3867f0c` |
| `http-authored.json` | `0cf4e2f48116f463bcb79f234d6442e229bec28f34f5a897c8de1616898a6acb` |
| `http-restart.json` | `63093a072fad62d7042ebb4a2e441c8ef1816793d3036db8747395272b11c333` |
| `http-expiry.json` | `fd86a1b5ebcaf2d6d10d389fa56bb92f9d5fc9726ecc463fd7c00a0da8e6e69a` |

## Repository-native local follow-up

The subsequent ops follow-up exposes `npm run acceptance:mud:local` for a fresh,
self-owned local world, canonical four-surface writers, a real retained-storage
process restart, committed-cycle expiry and independent post-LEAVE readback.
See [Local MUD acceptance](MUD-LOCAL-ACCEPTANCE.md) for the command, safety
boundaries and receipt interpretation. It does not turn the historical receipts
above into hosted acceptance or resolve the decisions below.

## Decision research follow-up

The [November 10 decision brief](MUD-DECISIONS-2026-11-10.md) separates settled policy from remaining owner choices. In particular, #733 already has a bounded November 6 same-run hosted required-gate receipt at source `5cebeca4`; #733 remains operator-held, and whole-R4 acceptance is separate. The remaining hosted/all-family gaps below are not a claim that this historical receipt is missing. Neither historical evidence nor this local branch silently certifies a later runtime.

## Current WAIT decision (2026-11-12 UTC)

The owner adopted internal `wait` / public `ok` for accepted complete WAIT, with truthful rest, failure/partial precedence and unchanged timing/budgets. The original requirement map above and its test/receipt pins remain historical, not a current missing-owner-decision claim. See [WAIT compatibility](WAIT-OUTCOME-COMPATIBILITY-850.md). Draft851 is not merged, the R1 assertion is unchanged, and current-main integration, independent review and remaining S1 acceptance are separate.

## Still open

- #850/#851 compatibility implementation/current-main verification, independent review and accountable disposition; the owner contract choice is adopted.
- Owner disposition for retired T1.5 room-browser acceptance and any intended
  change to current TRACES section policy.
- An authoritative Agent-observation source for optional flags, if product behavior
  needs them, rather than this wrapper-only compatibility seam or an unqualified
  default-world `/ready` value.
- Hosted campaigns, principal/SQL/post-eviction proof, broader hostile authored
  trace sources and parent R4 acceptance. None is silently promoted by this work.
