# Next

The current hand-off: latest review verdict and the next work order. Whoever finishes a slice or a review overwrites this file. Read it at the start of a session.

## Latest slice (2026-11-11): WATCH is one 3D Chamber stage, live

- **Spec:** Noema-Specs [`specify/watch-single-3d-stage.md`](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/specify/watch-single-3d-stage.md), decisions D1–D5 (Specs #392). D3 was amended at implementation (Specs #393): the view choice lasts for one visit; public `/watch` neither reads nor writes `noema.watch.mode`; Low noise is the lasting text-only preference.
- **Runtime:**
  - #867: the stage behind `?mode=3d`.
  - #869: map bands and world health on the stage.
  - #872: the stage is the default, and the TEXT / PIXEL / MAP rail and the MAP WebGL chunk are retired.
  - #876: the chunk URL carries a content-hash version (`/assets/watch-stage.js?v=<sha256[0:12]>`, written by `npm run build:watch-stage`).
- **Live:** Worker `45c610e0-9f18-4657-9963-30a427483d87`, pinned on `main` by #877. Checked on 2026-11-11:
  - `/watch` requests `watch-stage.js?v=8898cfa3c6c2`, and the served file hashes to the same value.
  - In a browser, the stage mounts with 10 site labels, the text fallback stays hidden, and the console shows no errors.

**Verdict:** shipped. Every runtime PR merged with green `build` and `Worker regression`. #876, #877 and this hand-off's predecessor #855 were admin-merged at the owner's explicit instruction.

## Next work order

1. **#875 (draft, owner only):** the privacy notice wording for `noema.watch.mode`, which now covers only the operator Watch TEXT / PIXEL choice. It needs owner review and an effective date; the test pins `2026-11-08`.
2. **Branch cleanup (owner):** remote branches `feat/watch-stage-default`, `feat/watch-stage-default-v2`, `feat/watch-stage-map-bands` and `fix/watch-stage-cache-bust` belong to merged or closed PRs. The agent safety check blocked deleting them.
3. **Not verified:** the stage under Safari with VoiceOver, Windows with NVDA, and iPhone with VoiceOver. Only desktop Chromium was checked.
4. **Other lane, do not touch:** the MUD next-ten work in [`docs/MUD-NEXT-TEN-EXECUTION-20261111.md`](../MUD-NEXT-TEN-EXECUTION-20261111.md) has its own coordinator and owned files.
