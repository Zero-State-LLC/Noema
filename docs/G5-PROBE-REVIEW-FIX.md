# G5 probe admission and evidence correction

Scope: PR #866 only. Existing CI has TS2769 for a sanitized child environment. Review comments 4533456116, 4533456126 and 4533456131 identify three false-target/false-evidence paths. This correction does not implement or execute hosted G5 acceptance.

## Requirements declared before implementation

- R1: BASE, WORLD_ID and three credentials must be explicit and nonblank. No helper default world is permitted. Admit only http(s) origins without URL credentials/path/query/fragment and never production doors. Invalid configuration must exit 2 with NOT_COMPUTABLE before network or mutation. Do not echo credentials or credential-bearing URLs.
- R2: A successful fresh WATCH read must identify the exact requested world before any tempo pin. Pin must be HTTP success with ok:true, matching world_id and a player_tempo object. A failed/mismatched pin must stop before wait or eviction. The after snapshot must be successful, fresh and same-world. Failures are NOT_COMPUTABLE, not observed alarms.
- R3: Sequence/cycle advancement is only raw watch activity, not proof an alarm fired or settled. Report watch_advanced separately, alarm not_observed with an explicit attribution limitation. Alarm-after-evict remains not_run. Remove the unsupported eviction and WebSocket inference branch. Configured WS_URL or a hibernation wait must refuse before any request until the required socket-open, changed-instance, retained socket and correct post-idle reply protocol is implemented. No arbitrary WS target contact. Hibernated remains not_run.
- R4: Preserve sanitized subprocess environments without spreading process.env or casting away types. Supply required nonsecret runtime fields explicitly. Capture baseline failing negative controls before fixing source, then pass maintained refusal/admission/evidence controls and committed plus generated declaration typechecks.
- R5: Bound requests, response bodies and waits, reject redirects, and do not emit secrets in errors. Keep raw evidence counters bounded and nonnegative. No production/runtime behavior, seed, supply, deployment, credentials, or existing clone state changes.

## Validation map

R1: real CLI missing each variable, forbidden/malformed origins and non-isolated world, assert zero requests using a loopback sentinel. Unit admission controls are supplemental.
R2: maintained injected rejected/mismatched pin/watch cases assert no later mutation. Actual loopback Worker with unchanged public interfaces must exercise no-config and mismatched-target refusal; safe successful pin is optional only if existing fully isolated local test routes can be provisioned without hosted resources.
R3: increasing mocked sequences must never produce an observed alarm, WS option must refuse without constructing a socket, no instance reset is performed. These are explicit synthetic negative controls, not hosted G5 proof.
R4: focused tests, whole Worker suite, generated/committed typechecks and exact PR CI readback.
R5: real CLI timeout/redirect/oversized-body controls may use a loopback HTTP server, explicitly transport controls not runtime-semantics proof. Review full diff, source binding and clean ownership.

## Observed local results, 2026-11-11

Validated source commit: `bdd58c4ecdf3b6cae175ddb5228cf37fb470fe87`. Defect tracker: #868. Original failing CI and the four preimplementation negative controls were retained, not replaced by later green results.

| Requirement | Concrete check and observed result |
|---|---|
| R1 | Actual executable missing/blank-variable and invalid origin/world/unsupported-option controls refused with exit 2 and zero sentinel requests. The separate coordinator run recorded 17 executable admission cases with zero sentinel contact. |
| R2 | Against an unchanged real local workerd with a unique isolated world, the executable refused a mismatched WATCH target. A direct local tempo-pin request returned 404, the executable refused the same-world unsupported pin, and independent before/after WATCH cycle and sequence stayed identical. Maintained synthetic pin/watch negatives checked that rejection stops before wait or further requests. No successful hosted pin was attempted. |
| R3 | Executable synthetic loopback success performed exactly GET WATCH, POST tempo-pin, GET WATCH, returned `RAW_OBSERVATIONS_ONLY`, and kept alarm `not_observed`, eviction/hibernation `not_run` even when counters advanced. Executable rejected-pin control made only the first two requests. These are synthetic transport controls, not hosted alarm or hibernation proof. |
| R4 | `vitest run test/hosted-g5-probe.test.ts`: 48 passed. Actual `npm test`: 299 files and 2,773 tests passed on Darwin. Actual `npm run typecheck` passed with generated declarations. After restoring only that tool-generated declaration output, `tsc --noEmit` passed with committed declarations. No casts or inherited shell secrets were added. Exact remote CI remains a separate publication gate. |
| R5 | Executable loopback controls refused redirects and oversized bodies and bounded a pending request at five seconds. The independent real-runtime run passed 22 checks and verified owned process group ESRCH, closed HTTP/inspector ports, and removal of its signing file. Nine pre-existing clone branch, HEAD and dirty-path baselines were preserved. |

The real-runtime loop prevented a false green: the first implementation checked a fabricated `pin` WATCH field. Actual `buildWatchLive` emits `watch_live: "watch-live/1.0"` at `workers/noema/src/watch-live.ts`. The executable, template and fixtures now use that real field, and a maintained test consumes the actual projection builder without introducing a compatibility field into the runtime. Earlier scratch setup failures also exposed a missing sealed-agent header and a missing historical Specs object in the new shallow sibling clone. Both were corrected in validation setup only. Their failed receipts/logs are retained.

The real local receipt is `actual-cli-tviV8D/receipt.json` under the private `noema-g5-followup-0508` evidence directory. It records the source commit, script SHA-256, individual checks and independent cleanup. The ordinary CLI output does not contain tokens or raw transport errors. Temporary generated declaration and graph-ignore changes are not part of this correction.

## Remaining authority and acceptance

No hosted Worker called, no alarm or hibernation proof claimed. The actual #777 campaign needs a separately scoped isolated target and operator authorization. This followup is a reviewable branch based on #866, not approval to merge or close #777. Existing review bypass authorization was specific to already merged #856.
