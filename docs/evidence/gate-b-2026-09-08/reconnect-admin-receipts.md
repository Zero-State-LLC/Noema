# Gate B addendum — Reconnect-cohort Admin report rows / ICR / binding digests

**Collected:** 2026-09-08T08:33:08Z UTC (**2026-09-08 01:33:08 PT**)  
**Issue:** [Zero-State-LLC/Noema#590](https://github.com/Zero-State-LLC/Noema/issues/590)  
**Candidate:** `lca2-gate-b-three-external-agent-population`  
**Server / Worker:** `https://noema.guru` / Worker `963b5edf-17ea-41f4-892f-130e278e0bb8`  
**Operator confirm:** Danny **yes** (Admin Approve path for reconnect codes)  
**Source:** Noema Admin report rows (OBSERVED; operator-exported)  
**Extends:** [INDEX.md](INDEX.md) + [admin-receipts.md](admin-receipts.md) (prior enroll cohort) + [concurrent-digests.md](concurrent-digests.md)

**This packet is evidence only. It does not claim Gate B COMPLETE.**  
Do **not** close #590. Do **not** flip Noema-Specs campaign state. No Deploy. No secrets.

---

## 1) Purpose

File **OBSERVED** Admin report rows for the **live reconnect cohort** device codes:

- `C5EE-9821` (LUDUS / controller-a)
- `B135-B266` (ADVERSARY / controller-b)
- `2D79-E3B6` (VECTOR / controller-c)

These rows **supersede** the earlier enroll-cohort device ids / Admin receipts in [admin-receipts.md](admin-receipts.md) for the **live reconnect** Controllers (remint after reconnect; expected). Prior enroll rows remain historical evidence for codes `C326-1B75` / `F25B-5D4F` / `1F36-6D59`.

Values below are copied exactly; nothing invented.

---

## 2) Live reconnect Controllers (three) — Admin rows OBSERVED

Worker era: `963b5edf…`. All three: `approver_amr=admin_session`, `enrollment_status=COMPLETE`.

### 2.1 C5EE-9821 LUDUS (controller-a)

| Field | Value |
|-------|-------|
| Device user code | `C5EE-9821` |
| Label | LUDUS |
| `controller_id` | `ctrl.device.32bdc772bf02` |
| `player_id` | `player.device32bdc772bf02` |
| `approver_amr` | `admin_session` |
| `approver_id` | `admin_session` |
| `enrollment_status` | `COMPLETE` |
| `independent_control_receipt` | `receipt.HMO6Dwqr5cMVJsD0dN5N6Vgn4zfCPtlRl17I-nuQgO8` |
| `controller_binding_digest` | `f7ad88a93030b751aeb71136aa631321d0971c1049692eed9beb6d47163f3c82` |
| `preview_status` | `redeemed` |

### 2.2 B135-B266 ADVERSARY (controller-b)

| Field | Value |
|-------|-------|
| Device user code | `B135-B266` |
| Label | ADVERSARY |
| `controller_id` | `ctrl.device.a75b4a98d334` |
| `player_id` | `player.devicea75b4a98d334` |
| `approver_amr` | `admin_session` |
| `enrollment_status` | `COMPLETE` |
| `independent_control_receipt` | `receipt.rWebNBItB7t0eErN1QyA4gzNO3Tgd9LxWDgS8VNtA9c` |
| `controller_binding_digest` | `875b2d02a17f7903efeedc90fda812c244842f09207b7e6d3199c541224a3482` |

(`approver_id` / `preview_status` not stated in the operator export for this row — not invented.)

### 2.3 2D79-E3B6 VECTOR (controller-c)

| Field | Value |
|-------|-------|
| Device user code | `2D79-E3B6` |
| Label | VECTOR |
| `controller_id` | `ctrl.device.d6fb4938b52a` |
| `player_id` | `player.deviced6fb4938b52a` |
| `approver_amr` | `admin_session` |
| `enrollment_status` | `COMPLETE` |
| `independent_control_receipt` | `receipt.py96fdiWE84Vg3WOpYpmWdemGSxk6vW76sNyVftnW_0` |
| `controller_binding_digest` | `9bbbed8a06b173df14b8068c9d9a2435972244f8fc66d2b5f613f603f8a311a1` |

(`approver_id` / `preview_status` not stated in the operator export for this row — not invented.)

### 2.4 Independence (OBSERVED)

| Check | Result |
|-------|--------|
| Distinct `independent_control_receipt` ×3 | **Yes** — three different `receipt.*` ids |
| Distinct `controller_binding_digest` ×3 | **Yes** — three different digests |
| Distinct `controller_id` / `player_id` / device codes ×3 | **Yes** (matches remint ids in [concurrent-digests.md](concurrent-digests.md)) |
| All `approver_amr` | `admin_session` |
| All `enrollment_status` | `COMPLETE` |
| Supersedes prior enroll Admin rows for live cohort | **Yes** — new codes + new device ids vs [admin-receipts.md](admin-receipts.md) |

**Independence of control receipts and binding digests (reconnect cohort):** **OBSERVED.**  
**Separate human principals (three distinct humans vs one Admin approving three agents):** still **NOT_COMPUTABLE** from Admin rows alone.

---

## 3) Authorizer ≠ Player (OBSERVED)

| Observation | Result |
|-------------|--------|
| Approver path | `approver_amr=admin_session` (Admin-session Approve; not Player) |
| Admin acting as Player | **Admin 401 on Player act** (OBSERVED) |
| Human / Admin principal as `player.device*` | **No** — authorizer remains Admin session; Player ids are device-bound Controllers |

**Authorizer ≠ Player:** **OBSERVED** (Admin-session approve + Admin 401 when attempting Player act).

---

## 4) Admin overview — recovery / ordering receipts

| Item | Status |
|------|--------|
| Admin overview recovery receipts | **NOT_COMPUTABLE** |
| Admin overview ordering receipts | **NOT_COMPUTABLE** |

Do not invent recovery/ordering receipt objects from Admin overview in this cut.

---

## 5) Summary table (reconnect cohort vs prior enroll)

| Cohort | Code | Label | `controller_id` | ICR (suffix) | Binding (prefix) |
|--------|------|-------|-----------------|--------------|------------------|
| **Live reconnect** | `C5EE-9821` | LUDUS | `ctrl.device.32bdc772bf02` | `…QgO8` | `f7ad88a9…` |
| **Live reconnect** | `B135-B266` | ADVERSARY | `ctrl.device.a75b4a98d334` | `…tA9c` | `875b2d02…` |
| **Live reconnect** | `2D79-E3B6` | VECTOR | `ctrl.device.d6fb4938b52a` | `…nW_0` | `9bbbed8a…` |
| Prior enroll (historical) | `C326-1B75` | LUDUS | `ctrl.device.65cba99c4116` | see [admin-receipts.md](admin-receipts.md) | … |
| Prior enroll (historical) | `F25B-5D4F` | ADVERSARY | `ctrl.device.c865ee7b39ce` | see [admin-receipts.md](admin-receipts.md) | … |
| Prior enroll (historical) | `1F36-6D59` | VECTOR | `ctrl.device.995df01ed35e` | see [admin-receipts.md](admin-receipts.md) | … |

Full reconnect ICR ids and binding digests are in §2 (not truncated there).

---

## 6) #590 checklist impact of this addendum

| Checklist item | After this addendum |
|----------------|---------------------|
| Live Admin report rows with `approver_amr` (reconnect codes) | **OBSERVED** — C5EE / B135 / 2D79 all `admin_session` + `COMPLETE` |
| `independent_control_receipt` ×3 (live reconnect Controllers) | **OBSERVED** — distinct receipt ids |
| `controller_binding_digest` ×3 (live reconnect Controllers) | **OBSERVED** — distinct digests |
| Human principal remains authorizer, never Player | **STRENGTHENED** — `admin_session` + Admin 401 on Player act |
| Enroll / reconnect ≥3 independently controlled Controllers | **STRENGTHENED** for live remint cohort; separate-human-principal still **NOT_COMPUTABLE** |
| Admin overview recovery / ordering receipts | Still **NOT_COMPUTABLE** |
| Specs campaign COMPLETE | **Still open — not flipped.** |

### Still-open shortlist (do not invent)

1. Specs campaign state update (blocked until remaining evidence is complete). **Not flipped.**
2. Admin overview recovery / ordering receipts — **NOT_COMPUTABLE**.
3. Separate-human-principal independence — **NOT_COMPUTABLE**.

Gaps **closed by this packet**:

- Admin report rows / `approver_amr` / ICR / binding digests for **reconnect** codes C5EE / B135 / 2D79 (superseding prior enroll device ids for the live cohort).
- Authorizer ≠ Player strengthened (Admin 401 on Player act).

## Explicit non-claims

- Gate B is **not** COMPLETE.
- Issue #590 stays **OPEN**.
- Prior enroll Admin rows are not deleted; they are superseded **for the live reconnect cohort** only.
- No Deploy. No Specs campaign flip. No tokens / `credential.json` / Authorization headers.
