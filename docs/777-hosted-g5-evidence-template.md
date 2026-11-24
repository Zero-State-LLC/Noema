# #777 hosted G5 evidence template: admission and raw observations only

Status: **NOT_COMPUTABLE for hosted G5 acceptance**. No hosted Worker was called for this correction. The runner does not execute or prove alarm firing, alarm settlement, eviction recovery, or WebSocket hibernation.

Runner: `workers/noema/scripts/hosted-g5-probe.mjs`. Supply explicit nonblank `BASE`, `WORLD_ID`, `PLAYER_TOKEN`, `ADMIN_TOKEN`, and `SEAL`. BASE must be an isolated HTTP(S) origin, without URL credentials, path beyond `/`, query, or fragment. Production `noema.guru` and subdomains are refused. WORLD_ID must be an explicit nonempty `test.hosted-canonical.<suffix>`, never the helper's default. Missing/invalid configuration exits 2 with `NOT_COMPUTABLE` before network access. Credentials and raw transport errors are not printed.

`WS_URL` or `G5_HIBERNATION_WAIT_MS`, even empty/zero, refuse before requests. There is no WebSocket or instance eviction/probe branch. `G5_WAIT_MS` defaults to 25000 and must be an integer from 0 through 60000. Each request, including body consumption, has a 5000 ms deadline and 64 KiB body cap. Redirects are forbidden.

Before pinning, WATCH must be HTTP-successful with `freshness: live`, `watch_live: watch-live/1.0`, the requested world, and nonnegative safe-integer sequence/cycle. Pin must be HTTP-successful with `ok: true`, the requested world and an object `player_tempo`. Failure stops before wait or further mutation. After WATCH must satisfy the same validation. The only mutation attempted is this admitted tempo pin.

A completed read/pin/wait/read returns `RAW_OBSERVATIONS_ONLY` (exit 0), **not overall G5 success**. `watch_advanced` reports raw sequence or cycle growth. Such activity cannot causally attribute an alarm fire or settlement. The report always records `alarm: not_observed` with that limitation, `alarm_after_evict: not_run`, and `hibernated: not_run`. Refused/failed observations return `NOT_COMPUTABLE` (exit 2).

| Evidence field | Result | Interpretation |
|---|---|---|
| Isolated target admitted | not_run | Record only after an authorized isolated campaign. |
| Tempo pin accepted | not_run | Admission is not alarm evidence. |
| Valid before/after WATCH counters | not_run | Raw observations only. |
| watch_advanced | not_run | Counter growth is not causal alarm proof. |
| Alarm fire/settlement | not_observed | Causal attribution unavailable from WATCH growth. |
| Alarm after eviction | not_run | No eviction is executed. |
| WebSocket hibernation | not_run | Required socket/instance/post-idle protocol is not implemented. |

Maintained tests in `workers/noema/test/hosted-g5-probe.test.ts` cover CLI admission and loopback HTTP transport controls plus injected synthetic evidence checks. These are **not hosted proof**, and loopback HTTP sentinels are not the real Worker runtime. Existing local fixture tests that call `alarm()` or hibernation handlers directly likewise do not prove hosted behavior. The coordinator owns real local Worker acceptance, full-suite and generated-declaration checks, graph refresh and publication. A real #777 campaign still requires a separately scoped isolated target and authorization. Production behavior remains unchanged.
