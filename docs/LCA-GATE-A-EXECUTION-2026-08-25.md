# LCA Gate A execution evidence — 2026-08-25

**Status:** runtime candidate evidence; all five Gate A runtime checks pass on candidate `61234ccee1861438850fef787e355d481c104553`, but Gate A is not complete until reviewed campaign promotion
**Campaign authority:** Noema-Specs `docs/LIVING-ALPHA-ACCEPTANCE.md` Gate A
**Promotion boundary:** this runtime packet does not edit Specs campaign state, enroll external Controllers, or authorize a new deployment

## Candidate declaration

| Required declaration | Observed value |
|---|---|
| Advanced Worker commit | `61234ccee1861438850fef787e355d481c104553` (`origin/main`) |
| Complete Worker validation | Authoritative PR #586 CI: 216 test files and 1,483 tests passed with no skips; `npm run typecheck` passed. Local post-change rerun: 215 files passed / 1 skipped, 1,470 tests passed / 13 skipped |
| Frozen production-alpha comparison | Frozen first-world pin remains runtime `9e0e41fdd589df46064b06f48b524f35d9613f16`, Worker `a210eb35-f1ce-44fd-87e4-1b11e90394b8`, `world-01`, Genesis `genesis.ef578f4ffceeccd0`; it was not touched |
| Live production deployment | Worker `01ebc196-b762-4689-a166-272e26bd73ad`, deployed `2026-08-25T19:27:58.964668Z`. The retained deployment transcript records the fast-forward to `61234cc`, the exact checkout path, and resulting Worker version ID |
| Live world constraints | `world.perihelion-reach-3`, Genesis `genesis.94d0961984b2b4f8`, accepted seal unchanged, entry `room.civic-exchange`, existing room bound unchanged |
| External client / Controller versions | The official client version remains single-sourced in `spec-compat.json`; no external Controller participated in Gate A. External population is Gate B |
| Enabled systems | Full suite covers GC1–GC10, diplomacy, access policy, WATCH, settlement, recovery, identity, replay, and closed-catalog guards; no accepted slice was disabled |
| Operator interventions | Existing production deployment at the declared version; read-only `/version`, `/ready`, `/v1/watch/live`, Wrangler metadata, and route-drift probes; no reseed, Genesis activation, recovery mutation, or new deploy |
| Start/end canonical head | Public capture stayed at cycle `2188`, sequence `7839`, ACTIVE / HEALTHY during the bounded read-only evidence window |
| Recovery receipts | Integrated restart scenario, older-world migration, incident recovery, isolated settlement proof, rollback evidence, settlement-chain, and accepted-replay tests passed |
| WATCH capture | `/v1/watch/live` returned HTTP 200, `freshness: live`, cycle `2188`, sequence `7839`; capture digest `sha256:4cbae1bb2210550694d8f77a1cba3d3c3e0a2e8caf29787390ebbbc5d66676d2` |
| Known production delta | Repository pin was stale after a concurrent deployment during this audit. This packet updates `spec-compat.json` to the superseding Worker; no public route exists in the candidate that is absent from the declared live source |

## Requirement-to-evidence result

| Gate A requirement | Evidence | Result |
|---|---|---|
| Complete Worker suite and typecheck pass together | PR #586 CI on the exact candidate: 216 files / 1,483 tests passed with no skips; typecheck passed. A fresh local post-change rerun also passed with environment-gated skips | PASS |
| Existing systems remain enabled | Full suite passed, including accepted slice, closed-catalog, projection, identity, communication, economy, culture, pressure, diplomacy, access, WATCH, settlement, and recovery tests | PASS |
| Durable state shares one event and settlement spine | `lca1-acceptance`, `isolated-settlement-proof`, `settle-head`, `settlement-chain`, and accepted-replay coverage passed | PASS |
| Restart/recovery preserves durable state | `lca1-acceptance` preserves identity, trade memory/obligation, organization, asset, message, access restriction, budgets, and head; compatibility and incident-recovery suites passed | PASS |
| No semantic breadth was added to repair integration | Candidate is current `origin/main`; this execution changes only evidence documentation and the stale deployment pin | PASS |

## Public-boundary observations

- `GET /version` → HTTP 200; evidence digest `sha256:c4a9f860381e214eb8a3e17bd962e61d62d0c7a13a63b5d4b5d1987fbcd75c5b`.
- `GET /ready` → HTTP 200, `ready: true`, ACTIVE, HEALTHY, playable; evidence digest `sha256:336b5a15b6aa81552e18e8e982cd81d547c36e00c4a2b56bed15df059643c4e6`.
- `GET /v1/watch/live` → HTTP 200 and matched the same canonical head.
- Wrangler reported the current version with `NOEMA_ENV=production`, protocol `1`, and `DEFAULT_WORLD_ID=world.perihelion-reach-3`.
- `deployed-route-drift.mjs --live-ref 61234ccee1861438850fef787e355d481c104553 --probe https://noema.guru` reported no routes added since the live build.

## Validation provenance and targeted reruns

- Authoritative PR #586 CI on candidate `61234cc`: 216 files / 1,483 tests passed with no skips; typecheck passed.
- Fresh local post-change rerun: 215 files passed / 1 skipped; 1,470 tests passed / 13 skipped; typecheck passed.
- The retained deployment transcript reports checkout `/home/scrimshawlife/.jcode/scratch/noema-fresh-remote-20260824/Noema`, production upload, and resulting Worker version `01ebc196…`; the same transcript records the fast-forward to `61234cc` immediately before deployment.
- Integrated scenario, compatibility, older-world load, incident recovery, settlement chain, and rollback: 6 files / 22 tests passed.
- Accepted replay, isolated settlement proof, settle head, and settlement inspection: 4 files / 25 tests passed.

## Honest boundary and next gate

The five Gate A runtime checks pass on the declared candidate. **Gate A is not complete** until the evidence/pin packet receives normal review and Specs campaign authority promotes it. Gate B remains blocked on a human-approved production device enrollment and at least three independent external Controllers. This packet does not claim either one.
