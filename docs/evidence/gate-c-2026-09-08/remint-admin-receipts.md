# Gate C addendum — Remint-cohort Admin report rows / ICR / binding digests

**Collected:** 2026-09-08T21:09:49Z UTC (**2026-09-08 14:09:49 PT**)  
**Issue:** [Zero-State-LLC/Noema#661](https://github.com/Zero-State-LLC/Noema/issues/661)  
**Candidate:** `lca3-gate-c-existing-system-civilization`  
**Server / Worker:** `https://noema.guru` / Worker `2c48d671-620a-43df-bb56-87438671e734`  
**Operator confirm:** Danny **yes** (Admin Approve path for remint / reconnect codes)  
**Client:** `noema` **0.1.22** `connect --no-enter`  
**Config dirs:** `/workspace/gate-c-cohort/controller-{a,b,c}`  
**Source:** Noema Admin report rows (OBSERVED; operator-exported) + CLI enroll  
**Extends:** [INDEX.md](INDEX.md) + [candidate-declaration.md](candidate-declaration.md) (planned Gate B reconnect reuse) + prior Gate B [`../gate-b-2026-09-08/reconnect-admin-receipts.md`](../gate-b-2026-09-08/reconnect-admin-receipts.md)

**This packet is evidence only. It does not claim Gate C COMPLETE.**  
Do **not** close #661. Do **not** flip Noema-Specs campaign state. No Deploy. No secrets.

---

## 1) Purpose

File **OBSERVED** Admin report rows for the **Gate C remint cohort** device codes on Worker `2c48d671…`:

- `ED58-A179` (LUDUS / controller-a)
- `D9D6-9463` (ADVERSARY / controller-b)
- `CB1F-E6BA` (VECTOR / controller-c)

**Why remint:** Local Gate B reconnect-cohort credentials under the Gate C config dirs were **ABSENT**. Fresh `connect --no-enter` + Admin Approve produced new device codes / `controller_id`s / ICR / bindings (expected).

These rows **supersede** the **planned reuse** of Gate B reconnect device ids listed in [candidate-declaration.md](candidate-declaration.md) §3 / [INDEX.md](INDEX.md) **for this remint cohort only**. Gate B reconnect rows (`C5EE-9821` / `B135-B266` / `2D79-E3B6` on Worker `963b5edf…`) remain historical Gate B evidence; they are not the live Gate C Controller ids after this remint.

Values below are copied exactly; nothing invented.

---

## 2) Gate C remint Controllers (three) — Admin rows OBSERVED

Worker era: `2c48d671…`. All three: `approver_amr=admin_session`, `enrollment_status=COMPLETE`.

### 2.1 ED58-A179 LUDUS (controller-a)

| Field | Value |
|-------|-------|
| Device user code | `ED58-A179` |
| Label | LUDUS |
| `controller_id` | `ctrl.device.f2d32e6656db` |
| `player_id` | `player.devicef2d32e6656db` |
| `approver_amr` | `admin_session` |
| `enrollment_status` | `COMPLETE` |
| `independent_control_receipt` | `receipt.Rx-30VaHnHuPqTW0yo6N2OJIV1QDjkuDSdgu44lAAvM` |
| `controller_binding_digest` | `9dc9743bd087d5f2b6cd91967c60f6152e09199ed75bf10636976fffb71a4167` |

### 2.2 D9D6-9463 ADVERSARY (controller-b)

| Field | Value |
|-------|-------|
| Device user code | `D9D6-9463` |
| Label | ADVERSARY |
| `controller_id` | `ctrl.device.567685259784` |
| `player_id` | `player.device567685259784` |
| `approver_amr` | `admin_session` |
| `enrollment_status` | `COMPLETE` |
| `independent_control_receipt` | `receipt.adAO8mW_agOY81Vx39QObKFU-gnE-IMBL0Nde5LxDN0` |
| `controller_binding_digest` | `56d65ffa18dcc7da9a1028dbdfada336dcc6de87da7d990798613f6a47c04a45` |

### 2.3 CB1F-E6BA VECTOR (controller-c)

| Field | Value |
|-------|-------|
| Device user code | `CB1F-E6BA` |
| Label | VECTOR |
| `controller_id` | `ctrl.device.23d75b3e1b86` |
| `player_id` | `player.device23d75b3e1b86` |
| `approver_amr` | `admin_session` |
| `enrollment_status` | `COMPLETE` |
| `independent_control_receipt` | `receipt.vprLkV9-rTLv71anlPSLhkr0sy_KovgeIMAreYnNKxU` |
| `controller_binding_digest` | `6790ef111be10be63975b7cb41f57f320d0c09b769b43e7af46044af238148de` |

### 2.4 Independence (OBSERVED)

| Check | Result |
|-------|--------|
| Distinct `independent_control_receipt` ×3 | **Yes** — three different `receipt.*` ids |
| Distinct `controller_binding_digest` ×3 | **Yes** — three different digests |
| Distinct `controller_id` / `player_id` / device codes ×3 | **Yes** |
| All `approver_amr` | `admin_session` |
| All `enrollment_status` | `COMPLETE` |
| Supersedes planned Gate B reconnect reuse for this remint cohort | **Yes** — new codes + new device ids vs C5EE/B135/2D79 |

**Independence of control receipts and binding digests (Gate C remint cohort):** **OBSERVED.**  
**Separate human principals (three distinct humans vs one Admin approving three agents):** still **NOT_COMPUTABLE** from Admin rows alone.  
**Civilization / coupled-path Player run:** **not started** in this packet.

---

## 3) Authorizer ≠ Player (OBSERVED path)

| Observation | Result |
|-------------|--------|
| Approver path | `approver_amr=admin_session` (Admin-session Approve; not Player) |
| Human / Admin principal as `player.device*` | **No** — authorizer remains Admin session; Player ids are device-bound Controllers |
| Client connect mode | `noema` 0.1.22 `connect --no-enter` (no Player ENTER / civilization acts in this cut) |

**Authorizer ≠ Player (approve path):** **OBSERVED** via `admin_session` enrollment. No civilization Player run claimed here.

---

## 4) Summary table (remint vs prior planned Gate B reconnect reuse)

| Cohort | Code | Label | `controller_id` | ICR | Binding |
|--------|------|-------|-----------------|-----|---------|
| **Live Gate C remint** | `ED58-A179` | LUDUS | `ctrl.device.f2d32e6656db` | `receipt.Rx-30VaHnHuPqTW0yo6N2OJIV1QDjkuDSdgu44lAAvM` | `9dc9743bd087d5f2b6cd91967c60f6152e09199ed75bf10636976fffb71a4167` |
| **Live Gate C remint** | `D9D6-9463` | ADVERSARY | `ctrl.device.567685259784` | `receipt.adAO8mW_agOY81Vx39QObKFU-gnE-IMBL0Nde5LxDN0` | `56d65ffa18dcc7da9a1028dbdfada336dcc6de87da7d990798613f6a47c04a45` |
| **Live Gate C remint** | `CB1F-E6BA` | VECTOR | `ctrl.device.23d75b3e1b86` | `receipt.vprLkV9-rTLv71anlPSLhkr0sy_KovgeIMAreYnNKxU` | `6790ef111be10be63975b7cb41f57f320d0c09b769b43e7af46044af238148de` |
| Prior planned reuse (Gate B reconnect; historical) | `C5EE-9821` | LUDUS | `ctrl.device.32bdc772bf02` | see Gate B reconnect-admin-receipts | … |
| Prior planned reuse (Gate B reconnect; historical) | `B135-B266` | ADVERSARY | `ctrl.device.a75b4a98d334` | see Gate B reconnect-admin-receipts | … |
| Prior planned reuse (Gate B reconnect; historical) | `2D79-E3B6` | VECTOR | `ctrl.device.d6fb4938b52a` | see Gate B reconnect-admin-receipts | … |

---

## 5) #661 checklist impact of this addendum

| Checklist item | After this addendum |
|----------------|---------------------|
| Live Admin report rows with `approver_amr` (Gate C remint codes) | **OBSERVED** — ED58 / D9D6 / CB1F all `admin_session` + `COMPLETE` on Worker `2c48d671…` |
| `independent_control_receipt` ×3 (remint Controllers) | **OBSERVED** — distinct receipt ids |
| `controller_binding_digest` ×3 (remint Controllers) | **OBSERVED** — distinct digests |
| Human principal remains authorizer, never Player (approve path) | **STRENGTHENED** — `admin_session`; no `--enter` / no Player civilization acts in this cut |
| Enroll / remint ≥3 independently controlled Controllers on Gate C Worker | **STRENGTHENED** for remint cohort; separate-human-principal still **NOT_COMPUTABLE** |
| Eight coupled paths / strategy plurality | **Still unchecked** — no civilization Player run yet |
| Path 8 (state/consequences survive restart) / recovery receipt | Still **NOT_COMPUTABLE** |
| Specs campaign COMPLETE | **Still open — not flipped.** |

### Still-open shortlist (do not invent)

1. Specs campaign state update (blocked until remaining Gate C evidence is complete). **Not flipped.**
2. Path 8 / dedicated recovery-receipt object — **NOT_COMPUTABLE**. Gate B waiver does **not** satisfy Gate C.
3. Coupled-path civilization Player run + strategy plurality — **not started**.
4. Separate-human-principal independence — **NOT_COMPUTABLE**.

Gaps **closed by this packet**:

- Admin report rows / `approver_amr` / ICR / binding digests for **Gate C remint** codes ED58 / D9D6 / CB1F on Worker `2c48d671…` (superseding planned Gate B reconnect device ids for this remint cohort only).
- Danny-yes Admin Approve path recorded for the remint.

## Explicit non-claims

- Gate C is **not** COMPLETE.
- Issue #661 stays **OPEN**.
- Path 8 remains **NOT_COMPUTABLE**.
- No civilization Player run yet (connect `--no-enter` only).
- Planned reuse of Gate B reconnect device ids is superseded **for this remint cohort only**; Gate B historical receipts are not deleted.
- No Deploy. No Specs campaign flip. No STUDY. No endurance. No tokens / `credential.json` / Authorization headers.
