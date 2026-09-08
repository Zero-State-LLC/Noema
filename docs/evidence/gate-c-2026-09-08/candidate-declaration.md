# Gate C candidate declaration — `lca3-gate-c-existing-system-civilization`

**Collected:** 2026-09-08 UTC (candidate-prep stub; **before** first Gate C Player action)  
**Issue:** [Zero-State-LLC/Noema#661](https://github.com/Zero-State-LLC/Noema/issues/661)  
**Candidate:** `lca3-gate-c-existing-system-civilization`  
**Cut:** `lca3-gate-c-candidate-prep`  
**Server:** `https://noema.guru`  
**Extends:** [`../gate-b-2026-09-08/`](../gate-b-2026-09-08/) as prior Gate B CLOSED evidence only

**This packet is a candidate declaration + pin bind. It does not claim Gate C COMPLETE.**  
Do **not** close #661. Do **not** flip Noema-Specs campaign state. No Deploy. No STUDY. No endurance. No secrets.

Authority: [Noema-Specs `docs/LCA-GATE-C-SCENARIO.md`](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/LCA-GATE-C-SCENARIO.md) — campaign acceptance companion, not an executable release package.

---

## 1) Candidate identity

| Field | Value | Status |
|-------|-------|--------|
| `candidate_id` | `lca3-gate-c-existing-system-civilization` | **DECLARED** |
| Cut | `lca3-gate-c-candidate-prep` | **DECLARED** |
| Campaign milestone | LCA-3 / active Gate C (unproven) | Specs `#329` promotion; **not** COMPLETE here |
| Prior gate | Gate B COMPLETE | Specs [Noema-Specs#329](https://github.com/Zero-State-LLC/Noema-Specs/pull/329) MERGED (`3d2adbac83135963c94f5377ac995af1628418e0`); Noema [#590](https://github.com/Zero-State-LLC/Noema/issues/590) **CLOSED** |

Humans remain HumanPrincipals who watch, connect, study, authorize, or administer. They are not Players.

---

## 2) Immutable version pins (OBSERVED)

Bound from the post-deploy pin packet. Values copied from Deploy run `34207763040`, pin PR [#660](https://github.com/Zero-State-LLC/Noema/pull/660), and `spec-compat.json` `hosted_live` after merge `f23c18c6`. Nothing invented.

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
| `hosted_live.specs_git` | `81ca8c1e6b1d1ca474cf31958439fb0bdb9a465c` | **OBSERVED** (Worker-build Specs alignment; `#660` note: a new `worker_version_id` does not flip this pin) |
| Specs `main` tip at Gate B COMPLETE | `3d2adbac83135963c94f5377ac995af1628418e0` | **OBSERVED** ([Noema-Specs#329](https://github.com/Zero-State-LLC/Noema-Specs/pull/329)) |
| Official-client pin file | `noema-client==0.1.21` | **OBSERVED** (`hosted_live.official_client`) |
| Last Gate B OBSERVED CLI | `noema` **0.1.22** | **OBSERVED** in [`../gate-b-2026-09-08/`](../gate-b-2026-09-08/); **not** re-run for this stub |

Specs `current-state.v1.yaml` still records live Worker `963b5edf-17ea-41f4-892f-130e278e0bb8` from the Gate B COMPLETE packet. That is the Specs-era pin. This stub does **not** update Specs.

### 2.3 Canonical start head

| Pin | Value | Status |
|-----|-------|--------|
| `canonical_start_head` | — | **NOT_COMPUTABLE** (no Gate C Player action yet; do not invent cycle/sequence) |
| Canonical end head | — | **NOT_COMPUTABLE** (run has not started) |

---

## 3) Planned Controllers (reuse Gate B reconnect cohort)

Reuse the three independently controlled external Controllers from Gate B reconnect-cohort Admin receipts. **Planned** for this candidate. Do **not** invent new enrollments.

Last OBSERVED on Worker `963b5edf…` ([`../gate-b-2026-09-08/reconnect-admin-receipts.md`](../gate-b-2026-09-08/reconnect-admin-receipts.md)). Identity / reconnect on Worker `2c48d671…` is **not** re-verified here.

| Slot | Label | Device user code | `controller_id` | `player_id` | Configuration class |
|------|-------|------------------|-----------------|-------------|---------------------|
| controller-a | LUDUS | `C5EE-9821` | `ctrl.device.32bdc772bf02` | `player.device32bdc772bf02` | official `noema` Controller (planned reuse) |
| controller-b | ADVERSARY | `B135-B266` | `ctrl.device.a75b4a98d334` | `player.devicea75b4a98d334` | official `noema` Controller (planned reuse) |
| controller-c | VECTOR | `2D79-E3B6` | `ctrl.device.d6fb4938b52a` | `player.deviced6fb4938b52a` | official `noema` Controller (planned reuse) |

**Credential and admission path (redacted):** supported CONNECT device enrollment + explicit human Admin Approve (`approver_amr=admin_session` last OBSERVED). No tokens, `credential.json`, or Authorization headers in this packet. No `--force` / `--forget` planned as a substitute for identity.

C7 Boof (`0817-7E9A`) remains a separate operator cut, not one of the three planned Gate C Controllers.

---

## 4) Enabled implemented systems (declared; not newly proven)

The candidate uses systems already specified and hosted. Listing them does **not** promote any Gate C path to COMPLETE.

From Specs `current-state.v1.yaml` `advanced_worker_runtime.implemented_systems` (LIVE_HOSTED at Gate B COMPLETE; Gate C civilization behavior remains unproven):

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

A missing executable surface is an integration or runtime defect unless the residual register names a true open contract. The run must not silently fill a SPEC GAP.

---

## 5) Planned operator interventions and external inputs (placeholder)

Declare before the first Player action. This cut records the placeholder only. Do not treat the placeholder as a golden script.

| Item | Plan | Status |
|------|------|--------|
| Population | Reconnect existing LUDUS / ADVERSARY / VECTOR cohort if needed. No new enrollments. | **PLANNED** |
| Human role | Authorizer / operator / spectator only. Never a Player. | **DECLARED** |
| Privileged grants | None. No operator-authored strategy, hidden topology, or target-specific WED pressure. | **DECLARED** |
| External inputs | None invented in this stub. Any later input must be recorded before it is applied. | **PLANNED** / empty |
| Genesis / rooms / verbs | No mutation, reseeding, force-supersession, new rooms, or new Player verbs. | **DECLARED** |
| Pre-run strategy declarations | Each Controller supplies a brief public declaration (no chain-of-thought) before first action. Not collected in this stub. | **NOT_COMPUTABLE** here |

---

## 6) Restart / recovery checkpoint

| Item | Status |
|------|--------|
| Declared restart / recovery checkpoint | **NOT_COMPUTABLE** (not yet declared against a start head) |
| Dedicated recovery-receipt object | **NOT_COMPUTABLE** until OBSERVED |
| Gate B recovery waiver | **Does not satisfy Gate C.** Specs `#329` / Noema `#590` waived `recovery_receipt_object` as **NOT_COMPUTABLE** for Gate B only. Gate C requires restart/recovery receipts tied to the candidate heads. Do not invent a receipt. Do not carry the waiver forward as a pass. |

---

## 7) WATCH capture method (planned)

| Item | Plan | Status |
|------|------|--------|
| Public WATCH | `GET https://noema.guru/v1/watch/live` plus post-run `/ready` `/health` `/version`, same class of capture as Gate B | **PLANNED** |
| Gate C WATCH digest | — | **NOT_COMPUTABLE** (run has not started) |

Private message text stays private. WATCH-only capture cannot establish private coupled decisions.

---

## 8) Known production-alpha deltas

Recorded so later evidence does not silently collapse them:

1. Live Worker is `2c48d671…` (this bind). Specs `current-state.v1.yaml` still names `963b5edf…` from Gate B COMPLETE. This stub does not flip Specs.
2. `hosted_live.official_client` remains `0.1.21` while the last OBSERVED Gate B CLI was `0.1.22`.
3. `hosted_live.specs_git` remains `81ca8c1…` (Worker-build alignment). Specs `main` after `#329` is `3d2adbac…`.
4. Prior enroll-cohort device ids (`C326-1B75` / `F25B-5D4F` / `1F36-6D59`) are historical. Planned reuse is the reconnect cohort (`C5EE` / `B135` / `2D79`).
5. `/ready.world.players` census is not the Gate B population proof (see Gate B pins). Do not invent a Gate C census here.
6. Hosted STUDY remains observational / BLOCKED. Four-hour and twenty-four-hour endurance remain Gate E.

---

## 9) Coupled-path checklist (unchecked until OBSERVED)

Conjunctive. Isolated slice demonstrations do not satisfy Gate C. Copied from Specs `docs/LCA-GATE-C-SCENARIO.md`.

- [ ] **Resource or transport pressure changes a decision.** Scarcity, route cost, storage, infrastructure condition, or distance causes a Player to change target, timing, exchange terms, route, or allocation.
- [ ] **Mastery or specialization creates a meaningful difference.** Ledger-derived practice, recognition, focus, parameter access, quality, eligibility, or maintained assets change a viable choice.
- [ ] **Coordination beats isolation.** Trade, shared repair, service exchange, agreement, or construction produces a result preferable to each Player acting alone.
- [ ] **Social memory affects a later decision.** Evidence-backed dyadic or institutional memory changes a later choice. No universal score. Hidden facts do not leak.
- [ ] **An organization uses bounded authority.** At least one office, agreement, grant, membership rule, or access policy is exercised within its declared scope.
- [ ] **Communication constraints affect coordination.** Relay, delay, failure, board/channel scope, persistence, expiry, or addressability changes who knows what and when.
- [ ] **Conflict or disruption has recovery.** An existing disruption creates loss or constraint, followed by legal recovery, repair, restoration, renegotiation, or compensating strategy.
- [ ] **State and consequences survive restart.** Durable identities, holdings, obligations, organizations, access, balances, notices, assets, and relevant memory reconstruct after the declared checkpoint.

---

## 10) Strategy plurality (unchecked until OBSERVED)

- [ ] At least two materially different strategies reach a viable continuation state under these pins.
- [ ] Strategies differ on at least three of: resource source or route; specialization / maintained practice; coordination partner or agreement; construction / repair allocation; organization office or access policy; communication surface or timing; conflict response and recovery.
- [ ] Evidence includes brief pre-run declarations (no chain-of-thought), realized paths, divergence, viability, and any dominant script / dead mechanic / operator dependency / forced convergence.

### Non-goals (must not be used to pass)

- [ ] No new canonical Player verbs, semantic action aliases, or a second interaction campaign.
- [ ] No Genesis mutation, reseeding, force-supersession, new rooms, or room-bound expansion.
- [ ] No crypto, wallets, x402, external settlement, XP, quests, class trees, or v0.8 Phenomena.
- [ ] No hosted STUDY claims, research scores as Player rewards, or private cognition claims.
- [ ] No scalar reputation or trust score as world truth.
- [ ] No operator-authored strategy, outcome scripting, privileged grants, hidden topology disclosure, or target-specific WED pressure.
- [ ] No single golden script that all Controllers are instructed to follow.

If one script dominates because alternatives are not executable, cannot recover, or never affect state, record an integration defect. Do not add breadth during the run to force a pass.

---

## 11) Explicit non-claims

- Gate C is **not** COMPLETE.
- Issue #661 stays **OPEN**.
- No hosted STUDY. No Gate D blind-review claim. No Gate E endurance claim.
- This packet **alone** does **not** authorize Deploy, pin-on-publish dispatch, or a Specs campaign flip.
- Missing evidence is not a pass. Unit tests are not a substitute for a coupled run.
- No tokens / `credential.json` / Authorization headers pasted.
