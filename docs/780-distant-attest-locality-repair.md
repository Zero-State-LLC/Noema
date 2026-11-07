# #780 — distant ATTEST locality availability repair

## Scope

Preserve discoverable public distant infrastructure in ATTEST suggestions, but mark those suggestions unavailable with `You must be in the same room to attest.` The existing executor and its authority/locality checks are unchanged. Co-located subject availability retains the existing affordability rule and insufficient-attention reason. Locality copy takes precedence when both distance and affordability block a suggestion; this is not a claim about executor error-precedence under multiple failures.

Base: `4e98f9845b32c6f677635157061a43749760bc7e` (merged #816).

## Behavioral evidence

At the public reducer seam, the original diagnostic followed the exact advertised OPERATING text command and the same metadata via structured COMMIT in fresh equivalent fixtures. A distant subject was marked available but both routes returned NOT_COLOCATED. Moving only the subject to the actor/artifact room made both routes succeed and settle the correct ENTITY_UPDATE. Distant refusals emitted no events, made no settlement calls and preserved the bounded canonical projection.

The repair's failing-before-fix assertions require unavailable metadata for distant subjects, not successful distant execution. They failed for both OPERATING and DESTROYED through text and structured routes (four failures; five controls passed). The minimal repair makes the expected metadata truthful while preserving direct NOT_COLOCATED refusals.

`workers/noema/test/isolated-attest.test.ts` retains its original three tests verbatim and adds eight cases:

- Four distant-subject cases: both claims through exact text and structured fields; unavailable with locality reason, direct refusal, zero events/settlement and unchanged bounded state.
- Two co-located OPERATING controls: available, successful and settled artifact/subject/claim match.
- Two zero-attention OBSERVE controls: local affordability reason preserved, distant locality reason retained, no budget/room/sequence change. OBSERVE is used because ordinary LOOK legitimately costs attention and settles read events.

Focused file: 11 tests pass. The bounded rejection projection includes sequence, rooms/entities, actor budgets/discovery, evidence fragments and unsettled state; it excludes replay/activity/pending bookkeeping and other unprojected world fields. Positive controls use the same callback shape and assert real settlement events. These are local fixture measurements, not hosted canonical SQL.

## Governing references and limits

Noema-Specs `6e169df1607a33b1c65d976bf05f225e7bae5fce`, RFC-0020:19–32 requires a visible co-located ARTIFACT and names NOT_COLOCATED. Those passages do not explicitly settle subject locality. This change conservatively aligns suggestions with the existing executor rather than inventing expanded remote authority. It adds no wire verb, topic-help advertisement, truth adjudication or source-access grant.

The local DESTROYED ontology, arbitrary label ambiguity, hidden/conditional subject visibility, cap ordering, modifiers and other ATTEST variants are not newly certified by this repair. Existing related tests remain regression controls, not whole-family acceptance. No historical audit verdict recensus, matrix-state upgrades or issue disposition is made. #780/#733 remain open; deployment or a new hosted campaign requires separate authorization.

## Reproduce

From `workers/noema`:

```sh
VITE_CONFIG_NATIVE_IGNORE_WARNING=true npm exec --no -- vitest run test/isolated-attest.test.ts --reporter=verbose
npm exec --no -- tsc --noEmit -p .
```

Expected: 11 tests pass and project typecheck exits zero.
