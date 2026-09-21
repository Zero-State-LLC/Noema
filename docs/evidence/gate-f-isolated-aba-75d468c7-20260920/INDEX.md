# Gate F isolated A-B-A rehearsal — 2026-09-20 (PASS r2)

**Issue:** [Zero-State-LLC/Noema#715](https://github.com/Zero-State-LLC/Noema/issues/715) (OPEN)
**Candidate:** `lca6-gate-f-successor-decision`
**Successor source (SUCCESSOR_NAMED, not live):** `75d468c750aeb04490969f33d2cc13ad7e85a3a5` ([#717](https://github.com/Zero-State-LLC/Noema/pull/717) sharp@0.35.4 override)
**Live baseline (unchanged):** Worker `ac6813da-1e0a-4f0c-8566-d9346b4baed5` / source `630652e6772d4fbc340cf155a33fd628163709d9`
**Pattern:** [ISOLATED-ROLLBACK-REHEARSAL.md](../../ISOLATED-ROLLBACK-REHEARSAL.md) / [#562](https://github.com/Zero-State-LLC/Noema/pull/562). Historical #555 receipts are not substitute evidence.
**Rehearsal script fix:** [#719](https://github.com/Zero-State-LLC/Noema/pull/719) (`wait /ready` after deploy before genesis) — PR-only; no production Deploy.

**Isolated A-B-A rehearsal verdict: `PASS` (r2).**

This packet seals **item-4 operational rehearsal** continuity for successor `75d468c7` on an isolated Worker only. It is **not** Gate F COMPLETE, **not** a scored seven-item packet, **not** `GO` / `NO-GO`, and **not** authorization for Deploy. #715 stays open. Scoring remains deferred.

## Pins (from receipt files only)

| Surface | Value |
|---|---|
| Isolated Worker | `noema-rollback-rehearsal-gatef-75d468c7-20260920-r2` |
| A / A′ (rollback_active) | `7e749359-c2e0-445a-ba4d-3ef9002bba56` |
| B | `c847fdc7-755d-4cab-94a4-7a8f32701256` |
| Source commit | `75d468c750aeb04490969f33d2cc13ad7e85a3a5` |
| World | `test.hosted-canonical.ewm-cutover` |
| State digest (A/B/A′) | `sha256:4249c808c36bdd47ea7000eb5fd036631880bdd9da987d5023366ce8f63724fa` |
| History digest (A/B/A′) | `sha256:c451d963a754f9ae7ef8340a3936d93f10edd19f4ae2b186630c6885ba02b9ba` |
| Production `/version` before+after | `ac6813da-1e0a-4f0c-8566-d9346b4baed5` (`unchanged: true`) |
| Finished (UTC) | `2026-09-20T23:40:45.610Z` (= **16:40 PDT**) |

## Files

| File | Contents |
|------|----------|
| [GATE-F-NOTE.md](GATE-F-NOTE.md) | Gate F overlay: PASS labels, #719 warm fix, prior FAIL pointer |
| [ISOLATED-ROLLBACK-REHEARSAL-717-EVIDENCE.md](ISOLATED-ROLLBACK-REHEARSAL-717-EVIDENCE.md) | Human PASS receipt (r2) |
| [ISOLATED-ROLLBACK-REHEARSAL-717-EVIDENCE.json](ISOLATED-ROLLBACK-REHEARSAL-717-EVIDENCE.json) | Machine PASS receipt. Digests from run only. No secrets |
| [workers-noema-630652e6-to-75d468c7.diff](workers-noema-630652e6-to-75d468c7.diff) | `git diff 630652e6..75d468c7 -- workers/noema` |
| [workers-noema-630652e6-75d468c7.diff](workers-noema-630652e6-75d468c7.diff) | Same bytes (alias matching #718 path) |
| [prior-fail-r1/](prior-fail-r1/) | HISTORICAL r1 FAIL (cold DO / genesis 500) |
| [prior-not-computable/](prior-not-computable/) | HISTORICAL #718 auth-gap NOT_COMPUTABLE docs |

## Verdicts

| Check | Verdict | Why |
|---|---|---|
| Isolated A-B-A rollback continuity | **PASS** | A/B/A′ digests matched; rollback restored A at 100%; idempotent ENTER stable; post-rollback WAIT advanced sequence |
| Production identity unchanged | **OBSERVED** | GET `/version` stayed `ac6813da…` before and after. No production write |
| Gate F seven-item score / `GO` | **not issued** | Scoring deferred. Packet incomplete for item 7 |
| Gate F COMPLETE | **no** | Companion + this seal do not COMPLETE Gate F |

## Prior attempts (honesty)

1. **#718 docs** — `NOT_COMPUTABLE` (Cloud Agent missing Wrangler auth). See `prior-not-computable/`.
2. **r1 box run** — `FAIL` at genesis/preview HTTP 500 on cold DO. See `prior-fail-r1/`.
3. **r2 box run** — `PASS` after `/ready` wait (script delta later landed as #719). This directory.

## Explicit non-claims

- Not Gate F COMPLETE
- Not `GO` / `NO-GO`
- Not Deploy / pin-on-publish / `noema-gateway` mutation
- Not a dual-SHA live cutover of production
- Not PLAY on `world-01` or any perihelion world
- Not a claim that live Worker advanced to `75d468c7`
- #715 stays open; successor remains `RUNTIME_ONLY` / SUCCESSOR_NAMED only
