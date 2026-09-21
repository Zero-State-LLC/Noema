# Gate F scorecard — live `1e52e827` / `65086d32` (items 1–6 fill)

**Tracking:** [Noema#715](https://github.com/Zero-State-LLC/Noema/issues/715) OPEN  
**Candidate:** `lca6-gate-f-successor-decision`  
**Written:** 2026-09-20 19:09 PDT · **owners/GO-ask patch:** 2026-09-20 19:16 PDT  
**Danny authorization:** items **1–6** filled; item-7 GO ask drafted — **not** item 7 issued / **`GO` unchecked** · owners column = **PROPOSED** pending confirm  
**Stance:** `LIVE_NAMED` · `successor_scope: RUNTIME_ONLY` · prior SUCCESSOR_NAMED `75d468c7` absorbed into live  
**Deploy:** already SUCCESS ([35549259561](https://github.com/Zero-State-LLC/Noema/actions/runs/35549259561)) — **Deploy ≠ `GO`**

## Packet items (conjunctive → item 7)

| # | Item | Status | Evidence label | Notes |
|---|---|---|---|---|
| 1 | Exact production delta | **FILLED** | OBSERVED | See `PRODUCTION-DELTA.md`. Prior live `ac6813da`/`630652e6` → live `1e52e827`/`65086d32`: sharp override + lockfile + rehearsal `/ready` wait + docs/pin. **No migration-required** Worker runtime-source rows. |
| 2 | Migration + rollback procedures | **FILLED (PARTIAL honesty)** | OBSERVED (no migrate rows; isolated A-B-A PASS) · NOT_COMPUTABLE (live production-shape dump; production A-return not rehearsed on `noema.guru`) | No schema/DO migration steps required. Isolated rollback PASS r2 cited. Older-world suite fixture #565 = **synthetic** (OBSERVED). Live perihelion-3 dump at cutover = operator work **NOT_COMPUTABLE**. Prod rollback = separate Deploy of prior source — not executed as Gate F rehearsal (correct: prod GET-only during rehearsal). |
| 3 | Compatibility (frozen + live PLAY under RUNTIME_ONLY) | **FILLED (PARTIAL honesty)** | OBSERVED (world/genesis/frozen OOS) · NOT_COMPUTABLE (full live digest matrix across Deploy) | Frozen `world-01` / `genesis.ef578f4ffceeccd0` out of scope. Live PLAY `world.perihelion-reach-3` / `genesis.94d0961984b2b4f8` unchanged post-Deploy (`/ready`). Seal pin in `spec-compat.json` recorded. Byte-for-byte state/history digests for live PLAY across Deploy **not measured** → NOT_COMPUTABLE. RFC-0120 agents-only: no admission-path source Δ (INFERRED unchanged). |
| 4 | Operational rehearsal result | **FILLED — PASS** | OBSERVED | Isolated A-B-A **PASS** r2 on `noema-rollback-rehearsal-gatef-75d468c7-20260920-r2`. A/A′ `7e749359-c2e0-445a-ba4d-3ef9002bba56` · B `c847fdc7-755d-4cab-94a4-7a8f32701256`. Receipts: `docs/evidence/gate-f-isolated-aba-75d468c7-20260920/`. Source rehearsed `75d468c7` (absorbed into live `65086d32`); #719 warm fix in lineage. Prior r1 FAIL (cold DO) archived. Production GET-only throughout rehearsal. |
| 5 | Permitted public claims | **FILLED (draft bounds)** | OBSERVED (forbidden set) · INFERRED (GO-conditional permits) | See § Item 5. No `current-state.v1.yaml` flip claimed by this packet. Hosted STUDY / sentience / offline↔hosted digest equivalence remain **forbidden**. |
| 6 | Unresolved risks | **FILLED (re-score; owners PROPOSED)** | OBSERVED (mitigations / Dependabot 0) · **PROPOSED** owners pending Danny confirm | LCA-1 register rows re-stated below. Dependabot sharp open alerts: **0**. Owners labeled **PROPOSED** (not OBSERVED) — cite [`ITEM-7-GO-ASK.md`](ITEM-7-GO-ASK.md). **`GO` unchecked.** |
| 7 | Verdict | **NOT ISSUED** | — | Danny authorized scorecard fill only. **`GO` left unchecked.** If a verdict were forced today: **NOT_COMPUTABLE** (digest matrix + risk-owner gaps). |

## Verdict boxes (human use)

- [ ] **GO** — **LEAVE UNCHECKED.** Item-7 ask drafted ([`ITEM-7-GO-ASK.md`](ITEM-7-GO-ASK.md)); Danny has not issued `GO`. Honest `GO` still needs Danny confirm of **PROPOSED** owners + explicit human-yes (and acceptance that across-Deploy digests are permanently NOT_COMPUTABLE). Deploy already done is **not** this box.
- [ ] **NO-GO** — not selected. Evidence incomplete / deferred COMPLETE, not a failed candidate.
- [x] **NOT_COMPUTABLE** *(draft recommendation **only if** a verdict were forced now)* — across-Deploy live PLAY digests permanently NOT_COMPUTABLE (no pre-dump); live production-shape dump absent; residual owners only **PROPOSED** until Danny confirm. Rehearsal PASS alone does not issue `GO`. **This packet still leaves GO unchecked.**

## Item 1 — Exact production delta (summary)

Full table: [`PRODUCTION-DELTA.md`](PRODUCTION-DELTA.md).

| Δ class | Present? |
|---|---|
| migration-required Worker runtime | **No** (OBSERVED) |
| production request-path `.ts`/routes/DO | **No** (OBSERVED) |
| sharp override + lockfile | **Yes — deployed** (OBSERVED) |
| rehearsal script `/ready` wait (#719) | **Yes — deployed as script** (OBSERVED); not on `noema.guru` handlers |
| docs / pin metadata | **Yes** (OBSERVED) |

## Item 2 — Migration and rollback procedures

| Step | Status | Label |
|---|---|---|
| Pre-migration backup | Not required for empty migration-required set; no Gate F backup bundle cited for this Deploy | NOT_COMPUTABLE as Gate F backup evidence |
| Schema / DO migrate | **None required** (no runtime-source migration rows) | OBSERVED |
| Isolated A-B-A rollback | **PASS** r2 — Worker `noema-rollback-rehearsal-gatef-75d468c7-20260920-r2`; digests matched A/B/A′; rollback restored A @ 100% | OBSERVED |
| Older-world DO load | Suite fixture via [#565](https://github.com/Zero-State-LLC/Noema/pull/565) / `older-world-compat.test.ts` — **synthetic** older-format | OBSERVED (synthetic) |
| Live production-shape dump of perihelion-3 | Not filed in this packet | NOT_COMPUTABLE |
| Production A-return after this Deploy | Would be a separately authorized Deploy of prior source; **not** rehearsed on production | NOT_COMPUTABLE (and correctly out of rehearsal scope) |
| Fresh writer fence / `noema verify` post-Deploy | Not cited in this packet | NOT_COMPUTABLE |

## Item 3 — Compatibility

| Check | Result | Label |
|---|---|---|
| Frozen first world OOS | `world-01` / `genesis.ef578f4ffceeccd0` unchanged; not PLAY target | OBSERVED (doctrine + RUNTIME_ONLY) |
| Live PLAY world_id | `world.perihelion-reach-3` before and after Deploy | OBSERVED |
| Live genesis_id | `genesis.94d0961984b2b4f8` | OBSERVED (`/ready`) |
| `/ready` post-Deploy | ACTIVE / HEALTHY · players 0 · cycle 21948 | OBSERVED |
| Seal (pin) | `sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395` in `spec-compat.json` hosted_live | OBSERVED (pin file) |
| Live state / history digests across Deploy | Not probed in this packet | NOT_COMPUTABLE |
| Room bound / entry room | Entry `room.civic-exchange` in pin; bound not re-measured | OBSERVED (pin) · NOT_COMPUTABLE (bound bytes) |
| RFC-0120 agents-only | No admission-path source Δ in Deploy compare | INFERRED unchanged |

## Item 4 — Operational rehearsal result

| Field | Value | Label |
|---|---|---|
| Verdict | **PASS** (r2) | OBSERVED |
| Isolated Worker | `noema-rollback-rehearsal-gatef-75d468c7-20260920-r2` | OBSERVED |
| A / A′ | `7e749359-c2e0-445a-ba4d-3ef9002bba56` | OBSERVED |
| B | `c847fdc7-755d-4cab-94a4-7a8f32701256` | OBSERVED |
| Rehearsal source | `75d468c750aeb04490969f33d2cc13ad7e85a3a5` (in live `65086d32`) | OBSERVED |
| Script warm fix | [#719](https://github.com/Zero-State-LLC/Noema/pull/719) | OBSERVED |
| Prior r1 | FAIL (cold DO / genesis 500) — archived | OBSERVED |
| Production during rehearsal | GET-only; then `ac6813da` unchanged | OBSERVED |
| Evidence tree | `docs/evidence/gate-f-isolated-aba-75d468c7-20260920/` · Specs#348 | OBSERVED |
| Who may Deploy | Human `workflow_dispatch` + ACK + post-deploy pin (existing law) | OBSERVED (Deploy 35549259561 already used that path) |

## Item 5 — Permitted public claims (draft bounds)

**If** a future item-7 `GO` were issued (it is **not** issued here), permitted copy would be limited to evidence-backed pins already OBSERVED:

| Claim class | Stance |
|---|---|
| Live Worker id / source / deployed_at as on `/version` | Allowed as OBSERVED fact |
| Isolated A-B-A PASS for the absorbed `#717` lineage | Allowed with receipt citation |
| `RUNTIME_ONLY` · same PLAY world/genesis | Allowed as OBSERVED |
| Gate F COMPLETE / campaign flip | **Forbidden** until item 7 `GO` + separate COMPLETE record |
| Hosted STUDY reopen / research rewards | **Forbidden** |
| Agent sentience / phenomenal claims | **Forbidden** |
| Offline ↔ hosted digest equivalence | **Forbidden** unless separately proven |
| “Deploy proves successor decision” | **Forbidden** — Deploy ≠ `GO` |
| Manifesto / Home / WATCH copy changes | Proposed only; **not applied** by this packet |

## Item 6 — Unresolved risks (re-score; owners **PROPOSED**)

Re-score of LCA-1 successor-cutover register against live `65086d32` / `RUNTIME_ONLY`.

**Owner column:** **PROPOSED** from standing OBSERVED roles — **pending Danny confirm** (see [`ITEM-7-GO-ASK.md`](ITEM-7-GO-ASK.md)). Not OBSERVED assignments until confirmed. Do not treat as assigned ownership.

| # | Area | Standing mitigation (OBSERVED) | Residual | Owner |
|---|---|---|---|---|
| 1 | World/Genesis preservation | RUNTIME_ONLY; `/ready` still perihelion-3 / genesis.94d0…; frozen OOS | Accidental WORLD_CUTOVER without packet | **PROPOSED** Danny (scrimshawlife-ctrl) — constitution/gate human-yes |
| 2 | DO state compatibility | No runtime-source migrate Δ; synthetic older-world fixture #565 in suite; isolated A-B-A PASS | Live perihelion-3 production-shape dump still absent | **PROPOSED** Prabu (prabu-openclaw) — Worker/DO ops; Danny for production dump authorize |
| 3 | Settlement / recovery | `/ready` HEALTHY post-Deploy; prior Gate E settlement evidence retained | Soft-restore / head-sequence SoT residuals from Gate E | **PROPOSED** Prabu + Noema Admin (ops plane) |
| 4 | Identity / credentials | No admission-path Δ in Deploy compare; RFC-0120 law unchanged in source | Production device enrollment still never completed (players=0) | **PROPOSED** Danny (product) |
| 5 | Client / harness | Official client pin `noema-client==0.1.21` unchanged by workers Δ | Re-check on next client release | **PROPOSED** Prabu on next client release |
| 6 | WATCH at population | players=0 OBSERVED | Unproven at real population (Gate D material) | **PROPOSED** Noema Admin + Gate D watch; Danny for COMPLETE claims |
| 7 | Deployment / rollback | Deploy via workflow_dispatch + pin #721; isolated A-B-A PASS; rehearsal script warm fix #719 | Bare `wrangler deploy` still a fail class; prod A-return not rehearsed | **PROPOSED** Danny (Deploy ACK only via workflow); Prabu for Worker scripts |
| 8 | Public claims | This packet forbids COMPLETE/`GO` claims | Overclaim risk if Deploy is narrated as `GO` | **PROPOSED** Danny + SIGNAL (public language) |
| 9 | sharp / supply chain | Dependabot sharp open alerts **0** (last probe); override 0.35.4 live | Future transitive advisories | **PROPOSED** Prabu (merge) + Danny (Deploy) |
| 10 | Gate E residual classes | Cited in Specs companion (settlement soft-restore, head-sequence, Controller credential expiry, in-window Deploy) | Carry-forward without new owners in this fill | **PROPOSED** Noema Admin + Danny |

**Honesty:** owners above are **PROPOSED** pending Danny confirm on #715 / item-7 GO ask. Across-Deploy live PLAY digests remain permanently **NOT_COMPUTABLE** (no pre-dump). **`GO` still unchecked.** Do not invent digests.

## Evidence labels summary

| Claim | Label |
|---|---|
| Live Worker `1e52e827…` / source `65086d32…` | OBSERVED |
| Prior live `ac6813da…` / `630652e6…` HISTORICAL | OBSERVED |
| Deploy 35549259561 SUCCESS | OBSERVED |
| Pin #721 / Specs #349 MERGED | OBSERVED |
| Isolated A-B-A PASS r2 | OBSERVED |
| `successor_scope: RUNTIME_ONLY` | OBSERVED |
| migration-required rows | OBSERVED **none** |
| Dependabot sharp open = 0 | OBSERVED |
| Live PLAY digest matrix across Deploy | NOT_COMPUTABLE |
| Named residual risk owners | **PROPOSED** (pending Danny confirm) — see ITEM-7-GO-ASK |
| Gate F COMPLETE / `GO` | **not claimed** (would be SPECULATIVE if claimed) |

## Hard walls (unchanged)

Not Gate F `GO` · not COMPLETE · no production Deploy from this packet · no WORLD_CUTOVER · no inventing digests/owners · Deploy already done ≠ `GO`.
