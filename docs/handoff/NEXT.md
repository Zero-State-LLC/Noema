# Next

The current hand-off: latest review verdict and the next work order. Whoever finishes a slice or a review overwrites this file. Read it at the start of a session.

## Latest local slice (2026-11-11): #793 fallback-presence repair

- Branch: `fix/793-fallback-presence-20261111`; base `88e111c5d9fc83203a7f414b0af2dade07cf2bec`.
- Scope and requirement-to-assertion map: [PRESENCE-FALLBACK-793-LOCAL-REPAIR.md](../PRESENCE-FALLBACK-793-LOCAL-REPAIR.md). The owner authorized this local repair and validation, not a hosted campaign or review-rule bypass.
- Product delta: reuse the existing valid retained observer-room predicate for `players_here`, preserving useful fallback display and independent own-roster/office/action entitlements.
- Verified local evidence: actual RED1pass/6intendedfailures, GREEN7pass, exact-source reversal1pass/6failures, restoredGREEN7pass; affected60pass/0fail/0pending with all53inherited cases preserved.
- Complete local validation: built-asset Worker2,811pass/0fail/0pending across302files; generated declarations typecheck0, exact committed declaration restoration and separate tsc0; wiring-only graph build/check and repeat hash equality; all11new-test incident edges audited and38other graph-delta source paths proven unchanged/already absent at base; post-graph affected60pass. Full execution preserved every earlier2,797registration; seven cases were added by already-landed concurrent work and seven by this repair. Raw receipts are local operator evidence, not hosted acceptance.
- Publication/landing gates: independent Standards and Spec review, exact committed-byte rechecks, exact-head GitHub CI and eligible code-owner approval. Runtime repository auto-merge is disabled and was not changed. This local source snapshot is unmerged, and #793/#733 remain OPEN. Never infer GitHub approval from local review or owner implementation approval. No deployment or settings change is authorized.

## Previous slice (2026-11-11): WATCH is one 3D Chamber stage, live

- **Spec:** Noema-Specs [`specify/watch-single-3d-stage.md`](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/specify/watch-single-3d-stage.md), decisions D1–D5 (Specs #392). D3 was amended at implementation (Specs #393): the view choice lasts for one visit; public `/watch` neither reads nor writes `noema.watch.mode`; Low noise is the lasting text-only preference.
- **Runtime:**
  - #867: the stage behind `?mode=3d`.
  - #869: map bands and world health on the stage.
  - #872: the stage is the default, and the TEXT / PIXEL / MAP rail and the MAP WebGL chunk are retired.
  - #876: the chunk URL carries a content-hash version (`/assets/watch-stage.js?v=<sha256[0:12]>`, written by `npm run build:watch-stage`).
  - #875: the public text-only Phosphor bootstrap neither reads nor writes `noema.watch.mode`, which now belongs only to Admin Watch's TEXT / PIXEL choice. The privacy notice says so, effective 2026-11-11. The owner delegated the review and the date.
- **Live:** Worker `cf01c793-5e9e-433f-bd05-a4ed9f4ead45`, pinned on `main` by #879. Checked on 2026-11-11:
  - `/privacy` shows "Effective date: 2026-11-11" and the new `noema.watch.mode` line.
  - `/watch` requests `watch-stage.js?v=b6f0ac8221af`, and the served file hashes to the same value.
  - In a browser with `noema.watch.mode` preset to `pixel`, running `/watch`'s inline scripts made no read or write of the key.
  - The stage mounts with 10 site labels, and the console shows no errors.

**Verdict:** shipped. Every runtime PR merged with green `build` and `Worker regression`. #855, #875, #876, #877, #878 and #879 were admin-merged at the owner's explicit instruction. The merged WATCH branches are deleted.

## Next work order

1. **Not verified:** the stage under Safari with VoiceOver, Windows with NVDA, and iPhone with VoiceOver. Only desktop Chromium was checked.
2. **CI note:** during the 2026-11-11 GitHub Actions outage, runs queued between 20:25 and 20:41 UTC were orphaned and never started. If a PR's checks stay "expected" after an outage, close and reopen it to start a fresh run.
3. **Other lane, do not touch:** the MUD next-ten work in [`docs/MUD-NEXT-TEN-EXECUTION-20261111.md`](../MUD-NEXT-TEN-EXECUTION-20261111.md) has its own coordinator and owned files.
