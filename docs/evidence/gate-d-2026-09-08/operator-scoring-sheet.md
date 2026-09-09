# Gate D operator scoring sheet (NOT for reviewer first pass)

**Candidate:** `lca4-gate-d-watch-legibility`  
**Issue:** [#667](https://github.com/Zero-State-LLC/Noema/issues/667) (**OPEN**)  
**Digest:** [watch-digest.md](watch-digest.md)  
**Ground truth tip:** `main` ~`4d553448` / prior `270af19` — compare only to public digest at [watch-digest.md](watch-digest.md).  
**This sheet is operators-only** (Boof / PRISM).  
**Gate D COMPLETE is not claimed here.** Conjunctive verdict: **FAIL**.

---

## Reviewer identity class + exclusion attestation

| Item | Value |
|------|-------|
| Reviewer identity class | **ASSIGNED** — campaign HumanPrincipal / Danny (uninvolved spectator); statements returned **2026-09-08 ~20:37 PT** |
| Exclusion attestation vs runbook §4.2 | ☑ human-yes **2026-09-08 ~20:32 PT** — stayed out of Gate C Controller (LUDUS/ADVERSARY/VECTOR) ops and Admin Approve for that cohort |
| Materials actually received | ☑ digest ☑ public URLs ☑ candidate id ☑ window bounds ☑ five-statement instruction — **no** golden answers / private briefings |
| Theater screenshot | ☑ OBSERVED — https://noema.guru/watch at cycle **17779** / seq **41816** matching digest (public-feed corroboration) |

---

## Capture bind (from digest)

| Item | OBSERVED |
|------|----------|
| Pin match | **Y** (`worker_version_id` `2c48d671…`, world `world.perihelion-reach-3`, genesis `genesis.94d0961984b2b4f8`, `deployed_at` `2026-09-08T09:03:17.074823Z`) |
| `canonical_head_range` | start=end cycle **17779** / sequence **41816** |
| Operator actions in window | **none declared** |
| Gate C WATCH digest | **NOT_COMPUTABLE** (no independently reviewable prior public digest under these pins) |

---

## Per-statement score (conjunctive)

Compare only to **pinned public ground truth**. Do not score against hidden facts.  
Operator: **Boof / PRISM**. Reviewer answers: Danny verbatim **2026-09-08 ~20:37 PT**.

| # | Statement | Public projection evidence | Public ground truth cite | Verdict |
|---|-----------|----------------------------|--------------------------|---------|
| 1 | Important visible change | "A report is circulating." | Matches notable NOW / `public_pulses`: "A report is circulating." | **PASS** |
| 2 | Involved public actors/locations | "0 players rn" | Statement asks for public Agent Player handles, organizations, or sites WATCH already shows. Answer only notes `players_present=0`; omits visible public sites/actors in same capture (e.g. Civic Exchange, actor_label reach-maint3, institution org pulse, room list). | **FAIL** |
| 3 | Observable consequence | "cant tell" | Omits observable public consequences already in the feed (stocks recovered at Civic Exchange; temporary repair authority notice). Motives not required — public result lines were present. | **FAIL** |
| 4 | Relevant prior public context | "Intitution declared a temporary repair authority, stocks recovered at civic exchange x" | Cites earlier public WATCH history a spectator can see: institution temporary repair authority + stocks recovered at Civic Exchange (matches `recent_events` / pulses). Typo "Intitution" ok. | **PASS** |
| 5 | What remains unknown | "Not really showing much rn" | Does not state material unknowns WATCH correctly withholds (e.g. report author, which institution, private motives, non-public site for followed device). Vague density complaint ≠ unknowns checklist item. Specs: omitting "what remains unknown" cannot pass. | **FAIL** |
| 6 | No private leak / invented motive (standing) | "no" | Reviewer attested no private leak / invented motive; public capture shows no private MESSAGE / PLAYER_PRIVATE / tokens. | **PASS** |

---

## Conjunctive candidate verdict

| Field | Value |
|-------|-------|
| Verdict | **FAIL** |
| Reasons | Any required statement FAIL ⇒ FAIL. Statements **2**, **3**, and **5** FAIL. |
| Optional Gate C digest status | **NOT_COMPUTABLE** (unchanged) |
| Human-yes on PASS before Specs flip | **not applicable** (FAIL) |

---

## Explicit non-claims block

- Gate D is **not** COMPLETE because a digest was captured, statements were scored, or this sheet exists.
- Blind reviewer **ASSIGNED** and scored; Gate D still **not** COMPLETE (conjunctive **FAIL**).
- No Deploy, Genesis mutation, STUDY, Gate E/F, or Specs campaign flip from this sheet.
- Human-yes Specs flip = **not applicable** (FAIL).
- Issue **#667 stays OPEN**.
- Missing evidence is not a pass. Unit fixtures are not a substitute for public-WATCH blind review.
- No tokens / credentials in this sheet.
