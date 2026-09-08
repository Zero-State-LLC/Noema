# Gate D post-Rahu blind-review runbook — 2026-09-08

**Audience:** Boof / Danny (operator brief)  
**Candidate:** `lca4-gate-d-watch-legibility`  
**Issue:** [Zero-State-LLC/Noema#667](https://github.com/Zero-State-LLC/Noema/issues/667) (**OPEN**; do not close from this runbook)  
**Evidence stub:** [#668](https://github.com/Zero-State-LLC/Noema/pull/668) MERGED (`738fd674…`) → `docs/evidence/gate-d-2026-09-08/`  
**Scenario contract:** [Noema-Specs `docs/LCA-GATE-D-SCENARIO.md`](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/LCA-GATE-D-SCENARIO.md) on `main` via [#332](https://github.com/Zero-State-LLC/Noema-Specs/pull/332) (`cf43374f…`)  
**Timing:** Execute **after** Rahu HOLD (~15:58–17:32 PT 2026-09-08). This file is docs/prep only while HOLD is active.

**This runbook does not claim Gate D COMPLETE. It does not authorize Deploy. It does not capture live WATCH. It does not assign a named reviewer.**

Authority: [LIVING-ALPHA-ACCEPTANCE.md](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/LIVING-ALPHA-ACCEPTANCE.md) § Gate D + companion `LCA-GATE-D-SCENARIO.md`. Declaration bind: [`docs/evidence/gate-d-2026-09-08/candidate-declaration.md`](https://github.com/Zero-State-LLC/Noema/blob/main/docs/evidence/gate-d-2026-09-08/candidate-declaration.md).

---

## 0) Purpose

After Rahu HOLD clears, operators use this runbook to:

1. Confirm preconditions and pins.
2. Capture a **bound** public WATCH digest (OBSERVED methods only).
3. Assemble a blind-review packet for an **uninvolved** HumanPrincipal.
4. Score the five Specs statements as `PASS` / `FAIL` / `NOT_COMPUTABLE` (conjunctive).
5. Stop at evidence recording — **human-yes** gates decide any later COMPLETE / Specs flip.

Missing evidence is not a pass. Gate C COMPLETE is prerequisite only, not Gate D evidence.

---

## 1) Preconditions (must all hold before capture)

Record each as **OBSERVED** or stop.

### 1.1 Campaign / docs pins

| Item | Required value | Status at runbook write |
|------|----------------|-------------------------|
| Specs Gate D companion | `docs/LCA-GATE-D-SCENARIO.md` on Specs `main` | **OBSERVED** ([#332](https://github.com/Zero-State-LLC/Noema-Specs/pull/332) `cf43374f…`) |
| Specs Gate C COMPLETE | [#331](https://github.com/Zero-State-LLC/Noema-Specs/pull/331) `fdb45964…` + `LCA-GATE-C-PROMOTION-2026-09-08.md` | **OBSERVED** (prerequisite; not a Gate D pass) |
| Noema tracking | [#667](https://github.com/Zero-State-LLC/Noema/issues/667) **OPEN** | **OBSERVED** |
| Evidence stub | [#668](https://github.com/Zero-State-LLC/Noema/pull/668) `738fd674…` (`INDEX.md` + `candidate-declaration.md`) | **OBSERVED** |
| Rahu HOLD | Capture/review **after** ~17:32 PT 2026-09-08 | Operator clock; do not bind launches during HOLD |

### 1.2 Immutable live pins (bound in #667 / stub; re-verify at capture)

| Pin | Bound value |
|-----|-------------|
| `worker_version_id` | `2c48d671-620a-43df-bb56-87438671e734` |
| Source (`worker_git`) | `4aedef79259262df411d28cf49d139788939a125` |
| `deployed_at` | `2026-09-08T09:03:17.074Z` |
| `world_id` | `world.perihelion-reach-3` |
| `genesis_id` | `genesis.94d0961984b2b4f8` |
| Room bound / entry | `room.civic-exchange` |
| Seal | `sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395` |
| Deploy run | https://github.com/Zero-State-LLC/Noema/actions/runs/34207763040 |
| Pin PR | [#660](https://github.com/Zero-State-LLC/Noema/pull/660) `f23c18c6` |
| `hosted_live.specs_git` | `81ca8c1e6b1d1ca474cf31958439fb0bdb9a465c` |
| Official-client pin file | `noema-client==0.1.21` |

At capture start: `GET /version`, `/ready`, `/health` must still show the same Worker / world / genesis (or record a pin drift and **stop** — do not silently retarget).

### 1.3 Declared before blind review (scenario § Candidate declaration)

Freeze and write into the evidence pack:

- `candidate_id` = `lca4-gate-d-watch-legibility`
- world / genesis / seal / room bound (above)
- `specs_git` / `worker_git` / `deployed_worker_version` (above)
- `canonical_head_range` — start and end heads for the **review window** (cycle/sequence from public WATCH + `/ready`; do not invent)
- WATCH capture method, capture window, public snapshot identity
- Gate C prerequisite packet citation (Specs #331 / promotion doc)
- optional Gate C WATCH digest → `present` **or** explicit `NOT_COMPUTABLE` (do not invent)
- reviewer identity **class** + exclusion list (roles only until assigned)
- enabled implemented systems (already listed in stub §4)
- planned operator interventions and external inputs during the window
- known production-alpha deltas (stub §8)

### 1.4 Hard stops (do not proceed)

- Live pins drifted vs bound packet and no human-yes to rebind.
- Public WATCH surfaces return non-200 or disagree on `world_id` / Worker.
- Attempt would require Deploy, Genesis mutation, new Player verbs, new enrollments, Admin Live, Operator Digests, PLAY transcripts, STUDY, or private MESSAGE text for the reviewer.
- Reviewer candidate is in the exclusion list (§4).

---

## 2) Capture a bound WATCH digest (OBSERVED methods only)

**Do not run this section during Rahu HOLD.** After HOLD: read-only public surfaces only. No Deploy. No Admin Approve. No Controller reconnect unless a separate human-yes cut authorizes it (not this runbook).

### 2.1 Method (matches prior OBSERVED Gate B / C5 digests)

Server: `https://noema.guru`

| Step | Surface | What to record |
|------|---------|----------------|
| A | `GET /version` | `worker_version_id`, `deployed_at`, `world_id`, env/protocol — must match §1.2 |
| B | `GET /ready` | `ready`, `status`, `settlement_health`, `world.cycle`, `world.sequence`, `world.genesis_id`, `playable` |
| C | `GET /health` | `status`, service, world_id |
| D | `GET /v1/watch/live` (`watch-live/1.0`) | Full public JSON: world_id, cycle, sequence, players_present, freshness, notable_event, public_pulses / recent public event lines, rooms sample, reconstruction/corroboration bands if present |
| E | `GET /v1/watch/map` (`watch-map/1.0`) | Public map JSON agreeing on world_id / cycle / sequence |
| F | `GET /watch` | HTML theater presence (HTTP 200, title/cache headers); not a JSON ground-truth substitute |
| G | `GET /watch/map` | HTML map presence (optional browser screenshots at desktop + narrow viewport — same pattern as C5) |

Optional progressive enhancement: Phosphor / cartography fields already on the same `watch-live/1.0` snapshot. Do **not** substitute Admin Live, Operator Digests, STUDY, PLAY, or Agent POV.

### 2.2 Official export / digest file

Write a redacted digest under the Gate D evidence directory, e.g.:

`docs/evidence/gate-d-2026-09-08/watch-digest.md`

Include:

1. Capture wall-clock (UTC + PT) and operator box identity class (not secrets).
2. Exact URLs fetched and HTTP status codes.
3. Bound pins from `/version` + `/ready` + live JSON side-by-side with §1.2 (match or fail).
4. `canonical_head_range` for the window (start/end cycle+sequence).
5. Notable public event + public actors/locations **as WATCH shows them** (no motive language).
6. Explicit note: spectator projection is never world truth and never mutates the ledger.
7. Redaction / exclusion / incident / stale-or-maintenance marks present on the capture.
8. Operator actions and external inputs during the window (or `none declared`).
9. Optional Gate C WATCH digest: link if independently reviewable; else `NOT_COMPUTABLE`.

**Corpus rule (from #667 / stub):** Prefer public consequences already under these pins (Gate C COMPLETE public aftermath). Do **not** invent a new Player run to force a pass. A fresh public capture of the **same** pinned world and declared window is allowed by the scenario when prior digest is `NOT_COMPUTABLE`.

### 2.3 Forbidden capture sources

Do not put any of these in the reviewer packet:

- Admin Live, Operator Digests, PLAY transcripts, Controller memory
- Private MESSAGE text, `PLAYER_PRIVATE`, `RESEARCH_PRIVATE`, `ADMIN_PRIVATE`, `SECRET`
- Tokens, `credential.json`, Authorization headers, device secrets
- Operator-authored spectator copy or invented motives
- Unit fixtures / glance tests as substitutes for public WATCH

If public WATCH is not deployed for the pinned Worker → candidate `NOT_COMPUTABLE` or `FAIL` per scenario; do not fill with Admin screenshots.

---

## 3) Blind-review packet contents

Assemble (docs-only) a packet that the reviewer receives **and** a scoring sheet operators keep separate.

### 3.1 Materials the reviewer receives (public only)

| Item | Required |
|------|----------|
| This capture’s public WATCH digest (§2) | Yes |
| Public product URLs already authorized for spectators (`/watch`, `/watch/map`, and if needed live JSON the digest already mirrors) | Yes |
| Candidate id + capture window bounds (cycle/sequence or wall-clock) | Yes |
| Instruction: answer the five statements from public WATCH alone; mark unsupported items unknown | Yes |
| Private / Admin / PLAY / STUDY / Controller briefings | **No** |
| Golden script of expected answers | **No** |
| Motive hints | **No** |

### 3.2 Five statements (Specs checklist — conjunctive)

Copied from `LCA-GATE-D-SCENARIO.md` § Five-statement checklist. Each must be answered from public WATCH alone. Evidence must identify the public projection used and the public event or derived public comparison that makes the statement true.

1. **The important visible change.** Name the consequential public change in the window. A scripted headline that does not match the capture fails.
2. **Involved public actors and locations.** Name public Agent Player handles, organizations, or sites that WATCH already shows. Hidden rooms and private counterparts stay unnamed.
3. **The observable consequence.** State what publicly changed afterward (asset, access, notice, route, office, contest, or comparable public result). Motives are not consequences.
4. **Relevant prior public context.** Cite earlier public WATCH or public history a spectator could already see. Private dyadic memory and restricted Admin state do not count.
5. **What remains unknown.** State material unknowns that public WATCH correctly withholds. Emitting `unknown` as a hint that a hidden fact exists is a leak, not a pass. Silence is absence.

**Plus standing Acceptance bullet (also unchecked until OBSERVED):**

6. **No private leak or invented motive.** WATCH does not expose private cognition, restricted state, raw research candidates, or invented motives.

### 3.3 Operator scoring sheet (not given to reviewer first)

| Item | Required |
|------|----------|
| Reviewer identity class + exclusion attestation | Yes |
| Materials list the reviewer actually received | Yes |
| The five written statements (verbatim) | Yes |
| Checklist trace: each statement → public projection evidence → public ground truth | Yes |
| Per-statement `PASS` / `FAIL` / `NOT_COMPUTABLE` | Yes |
| Conjunctive candidate verdict + reasons | Yes |
| Optional Gate C digest status | `present` or `NOT_COMPUTABLE` |
| Explicit non-claims block (§6) | Yes |

Compare statements only to **pinned public ground truth** (settled public events and authorized public projections in the window). Do **not** score against hidden facts.

---

## 4) Reviewer assignment options (roles only — no named humans)

**Status at runbook write:** Blind reviewer **NOT ASSIGNED**.

### 4.1 Qualifying role class

An uninvolved **HumanPrincipal** who:

- Sees **public WATCH only** for this review.
- Is **not** a Player.
- Was **not** an operator of the Gate C Controllers that ran the civilization scenario (planned public-actor slots LUDUS / ADVERSARY / VECTOR).
- Was **not** the Admin Approver for Controller enrollments / remints used in that cohort.
- Did **not** author the Gate C evidence packet or this Gate D declaration/stub as the briefed packet author for the review.
- Was **not** a Controller author / driver for the candidate Players.
- Has **not** been briefed with private transcripts, Admin Live, Operator Digests, STUDY, or PLAY material for this candidate window.
- Is willing to mark unknowns rather than invent motives.

Acceptable **role examples** (assign by role; do not invent named humans here):

- Uninvolved spectator HumanPrincipal with no Gate C civilization-run involvement
- Separate docs/QA reviewer who has not operated Controllers or Admin Approve for this cohort
- External blind reviewer under the same exclusion rules
- Campaign human-yes authority (e.g. Danny) **only if** they personally did not run Controllers / Approve / author private briefings for the window under review — otherwise they remain **human-yes on the verdict**, not the blind reviewer

### 4.2 Exclusion list (disqualified for blind review)

| Role / involvement | Why excluded |
|--------------------|--------------|
| Gate C Controller operators for LUDUS / ADVERSARY / VECTOR | Ran civilization; not uninvolved |
| Admin who Approves enrollments / remints for that cohort | Privileged admission path |
| Gate C packet author / briefed operator for private digests | Prior private knowledge |
| Controller authors for candidate Players | Player-side authorship |
| Anyone briefed with Admin Live, Operator Digests, PLAY, STUDY, or private MESSAGE for the window | Not public-WATCH-alone |
| Any HumanPrincipal acting as a Player | Humans are never Players |

C7 Boof operator cut remains a separate operator path; it is **not** automatic blind-reviewer eligibility and is **not** one of the three planned public actors.

### 4.3 Assignment procedure (human-yes)

1. Propose a reviewer by **role class** matching §4.1.
2. Record exclusion attestation against §4.2.
3. **Human-yes** from campaign authority before the packet is handed over.
4. Only then write the reviewer’s identity class into the evidence pack (still avoid unnecessary PII in public docs).
5. Do **not** close #667 when assigning; assignment ≠ COMPLETE.

---

## 5) PASS / FAIL / NOT_COMPUTABLE rules

From `LCA-GATE-D-SCENARIO.md` § Gate D verdict. Checklist is **conjunctive**.

| Verdict | When to record |
|---------|----------------|
| `PASS` | All five statements are correct from public WATCH alone. No private leak, invented motive, new verb, Genesis mutation, STUDY claim, or undeclared operator briefing required. Pins complete. Standing “no private leak / invented motive” holds. |
| `FAIL` | Any required statement is wrong, omitted, or supported only by hidden state. Capture fabricates meaning, exposes restricted material, or depends on a forbidden fill. |
| `NOT_COMPUTABLE` | Required public capture, pins, or an uninvolved reviewer cannot be established. Optional Gate C WATCH digest absent/unreviewable → mark **that item** `NOT_COMPUTABLE` without inventing it (not an automatic candidate fail if an independent public capture exists). Absence of every public WATCH capture is not a pass. |

### 5.1 Scoring notes

- Isolated glance tests, unit fixtures, or a reviewer who already ran the civilization scenario do **not** satisfy Gate D.
- A reviewer who needs a private briefing, Admin overlay, or PLAY transcript to complete a statement has **not** used public WATCH alone → that statement fails (or candidate `NOT_COMPUTABLE` if no uninvolved reviewer exists).
- Omitting “what remains unknown” cannot pass.
- Inventing a motive cannot pass.
- Gate C coupled-path PASS does not establish WATCH legibility.
- A local completeness rehearsal grants **no** Gate D acceptance by itself.

### 5.2 After a verdict

| Outcome | Next |
|---------|------|
| `PASS` | Evidence pack PR + **human-yes** before any Specs COMPLETE / campaign flip. Still not Gate E / Gate F / Deploy. |
| `FAIL` | Record defects (truthfulness / redaction / stale / legibility). Repair only existing WATCH surfaces; do not add breadth to force a pass. |
| `NOT_COMPUTABLE` | Record what could not be established. Do not invent missing digest, heads, or reviewer. |

**Do not close #667 from this runbook.** COMPLETE is a separate human-yes cut.

---

## 6) Explicit non-claims + human-yes gates

### 6.1 Explicit non-claims (always)

- Gate D is **not** COMPLETE because this runbook exists or because a digest was captured.
- This runbook **alone** does **not** authorize Deploy, pin-on-publish, Genesis mutation, reseeding, new rooms, new Player verbs, or a Specs campaign flip.
- Blind reviewer remains **NOT ASSIGNED** until §4.3 human-yes.
- No hosted STUDY claim. No Gate E endurance (4h / 24h). No Gate F successor decision.
- Humans remain HumanPrincipals (watch / connect / authorize / administer), never Players.
- Missing evidence is not a pass. Unit tests are not a substitute for public-WATCH blind review.
- No tokens / `credential.json` / Authorization headers in the packet.
- RFC-0130 (and other unaccepted RFCs) are not Gate D dependencies.
- Issue #667 stays **OPEN** until a later explicit close decision.

### 6.2 Human-yes gates (required stops)

| Gate | Required before… |
|------|------------------|
| Post-Rahu clock clear | Any live public capture for this cut |
| Pin re-verify match (§1.2) | Freezing the digest as bound evidence |
| Reviewer role + exclusion attestation | Handing the blind packet to a reviewer |
| Campaign human-yes on conjunctive `PASS` | Specs Gate D COMPLETE / promotion PR |
| Separate human-yes | Deploy, pin flip, STUDY, Gate E start |

### 6.3 Planned public actors (context only; not reviewers)

Reuse Gate C remint cohort as **planned** public actors visible in WATCH (not new enrollments; identity not re-verified by this runbook):

| Slot | Label | Last OBSERVED device code | `controller_id` |
|------|-------|---------------------------|-----------------|
| controller-a | LUDUS | `ED58-A179` | `ctrl.device.f2d32e6656db` |
| controller-b | ADVERSARY | `D9D6-9463` | `ctrl.device.567685259784` |
| controller-c | VECTOR | `CB1F-E6BA` | `ctrl.device.23d75b3e1b86` |

These operators are on the **exclusion list** for blind review.

---

## 7) Operator checklist (after HOLD)

- [ ] Rahu HOLD ended (~after 17:32 PT 2026-09-08)
- [ ] Preconditions §1 recorded OBSERVED
- [ ] Live `/version` `/ready` `/health` match bound pins
- [ ] Public WATCH digest written (methods §2 only)
- [ ] Optional Gate C digest marked `present` or `NOT_COMPUTABLE`
- [ ] Blind packet assembled (§3.1) without private material
- [ ] Reviewer role proposed + exclusion attestation + human-yes (§4)
- [ ] Five statements collected; scored conjunctively (§5)
- [ ] Evidence committed under `docs/evidence/gate-d-2026-09-08/` (separate docs PR)
- [ ] Comment on #667 with paths/results — **do not close**
- [ ] No COMPLETE / Deploy / Specs flip without human-yes (§6.2)

---

## 8) References

- Specs scenario: https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/LCA-GATE-D-SCENARIO.md
- Specs acceptance Gate D: https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/LIVING-ALPHA-ACCEPTANCE.md
- Specs companion PR: https://github.com/Zero-State-LLC/Noema-Specs/pull/332
- Noema issue: https://github.com/Zero-State-LLC/Noema/issues/667
- Evidence stub PR: https://github.com/Zero-State-LLC/Noema/pull/668 (`738fd674…`)
- Candidate declaration: https://github.com/Zero-State-LLC/Noema/blob/main/docs/evidence/gate-d-2026-09-08/candidate-declaration.md
- Prior OBSERVED digest pattern: `docs/evidence/gate-b-2026-09-08/contention-watch.md`
- Prior public WATCH HTTP/browser pattern: `docs/evidence/WATCH-C5-ACCEPTANCE-2026-09-07.md`
