# #777 hosted tempo alarm and WebSocket hibernation

Status of this file: **NOT_COMPUTABLE**. No isolated Worker was called while writing it.

Runner: `workers/noema/scripts/hosted-g5-probe.mjs`. It refuses `noema.guru` and any world id that is not `test.hosted-canonical.*`. Missing `BASE`, `WORLD_ID`, `PLAYER_TOKEN`, `ADMIN_TOKEN`, or `SEAL` exits 2 with `status: NOT_COMPUTABLE`.

Local fixture coverage already on main is `workers/noema/test/isolated-tempo-pin-777.test.ts` and `workers/noema/test/isolated-watch-hibernation.test.ts`. Those call `alarm()` and the hibernation handlers directly. They are not a hosted alarm fire and not an observed hibernation.

| Check | Result (`observed` / `not_observed` / `not_run`) | Notes |
|---|---|---|
| Pin accepted on the isolated world |  |  |
| Sequence advanced after one cadence with no further command |  |  |
| Evict between schedule and fire, alarm still ran |  | `evict` uses `retryAlarm: false` (`world-do.ts` isolated reset). This cell is the open question. |
| WebSocket stayed open across an idle eviction and the next ACT was correct |  | Hibernation is observational. `not_observed` is not a product failure. |

Production tempo and production alarm behavior stay unchanged.
