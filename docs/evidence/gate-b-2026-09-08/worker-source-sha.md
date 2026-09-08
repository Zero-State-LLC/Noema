# Gate B — Worker source git SHA lookup (live UUID 963b5edf…)

**Collected:** 2026-09-08T07:31:22Z UTC (**2026-09-08 00:31:22 PT**)  
**Issue:** [Zero-State-LLC/Noema#590](https://github.com/Zero-State-LLC/Noema/issues/590)  
**Live Worker UUID:** `963b5edf-17ea-41f4-892f-130e278e0bb8`  
**Locks honored:** no Deploy; no secrets dump; no Gate B COMPLETE claim; does not close #590.

---

## Verdict

| Item | Status | Value |
|------|--------|-------|
| Live Worker UUID matches `/version` | **OBSERVED** | `963b5edf-17ea-41f4-892f-130e278e0bb8` |
| Worker **source** git SHA for that UUID | **OBSERVED** | `308c98de4173874d8a1941818ba4392ddcc2cba6` |
| Sealed pin-bundle fields (`spec-compat.json` → `hosted_live`) | **OBSERVED** | see §3 |
| Separate standalone sealed-bundle artifact file beyond `hosted_live` / pin PR | **NOT_COMPUTABLE** | none found in `/tmp/c7diag` or Gate B evidence folder |
| Source SHA field on live `/version` JSON itself | **NOT_COMPUTABLE** | endpoint does not expose `source_commit` |

---

## 1) `curl -sS https://noema.guru/version` — full JSON (OBSERVED)

Fetched **2026-09-08T07:31:22Z UTC** (2026-09-08 00:31:22 PT). Unchanged vs prior Gate B packets.

```json
{"product":"noema","stage":"0","env":"production","protocol_version":"1","world_id":"world.perihelion-reach-3","worker_version_id":"963b5edf-17ea-41f4-892f-130e278e0bb8","deployed_at":"2026-09-08T05:52:14.712143Z"}
```

**Note:** No `source_commit` / source SHA on this public surface. Mapping UUID→source SHA requires the post-deploy pin PR / `spec-compat.json`.

---

## 2) GitHub pin PR mentioning `963b5edf` — **OBSERVED** (#649)

| Field | Value |
|-------|-------|
| PR | [Zero-State-LLC/Noema#649](https://github.com/Zero-State-LLC/Noema/pull/649) |
| Title | `chore: pin live Worker 963b5edf-17ea-41f4-892f-130e278e0bb8` |
| State | **MERGED** at `2026-09-08T05:54:33Z` UTC |
| Merge commit | `8a7a62d1a027eb20d640a7330d830cd560545f61` |
| Pin commit on PR branch | `60b8a29c25980bf98dcd683a005f245632b6a6e4` |
| **Source commit deployed by workflow** | **`308c98de4173874d8a1941818ba4392ddcc2cba6`** |
| Wrangler deployment Worker version id | `963b5edf-17ea-41f4-892f-130e278e0bb8` (matches live) |
| Evidence URL / fetched_at (from PR body) | `https://noema.guru/version` / `2026-09-08T05:52:17.823Z` |

Source commit object verified via `gh api repos/Zero-State-LLC/Noema/commits/308c98de4173874d8a1941818ba4392ddcc2cba6`:

| Field | Value |
|-------|-------|
| Full SHA | `308c98de4173874d8a1941818ba4392ddcc2cba6` |
| Message (headline) | `O2: Admin-session Approve on /connect (#648)` |
| Author/committer date | `2026-09-08T05:48:49Z` UTC |
| Parent | `c19e5e954c679708e49209800b627769cc5eb774` |
| URL | https://github.com/Zero-State-LLC/Noema/commit/308c98de4173874d8a1941818ba4392ddcc2cba6 |

`gh api search/issues` for the UUID returned HTTP 404 (search API not usable with this token path); direct `gh pr view 649` succeeded and is the OBSERVED source of the UUID→SHA mapping.

---

## 3) Sealed pin-bundle fields from `spec-compat.json` → `hosted_live` (OBSERVED)

Read from `main` tip of Zero-State-LLC/Noema (`gh api …/contents/spec-compat.json`) after #649 landed. These are the production PLAY pin fields written by the post-deploy pin workflow.

| Field | Value | Status |
|-------|-------|--------|
| `worker_version_id` | `963b5edf-17ea-41f4-892f-130e278e0bb8` | **OBSERVED** |
| `source_commit` | `308c98de4173874d8a1941818ba4392ddcc2cba6` | **OBSERVED** |
| `deployed_at` | `2026-09-08T05:52:14.712Z` | **OBSERVED** |
| `world_id` / `do_name` | `world.perihelion-reach-3` | **OBSERVED** |
| `genesis_id` | `genesis.94d0961984b2b4f8` | **OBSERVED** |
| `entry_room_id` | `room.civic-exchange` | **OBSERVED** |
| `profile_id` | `EWM_ENHANCED` | **OBSERVED** |
| `specs_git` | `81ca8c1e6b1d1ca474cf31958439fb0bdb9a465c` | **OBSERVED** |
| `seal` | `sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395` | **OBSERVED** |
| `official_client` | `noema-client==0.1.21` | **OBSERVED** (pin file; live Gate B CLI used **0.1.22**) |
| `rfc` | `RFC-0122` | **OBSERVED** |
| `version_evidence.url` | `https://noema.guru/version` | **OBSERVED** |
| `version_evidence.fetched_at` | `2026-09-08T05:52:17.823Z` | **OBSERVED** |
| `version_evidence.source_commit` | `308c98de4173874d8a1941818ba4392ddcc2cba6` | **OBSERVED** |

**Client note (honesty):** Gate B cohort evidence used client **0.1.22**; `hosted_live.official_client` still records `noema-client==0.1.21`. Both OBSERVED; do not invent a pin flip.

---

## 4) Local `/tmp/c7diag` / workspace deploy notes

| Path | Finding |
|------|---------|
| `/tmp/c7diag/` | Present; holds client/worker source snapshots + older evidence docs. **No** file mapping live UUID `963b5edf…` → source SHA. |
| `/workspace/noema-gateb-*.md` + `docs/evidence/gate-b-2026-09-08/pins-human.md` | Prior packets correctly marked source SHA **NOT_COMPUTABLE** *at that time* (before this lookup against #649 / `spec-compat`). |
| `/workspace/wrangler-deploy.sh` | Exists as a script path only; **not executed** (Deploy lock). |

---

## 5) Cloudflare / wrangler

`wrangler` **not on PATH**. No secrets dump. Skipped (data already OBSERVED via #649 + `spec-compat.json`).

---

## 6) Remaining #590 gaps (after this find; still do **not** claim COMPLETE)

Relative to merged `main` Gate B INDEX (including #654 admin-receipts) + this addendum (do **not** invent COMPLETE):

1. **Specs campaign state update** — still blocked / **not flipped**.
2. ~~Worker source git SHA for live UUID~~ — **now OBSERVED** (`308c98de…` via #649 / `hosted_live`). Standalone sealed-bundle *artifact file* beyond `hosted_live` still **NOT_COMPUTABLE** if required as a distinct object.
3. Explicit server ordering / idempotency / recovery receipts — still **NOT observed** via CLI.
4. Contention/ordering fully closed — still **PARTIAL** (concurrent LOOK OBSERVED; ordering/idempotency fields not in CLI).
5. Separate-human-principal proof (three distinct human identities vs one Admin approving three agents) — still **NOT_COMPUTABLE**.

**Already closed on `main` (not this cut):** live Admin `approver_amr` rows + `independent_control_receipt` / `controller_binding_digest` ×3 — **OBSERVED** in [admin-receipts.md](admin-receipts.md) (#654).

**Explicit non-claims:** Gate B is **not** COMPLETE. #590 stays **OPEN**. No Deploy. No secrets. This PR does not close #590.

