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

## Remaining authority and acceptance

No hosted Worker called, no alarm or hibernation proof claimed. The actual #777 campaign needs a separately scoped isolated target and operator authorization. This followup is a reviewable branch based on #866, not approval to merge or close #777. Existing review bypass authorization was specific to already merged #856.
