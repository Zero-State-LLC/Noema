# Gate E endurance evidence — 2026-09-09 / 2026-09-10

**Issue:** [Zero-State-LLC/Noema#682](https://github.com/Zero-State-LLC/Noema/issues/682)
**Candidate:** `lca5-gate-e-endurance`
**Cut:** `lca5-gate-e-candidate-prep` + Phase A/B OBSERVED receipts (this packet)
**Authority:** [Noema-Specs `docs/LIVING-ALPHA-ACCEPTANCE.md`](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/LIVING-ALPHA-ACCEPTANCE.md) — Gate E (Endurance)

**This packet is NOT COMPLETE. It does not claim Gate E COMPLETE, Phase A PASS, or Phase B PASS.**
Do not close #682. Do not flip Noema-Specs campaign state. No Deploy. No STUDY. No Gate F. No Controller reconnect. Path 8 is **FIRED_OK** ([phase-b-path8.md](phase-b-path8.md)); this packet does not re-fire it. No secrets.

Prior Gate D evidence (Specs COMPLETE [Noema-Specs#334](https://github.com/Zero-State-LLC/Noema-Specs/pull/334) → `23987586219dfd95fd7544da8e13a316a8bd9457`) lives in [`../gate-d-2026-09-08/`](../gate-d-2026-09-08/). This packet does not reopen Gate D and does not reuse Gate D WATCH-legibility PASS as Gate E endurance evidence.

Companion [`docs/LCA-GATE-E-SCENARIO.md`](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/LCA-GATE-E-SCENARIO.md) is on Specs `main` (`d252891`, recorded in [repin-2026-09-10.md](repin-2026-09-10.md)). Track that companion's checklist as **unchecked**. Do not invent companion bullets.

[#702](https://github.com/Zero-State-LLC/Noema/pull/702) re-pin to live Worker `7188ff8a…` is **already on `main`**. This packet adds Phase A/B OBSERVED receipts and the intervention / controllers notes. It does not re-do the re-pin. remint4 is filed ([phase-b-remint4.md](phase-b-remint4.md)). Path 8 is **FIRED_OK** ([phase-b-path8.md](phase-b-path8.md)). End score still pending. Packet remains **NOT COMPLETE**.

## Binding rules

- Recovery drill counts **inside** the 24h candidate. A serial rehearsal between 4h and 24h is extra practice only; it does not substitute unless the Specs companion later says otherwise.
- Reconnect **≥3** independently controlled Controllers **before** the 4h clock. Start/end/remint states are in the Phase files; they do not score PASS here.
- Players at Prep bind: **0**. Zero-Controller endurance without a `NOT_COMPUTABLE` label is WEAK / likely `NOT_COMPUTABLE`.
- Public `/v1/watch/live` `controllers` is **not** a trio census — [controllers-watch-live-note.md](controllers-watch-live-note.md).
- CONTROL_PLANE Deploys inside Phase B are logged in [intervention-log.md](intervention-log.md). Budget adjudication is **NOT_COMPUTABLE** from the repo alone. None is Path 8.

## Files

| File | Contents |
|------|----------|
| [candidate-declaration.md](candidate-declaration.md) | Immutable pin bind (Prep). Run fields blank / TBD / `NOT_COMPUTABLE`. Gate E checklist unchecked |
| [repin-2026-09-10.md](repin-2026-09-10.md) | Re-pin to live Worker `7188ff8a…` (#702 already on `main`); Worker lineage; fail-closed marks. NOT COMPLETE |
| [phase-a-start.md](phase-a-start.md) | Phase A start receipt. Status **RUNNING** (start only). `2026-09-09T07:38:30Z`–`11:38:30Z`. Worker `592c06a4…`. ADVERSARY `ENTER`→`SETTLEMENT_RESYNC`. NOT COMPLETE |
| [phase-a-end.md](phase-a-end.md) | Phase A end check `2026-09-09T11:44:32Z`. Heads `18318`/`43155`. Continuity **FAIL**. Overall **NOT_COMPUTABLE** as clean PASS / HOLD. NOT COMPLETE |
| [deploy-686-probe.md](deploy-686-probe.md) | Deploy #686 probe. Actions `34335936228` SUCCESS. Worker `3db8d757…`. 3/3 ENTER OK; acceptance MET; remint skipped. NOT Gate E COMPLETE |
| [phase-b-start.md](phase-b-start.md) | Phase B start `2026-09-09T16:37:48Z`. Worker `3db8d757…`. 3/3 ENTER+observe. Path 8 at start **SCHEDULED_NOT_FIRED**. NOT COMPLETE |
| [phase-b-remint-mid.md](phase-b-remint-mid.md) | Mid-run remint `2026-09-09T22:37:57Z` (`NOT_AUTHORIZED`). New trio OK @ `18815`. `ends_at` unchanged. NOT COMPLETE |
| [phase-b-remint4.md](phase-b-remint4.md) | remint4 `2026-09-10T04:05:40Z` after remint3 `NOT_AUTHORIZED` (~`2026-09-09T23:36:59Z`). New trio OK @ cycle `19352`. Continuity gap ~4.5h. `ends_at` unchanged. Path 8 then unfired. NOT COMPLETE |
| [phase-b-path8.md](phase-b-path8.md) | Path 8 recover drill `2026-09-10T04:51:42Z`. INCIDENT→recover `gate-e-path8-declared-restart`; `recover_mode=restore` rev `23242`. **FIRED_OK**. Still NOT COMPLETE. End score pending |
| [intervention-log.md](intervention-log.md) | CONTROL_PLANE rows inside Phase B (#688–#700 / pins #691–#701) plus Phase A calendar #684/#686. Operator remint + remint4 + Path 8 recover. Heads **NOT_COMPUTABLE**. Budget **NOT_COMPUTABLE** |
| [controllers-watch-live-note.md](controllers-watch-live-note.md) | `/v1/watch/live` `controllers` is RFC-0024 / GC6-S1 reconstruction default (`?? 1`) at `watch-live.ts:751`. Not a LUDUS/ADVERSARY/VECTOR census. Trio census **NOT_COMPUTABLE** from public surfaces |

## OBSERVED live pins (Prep bind; historical)

Bound from #682 and the live pin packet at Prep. Current live pins are in [repin-2026-09-10.md](repin-2026-09-10.md) (#702). Nothing invented.

| Pin | Value |
|-----|-------|
| `candidate_id` | `lca5-gate-e-endurance` |
| `worker_version_id` (Prep) | `592c06a4-fa8c-40f6-bec7-21cbc45689f9` |
| Unify source | `39d4856abd857b79aedd4304987ef6d7593d000a` ([#680](https://github.com/Zero-State-LLC/Noema/pull/680)) |
| Main tip / pin (Prep) | `0ff8aaadd294a5c13ff66eca402529ee5db263f1` ([#681](https://github.com/Zero-State-LLC/Noema/pull/681)) |
| `deployed_at` (Prep) | `2026-09-09T06:00:52.404542Z` |
| World | `world.perihelion-reach-3` |
| Genesis | `genesis.94d0961984b2b4f8` |
| Deploy run (Prep) | https://github.com/Zero-State-LLC/Noema/actions/runs/34317120696 |
| Gate D COMPLETE | Specs [#334](https://github.com/Zero-State-LLC/Noema-Specs/pull/334) → `23987586219dfd95fd7544da8e13a316a8bd9457` |
| Heads at Prep bind | cycle **17958** / sequence **42176** |
| Players at Prep bind | **0** |
| Tracking | [#682](https://github.com/Zero-State-LLC/Noema/issues/682) |
| Current live (re-pin) | Worker `7188ff8a-3d58-449e-9e6b-2e0282ed9724` — [repin-2026-09-10.md](repin-2026-09-10.md) / [#702](https://github.com/Zero-State-LLC/Noema/pull/702) **MERGED** |

## Phase checklist (unchecked — receipts ≠ PASS)

PROMETHEUS SEALED. Filing OBSERVED receipts does **not** check these boxes.

- [ ] **Prep (no clock).** Stubs + human-yes + trio reconnect (≥3 Controllers) + pin bind + intervention budget declared.
- [ ] **4h candidate.** PASS required before 24h opens. Phase A overall is **NOT_COMPUTABLE** as a clean PASS / HOLD ([phase-a-end.md](phase-a-end.md)).
- [ ] **24h candidate (recovery drill inside the window).** ≥24h continuous; **≥1 planned restart/recovery drill inside the 24h**; honest stale/lag/incident marks; bounded logged interventions. Path 8 **FIRED_OK** ([phase-b-path8.md](phase-b-path8.md)). End score still pending. Receipt ≠ PASS.
- [ ] **Evidence pack.** Heads range, recovery receipts, WATCH digests, intervention log, PASS/FAIL/`NOT_COMPUTABLE`. **NOT COMPLETE** until scored.

## Still-open shortlist (do not invent)

1. Specs companion `LCA-GATE-E-SCENARIO.md` is on Specs `main`. Copy its checklist here as unchecked; do not invent bullets. Campaign stays Gate E **unproven**.
2. Trio census from public WATCH is **NOT_COMPUTABLE** ([controllers-watch-live-note.md](controllers-watch-live-note.md)). Admin / Controller-log census through Phase B `ends_at` is not in this packet.
3. Phase A start/end are filed. Continuity through `ends_at` **FAIL**. Overall **NOT_COMPUTABLE** as clean PASS / HOLD. Do not treat Phase B start as Phase A PASS.
4. Phase B start + mid-remint + remint4 + Path 8 recover are filed ([phase-b-path8.md](phase-b-path8.md)). remint4 notes a ~4.5h continuity gap after remint3 `NOT_AUTHORIZED` (expiry `2026-09-09T23:36:59Z` → reconnect `2026-09-10T04:05:40Z`). Path 8 is **FIRED_OK** (INCIDENT→recover `gate-e-path8-declared-restart`; `recover_mode=restore` rev 23242). Continuity gap is **not** Path 8. End score still pending. Dedicated recover schema stays **NOT_COMPUTABLE** (existing Admin form only).
5. [intervention-log.md](intervention-log.md) lists CONTROL_PLANE Deploys. Per-Deploy heads and budget adjudication are **NOT_COMPUTABLE**. None of those Deploys is Path 8. Path 8 is the operator recover row.
6. Specs `current-state.v1.yaml` live Worker pin may still be stale vs `7188ff8a…` (see #702 re-pin). Score packet must cite score-time `/version`.
7. Issue #682 stays **OPEN**. This packet does not flip Specs.

## Explicit non-claims

- Gate E is **not** COMPLETE. Phase A is **not** PASS. Phase B is **not** PASS.
- Issue #682 stays **OPEN**.
- No hosted STUDY. No Gate F GO / Deploy-as-success.
- No Worker runtime code changes. No Deploy from this packet. No Genesis mutation. No new Player verbs.
- No Controller reconnect or remint from this packet. Path 8 recover is filed as OBSERVED ([phase-b-path8.md](phase-b-path8.md)); this packet does not re-fire it or claim Phase B PASS.
- No Specs campaign flip from this packet.
- No amounts, enrollments, recoveries, or endurance verdicts invented or upgraded.
