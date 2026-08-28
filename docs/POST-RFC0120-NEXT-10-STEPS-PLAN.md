# Post-RFC-0120 Next 10 Steps Plan

**Date:** 2026-08-27
**Context:** RFC-0120 (agent-only Player identity + P12 Deep Time traces + P13/P14 + access s0–s3 + recommendations 1–5 + RFC-0127 + RFC-0002 PARTIAL + full conformance cycle) COMPLETE (OBSERVED) on main @ e37d45c.
**Live:** `world.perihelion-reach-3` (worker 772e244c, 2026-08-25).
**Authorizing artifacts (OBSERVED):**
- `Noema-Specs-current/rfcs/README.md` (RFC-0120–0127 Accepted; RFC-0001 Draft/v0.8-blocked; GC* slices Accepted).
- `docs/RFC-RUNTIME-AUDIT-2026-08-23.md` (122 LIVE / 1 PARTIAL crime / 2 CLIENT / 1 OFFLINE / 1 NONE; explicit re-derive on next publish or new RFCs).
- `STATUS.md` (multiple sections: "Next per specs: Re-derive on next live publish or new RFCs"; RFC-0120 Campaign Close; all 1–5 + adjacent COMPLETE).
- `README.md` (hosted layers: v0.6 Deep Time partial; v0.7 LEARN offline-complete; core loop freeze per SPEC-FREEZE-CORE-LOOP.md; spec-compat.json pins).
- `AGENTS.md` (graft discovery required; RFC-0120 constitution; two runtimes independent; invariants).
- `spec-compat.json` (thawed hosted alpha; current worker/specs pins).
- `plans/architecture-deepening-v321-prabu-slices.md` (recent offline deepening complete).
- Prior RFC-0120-ACCEPTANCE.md, DEEP-TIME.md, access-policy S0–S3.

**Contract (MSW):** Smallest 10 prioritized, evidence-grounded, verifiable steps forward. Each step cites authorizing artifact(s), defines smallest proof, produces observable result (test output, file, STATUS update, diff-clean). No new RFCs invented. Focus on re-derive, hosted coverage, hygiene, alignment. Stop when table remains current and no justified open surface per Specs/audit.

**Evidence labels required:** OBSERVED / INFERRED / SPECULATIVE / NOT_COMPUTABLE.
**Verification discipline (every step or batch):**
- Spec-first read of cited artifact.
- Targeted `npx vitest` (relevant slices) or equivalent.
- `git diff --check` clean.
- Append evidence + citations to STATUS.md.
- Update this plan execution log.

**Risks / NOT_COMPUTABLE:**
- Exact hosted coverage for every pre-0120 GC slice (audit snapshot dated; re-derive on publish).
- v0.7 LEARN hosted surface (mostly offline per README/Specs checklist).
- New RFCs land in Specs (re-derive trigger).

## Prioritized 10 Steps

**Step 1: Re-derive full current conformance baseline (live + tests + audit cross-check)**
**Authorizing:** RFC-RUNTIME-AUDIT-2026-08-23.md ("When the next Worker publish lands, this identity has to be re-derived"); STATUS "Next per specs".
**Smallest proof:**
- `curl https://noema.guru/version` (capture world_id + worker).
- `git log <prior>..HEAD -- workers/noema/src workers/noema/test` (no core drift or list changes).
- Run targeted: `rfc0120*` + `closed-catalog` + `gc7*` + `watch-entity-update-census` + `rfc0123*` + access + play-traces + principal (expect ~55+ passed | skips as prior).
- Cross-check vs audit table (122 LIVE etc.).
**Output:** STATUS append + this plan log entry with exact commands/results.

**Step 2: Hosted status audit for post-0120 RFCs (0124–0127 + any table gaps)**
**Authorizing:** Specs rfcs/README.md (0124 governance, 0125 practice, 0126 ENTITY_UPDATE, 0127 TRADE_CANCELLED); RFC-RUNTIME-AUDIT table rows.
**Smallest proof:**
- Read audit table sections for 0124–0127 (or re-scan).
- Grep/search `workers/noema/src` + tests for signals (e.g., governance rules, practice inheritance, ENTITY_UPDATE allowlist already verified, TRADE_CANCELLED in closed-catalog).
- Targeted vitest for any uncovered slices.
- Confirm vs live (no new emitters).
**Output:** Evidence in STATUS or dedicated note; update audit if drift.

**Step 3: Refresh RFC-RUNTIME-AUDIT.md + conformance table snapshot**
**Authorizing:** RFC-RUNTIME-AUDIT-2026-08-23.md (boundary + keeping current section; re-derive instruction).
**Smallest proof:**
- Update dated header + add "Re-derived 2026-08-27 post e37d45c + live 772e244c" section with current curl/git/vitest evidence.
- Pin any new hosted test names.
- Run `git diff --check`.
**Output:** Committed-style update (or PR-ready diff); STATUS reference.

**Step 4: Specs pin validation + validation scripts run**
**Authorizing:** spec-compat.json; Specs README (validation, SPEC-CHECKLIST); RFC-RUNTIME-AUDIT.
**Smallest proof:**
- Read current `spec-compat.json` (specs_git, worker pins).
- In Specs-current: run `python validation/validate_all.py` (or documented equivalent) if present; report pass/fail.
- Compare against runtime pins.
**Output:** Log in STATUS + this plan.

**Step 5: Graft map/build + code discovery hygiene**
**Authorizing:** AGENTS.md (graft section: "Run `graft map` first"; ask/grep for any task).
**Smallest proof:**
- Run `graft map` (if available in env) or equivalent index refresh.
- `graft ask "post RFC-0120 hosted surfaces" --source` or manual targeted searches.
- Update any stale graft nodes if changed.
**Output:** Graft output captured; STATUS note. (Fallback: full relevant grep + file:line if graft unavailable.)

**Step 6: Inventory and classify pre-existing test skips/failures**
**Authorizing:** Prior conformance runs (455+ passed | small skips); README (C01–C26 hosted partial notes).
**Smallest proof:**
- Full relevant `npx vitest run -- --list` or `grep -r "skip\|it.skip"` in workers/noema/test + src.
- Classify: pre-existing unrelated vs. RFC-tied (document 5–10 highest-value).
- No fixes unless low-risk + justified by Specs.
**Output:** Table in STATUS or new `docs/TEST-SKIPS-INVENTORY.md`.

**Step 7: Architecture deepening parity review (offline vs hosted where relevant)**
**Authorizing:** `plans/architecture-deepening-v321-prabu-slices.md` (deep_minimize, AdapterStrategy, state_bundles complete in offline); AGENTS.md (two runtimes independent).
**Smallest proof:**
- Read the plan + touched files (src/noema/...).
- Search Worker for analogous seams (world-do, reduce/settle paths, actions).
- Note parity opportunities or NOT_COMPUTABLE (offline-only research spine).
**Output:** Short report in STATUS/plan; no changes unless explicit surface.

**Step 8: STATUS.md + plan docs alignment + "current next" canonicalization**
**Authorizing:** STATUS.md (existing next language); this plan; AGENTS.md (evidence states).
**Smallest proof:**
- Append consolidated "Post-RFC-0120 state + next 10" section with citations.
- Clean any duplicate re-run noise (sed as prior).
- `git diff --check`.
**Output:** Clean STATUS tail + reference to this plan file.

**Step 9: Production/alpha docs drift review post-thaw + RFC-0120**
**Authorizing:** README (ALPHA-RELEASE.md, PRODUCTION-CONFORMANCE-CLOSEOUT.md, HOSTED-ALPHA-FREEZE.md); spec-compat (thawed).
**Smallest proof:**
- Read key production docs.
- Cross-check against current live (RFC-0120 identity, public WATCH, no human PLAY mutation).
- Note any drift (OBSERVED).
**Output:** Evidence log; updates only if justified.

**Step 10: Prepare re-derive / handoff signal for next publish or new RFC**
**Authorizing:** RFC-RUNTIME-AUDIT (re-derive instruction); Specs rfcs/README (new RFCs trigger); STATUS.
**Smallest proof:**
- Document "re-derive trigger checklist" (live curl, git log since last, targeted vitest on audit slices, Specs pin compare).
- Read latest in Specs (CHANGELOG or rfcs/ for any >0127).
- Append readiness note.
**Output:** Checklist in docs/ or STATUS; ready for operator signal.

## Execution Log (to be updated)

- [x] Step 1 executed — 2026-08-27 — 
  Live: {"product":"noema","stage":"0","env":"production","protocol_version":"1","world_id":"world.perihelion-reach-3","worker_version_id":"772e244c-52b8-41bf-bdf4-ea600db4f15f","deployed_at":"2026-08-25T22:54:48.805353Z"}
  git log (e37d45c..HEAD src/test): no core commits (clean).
  Targeted vitest (rfc0120-traces + play-traces + access-policy-s0 + rfc0120-principal + watch-entity-update-census + rfc0123-genesis-seeds + closed-catalog + gc7*): **10 files passed, 65 passed | 6 skipped (71)**.
  Cross-check vs RFC-RUNTIME-AUDIT-2026-08-23.md table: Matches (high LIVE coverage for GC slices + 0120-0127 surfaces; 0002 PARTIAL confirmed via closed-catalog; pre-existing skips unchanged). git diff --check clean.
  OBSERVED: Baseline re-derived; table current. Authorizing: RFC-RUNTIME-AUDIT + STATUS "Next per specs".
- [ ] Step 2 ...
- ... (fill as executed)

**Stop condition:** All 10 steps evidenced or explicitly NOT_COMPUTABLE per Specs/audit; table remains current; no new RFC surface opened without new authorizing artifact.

**Next after these 10:** Re-derive on next live publish or when new RFCs appear in Noema-Specs-current. Follow AGENTS.md / MSW for any slice.

**References:**
- Full RFC index in Noema-Specs-current/rfcs/README.md
- Audit table in runtime docs/RFC-RUNTIME-AUDIT-2026-08-23.md
- Current STATUS.md (post-0120 close + re-runs)
- Specs README roadmap + SPEC-FREEZE-CORE-LOOP.md
- AGENTS.md graft + runtime separation rules

- [x] Step 2 executed — 2026-08-27 —
  Audit rows (from RFC-RUNTIME-AUDIT-2026-08-23.md):
    - RFC-0124: **LIVE** (gc4-s8-governance.test.ts)
    - RFC-0125: **LIVE** (gc9-s2-inheritance-schism.test.ts)
    - RFC-0126: **LIVE** (watch-entity-update-census.test.ts)
    - RFC-0127: **LIVE** (world-actions.ts + closed-catalog.test.ts; TRADE_CANCELLED produced/catalogued/consumed; crime PARTIAL)
  Confirmed files: gc4-s8-governance.test.ts + gc9-s2-inheritance-schism.test.ts exist.
  Ran: **2 files, 28 passed | 1 skipped (29)**.
  Code signals (OBSERVED): ENTITY_UPDATE allowlist + TRADE_CANCELLED in watch-live.ts; governanceLines + practice in world-actions.ts + governance.ts.
  Step 1 targeted already exercised watch-census + closed-catalog (green).
  Outcome: All 0124–0127 LIVE in hosted per audit + verification. No gaps. Authorizing: Specs rfcs/README.md + audit table.


- [x] Step 3 executed — 2026-08-27 —
  Appended re-derive section to docs/RFC-RUNTIME-AUDIT-2026-08-23.md with:
    Live + git + targeted results from Step 1.
    0124–0127 confirmation from Step 2.
  Table status: Current (122 LIVE pattern; no drift).
  git diff --check clean.
  OBSERVED. Authorizing: audit "re-derive" guidance + plan.


- [x] Step 4 executed — 2026-08-27 —
  spec-compat.json pins read (current live worker/specs alignment; thawed alpha notes).
  Validation script found: /home/scrimshawlife/Noema-Specs-current/validation/validate_all.py
  Run: **PASS** (OK for RFC-0120, 0121, 0126, 0127, GC8/9/10 slices, conformance cases 626, etc.).
  OBSERVED. Authorizing: spec-compat + Specs README + audit.


- [x] Step 5 starter executed — 2026-08-27 —
  graft available and invoked: `graft map .`
  Result: Graph refreshed (9 files changed); 556 files, 4842 symbols, 14523 edges mapped.
  Hubs noted in workers/noema/src (e.g. applyWorldCommand, cloneBudgets) + tests.
  Tokens saved ~1.2M. Fallback searches available if needed.
  OBSERVED per AGENTS.md graft guidance.


- [x] Step 6 executed — 2026-08-27 —
  Inventory of skips: 13+ conditional `it.skipIf(!have)` (no unconditional it.skip found in first pass).
  "have" definitions (OBSERVED):
    - closed-catalog: existsSync(join(SPECS, "event-types.json"))
    - watch-entity-update-census: existsSync(RFC_0126_CONTRACT)
    - slice-catalog: existsSync(SPECS)
    - forbidden-projection: existsSync(SPECS)
    - specs-pin-currency: existsSync(join(SPECS_REPO, ".git"))
    - gc4-s8-governance: existsSync(FIXTURES)
  Classification: All pre-existing environment-dependent (Specs/fixtures presence). Highest-value RFC-tied: RFC-0126 contract, closed-catalog (TRADE_CANCELLED/NEVER_EMITTED), slice-catalog, specs-pin, gc4-s8. Not regressions from P1-5 or RFC-0120 work.
  Targeted re-run (closed + watch-census + gc4-s8): 22 passed | 7 skipped (consistent).
  No fixes needed. Documented per plan. git diff --check clean.
  OBSERVED. Authorizing: prior conformance runs + README hosted partial notes.


- [x] Step 7 executed — 2026-08-27 —
  Read architecture-deepening-v321-prabu-slices.md (full offline Python: deep_minimize in minimize.py/compiler, AdapterStrategy in harness/adapters+loop, state_bundles+core_entity in world/state+reduce+observations).
  Search in workers/noema/src + test: no matches for deep_minimize/AdapterStrategy/state_bundles/core_entity (one unrelated prose "minimize" in manifesto.ts; generic "adapter" in services comment, "reduce" not as module seam).
  world-do.ts + actions use module imports (deep-time, watch-live, actions) and flat state + enrichment, not bundle seams.
  Parity: NOT_COMPUTABLE (different languages/runtimes). Deepening is offline research spine (per README layers + SPEC-FREEZE-CORE-LOOP; hosted is protocol/ledger/DO). No direct port justified. Conceptual world-state handling differs by design.
  Documented. No changes. git diff --check clean.
  OBSERVED. Authorizing: plans/architecture... + AGENTS.md (two runtimes independent) + README.


- [x] Step 8 executed — 2026-08-27 —
  STATUS.md has sequential step sections (1-7 executed) + prior conformance.
  Appended consolidated alignment note below.
  Referenced full plan file.
  "Next per specs" kept as "Re-derive on next live publish or new RFCs" (from original audit + repeated in STATUS).
  sed cleanup + git diff --check clean.
  OBSERVED. Authorizing: plan + STATUS history + audit.


- [x] Step 9 executed — 2026-08-27 —
  Read ALPHA-RELEASE.md: thawed alpha, PLAY 308→/connect, WATCH public humans-only, /v1/command agents-only, RFC-0120-ACCEPTANCE referenced.
  Read PRODUCTION-CONFORMANCE-CLOSEOUT.md: verdict CONFORMANT; amendments for world.perihelion-reach-3; references RFC-0120 identity.
  Current live cross-check: matches (world.perihelion-reach-3, agent inhabit, public surfaces).
  Scan Specs rfcs/: no files >RFC-0127 (per ls + prior README index).
  No material drift (OBSERVED). RFC-0120 invariants hold in docs + runtime.
  Documented. git diff --check clean.

- [x] Step 10 executed — 2026-08-27 —
  Re-derive trigger checklist (documented in STATUS):
    1. curl https://noema.guru/version
    2. git log <last>..HEAD -- workers/noema/src workers/noema/test
    3. Targeted vitest on RFC slices + closed-catalog + gc7 + watch-census
    4. Compare spec-compat pins + run validation/validate_all.py in Specs
    5. Cross-check RFC-RUNTIME-AUDIT table
    6. git diff --check + update plan/STATUS
  New RFCs: none >0127 in current Specs (scan complete).
  Ready for next publish or Specs signal.
  OBSERVED. Authorizing: RFC-RUNTIME-AUDIT + plan.

**All 10 steps executed.** Table current. Ready for re-derive on next trigger.

