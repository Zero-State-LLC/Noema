# Darwin owned-group reaping: diagnosis and fix specification

Date: November 11, 2026. Baseline: `d4289ad99de8ce4a7bd0b5afce41a1d75f4e5fff`.

## Diagnosis and evidence boundary

The earlier actual npm interruption receipt failed on an owned-group signal-0
`EPERM`. Its process-state snapshot was not captured. Sixty subsequent ordinary
public npm runs did not reproduce it, so that historical instance is not proven
to have any particular cause and remains failed.

A minimized real-OS reproducer now establishes a cleanup design defect on Darwin
25.3.0 / Node 22.23.1: fork a same-UID child, make it a new session/process-group
leader, exit it, and hold reaping with `waitid(WEXITED | WNOWAIT)`. The only group
member is `Z`. Actual negative-PGID signal 0, SIGTERM and SIGKILL all throw EPERM.
After its parent reaps it, the same group probe returns ESRCH. The existing
`stopOwned` fails immediately, even when reaping is scheduled 150ms later. Three
consecutive timed baseline runs failed in this way. No injected kill results or
foreign process groups were used. The C diagnostic is scratch-only, not a build
dependency. A maintained Node-only real-process regression will cover this seam.

## Research and competing explanations

1. **Unreaped exit state:** predicts same-UID zombie-only group EPERM becomes
   ESRCH after reaping. Confirmed by the real OS reproducer.
2. **Actual permission denial:** predicts EPERM persists without a successful
   signal/probe or ESRCH. It must remain failure, with the exact original thrown
   error and bounded diagnostic. Synthetic negative controls exercise this
   safety rule without targeting another user's processes.
3. **Live group descendant:** predicts signal-0 succeeds while it remains alive.
   Existing owned-child and escalation controls must retain their behavior.

Primary sources consulted, not third-party diagnoses:

- Apple `kill(2)` manual: negative PID addresses a process group; EPERM is not
  ESRCH. `https://developer.apple.com/library/archive/documentation/System/Conceptual/ManPages_iPhoneOS/man2/kill.2.html`
- Node v22 `process.kill`: signal sender, with signal 0 as an existence probe.
  `https://nodejs.org/docs/latest-v22.x/api/process.html#processkillpid-signal`
- Apple's published XNU `kern_sig.c`, immutable commit
  `f6217f891ac0bb64f3d375211650a4c1ff8ca1ea`, `killpg1` lines 1606-1621:
  group iteration filters SZOMB and returns EPERM when none are counted under
  POSIX semantics. This source explains the reproduced behavior, but is not
  claimed to be the exact installed kernel build. The exact local kernel tag
  was unavailable at the public repository.
  `https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/bsd/kern/kern_sig.c#L1606-L1621`

## Narrow fix contract

Scope: `stopOwned` in the LOCAL MUD acceptance runner, its diagnostic tests,
a new real-process test, this spec and user-facing local acceptance docs.
No world logic, transport, hosted operations, grant policy, arbitrary PID/URL
option, or independent outer observer verification changes.

- **R1:** Only Darwin EPERM from an owned-group signal/probe may yield and retry
  the same operation. Share a maximum of ten 100ms reaping waits across one
  `stopOwned` invocation. This adds at most 1,000ms of requested waits to the
  existing 40+30 shutdown waits. It is not an unbounded timer or a per-probe reset.
- **R2:** Never interpret EPERM, child exit state, `ps` output, or closed ports as
  absence. Successful cleanup still requires the actual group probe to reach
  ESRCH. A successful signal alone is insufficient.
- **R3:** Persistent EPERM exhausts the shared budget and throws the first EPERM
  of that operation, retaining its identity and safe bounded diagnostics. No
  forced success, process enumeration, privilege escalation or foreign kill.
- **R4:** Other platforms and other errors remain fail-closed without these
  retries. Existing ordinary ESRCH, live-group timeout, TERM/KILL escalation and
  wait-error behavior remain covered.
- **R5:** The only new receipt field is optional per-process
  `cleanup_reap_waits`, an integer 1..10. It records attempted reaping waits on both
  success and failure, including a wait that itself rejects. No messages,
  commands, environment or secrets are added.
- **R6:** The platform/kill/wait test seam is programmatic only. CLI admission
  and sanitized child environment remain unchanged.

## Requirement-to-check map

The map was committed before implementation. Initial failures and corrected
results are distinguished below. The native Node regression uses only owned
processes, real `process.kill` calls and a parent that deliberately delays reaping.

| Requirement | Concrete check | Observed result |
| --- | --- | --- |
| R1, R2 | Real OS zombie group released inside the grace window, then actual `stopOwned` and independent ESRCH probe | Baseline C reproducer failed three times. Unchanged C repro and maintained Node regression pass after the fix; Node counter is 1..10 and no failure diagnostic is emitted. |
| R1, R3 | Real owned zombie held for 3 seconds, beyond the grace window | Native regression fails cleanup with actual EPERM after exactly ten waits, retains the owned signal diagnostic, and independently observes EPERM before the parent finally reaps and ESRCH afterward. |
| R1, R3 | Synthetic repeated EPERM at TERM, probe and KILL, unchanged target and error identity | All three exhaust ten waits and throw the exact first error object for that operation. |
| R1 | Alternate transient signal/probe EPERM without resetting budget | Shared-budget regression passes with ten total waits across operations. |
| R2, R4 | Live group after transient error, ordinary owned child and escalation | Live-group negative control remains fatal, ordinary real owned-child cleanup passes, and escalation controls pass. |
| R4 | Linux EPERM, EACCES/EINVAL/EIO and thrown wait controls | All remain fail-closed. Non-Darwin synthetic controls make no new wait. Wait and later-error identity are preserved. |
| R5 | Recovery/failure counters, bounded records, secret/accessor exclusion | All 21 diagnostic/control cases pass, including bounded output and original-error preservation. |
| R6 | Actual npm help and rejected external/relative options; no environment/config switches | Pending corrected-head public admission execution. |
| Integration | Actual npm lifecycle 49 checks and interruption 8 checks, independent groups/ports/signing-file absence | Pending corrected-head public execution. |
| Integration | Actual npm with explicitly synthetic transient/persistent signal and probe EPERM | Pending. Recovery must pass after one injected error. Eleven errors must retain failure after ten waits, even if final cleanup succeeds. |
| Integration | Full Worker suite, generated and committed types, exact-head Linux CI, protected clones | Focused 24 tests and committed types pass. Remaining full-result checks pending. |

## Explicit limits

This fixes the reproduced premature-failure pattern, not a retroactive finding
about every historical EPERM. A group that remains unreaped or inaccessible
past the small grace window still fails. The independent outer interruption
observer remains fail-closed and unchanged. Actual foreign-UID permission denial
is not induced. Human/AT, WAIT/TRACES decisions, review and hosted authorization
gates are unrelated and remain open. No merge or deployment is authorized by this
specification.
