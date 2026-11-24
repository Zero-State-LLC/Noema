# #781 after #856

Source pin: `38d8fd81b0296ba3b5fdd2c3528222b012b53413`. This note does not change matrix states and does not mark S3 VERIFIED.

## Observed local run

`vitest run test/mud-trace-lifecycle.test.ts test/mud-trace-supported-lifecycle.test.ts test/org-trace-provenance-781.test.ts test/s3-authored-text-boundaries.test.ts` in `workers/noema`: **24 passed, 0 failed**.

Those files already cover later-family reprojection, supported insignia/vacancy/rumor writers, organization provenance references, and literal board/shout/institution/trade text on the JSON wire. #856 landed the lifecycle cases. This change adds no new trace tests.

## Not computable here

- Hosted SQL readback of every trace family on this pin. The November 6 AC17 receipt is 8/8 for one repair plate on an older source, not this main.
- Elapsed-time expiry. The local cases clear or move canonical sources and read again.
- A new browser XSS campaign. The earlier localhost Chrome supplement in `docs/781-local-trace-coverage.md` stays pinned to its own source.

`workers/noema/scripts/acceptance-733.mjs` already has the AC17 phase. Running it needs an isolated Worker and database, which this change does not do.
