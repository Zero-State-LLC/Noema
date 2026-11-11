# Reproducible local MUD acceptance

This is server/protocol conformance tooling for the bounded MUD closeout. It is
not a product client, hosted deployment, SQL settlement campaign, or R4 sign-off.

## Run

From a macOS or Linux checkout with Node 20 or newer and the lockfile-pinned
Worker dependencies installed (Windows process groups are not supported):

```sh
cd workers/noema
npm ci
npm run acceptance:mud:local -- --artifacts "$HOME/.cache/noema-mud-acceptance"
```

For Jcode runs, place artifacts under the provided scratch directory instead of
inside a repository or an existing acceptance campaign. Each invocation owns a
fresh run directory. The Worker CI job invokes the same public npm command with
its runner-temporary artifact directory, then separately exercises actual
SIGTERM cleanup through the interruption command below.

No already-running dev server, hosted URL, operator token, Supabase credentials,
production signing secret, reseed, or global reset is required. The command does
not take a caller-supplied base URL or production world. It starts its own local
Wrangler/workerd process and stops only the processes it created.

## Acceptance boundary

The workflow uses the real Worker HTTP interface and canonical commands rather
than a copied reducer or a simulated server:

1. Start with a generated local-only configuration, fresh isolated storage and
   owned loopback ports. Keep the same Worker name and storage directory across
   the restart. Supply a separate local-only token-signing binding so normal
   repository dev-server settings and `.dev.vars` are not prerequisites.
2. Mint Agent controller tokens locally and ENTER both Agents through canonical
   commands. Do not inject state or invent extra material supply.
3. Exercise a rejected MOVE without a debit, then a legal MOVE and return through
   existing Mini Chamber exits. Verify destination orientation, legal hints,
   the existing five-budget contract, and no hidden LOOK event. Retain the
   original command's request and idempotency identities for replay.
4. Create supported office/repair preconditions through canonical commands, then
   write all four supported room notice sources through MESSAGE: BOARD, SHOUT,
   NOTICE and TRADE_NOTICE. Verify authorized Agent readback.
5. Stop and restart the actual workerd process against the same retained state.
   Verify notice and repair attribution survives. Replay the original MOVE with
   the same identity and verify its original response. Independently LOOK before
   and after replay to prove current location and budgets did not change, except
   for the existing LOOK attention cost. A cached response alone is not proof of
   no second move or debit.
6. Exercise the all-present Agent WAIT barrier to commit the existing expiry
   cycle. Verify all four notice fields disappear, while the repair plate remains.
7. Read independently after the builder leaves. Verify public WATCH includes the
   permitted repair plate and excludes those authored notice sources.
8. Emit a bounded receipt without bearer tokens or the local signing value, and
   stop the owned server on success or failure.

LOOK is not free: the existing contract charges attention 1. WAIT here tests the
cycle barrier and expiry, not the disputed `ok` versus `wait` presentation token.
A rejected MOVE is an expected command result, not a failed acceptance run.
The legal MOVE checks the existing energy debit and preservation of the other
budgets, not an invented additional debit. The return trip keeps both Agents in
the original room for the notice, repair, and independent-readback checks.

### MOVE replay evidence

The receipt's individually named checks and recorded command identities must
show all of the following, not only a successful process exit:

| Requirement | Recorded acceptance observation |
| --- | --- |
| Rejected direction | Expected rejection code, no canonical events, unchanged location and all budgets. |
| Legal MOVE | Actual destination and return affordance, one MOVE event, no LOOK event, and existing exact budget deltas. |
| Retained idempotency | Same request/key after the actual process restart returns the original result. |
| Current state is independent of cached result | Fresh LOOKs around replay retain the current room and all other budgets, with exactly the normal attention cost of LOOK. |
| Existing lifecycle still works | Four notice writers/readbacks, retained restart state, expiry, post-LEAVE plate and WATCH privacy checks still pass. |

This local server/protocol path does not qualify browser viewport presentation,
hosted eviction, or SQL settlement.

## Reproduce interruption cleanup

```sh
npm run acceptance:mud:interrupt -- --artifacts "$HOME/.cache/noema-mud-interruption"
```

This separate POSIX smoke check starts the actual public
`npm run acceptance:mud:local` command in a fresh owned artifact directory. It
observes the generated world's real loopback `/health` response before sending
SIGTERM to its own npm process group. It requires npm to terminate with a
positive failure exit code or Node's `{code:null, signal:"SIGTERM"}` result, and an
inner receipt with `status: "failed"` and `Interrupted by SIGTERM`, then
independently checks owned process groups, both ports and signing-file removal.
A successful smoke result proves this bounded failure-and-cleanup path, not
successful MUD conformance. The normal 49-check command remains a separate run.

The observer has bounded startup and shutdown deadlines and accepts no external
URL, existing run, caller PID or hosted credentials. Missing readiness, a normal
success before interruption, missing receipts or incomplete cleanup must fail the
smoke rather than being credited as interruption coverage. SIGKILL is outside the
graceful-cleanup guarantee. Both commands run in the Linux Worker CI job.

The smoke emits `interruption-receipt.json` with eight individually named checks,
the npm exit result and a reference to the failed inner `receipt.json`. The
one-line public CLI summary also reports `npm_exit`, so CI records the observed
termination representation. Its fresh directory and files are private. A per-invocation random nonce binds the
runner's private `ownership.json` to the observer that launched it. That file
contains only local identities, ports and owned process groups, not signing
material. The observer does not discover kill targets by process-name scans,
listen-port scans or a caller-supplied receipt. The ordinary conformance command
does not emit this ownership file unless launched by the observer.

## Evidence and limits

### Owned-process cleanup diagnostics

A failed owned-process stop can add `cleanup_diagnostics` to its existing
`processes` entry. The enclosing entry identifies the run phase. Each diagnostic
records only the owned process/group IDs, cleanup stage, attempted signal or
existence probe, and a recognized error code or bounded numeric errno when
available. At most four failed attempts are retained per process. Raw error
stacks, paths, arbitrary properties and credentials are not copied into these
structured fields. Ordinary successful stops omit the optional diagnostics.

Diagnostics do not change the original `error` / `cleanup_error` failure text or
expand which processes can be stopped. If final cleanup succeeds after an earlier
stop failed, the original failed run and its diagnostic remain failed evidence.
Injected permission failures in tests are synthetic controls, not proof of an
actual OS permission failure or the cause of a historical failure.

On Darwin, an exited but unreaped process group can return `EPERM` rather than
`ESRCH`. The local runner now permits at most ten shared 100ms reaping waits per
owned stop, retrying the same signal/probe. This adds at most 1,000ms of requested
waits to the existing 40+30 shutdown waits. **EPERM never means absence**: the group
must still reach an actual `ESRCH` probe. Persistent EPERM remains failure with
the original error identity, and non-Darwin and other error behavior is unchanged.
Optional `cleanup_reap_waits` (1..10) records attempted reaping waits in that
process entry, without messages or secrets. The independent interruption
observer is unchanged and still fail-closed. See `MUD-DARWIN-REAPING-FIX.md` for
the real-OS reproduction, primary-source research and requirement-to-check map.
The historical EPERM receipt had no process-state snapshot, so this confirmed
failure pattern is not retroactive proof of that individual run's cause.

### Receipt provenance and remaining boundaries

Keep the command's receipt with the tested Git head and native test/CI results.
The receipt records available Git HEAD and dirty-state metadata. A dirty run is
not evidence for a clean published commit; rerun after committing for that claim.
The HTTP fetch, body reads and cancellation await the same ten-second request
deadline and interruption signal. A transport that fails to settle its own
cancellation must not prevent the runner from reaching owned-process cleanup.
An interrupted run exits unsuccessfully and records the interruption reason and
cleanup results in its receipt. That expected failure receipt is not a successful
MUD conformance run. SIGKILL cannot provide this graceful-cleanup guarantee.

Generated local state is local test material, not a hosted ledger or SQL row
proof. The fresh signing file is removed on cleanup, but the retained run
directory still contains local world state. Do not publish that directory,
configuration files or bearer credentials as evidence.

The command does not qualify synthetic rumor/ownership transitions as canonical
writers, prove BUILD.VEST from a fixture-owned asset, exercise a maintained Agent
room viewport, or establish hostile authored-text safety in every browser mode.
Owner-held WAIT #850/#851, authoritative optional STATUS flag producers, room
consumer applicability, hosted all-family/post-eviction provenance and parent R4
acceptance remain independent decisions.

Historical handoff and criterion mapping: [MUD next-ten bounded closeout](MUD-NEXT-TEN-2026-11-10.md).
