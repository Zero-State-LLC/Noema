# Gate E candidate declaration — `lca5-gate-e-endurance`

**Collected:** 2026-09-09 UTC (candidate-prep stub; **before** 4h clock)  
**Issue:** [Zero-State-LLC/Noema#682](https://github.com/Zero-State-LLC/Noema/issues/682)  
**Candidate:** `lca5-gate-e-endurance`  
**Cut:** `lca5-gate-e-candidate-prep`  
**Server:** `https://noema.guru`  
**Extends:** [`../gate-d-2026-09-08/`](../gate-d-2026-09-08/) as prior Gate D COMPLETE evidence only

**This packet is a candidate declaration + pin bind. It does not claim Gate E COMPLETE.**  
Do **not** close #682. Do **not** flip Noema-Specs campaign state. No Deploy. No STUDY. No Gate F. No Controller reconnect. No 4h clock. No secrets.

Authority: [Noema-Specs `docs/LIVING-ALPHA-ACCEPTANCE.md`](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/LIVING-ALPHA-ACCEPTANCE.md) — Gate E (Endurance). Campaign companion `docs/LCA-GATE-E-SCENARIO.md` is not on Specs `main` as of this stub (may still be in flight). Track that companion's checklist as unchecked once it exists. Do not invent companion bullets.

---

## 1) Candidate identity

| Field | Value | Status |
|-------|-------|--------|
| `candidate_id` | `lca5-gate-e-endurance` | **DECLARED** |
| Cut | `lca5-gate-e-candidate-prep` | **DECLARED** |
| Campaign milestone | LCA-4 / next LCA-5 / active Gate E (unproven) | Specs `#334` promotion of Gate D; **not** COMPLETE here |
| Prior gate | Gate D COMPLETE | Specs [Noema-Specs#334](https://github.com/Zero-State-LLC/Noema-Specs/pull/334) MERGED (`23987586219dfd95fd7544da8e13a316a8bd9457`) |

Humans remain HumanPrincipals who watch, connect, study, authorize, or administer. They are not Players.

---

## 2) Immutable version pins (OBSERVED)

Bound from tracking #682 and the live pin packet. Values copied from Deploy run `34317120696`, unify [#680](https://github.com/Zero-State-LLC/Noema/pull/680), pin [#681](https://github.com/Zero-State-LLC/Noema/pull/681), and Specs `#334`. Nothing invented. Re-pin / re-verify `/version` at clock start.

### 2.1 Live Worker / world

| Pin | Value | Status |
|-----|-------|--------|
| `worker_version_id` | `592c06a4-fa8c-40f6-bec7-21cbc45689f9` | **OBSERVED** |
| Unify source | `39d4856abd857b79aedd4304987ef6d7593d000a` | **OBSERVED** ([#680](https://github.com/Zero-State-LLC/Noema/pull/680)) |
| Main tip / pin | `0ff8aaadd294a5c13ff66eca402529ee5db263f1` | **OBSERVED** ([#681](https://github.com/Zero-State-LLC/Noema/pull/681)) |
| `deployed_at` | `2026-09-09T06:00:52.404542Z` | **OBSERVED** |
| `world_id` | `world.perihelion-reach-3` | **OBSERVED** |
| `genesis_id` | `genesis.94d0961984b2b4f8` | **OBSERVED** |
| Deploy run | https://github.com/Zero-State-LLC/Noema/actions/runs/34317120696 | **OBSERVED** |
| Pin PR | [#681](https://github.com/Zero-State-LLC/Noema/pull/681) tip `0ff8aaad…` | **MERGED** |

### 2.2 Specs / prior gate

| Pin | Value | Status |
|-----|-------|--------|
| Gate D COMPLETE | Specs [#334](https://github.com/Zero-State-LLC/Noema-Specs/pull/334) → `23987586219dfd95fd7544da8e13a316a8bd9457` | **OBSERVED** |
| Companion `LCA-GATE-E-SCENARIO.md` | — | **NOT** on Specs `main` (do not invent bullets) |
| Official-client / Controller CLI pin | — | **TBD** (not re-run for this stub) |

This stub does **not** update Specs. Campaign machine state after `#334` stays LCA-4 / next LCA-5 / Gate E unproven.

### 2.3 Heads at bind (not a run start)

| Pin | Value | Status |
|-----|-------|--------|
| Heads at bind | cycle `17958` / sequence `42176` | **OBSERVED** (`/ready` at bind) |
| Players at bind | `0` | **OBSERVED** |
| `canonical_start_head` (4h / 24h run) | — | **TBD** / **NOT_COMPUTABLE** (clock has not started; do not invent) |
| Canonical end head | — | **TBD** / **NOT_COMPUTABLE** (run has not started) |

---

## 3) Controllers (required before 4h; not reconnected here)

Reconnect **≥3** independently controlled external Controllers **before** the 4h clock. Players at bind are **0**. This stub does **not** reconnect anyone. Do **not** invent enrollments or device ids.

| Slot | Label | Device user code | `controller_id` | `player_id` | Status |
|------|-------|------------------|-----------------|-------------|--------|
| controller-a | TBD | — | — | — | **TBD** (not reconnected) |
| controller-b | TBD | — | — | — | **TBD** (not reconnected) |
| controller-c | TBD | — | — | — | **TBD** (not reconnected) |

Zero-Controller endurance without a `NOT_COMPUTABLE` label is WEAK / likely `NOT_COMPUTABLE`.

**Credential and admission path:** not exercised in this stub. No tokens, `credential.json`, or Authorization headers in this packet.

---

## 4) Enabled implemented systems

**TBD** at clock start. Listing hosted systems does **not** promote any Gate E bullet to COMPLETE. Do not invent a proof list here.

---

## 5) Planned operator interventions and external inputs

Declare before the 4h clock. This cut records the placeholder only.

| Item | Plan | Status |
|------|------|--------|
| Population | ≥3 independently controlled Controllers before 4h. No new enrollments invented here. | **TBD** / **PLANNED** |
| Human role | Authorizer / operator / spectator only. Never a Player. | **DECLARED** |
| Privileged grants | None. Interventions bounded, logged, and not used to script the outcome. | **DECLARED** |
| Intervention log | — | **TBD** (empty; clock has not started) |
| External inputs | None invented in this stub. Any later input must be recorded before it is applied. | **TBD** / empty |
| Genesis / rooms / verbs | No mutation, reseeding, force-supersession, new rooms, or new Player verbs. | **DECLARED** |

---

## 6) Restart / recovery checkpoint

Recovery drill counts **inside** the 24h candidate. A serial rehearsal between 4h and 24h is extra practice only; it does not substitute unless the Specs companion later says otherwise.

| Item | Status |
|------|--------|
| Declared restart / recovery checkpoint | **TBD** / **NOT_COMPUTABLE** (not yet declared against a start head) |
| Recovery receipts | **TBD**. Existing Admin recover JSON is acceptable when OBSERVED. Dedicated schema is **NOT_COMPUTABLE** / not invented. |
| In-window 24h drill | **TBD** (24h has not started) |

---

## 7) WATCH capture method (planned)

| Item | Plan | Status |
|------|------|--------|
| Public WATCH | `GET https://noema.guru/v1/watch/live` plus public `/watch` and post-run `/ready` `/health` `/version` | **PLANNED** |
| Gate E WATCH digest | — | **TBD** / **NOT_COMPUTABLE** (run has not started) |

Private message text stays private. WATCH-only capture cannot establish endurance.

---

## 8) Known production-alpha deltas

Recorded so later evidence does not silently collapse them:

1. Live Worker is `592c06a4…` (this bind). Unify source is `#680` `39d4856a…`. Pin tip is `#681` `0ff8aaad…`.
2. Players at bind are **0**. ≥3 Controllers must reconnect before the 4h clock.
3. Hosted STUDY remains observational / BLOCKED. Gate F successor decision remains unopened.
4. Companion `docs/LCA-GATE-E-SCENARIO.md` is not on Specs `main` as of this stub.
5. `/ready.world.players` census at bind is not a population proof. Do not invent a Gate E census here.

---

## 9) Gate E checklist (unchecked until OBSERVED)

Conjunctive. Isolated slice demonstrations and Gate D WATCH-legibility PASS do not satisfy Gate E. Copied from Specs `docs/LIVING-ALPHA-ACCEPTANCE.md` § Gate E.

When `docs/LCA-GATE-E-SCENARIO.md` exists on Specs `main`, copy that companion's checklist here as **unchecked**. Do not invent companion bullets while the file is still in flight.

- [ ] **4h candidate.** A four-hour candidate run passes before the 24-hour run opens.
- [ ] **24h candidate.** The final candidate spans at least 24 continuous hours.
- [ ] **In-window recovery drill.** At least one planned restart or recovery drill occurs **inside** the 24h candidate.
- [ ] **Honest marks.** Incidents, settlement lag, or stale projections are marked honestly.
- [ ] **Bounded interventions.** Operator interventions are bounded, logged, and not used to script the desired outcome.

### Non-goals (must not be used to pass)

- [ ] No new canonical Player verbs, semantic action aliases, or a second interaction campaign.
- [ ] No Genesis mutation, reseeding, force-supersession, new rooms, or room-bound expansion.
- [ ] No crypto, wallets, x402, external settlement, XP, quests, class trees, or v0.8 Phenomena.
- [ ] No hosted STUDY claims, research scores as Player rewards, or private cognition claims.
- [ ] No scalar reputation or trust score as world truth.
- [ ] No operator-authored strategy, outcome scripting, privileged grants, hidden topology disclosure, or target-specific WED pressure.
- [ ] No Gate F GO / Deploy-as-success claim from this packet.
- [ ] No 4h-clock-started claim. Clock has not started.
- [ ] No Controller-reconnect claim. Controllers are not reconnected here.

If the hosted world cannot support a 4h → 24h (in-window recovery) run under these pins, record an integration or ops defect. Do not add breadth during the run to force a pass.

---

## 10) Explicit non-claims

- Gate E is **not** COMPLETE.
- Issue #682 stays **OPEN**.
- Controllers are **not** reconnected. The 4h clock has **not** started.
- No hosted STUDY. No Gate F successor claim.
- This packet **alone** does **not** authorize Deploy, pin-on-publish dispatch, a Specs campaign flip, Controller reconnect, or clock start.
- Missing evidence is not a pass. Unit tests are not a substitute for an endurance run.
- No tokens / `credential.json` / Authorization headers pasted.
