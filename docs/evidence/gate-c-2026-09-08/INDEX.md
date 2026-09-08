# Gate C candidate-prep stub — 2026-09-08

**Issue:** [Zero-State-LLC/Noema#661](https://github.com/Zero-State-LLC/Noema/issues/661)  
**Candidate:** `lca3-gate-c-existing-system-civilization`  
**Cut:** `lca3-gate-c-candidate-prep`  
**Collected:** 2026-09-08 (declaration stub; no coupled-path run)  
**Authority:** [Noema-Specs `docs/LCA-GATE-C-SCENARIO.md`](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/LCA-GATE-C-SCENARIO.md)

**This packet is candidate declaration + pin bind + civilization-run evidence (paths 1–7) + Path 8 recover receipt. It does not claim Gate C Specs COMPLETE.**  
Do not close #661. Do not flip Noema-Specs campaign state (separate human-yes). No Deploy. No STUDY. No endurance. No secrets.

Prior Gate B evidence (CLOSED [#590](https://github.com/Zero-State-LLC/Noema/issues/590); Specs COMPLETE [Noema-Specs#329](https://github.com/Zero-State-LLC/Noema-Specs/pull/329)) lives in [`../gate-b-2026-09-08/`](../gate-b-2026-09-08/). This stub does not reopen Gate B and does not reuse the Gate B recovery-receipt waiver as Gate C evidence.

**Addenda:**
- [civilization-run.md](civilization-run.md) collected 2026-09-08 (PT) — Gate C paths 1–7 OBSERVED evidence pack on Worker `2c48d671…` with remint cohort LUDUS/ADVERSARY/VECTOR; strategy plurality ≥3 dims; Path 8 then **NOT_COMPUTABLE** (superseded for Path 8 by path8-recover-receipt); **no Gate C COMPLETE**; #661 stays OPEN
- [strategy-declarations.md](strategy-declarations.md) — pre-run public Strategy A/B declarations + operator-intervention list + canonical start heads
- [remint-admin-receipts.md](remint-admin-receipts.md) collected 2026-09-08T21:09:49Z UTC (14:09:49 PT) — live Gate C remint-cohort Admin rows (ED58/D9D6/CB1F) with `approver_amr=admin_session`, distinct ICR ×3 + binding digests ×3 **OBSERVED** on Worker `2c48d671…`; local Gate B creds ABSENT → remint (expected); supersedes planned Gate B reconnect device ids for this remint cohort only; Danny yes. Civilization-run paths 1–7 in civilization-run.md.
- [path8-recover-receipt.md](path8-recover-receipt.md) collected 2026-09-08 (PT) — OBSERVED declared INCIDENT→recover on Worker `2c48d671…` / `world.perihelion-reach-3`; Danny human-yes accepts **EXISTING** Admin recover JSON as Path 8 restart/recovery receipt (**no new schema**); Path 8 **PASS**; Gate C Specs COMPLETE still requires separate Specs campaign flip (separate human-yes); #661 stays OPEN; No Deploy

## Files

| File | Contents |
|------|----------|
| [candidate-declaration.md](candidate-declaration.md) | Immutable pin bind, planned LUDUS / ADVERSARY / VECTOR reuse (superseded for live remint cohort — see remint-admin-receipts), operator-intervention placeholder, recovery **NOT_COMPUTABLE**, coupled-path + strategy-plurality tracking |
| [civilization-run.md](civilization-run.md) | Paths 1–7 OBSERVED civilization evidence pack + scorecard; Path 8 NOT_COMPUTABLE; no COMPLETE |
| [strategy-declarations.md](strategy-declarations.md) | Pre-run Strategy A/B declarations, operator-intervention list, canonical start heads |
| [remint-admin-receipts.md](remint-admin-receipts.md) | Addendum: Gate C remint-cohort Admin rows (ED58/D9D6/CB1F) on Worker `2c48d671…` — `approver_amr=admin_session`, distinct ICR ×3 + binding digests ×3 **OBSERVED**; supersedes planned Gate B reconnect device ids for this remint cohort only; Danny yes; see also civilization-run.md |
| [path8-recover-receipt.md](path8-recover-receipt.md) | Addendum: Path 8 declared INCIDENT→recover — EXISTING Admin recover JSON OBSERVED + Danny-accepted as restart/recovery receipt (no new schema); Path 8 **PASS**; Gate C Specs COMPLETE **not** claimed; #661 stays OPEN |

## OBSERVED live pins (bound)

| Pin | Value |
|-----|-------|
| `worker_version_id` | `2c48d671-620a-43df-bb56-87438671e734` |
| Source | `4aedef79259262df411d28cf49d139788939a125` |
| `deployed_at` | `2026-09-08T09:03:17.074Z` |
| World | `world.perihelion-reach-3` |
| Deploy run | https://github.com/Zero-State-LLC/Noema/actions/runs/34207763040 |
| Pin PR | [#660](https://github.com/Zero-State-LLC/Noema/pull/660) (`f23c18c6`) |

## Controllers

### Live remint cohort (OBSERVED on Worker `2c48d671…`)

Local Gate B reconnect creds were **ABSENT** → remint via `noema` 0.1.22 `connect --no-enter` + Danny-yes Admin Approve. Full Admin ICR/bindings: [remint-admin-receipts.md](remint-admin-receipts.md).

| Slot | Label | Device code | `controller_id` | `player_id` |
|------|-------|-------------|-----------------|-------------|
| controller-a | LUDUS | `ED58-A179` | `ctrl.device.f2d32e6656db` | `player.devicef2d32e6656db` |
| controller-b | ADVERSARY | `D9D6-9463` | `ctrl.device.567685259784` | `player.device567685259784` |
| controller-c | VECTOR | `CB1F-E6BA` | `ctrl.device.23d75b3e1b86` | `player.device23d75b3e1b86` |

### Prior planned reuse (Gate B reconnect; historical only)

Originally listed as planned Gate C reuse in [candidate-declaration.md](candidate-declaration.md). **Superseded for this remint cohort** by the live table above. Last OBSERVED on Worker `963b5edf…`.

| Slot | Label | Device code | `controller_id` |
|------|-------|-------------|-----------------|
| controller-a | LUDUS | `C5EE-9821` | `ctrl.device.32bdc772bf02` |
| controller-b | ADVERSARY | `B135-B266` | `ctrl.device.a75b4a98d334` |
| controller-c | VECTOR | `2D79-E3B6` | `ctrl.device.d6fb4938b52a` |

## Still-open shortlist (do not invent)

1. Paths **1–7** OBSERVED in [civilization-run.md](civilization-run.md); Path **8** OBSERVED + Danny-accepted in [path8-recover-receipt.md](path8-recover-receipt.md) — **still not** a Gate C Specs COMPLETE claim (Specs campaign flip is separate human-yes).
2. Strategy plurality OBSERVED (≥3 dimension divergences) in civilization-run + [strategy-declarations.md](strategy-declarations.md).
3. Path 8 restart/recovery receipt: **PASS** under Danny human-yes accepting **EXISTING** Admin lifecycle recover JSON (no new schema). Gate B waiver is **not** the Path 8 basis.
4. Canonical start/end heads and pre-run strategy declarations are recorded; WATCH digest optional supporting context only.
5. Specs campaign stays Gate C **unproven** until a separate Specs campaign flip (separate human-yes). This packet does **not** flip it.
6. Separate-human-principal independence still **NOT_COMPUTABLE**.

### Closed by [remint-admin-receipts.md](remint-admin-receipts.md) (now **OBSERVED**)

- Live Gate C remint Admin report rows with `approver_amr=admin_session` for ED58/D9D6/CB1F (Danny yes).
- Distinct `independent_control_receipt` / `controller_binding_digest` ×3 for remint controller ids on Worker `2c48d671…` (supersedes planned Gate B reconnect device ids for this remint cohort only).

## Explicit non-claims

- Gate C Specs campaign is **not** COMPLETE (requires separate Specs flip / separate human-yes).
- Issue #661 stays **OPEN**.
- Path 8 is **PASS** under Danny-accepted existing recover JSON only — that is **not** a Specs COMPLETE claim.
- Civilization Player run evidence collected for paths 1–7; Path 8 recover receipt filed — **still no Gate C Specs COMPLETE**.
- Planned Gate B reconnect device-id reuse is superseded **for this remint cohort only**.
- No hosted STUDY. No Gate E endurance (4h / 24h).
- No Deploy from this packet. No Genesis mutation. No new Player verbs.
- No new recovery schema invented. No secrets beyond `operator_session` id already in Admin report.
