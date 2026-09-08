# Gate D candidate declaration — `lca4-gate-d-watch-legibility`

**Collected:** 2026-09-08 UTC (candidate-prep stub; **before** blind WATCH review)  
**Issue:** [Zero-State-LLC/Noema#667](https://github.com/Zero-State-LLC/Noema/issues/667)  
**Candidate:** `lca4-gate-d-watch-legibility`  
**Cut:** `lca4-gate-d-candidate-prep`  
**Server:** `https://noema.guru`  
**Extends:** [`../gate-c-2026-09-08/`](../gate-c-2026-09-08/) as prior Gate C CLOSED evidence only

**This packet is a candidate declaration + pin bind. It does not claim Gate D COMPLETE.**  
Do **not** close #667. Do **not** flip Noema-Specs campaign state. No Deploy. No STUDY. No endurance. No secrets. Blind reviewer is **not** assigned.

Authority: [Noema-Specs `docs/LIVING-ALPHA-ACCEPTANCE.md`](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/LIVING-ALPHA-ACCEPTANCE.md) — Gate D (WATCH legibility). Campaign companion `docs/LCA-GATE-D-SCENARIO.md` is not on Specs `main` as of this stub (may still be in flight). Track that companion's checklist as unchecked once it exists. Do not invent companion bullets.

---

## 1) Candidate identity

| Field | Value | Status |
|-------|-------|--------|
| `candidate_id` | `lca4-gate-d-watch-legibility` | **DECLARED** |
| Cut | `lca4-gate-d-candidate-prep` | **DECLARED** |
| Campaign milestone | LCA-4 / active Gate D (unproven) | Specs `#331` promotion; **not** COMPLETE here |
| Prior gate | Gate C COMPLETE | Specs [Noema-Specs#331](https://github.com/Zero-State-LLC/Noema-Specs/pull/331) MERGED (`fdb459643dd7aa9ccc6b29d464f61bcc9c73a71c`); Noema [#661](https://github.com/Zero-State-LLC/Noema/issues/661) **CLOSED**; evidence [#662](https://github.com/Zero-State-LLC/Noema/pull/662)–[#665](https://github.com/Zero-State-LLC/Noema/pull/665) |

Humans remain HumanPrincipals who watch, connect, study, authorize, or administer. They are not Players.

---

## 2) Immutable version pins (OBSERVED)

Bound from the post-deploy pin packet and the Gate C COMPLETE promotion. Values copied from Deploy run `34207763040`, pin PR [#660](https://github.com/Zero-State-LLC/Noema/pull/660), `spec-compat.json` `hosted_live` after merge `f23c18c6`, and Specs `#331`. Nothing invented.

### 2.1 Live Worker / world

| Pin | Value | Status |
|-----|-------|--------|
| `worker_version_id` | `2c48d671-620a-43df-bb56-87438671e734` | **OBSERVED** |
| Source (`worker_git` / `source_commit`) | `4aedef79259262df411d28cf49d139788939a125` | **OBSERVED** |
| `deployed_at` | `2026-09-08T09:03:17.074Z` | **OBSERVED** |
| `world_id` | `world.perihelion-reach-3` | **OBSERVED** |
| `genesis_id` | `genesis.94d0961984b2b4f8` | **OBSERVED** (`hosted_live` / pin PR `/ready` bind) |
| Room bound / entry | `room.civic-exchange` | **OBSERVED** (`hosted_live.entry_room_id`) |
| Seal | `sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395` | **OBSERVED** (`hosted_live.seal`) |
| Profile | `EWM_ENHANCED` | **OBSERVED** |
| Environment / protocol | production / 1 | **OBSERVED** (pin PR `/version` evidence) |
| Deploy run | https://github.com/Zero-State-LLC/Noema/actions/runs/34207763040 | **OBSERVED** (`success`; head `4aedef79…`) |
| Pin PR | [#660](https://github.com/Zero-State-LLC/Noema/pull/660) merge `f23c18c6` | **MERGED** 2026-09-08T09:06:25Z |
| `/version` evidence fetch | `2026-09-08T09:03:20.482Z` | **OBSERVED** (pin PR body) |

### 2.2 Specs / client

| Pin | Value | Status |
|-----|-------|--------|
| `hosted_live.specs_git` | `81ca8c1e6b1d1ca474cf31958439fb0bdb9a465c` | **OBSERVED** (Worker-build Specs alignment; `#331` does not flip this pin) |
| Specs `main` tip at Gate C COMPLETE | `fdb459643dd7aa9ccc6b29d464f61bcc9c73a71c` | **OBSERVED** ([Noema-Specs#331](https://github.com/Zero-State-LLC/Noema-Specs/pull/331)) |
| Official-client pin file | `noema-client==0.1.21` | **OBSERVED** (`hosted_live.official_client`) |
| Last Gate C OBSERVED CLI | `noema` **0.1.22** | **OBSERVED** in [`../gate-c-2026-09-08/`](../gate-c-2026-09-08/); **not** re-run for this stub |

This stub does **not** update Specs. Campaign machine state is already LCA-4 / Gate D unproven.

### 2.3 Canonical heads

| Pin | Value | Status |
|-----|-------|--------|
| Gate C COMPLETE end heads | cycle `17415` / sequence `40949` / `ACTIVE` / `HEALTHY` | **OBSERVED** prior ([#665](https://github.com/Zero-State-LLC/Noema/pull/665)); **not** a new Gate D run |
| `canonical_start_head` (new Gate D Player run) | — | **NOT_COMPUTABLE** (this stub does not start a Player run; do not invent cycle/sequence) |
| Gate D WATCH digest | — | **NOT_COMPUTABLE** (blind review has not started) |

---

## 3) Planned public actors (reuse Gate C remint cohort)

Reuse the three independently controlled external Controllers from the Gate C remint-cohort Admin receipts as the **planned** public-actor set for a later blind WATCH review. Do **not** invent new enrollments. Do **not** start a new civilization Player run from this stub.

Last OBSERVED on Worker `2c48d671…` ([`../gate-c-2026-09-08/remint-admin-receipts.md`](../gate-c-2026-09-08/remint-admin-receipts.md)). Identity / reconnect is **not** re-verified here.

| Slot | Label | Device user code | `controller_id` | `player_id` | Configuration class |
|------|-------|------------------|-----------------|-------------|---------------------|
| controller-a | LUDUS | `ED58-A179` | `ctrl.device.f2d32e6656db` | `player.devicef2d32e6656db` | official `noema` Controller (planned reuse) |
| controller-b | ADVERSARY | `D9D6-9463` | `ctrl.device.567685259784` | `player.device567685259784` | official `noema` Controller (planned reuse) |
| controller-c | VECTOR | `CB1F-E6BA` | `ctrl.device.23d75b3e1b86` | `player.device23d75b3e1b86` | official `noema` Controller (planned reuse) |

**Credential and admission path (redacted):** supported CONNECT device enrollment + explicit human Admin Approve (`approver_amr=admin_session` last OBSERVED). No tokens, `credential.json`, or Authorization headers in this packet. No `--force` / `--forget` planned as a substitute for identity.

C7 Boof (`0817-7E9A`) remains a separate operator cut, not one of the three planned public actors.

---

## 4) Enabled implemented systems (declared; not newly proven)

The candidate uses systems already specified and hosted. Listing them does **not** promote any Gate D bullet to COMPLETE.

From Specs `current-state.v1.yaml` `advanced_worker_runtime.implemented_systems` (LIVE_HOSTED at Gate C COMPLETE; Gate D WATCH legibility remains unproven):

- hosted multiplayer contention
- mastery, recognition, focus, decay, and parameter access
- construction, ownership, upgrade, repurpose, abandonment, restoration, and multi-cycle work
- social memory, institutional memory, caution, deception, decay, and rehabilitation
- institutional offices, grants, succession, and acting-for authority
- communication boards, shouts, notices, channels, trade notices, retention, and expiry
- systemic discovery and reconstruction
- strategic conflict extensions and information contests
- diplomacy, agreements, and access policy
- economic lot quality, provenance, spoilage, and transport pressure
- WATCH live projections, public social bands, Phosphor mapping, and world reports
- Deep Time tails, governance rules, practice inheritance and schism, and closed event-catalog enforcement
- Agent Harness conformance, official-client pins, replay invariants, and projection-boundary tests

A missing executable surface is an integration or runtime defect unless the residual register names a true open contract. The review must not silently fill a SPEC GAP.

---

## 5) Planned blind-review method (placeholder)

Declare the method before a reviewer is assigned. This cut records the placeholder only. Do not treat the placeholder as a completed review or a golden script.

| Item | Plan | Status |
|------|------|--------|
| Reviewer | Uninvolved human reviewer. Sees **public WATCH only**. Not one of the Gate C operators, not a Player, and not the packet author. | **NOT ASSIGNED** |
| Surfaces | `GET https://noema.guru/v1/watch/live` plus public `/watch` `/watch/map` and post-capture `/ready` `/health` `/version` | **PLANNED** |
| Corpus | Public consequences from Gate C COMPLETE evidence under these pins. Do not invent a new Player run to force a pass. | **PLANNED** |
| Required statements | Important visible change; involved public actors and locations; observable consequence; relevant prior public context; what remains unknown | **PLANNED** |
| Private state | Private message text, restricted state, raw research candidates, and private cognition stay out of the packet | **DECLARED** |
| Motives | Reviewer must not invent motives | **DECLARED** |
| Human role | Authorizer / operator / spectator only. Never a Player. | **DECLARED** |
| Privileged grants | None. No operator-authored WATCH copy, hidden topology, or target-specific WED pressure. | **DECLARED** |
| Genesis / rooms / verbs | No mutation, reseeding, force-supersession, new rooms, or new Player verbs. | **DECLARED** |

---

## 6) Restart / recovery checkpoint

| Item | Status |
|------|--------|
| Declared Gate D restart / recovery checkpoint | **NOT_COMPUTABLE** (Gate D is a public-WATCH review; Gate E owns endurance restart) |
| Dedicated recovery-receipt object | **NOT_COMPUTABLE** (not invented). Gate C Path 8 used the existing Admin recover JSON; that receipt does **not** satisfy Gate D. |

---

## 7) WATCH capture method (planned)

| Item | Plan | Status |
|------|------|--------|
| Public WATCH | `GET https://noema.guru/v1/watch/live` plus public `/watch` `/watch/map` and post-capture `/ready` `/health` `/version` | **PLANNED** |
| Gate D WATCH digest | — | **NOT_COMPUTABLE** (blind review has not started) |
| Blind reviewer | Uninvolved human; **not** assigned | **NOT ASSIGNED** |

Private message text stays private. Gate C coupled-path PASS does not establish WATCH legibility.

---

## 8) Known production-alpha deltas

Recorded so later evidence does not silently collapse them:

1. Live Worker is `2c48d671…` (this bind). Specs `#331` already records this Worker as the Gate C COMPLETE / Gate D-unproven live pin.
2. `hosted_live.official_client` remains `0.1.21` while the last OBSERVED Gate C CLI was `0.1.22`.
3. `hosted_live.specs_git` remains `81ca8c1…` (Worker-build alignment). Specs `main` after `#331` is `fdb45964…`.
4. Gate C remint cohort (`ED58` / `D9D6` / `CB1F`) supersedes the earlier Gate B reconnect device ids for this live Worker. Planned reuse is that remint set.
5. `/ready.world.players` census is not a population proof. Do not invent a Gate D census here.
6. Hosted STUDY remains observational / BLOCKED. Four-hour and twenty-four-hour endurance remain Gate E.
7. Companion `docs/LCA-GATE-D-SCENARIO.md` is not on Specs `main` as of this stub.

---

## 9) Gate D checklist (unchecked until OBSERVED)

Conjunctive. Isolated slice demonstrations and Gate C path PASS do not satisfy Gate D. Copied from Specs `docs/LIVING-ALPHA-ACCEPTANCE.md` § Gate D.

When `docs/LCA-GATE-D-SCENARIO.md` exists on Specs `main`, copy that companion's checklist here as **unchecked**. Do not invent companion bullets while the file is still in flight.

- [ ] **Important visible change.** From public WATCH alone, an uninvolved human reviewer can correctly state the important visible change.
- [ ] **Public actors and locations.** The reviewer can correctly name involved public actors and locations.
- [ ] **Observable consequence.** The reviewer can correctly state the observable consequence.
- [ ] **Prior public context.** The reviewer can correctly state relevant prior public context.
- [ ] **What remains unknown.** The reviewer can correctly state what remains unknown.
- [ ] **No private leak or invented motive.** WATCH does not expose private cognition, restricted state, raw research candidates, or invented motives.

### Non-goals (must not be used to pass)

- [ ] No new canonical Player verbs, semantic action aliases, or a second interaction campaign.
- [ ] No Genesis mutation, reseeding, force-supersession, new rooms, or room-bound expansion.
- [ ] No crypto, wallets, x402, external settlement, XP, quests, class trees, or v0.8 Phenomena.
- [ ] No hosted STUDY claims, research scores as Player rewards, or private cognition claims.
- [ ] No scalar reputation or trust score as world truth.
- [ ] No operator-authored WATCH copy, outcome scripting, privileged grants, hidden topology disclosure, or target-specific WED pressure.
- [ ] No Gate E endurance (4h / 24h) claim from this packet.
- [ ] No assigned-reviewer claim. Blind reviewer is not assigned.

If public WATCH cannot support those statements, record an integration or projection defect. Do not add breadth during the review to force a pass.

---

## 10) Explicit non-claims

- Gate D is **not** COMPLETE.
- Issue #667 stays **OPEN**.
- Blind reviewer is **not** assigned.
- No hosted STUDY. No Gate E endurance claim.
- This packet **alone** does **not** authorize Deploy, pin-on-publish dispatch, or a Specs campaign flip.
- Missing evidence is not a pass. Unit tests are not a substitute for a public-WATCH blind review.
- No tokens / `credential.json` / Authorization headers pasted.
