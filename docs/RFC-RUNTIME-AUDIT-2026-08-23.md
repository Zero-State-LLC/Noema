# RFC runtime audit — 2026-08-23

**What this is.** A per-RFC statement of where each of the 126 accepted contracts is
implemented: the hosted Cloudflare Worker, the offline Python runtime, an agent-side
client, or nowhere.

**What this is not.** Not authority for what is deployed. `GET https://noema.guru/version`
is that, and this document is dated the moment it disagrees with a later publish.
Not a claim that every RFC clause is satisfied — the unit here is the contract, not the
sentence.

## Why it exists

`docs/CORE-LOOP-RUNTIME.md` opens by saying it is **"not a map of the hosted Worker."**
Until now nothing was. The gap had a cost: `SPEC-FREEZE-CORE-LOOP.md` recorded five
slices as `Not started` that were built and passing offline, and 72 RFCs carried a
"Specification-only until hosted" line whose gate had fired years of work ago
(Specs #267, #268). Both are the same mistake — a status nobody could check, so nobody did.

## The boundary this audit is allowed to claim

Source presence normally proves nothing about a deployment. Here it does, for one
specific reason, and only today:

| Fact | Evidence |
|---|---|
| Which Worker is live | `hosted_live.worker_version_id` in [`spec-compat.json`](../spec-compat.json) |
| When it was published | the same block's `note` |
| That the pin is not stale | `GET https://noema.guru/version`, and the `pin-currency` workflow |
| That no Worker code has landed since | `git log <build commit>..main -- workers/noema/src workers/noema/test` is empty |

**This document names no version ids.** It used to name eleven, and a publish meant editing
all eleven — which is why one of them was still `591a5fe4` two publishes later, sitting in the
instructions for checking whether the pin is current. A restated fact is a fact that goes
stale somewhere you are not looking.

The pin lives in `spec-compat.json`, once. Rows below say **LIVE**, not *live in this build*,
because "which build" is a question with exactly one answer and it is not stored here.

So `workers/noema/src` at the build commit **is** the source of the running build. Name the
build commit, not `main` — `main` moves, and a row that says "on main" stops meaning anything
the moment it does. When the next Worker publish lands, this identity has to be re-derived
rather than trusted.

### Keeping this current

Two facts go stale, and only two. They are now checked rather than restated.

**Is the pin still the live build?** `.github/workflows/pin-currency.yml` reads
`GET /version` and compares it to `hosted_live.worker_version_id`, on a schedule and on
demand. It does not gate pull requests — a publish legitimately lands before the pin PR
merges, and a check that goes red for a correct state gets ignored. It exists so a lag
announces itself instead of being discovered days later.

**Has Worker code landed since that build?** One command, in the recipe at the end.

The pin lagged twice on 2026-08-24 alone, so this is not hypothetical. What `/version`
bought is that a lag is a one-read correction rather than a source diff. What the workflow
adds is that nobody has to remember to run the read.

Which commits a build carries is still **derived, not read** — `/version` reports the version
id and the deploy time, not a source commit. That derivation belongs in the pin's `note`,
where it is written once.

One note on `specs_git`. It is `26d840b` — Specs #276, the RFC this build implements. Every
prior build's specs pin trailed its own authority; #520 shipped before Specs #273 described
it. This is the first where the pin contains the RFC the runtime is executing.

## Method

Three joined facts, no inference chain longer than that:

1. **Slice → RFC** comes from the Specs validator, which prints the pairing it enforces
   (`OK: GC5-S10 board expiry: … RFC-0081 Accepted`). 103 pairs, plus 9 read directly from
   the slice docs for the `ACCESS_POLICY`, `Diplomacy`, orientation and GC9-S2 families.
2. **Slice → hosted test** comes from the Worker's own `describe()` titles, which name
   slices literally: `describe("GC5-S10 world path")`, `describe("ACCESS_POLICY S0 mapper")`.
3. **The tests pass.** Full Worker suite on this tree:

```
Test Files  198 passed (198)
     Tests  1323 passed | 1 skipped (1324)
```

The one skip is `gc4-s8-governance.test.ts` — `it.skipIf(!have)` on the Specs fixture
directory, which is absent when the Specs repo is not checked out beside this one.

99 RFCs resolve through that join. The remaining 26 were read by hand: 11 are cited by
RFC number inside Worker source or tests, 10 were matched to their distinctive identifier
in Worker source, and 5 are special cases written out below.

### A method that was tried and thrown away

The first pass scored each RFC by how many of its rare backticked identifiers appeared in
Worker source. It looked convincing and it was wrong. RFC-0081 (board expiry) scored
**zero** and would have been published as unimplemented. It is live, and
`gc5-s10.test.ts` proves it in one line:

```
it("keeps last 5 in the posting cycle, then drops them after one WAIT")
```

That is the RFC's contract exactly. Identifier overlap measures vocabulary, not behavior.
Nothing below rests on it.

## Result

| Verdict | Count | Meaning |
|---|---|---|
| **LIVE** | 121 | In the Worker source that built the pinned build, with passing hosted tests |
| **PARTIAL** | 1 | One half of the contract is live, the other is not |
| **CLIENT** | 2 | Contract belongs to the agent side; the Worker's half is live |
| **OFFLINE** | 1 | Implemented in `src/noema/` only; not hosted |
| **NONE** | 1 | Not implemented anywhere — and not expected to be |

Note what this replaces. `SPEC-FREEZE-CORE-LOOP.md` §4 slices D–G and I are the
**research spine** — Frontier, Observatory, Lab, Compiler, LEARN — and those are offline
(Specs #267). The RFC set audited here is the **game contract** set, and it is almost
entirely hosted. Both statements are true; they are about different bodies of work.

## RFC-0002 — contestation is live, crime is not · PARTIAL

Recorded as LIVE on 2026-08-23. That was wrong, and how it was wrong matters more than the row.

The evidence was `CRIME_DETECTED` appearing in `world-actions.ts` and `social-memory.ts` —
this document's weakest tier, an identifier found in Worker source. Every occurrence **reads**
the event. None writes it:

| File | What it does with `CRIME_DETECTED` |
|---|---|
| `watch-live.ts` | MAJOR tier, public projection, §7 redaction gate |
| `social-memory.ts` | danger-evidence credit, public-history branch |
| `world-reports.ts` | crime section filter |
| `world-actions.ts` | public-visibility check |
| `presentation/glyphs.ts` | glyph |

Five consumers, no producer. RFC-0002 requires detection by witness, sensor (condition ≥ 50),
investigation, or self-report; the Worker implements none, so the event cannot occur. **The
hosted world can interpret a crime it has no way to commit.**

Contestation, the other half of the same RFC, is fully live — `CONTEST_DECLARED` and
`CONTEST_RESOLVED` are emitted and covered by `gc7-s2` and `gc7-s3`. Hence PARTIAL, not NONE.

**The lesson is about method.** Identifier-presence cannot tell a producer from a consumer,
and tier three of this audit is identifier-presence. The first method tried here was thrown
out for scoring vocabulary instead of behavior; tier three is a milder form of the same error,
and it produced one false LIVE. The other tier-three rows were re-checked by hand — RFC-0103's
`ALLOW_ONLY` is parsed, validated and enforced; RFC-0021's delay band is computed and applied;
RFC-0018 writes `archive_claim` — and they stand. `closed-catalog.test.ts` now pins crime as
consumed-and-unproduced, so wiring it fails a test rather than quietly aging this row.

## The four rows that are not LIVE, and one that was

### RFC-0032 — the standby was missing, and now exists · was DIVERGENT, now LIVE

This audit originally recorded RFC-0032 as the one contract the runtime contradicted. The
Status section had already been amended so that Resend is preferred and *"Postmark remains
a configured standby"* — but `EmailProvider` was the one-member union `"resend"`, there was
no fallback path, `provider-management.test.ts` asserted `config` had no `postmark`
property, and `.env.example` advertised four `POSTMARK_*` variables that no code read.

That gap is closed: `postmark.ts` implements decision items 1–9 and the provider contract,
and `email-provider.ts` tries Resend first and Postmark second. The divergence count is zero.

The row was **PENDING PUBLISH** for one day, which was the point: writing LIVE while the fix
sat on `main` would have been the same mistake as a `hosted_live` pin running ahead of a
publish. It went LIVE with the 2026-08-24T01:08:29Z publish and has stayed so — derived from
merge order rather than probed, for the reason given in the boundary section.

### RFC-0111 · RFC-0116 — agent-side contracts · CLIENT

Both are implemented, neither by the Worker, and that is correct rather than a gap.
RFC-0111's harness is `src/noema/harness/` (policy, loop, seal, transport); RFC-0116's
client is `scrimshawlife-ctrl/noema-client`, pinned as `noema-client==0.1.15` in
`hosted_live` since 2026-08-24 (0.1.15 is on PyPI; #20 added the LOOK chrome for
`reputation_summary` and `active_norms`). The Worker's obligations under both — `POST /v1/command`, `/connect`, and
`GET /.well-known/noema-agent.json` (`index.ts:256`) — are live.

### RFC-0114 — LLM Controller adapter · OFFLINE

`src/noema/llm/` and `scripts/noema_llm_agent.py`, covered by `tests/test_llm_agent.py`.
Nothing in the Worker, by design: an adapter runs beside the agent, not inside the server.

### RFC-0001 — Phenomena self-reference · NONE

Draft, v0.8-blocked. `SPEC-FREEZE-CORE-LOOP.md` §7 puts it out of scope for first
implementation. Absent from both runtimes, as intended.

## Full table

Verdicts are per RFC. Evidence is the hosted test file whose `describe()` names the slice,
or the Worker source carrying the contract's identifier.

| RFC | Title | Slice | Verdict | Hosted evidence |
|---|---|---|---|---|
| [RFC-0001](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0001-phenomena-self-reference-integration.md) | Phenomena Constructs for Self-Reference and Integration | — | **NONE** | Draft, v0.8-blocked. No implementation in either runtime — expected; `SPEC-FREEZE-CORE-LOOP` §7 puts it out of scope |
| [RFC-0002](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0002-strategic-contestation-and-crime-events.md) | Strategic Contestation and Crime Events | — | **PARTIAL** | Contestation live (`contest.ts`, `gc7-s2`/`gc7-s3` tests). Crime consumed but never emitted — see below |
| [RFC-0003](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0003-deterministic-contract-hardening.md) | Deterministic Contract Hardening | — | **LIVE** | canonical-state.ts, settle.ts (`noema-jcs`) |
| [RFC-0004](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0004-derived-mastery-projection.md) | Derived Mastery Projection (GC1-S0) | GC1-S0 | **LIVE** | `actions-tier1.test.ts`, `practice.test.ts` |
| [RFC-0005](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0005-mastery-recognition.md) | Mastery Recognition Projection (GC1-S1) | GC1-S1 | **LIVE** | cites RFC-0005: `practice.ts` |
| [RFC-0006](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0006-construction-existing-events.md) | GC2-S0 Construction via Existing Events | GC2-S0 | **LIVE** | `construction.test.ts` |
| [RFC-0007](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0007-dyadic-trade-memory.md) | GC3-S0 Dyadic Trade Memory | GC3-S0 | **LIVE** | `social-memory.test.ts` |
| [RFC-0008](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0008-office-authority-pins.md) | GC4-S0 Existing Roles as Bounded Authority | GC4-S0 | **LIVE** | offices.ts, emergency.ts (`AuthorityGrant`) |
| [RFC-0009](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0009-relay-message-delivery.md) | GC5-S0 Relay Bands on Existing MESSAGE | GC5-S0 | **LIVE** | `communication.test.ts` |
| [RFC-0010](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0010-discovery-contradiction.md) | GC6-S0 Archive vs Live Inspect | GC6-S0 | **LIVE** | `discovery.test.ts` |
| [RFC-0011](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0011-contest-rhythm.md) | GC7-S0 Existing Contest Rhythm | GC7-S0 | **LIVE** | `contest.test.ts` |
| [RFC-0012](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0012-distance-interdependence.md) | GC8-S0 Distance Interdependence | GC8-S0 | **LIVE** | `economy.test.ts` |
| [RFC-0013](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0013-maintenance-custom.md) | GC9-S0 Maintenance Custom from Repeated Repair | GC9-S0 | **LIVE** | `culture.test.ts` |
| [RFC-0014](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0014-wed-schedule-pressure.md) | GC10-S0 Seeded Mild Relay Pressure | GC10-S0 | **LIVE** | `pressure.test.ts` |
| [RFC-0015](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0015-archive-record-source.md) | GC6-S0 Archive-Record Source | — | **LIVE** | cites RFC-0015: `discovery.ts` |
| [RFC-0016](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0016-hosted-durable-world-head.md) | Hosted Durable World Head | — | **LIVE** | cites RFC-0016: `world-do.ts` |
| [RFC-0017](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0017-hosted-cycle-fence.md) | Hosted Cycle Fence and Durable Settlement Recovery | — | **LIVE** | cites RFC-0017: `settle.ts` |
| [RFC-0018](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0018-archive-claim-writer.md) | Archive-Claim Field Writer | — | **LIVE** | world-actions.ts, actions.ts (`archive_claim`) |
| [RFC-0019](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0019-hosted-world-time.md) | Hosted World-Time via WAIT Quorum | — | **LIVE** | cites RFC-0019: `world-time.ts` |
| [RFC-0020](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0020-archive-claim-attest.md) | Archive-Claim Attestation (later COMMIT.ATTEST) | — | **LIVE** | cites RFC-0020: `attest.test.ts` |
| [RFC-0021](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0021-relay-message-delay.md) | GC5-S1 Deterministic MESSAGE Delay | GC5-S1 | **LIVE** | communication.ts (delay bands) |
| [RFC-0022](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0022-betrayal-dangerous.md) | GC3-S1 Dangerous from Contest or Breach | GC3-S1 | **LIVE** | `social-memory.test.ts` |
| [RFC-0023](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0023-named-offices.md) | GC4-S1 Named Institutional Offices | GC4-S1 | **LIVE** | `offices.test.ts` |
| [RFC-0024](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0024-historical-reconstruction.md) | GC6-S1 Historical Reconstruction | GC6-S1 | **LIVE** | `reconstruction.test.ts` |
| [RFC-0025](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0025-tradition.md) | GC9-S1 Tradition | GC9-S1 | **LIVE** | `tradition.test.ts` |
| [RFC-0026](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0026-contest-withdraw.md) | GC7-S1 Contest Withdraw | GC7-S1 | **LIVE** | `withdraw.test.ts` |
| [RFC-0027](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0027-additional-world-pressure.md) | GC10-S1 Additional World Pressure Classes | GC10-S1 | **LIVE** | `pressure.test.ts` |
| [RFC-0028](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0028-rumor-provenance.md) | GC5-S2 Rumor Provenance | GC5-S2 | **LIVE** | `rumor.test.ts` |
| [RFC-0029](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0029-institution-trade-repair.md) | Institutional TRADE and REPAIR Authority | GC4-S2 | **LIVE** | `institution-actions.test.ts` |
| [RFC-0030](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0030-emergency-scopes.md) | Institutional Emergency Authority Scopes | GC4-S3 | **LIVE** | `emergency.test.ts` |
| [RFC-0031](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0031-designated-succession.md) | Designated Institutional Succession | GC4-S4 | **LIVE** | `succession.test.ts` |
| [RFC-0032](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0032-postmark-admin-email-delivery.md) | Postmark Auth Email Delivery | — | **LIVE** | `postmark-standby.test.ts`, `provider-management.test.ts` |
| [RFC-0033](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0033-agent-bootstrap-and-game-profile.md) | Agent Bootstrap and Game-Only Controller Profile | AGENT-ORIENTATION-S2 | **LIVE** | `agent-orientation-s2.test.ts` |
| [RFC-0034](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0034-watch-public-descriptors.md) | GC3-S2 WATCH Public Descriptor Bands | GC3-S2 | **LIVE** | `gc3-s2-s6.test.ts` |
| [RFC-0035](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0035-institution-edges.md) | GC3-S3 Institution→Player Edges | GC3-S3 | **LIVE** | world-actions.ts, offices.ts (org edges) |
| [RFC-0036](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0036-decay-rehab.md) | GC3-S4 Decay and Rehabilitation Weights | GC3-S4 | **LIVE** | `gc3-s2-s6.test.ts` |
| [RFC-0037](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0037-trade-friction.md) | GC3-S5 Published Trade Caution | GC3-S5 | **LIVE** | `gc3-s2-s6.test.ts` |
| [RFC-0038](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0038-deceptive-edge.md) | GC3-S6 Deceptive as a Distinct Edge | GC3-S6 | **LIVE** | `gc3-s2-s6.test.ts` |
| [RFC-0039](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0039-preferred-counterparty.md) | GC3-S7 Preferred-Counterparty Discount | GC3-S7 | **LIVE** | `gc3-s2-s6.test.ts` |
| [RFC-0040](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0040-engineer-quality.md) | GC1-S2 Same-Asset Engineer Quality | GC1-S2 | **LIVE** | `gc1-s2.test.ts` |
| [RFC-0041](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0041-institution-contest-party.md) | GC7-S2 Institution as Contest Party | GC7-S2 | **LIVE** | `gc7-s2.test.ts` |
| [RFC-0042](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0042-information-contest.md) | GC7-S3 Information Contest Form | GC7-S3 | **LIVE** | `gc7-s3.test.ts` |
| [RFC-0043](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0043-mastery-decay.md) | GC1-S3 Mastery Decay | GC1-S3 | **LIVE** | `gc1-s3.test.ts` |
| [RFC-0044](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0044-prior-work-benefits.md) | GC1-S4 Prior-Work Track Benefits | GC1-S4 | **LIVE** | `gc1-s4.test.ts` |
| [RFC-0045](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0045-lot-quality.md) | GC8-S1 Lot Quality (SOUND / WORN) | GC8-S1 | **LIVE** | `gc8-s1.test.ts` |
| [RFC-0046](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0046-lot-provenance.md) | GC8-S2 Lot Provenance | GC8-S2 | **LIVE** | `gc8-s2.test.ts` |
| [RFC-0047](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0047-lot-spoilage.md) | GC8-S3 Worn Lot Spoilage | GC8-S3 | **LIVE** | `gc8-s3.test.ts` |
| [RFC-0048](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0048-cargo-move.md) | GC8-S4 Cargo MOVE Extra | GC8-S4 | **LIVE** | `gc8-s4.test.ts` |
| [RFC-0049](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0049-route-link.md) | GC2-S1 route_link | GC2-S1 | **LIVE** | `gc2-s1.test.ts` |
| [RFC-0050](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0050-workshop.md) | GC2-S2 workshop | GC2-S2 | **LIVE** | `gc2-s2.test.ts` |
| [RFC-0051](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0051-irreversible-scar.md) | GC10-S2 Irreversible Scar | GC10-S2 | **LIVE** | `gc10-s2.test.ts` |
| [RFC-0052](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0052-defensive-work.md) | GC2-S3 defensive_work | GC2-S3 | **LIVE** | `gc2-s3.test.ts` |
| [RFC-0053](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0053-archive-annex.md) | GC2-S4 archive_annex | GC2-S4 | **LIVE** | `gc2-s4.test.ts` |
| [RFC-0054](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0054-message-board.md) | GC5-S3 MESSAGE board surface | GC5-S3 | **LIVE** | `gc5-s3.test.ts` |
| [RFC-0055](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0055-office-eligibility.md) | GC1-S5 office eligibility | GC1-S5 | **LIVE** | `gc1-s5.test.ts` |
| [RFC-0056](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0056-workshop-upgrade.md) | GC2-S5 workshop UPGRADE | GC2-S5 | **LIVE** | `gc2-s5.test.ts` |
| [RFC-0057](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0057-workshop-repurpose.md) | GC2-S6 workshop REPURPOSE | GC2-S6 | **LIVE** | `gc2-s6.test.ts` |
| [RFC-0058](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0058-abandonment.md) | GC2-S7 abandonment | GC2-S7 | **LIVE** | `gc2-s7.test.ts` |
| [RFC-0059](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0059-restore.md) | GC2-S8 RESTORE | GC2-S8 | **LIVE** | `gc2-s8.test.ts` |
| [RFC-0060](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0060-consensus-succession.md) | GC4-S5 CONSENSUS succession | GC4-S5 | **LIVE** | `gc4-s5.test.ts` |
| [RFC-0061](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0061-multicycle-construct.md) | GC2-S9 multi-cycle relay CONSTRUCT | GC2-S9 | **LIVE** | `gc2-s9.test.ts` |
| [RFC-0062](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0062-message-shout.md) | GC5-S4 MESSAGE shout surface | GC5-S4 | **LIVE** | `gc5-s4.test.ts` |
| [RFC-0063](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0063-board-retention.md) | GC5-S5 MESSAGE board retention | GC5-S5 | **LIVE** | `gc5-s5.test.ts` |
| [RFC-0064](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0064-institution-notice.md) | GC5-S6 MESSAGE institution notice | GC5-S6 | **LIVE** | `gc5-s6.test.ts` |
| [RFC-0065](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0065-org-channel.md) | GC5-S7 MESSAGE org channel | GC5-S7 | **LIVE** | `gc5-s7.test.ts` |
| [RFC-0066](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0066-trade-notice.md) | GC5-S8 MESSAGE trade notice | GC5-S8 | **LIVE** | `gc5-s8.test.ts` |
| [RFC-0067](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0067-institution-own.md) | GC2-S10 institution-owned constructibles | GC2-S10 | **LIVE** | `gc2-s10.test.ts` |
| [RFC-0068](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0068-shared-own.md) | GC2-S11 shared constructible ownership | GC2-S11 | **LIVE** | `gc2-s11.test.ts` |
| [RFC-0069](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0069-rule-based-succession.md) | GC4-S6 RULE_BASED succession | GC4-S6 | **LIVE** | `gc4-s6.test.ts` |
| [RFC-0070](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0070-inherited-org.md) | GC4-S7 INHERITED_BY_ORGANIZATION | GC4-S7 | **LIVE** | `gc4-s7.test.ts` |
| [RFC-0071](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0071-connect-dest.md) | GC2-S12 CONNECT dest pin | GC2-S12 | **LIVE** | `gc2-s12.test.ts` |
| [RFC-0072](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0072-workshop-cycle.md) | GC2-S13 multi-cycle workshop CONSTRUCT | GC2-S13 | **LIVE** | `gc2-s13.test.ts` |
| [RFC-0073](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0073-generator-cycle.md) | GC2-S14 multi-cycle generator CONSTRUCT | GC2-S14 | **LIVE** | `gc2-s14.test.ts` |
| [RFC-0074](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0074-storage-bay-cycle.md) | GC2-S15 multi-cycle storage_bay CONSTRUCT | GC2-S15 | **LIVE** | `gc2-s15.test.ts` |
| [RFC-0075](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0075-production-node-cycle.md) | GC2-S16 multi-cycle production_node CONSTRUCT | GC2-S16 | **LIVE** | `gc2-s16.test.ts` |
| [RFC-0076](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0076-defensive-work-cycle.md) | GC2-S17 multi-cycle defensive_work CONSTRUCT | GC2-S17 | **LIVE** | `gc2-s17.test.ts` |
| [RFC-0077](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0077-archive-annex-cycle.md) | GC2-S18 multi-cycle archive_annex CONSTRUCT | GC2-S18 | **LIVE** | `gc2-s18.test.ts` |
| [RFC-0078](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0078-route-link-cycle.md) | GC2-S19 multi-cycle route_link CONSTRUCT | GC2-S19 | **LIVE** | `gc2-s19.test.ts` |
| [RFC-0079](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0079-second-co-owner.md) | GC2-S20 second co-owner | GC2-S20 | **LIVE** | `gc2-s20.test.ts` |
| [RFC-0080](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0080-shout-expiry.md) | GC5-S9 shout cycle expiry | GC5-S9 | **LIVE** | `gc5-s9.test.ts` |
| [RFC-0081](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0081-board-expiry.md) | GC5-S10 board cycle expiry | GC5-S10 | **LIVE** | `gc5-s10.test.ts` |
| [RFC-0082](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0082-notice-expiry.md) | GC5-S11 notice cycle expiry | GC5-S11 | **LIVE** | `gc5-s11.test.ts` |
| [RFC-0083](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0083-channel-expiry.md) | GC5-S12 channel cycle expiry | GC5-S12 | **LIVE** | `gc5-s12.test.ts` |
| [RFC-0084](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0084-trade-notice-expiry.md) | GC5-S13 trade-notice cycle expiry | GC5-S13 | **LIVE** | `gc5-s13.test.ts` |
| [RFC-0085](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0085-third-co-owner.md) | GC2-S21 third co-owner | GC2-S21 | **LIVE** | `gc2-s21.test.ts` |
| [RFC-0086](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0086-fourth-co-owner.md) | GC2-S22 fourth co-owner | GC2-S22 | **LIVE** | `gc2-s22.test.ts` |
| [RFC-0087](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0087-fifth-co-owner.md) | GC2-S23 fifth co-owner | GC2-S23 | **LIVE** | `gc2-s23.test.ts` |
| [RFC-0088](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0088-world-report.md) | WR-S0 public world report | WR-S0 | **LIVE** | `wr-s0.test.ts` |
| [RFC-0089](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0089-share-closeout.md) | GC2-S24 SHARE family closeout | GC2-S24 | **LIVE** | `gc2-s24.test.ts` |
| [RFC-0090](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0090-build-play-thaw.md) | GC2 first-world BUILD help | GC2 | **LIVE** | `construction.test.ts`, `gc2-s1.test.ts`, `gc2-s10.test.ts` +23 |
| [RFC-0091](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0091-org-report.md) | WR-S1 organization report lines | WR-S1 | **LIVE** | `wr-s1.test.ts` |
| [RFC-0092](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0092-contest-report.md) | WR-S2 public contest report lines | WR-S2 | **LIVE** | `wr-s2.test.ts` |
| [RFC-0093](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0093-access-report.md) | WR-S3 public access report lines | WR-S3 | **LIVE** | `wr-s3.test.ts` |
| [RFC-0094](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0094-crime-report.md) | WR-S4 public crime report lines | WR-S4 | **LIVE** | `wr-s4.test.ts` |
| [RFC-0095](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0095-contest-play-thaw.md) | GC7 first-world CONTEST help | GC7 | **LIVE** | `contest.test.ts`, `gc7-s2.test.ts`, `gc7-s3.test.ts` +2 |
| [RFC-0096](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0096-discovery-report.md) | WR-S5 public discovery report lines | WR-S5 | **LIVE** | `wr-s5.test.ts` |
| [RFC-0097](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0097-diplomacy-trade.md) | Diplomacy S0 TRADE agreement form | Diplomacy S0 | **LIVE** | `diplomacy-s0.test.ts` |
| [RFC-0098](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0098-diplomacy-terminate.md) | Diplomacy S1 AGREEMENT_TERMINATE | Diplomacy S1 | **LIVE** | `diplomacy-s1.test.ts` |
| [RFC-0099](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0099-diplomacy-report.md) | WR-S6 public diplomacy report lines | WR-S6 | **LIVE** | `wr-s6.test.ts` |
| [RFC-0100](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0100-diplomacy-closeout.md) | Diplomacy S2 remaining types, effects, and help | Diplomacy S2 | **LIVE** | `diplomacy-s2.test.ts` |
| [RFC-0101](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0101-access-policy.md) | ACCESS_POLICY S0 GRANT_ACCESS exit deny / clear | ACCESS_POLICY S0 | **LIVE** | `access-policy-s0.test.ts` |
| [RFC-0102](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0102-access-policy-room.md) | ACCESS_POLICY S1 ROOM deny / clear | ACCESS_POLICY S1 | **LIVE** | access-policy.ts (room scope) |
| [RFC-0103](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0103-access-policy-allow-only.md) | ACCESS_POLICY S2 ALLOW_ONLY | ACCESS_POLICY S2 | **LIVE** | access-policy.ts (`ALLOW_ONLY`) |
| [RFC-0104](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0104-access-policy-help.md) | ACCESS_POLICY S3 Chamber ACCESS help | ACCESS_POLICY S3 | **LIVE** | cites RFC-0104: `access-policy.ts` |
| [RFC-0105](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0105-public-titles.md) | GC1-S6 public titles | GC1-S6 | **LIVE** | `gc1-s6.test.ts` |
| [RFC-0106](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0106-agent-orientation.md) | Agent orientation S0 first-OBSERVE withhold | AGENT-ORIENTATION-S0, agent-orientation | **LIVE** | `agent-orientation-s1.test.ts`, `agent-orientation-s2.test.ts` |
| [RFC-0107](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0107-agent-orientation-situation.md) | Agent orientation S1 situation fields | AGENT-ORIENTATION-S1, agent-orientation | **LIVE** | `agent-orientation-s1.test.ts`, `agent-orientation-s2.test.ts` |
| [RFC-0108](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0108-agent-orientation-connect.md) | Agent orientation S2 CONNECT / skill withhold | AGENT-ORIENTATION-S1, AGENT-ORIENTATION-S2, agent-orientation | **LIVE** | `agent-orientation-s1.test.ts`, `agent-orientation-s2.test.ts` |
| [RFC-0109](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0109-human-orientation.md) | Human first-screen withhold | HUMAN-ORIENTATION-S0, human-orientation | **LIVE** | `human-orientation-s0.test.ts` |
| [RFC-0110](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0110-focus-declaration.md) | GC1-S7 focus declaration | GC1-S7 | **LIVE** | `gc1-s7.test.ts` |
| [RFC-0111](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0111-agent-harness.md) | Headless Agent Gameplay Harness | agent-harness | **CLIENT** | Controller-side contract. Implemented offline in `src/noema/harness/` (policy, loop, seal, transport). The Worker's half is `/v1/command`, live |
| [RFC-0112](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0112-parameter-access.md) | GC1-S8 Engineer overhaul parameter | GC1-S8 | **LIVE** | `gc1-s8.test.ts` |
| [RFC-0113](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0113-hosted-multiplayer-contention.md) | Hosted multiplayer contention | hosted-mp | **LIVE** | `hosted-mp-contention.test.ts` |
| [RFC-0114](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0114-llm-controller-adapter.md) | LLM Controller adapter (v0.1) | — | **OFFLINE** | `src/noema/llm/` + `scripts/noema_llm_agent.py`; `tests/test_llm_agent.py`. Nothing in the Worker — an adapter runs beside the agent, not in the server |
| [RFC-0115](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0115-sealed-live-attach.md) | Sealed live attach | sealed-live-attach | **LIVE** | `seal.test.ts` |
| [RFC-0116](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0116-official-agent-client.md) | Official external agent client | official-agent-client | **CLIENT** | Implemented in `scrimshawlife-ctrl/noema-client`, pinned as `noema-client==0.1.15` in `hosted_live`. The Worker's half is live: `/connect` and `GET /.well-known/noema-agent.json` (`index.ts:256`) |
| [RFC-0117](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0117-lockout-wait-rest.md) | Lockout WAIT rest | — | **LIVE** | cites RFC-0117: `cargo.ts` |
| [RFC-0118](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0118-work-consumes-cargo.md) | Work consumes cargo | GC8-S6 | **LIVE** | `cargo.test.ts`, `gc8-s6.test.ts` |
| [RFC-0119](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0119-wait-cargo-fuel.md) | WAIT burns cargo for energy | GC8-S7 | **LIVE** | cites RFC-0119: `cargo.ts` |
| [RFC-0120](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0120-agent-only-player-identity.md) | Agent-Only Player Identity | — | **LIVE** | cites RFC-0120: `rfc0120-*.test.ts (5 files)` |
| [RFC-0121](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0121-perihelion-successor-world-version.md) | Perihelion successor world_version | — | **LIVE** | genesis.ts (`world.perihelion-reach-3`) |
| [RFC-0122](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0122-perihelion-ewm-product-world.md) | Perihelion EWM product world_version | — | **LIVE** | genesis.ts (`EWM_ENHANCED`) |
| [RFC-0123](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0123-norm-ratchet-bounds-and-costly-trade-reject.md) | Bounded upward norm ratchet; costly TRADE-reject punishment pinned | — | **LIVE** | cites RFC-0123: `rfc0123-genesis-seeds.test.ts` |
| [RFC-0124](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0124-governance-rule-contract.md) | Governance rule contract (GC4-S8) | GC4-S8 | **LIVE** | `gc4-s8-governance.test.ts` |
| [RFC-0125](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0125-practice-inheritance-and-schism.md) | Practice inheritance and schism (GC9-S2) | GC9-S2 | **LIVE** | `gc9-s2-inheritance-schism.test.ts` |
| [RFC-0126](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0126-watch-entity-update-exposure.md) | WATCH `ENTITY_UPDATE` exposure closure | — | **LIVE** | `watch-entity-update-census.test.ts` |
## Re-running this

```bash
curl -s https://noema.guru/version                  # compare to hosted_live.worker_version_id
git log <that build>..main -- workers/noema/src workers/noema/test   # empty means code equals live
#   <that build> is the commit that was main at deployed_at — /version does not report it
cd workers/noema && npm ci && npm test              # 198 files
python validation/validate_all.py                   # in Noema-Specs: prints the slice → RFC pairs
```

If the first two disagree, stop and re-derive the boundary before reading any row below it.
