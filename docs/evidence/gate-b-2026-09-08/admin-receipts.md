# Gate B addendum — Admin report rows / independent_control_receipt / binding digests

**Collected:** 2026-09-08T07:31:59Z UTC (**2026-09-08 00:31:59 PT**)  
**Issue:** [Zero-State-LLC/Noema#590](https://github.com/Zero-State-LLC/Noema/issues/590)  
**Candidate:** `lca2-gate-b-three-external-agent-population`  
**Server / Worker:** `https://noema.guru` / Worker `963b5edf-17ea-41f4-892f-130e278e0bb8`  
**Source:** Noema Admin report rows (OBSERVED; operator-exported)  
**Extends:** [INDEX.md](INDEX.md) + [pins-human.md](pins-human.md) (PR #653) + prior gate-b / c7 packets

**This packet is evidence only. It does not claim Gate B COMPLETE.**  
Do **not** close #590. Do **not** flip Noema-Specs campaign state. No Deploy. No secrets.

---

## 1) Purpose

Close the previously **NOT_COMPUTABLE** gap called out in [pins-human.md](pins-human.md) and [INDEX.md](INDEX.md):

- Live Admin report rows with `approver_amr` for Gate B + C7 device codes
- `independent_control_receipt` per Controller
- `controller_binding_digest` per Controller

These rows are **OBSERVED** from Noema Admin against Worker `963b5edf…`. Values below are copied exactly; nothing invented.

---

## 2) Gate B Controllers (three) — Admin rows OBSERVED

### 2.1 C326-1B75 LUDUS (controller-a)

| Field | Value |
|-------|-------|
| Device user code | `C326-1B75` |
| Label | LUDUS |
| `controller_id` | `ctrl.device.65cba99c4116` |
| `player_id` | `player.device65cba99c4116` |
| `approver_amr` | `admin_session` |
| `enrollment_status` | `COMPLETE` |
| `independent_control_receipt` | `receipt.LFf4mwYdJV1AiRMHMkXncG_3pEEnwV5WbIw-tuieBBI` |
| `controller_binding_digest` | `7659b2eae355633d18fe0f0cea4ab397f8eb3c10823057256980254db14049ae` |
| `preview_status` | `redeemed` |

### 2.2 F25B-5D4F ADVERSARY (controller-b)

| Field | Value |
|-------|-------|
| Device user code | `F25B-5D4F` |
| Label | ADVERSARY |
| `controller_id` | `ctrl.device.c865ee7b39ce` |
| `player_id` | `player.devicec865ee7b39ce` |
| `approver_amr` | `admin_session` |
| `enrollment_status` | `COMPLETE` |
| `independent_control_receipt` | `receipt.6f_BbK_cfBlIxasDO_q5jHVW2lukAFvR2rPIU52t2WE` |
| `controller_binding_digest` | `268a2e670efb7f1afebda4ea3b2a96d0dbebaa8f858bbc356317b17af96caf67` |
| `preview_status` | `redeemed` |

### 2.3 1F36-6D59 VECTOR (controller-c)

| Field | Value |
|-------|-------|
| Device user code | `1F36-6D59` |
| Label | VECTOR |
| `controller_id` | `ctrl.device.995df01ed35e` |
| `player_id` | `player.device995df01ed35e` |
| `approver_amr` | `admin_session` |
| `enrollment_status` | `COMPLETE` |
| `independent_control_receipt` | `receipt.lzE73Lb-bEJ1jNWHfER8sel_JZQ3Q2sxXVBOXSJ6tRc` |
| `controller_binding_digest` | `3d7f5f769a43cf994c3204edccab4fbf0db1e3c2f2af2ddd2e2d64647b797694` |
| `preview_status` | `redeemed` |

### 2.4 Independence (OBSERVED)

| Check | Result |
|-------|--------|
| Distinct `independent_control_receipt` ×3 | **Yes** — three different `receipt.*` ids |
| Distinct `controller_binding_digest` ×3 | **Yes** — three different digests |
| Distinct `controller_id` / `player_id` / device codes ×3 | **Yes** (matches prior orientation / pins-human) |
| All `approver_amr` | `admin_session` |
| All `enrollment_status` | `COMPLETE` |
| All `preview_status` | `redeemed` |

**Independence of control receipts and binding digests:** **OBSERVED.**  
**Separate human principals (three distinct humans vs one Admin approving three agents):** still **NOT_COMPUTABLE** from Admin rows alone — `approver_amr=admin_session` confirms Admin-session Approve path, not three distinct human identities.

---

## 3) C7 Boof (operator enroll — NOT one of the Gate B three)

Labeled separately. Not counted toward Gate B three-Controller acceptance.

| Field | Value |
|-------|-------|
| Device user code | `0817-7E9A` |
| Label | C7 Boof (operator) |
| `controller_id` | `ctrl.device.9a3eabf9b619` |
| `player_id` | `player.device9a3eabf9b619` |
| `approver_amr` | `admin_session` |
| `enrollment_status` | `COMPLETE` |
| `independent_control_receipt` | `receipt.elwlQ0tg6BUUOAXYkjLiSqvFXhQM9hJ7Wbd0nw8uM1c` |
| `controller_binding_digest` | `b647081d410be2ce2f27e81310c48a99857b7db4f63703bc826d8917747be0e2` |
| `preview_status` | `redeemed` |

C7 receipt id and binding digest are distinct from the Gate B trio (OBSERVED). See also [../c7-2026-09-08/](../c7-2026-09-08/).

---

## 4) Summary table (all four Admin rows)

| Code | Label | Role in Gate B | `approver_amr` | `enrollment_status` | Receipt (suffix) | Binding digest (prefix) | `preview_status` |
|------|-------|----------------|----------------|---------------------|------------------|-------------------------|------------------|
| `C326-1B75` | LUDUS | Gate B a | `admin_session` | `COMPLETE` | `…BBI` | `7659b2ea…` | `redeemed` |
| `F25B-5D4F` | ADVERSARY | Gate B b | `admin_session` | `COMPLETE` | `…2WE` | `268a2e67…` | `redeemed` |
| `1F36-6D59` | VECTOR | Gate B c | `admin_session` | `COMPLETE` | `…tRc` | `3d7f5f76…` | `redeemed` |
| `0817-7E9A` | C7 Boof | Operator only | `admin_session` | `COMPLETE` | `…M1c` | `b647081d…` | `redeemed` |

Full receipt ids and digests are in §§2–3 (not truncated there).

---

## 5) #590 checklist impact of this addendum

| Checklist item | After this addendum |
|----------------|---------------------|
| Live Admin report rows with `approver_amr` | **OBSERVED** — Gate B trio + C7 all `admin_session` |
| `independent_control_receipt` ×3 (Gate B) | **OBSERVED** — distinct receipt ids |
| `controller_binding_digest` ×3 (Gate B) | **OBSERVED** — distinct digests |
| Human principal remains authorizer, never Player | **STRENGTHENED** — Admin-session Approve rows + prior identity separation; human still never appears as `player.device*` |
| Enroll ≥3 independently controlled Controllers | **STRENGTHENED** — formal receipt + binding digests now filed; separate-human-principal still **NOT_COMPUTABLE** |
| Pins / Worker **source** git SHA | Unchanged — source SHA still **NOT_COMPUTABLE** if not yet found |
| Ordering / idempotency / recovery receipts | Still **NOT observed** via CLI / Admin export in this cut |
| Specs campaign COMPLETE | **Still open — not flipped.** |

### Still-open shortlist (do not invent)

1. Specs campaign state update (blocked until remaining evidence is complete). **Not flipped.**
2. Worker **source** git SHA for live UUID `963b5edf…` (if not yet found).
3. Explicit server ordering / idempotency / recovery receipts.

Gaps **closed by this packet** (INDEX should mark them **OBSERVED**):

- Admin report rows / `approver_amr` for Gate B + C7 codes
- `independent_control_receipt` / `controller_binding_digest` for Gate B trio (and C7 labeled separately)

## Explicit non-claims

- Gate B is **not** COMPLETE.
- Issue #590 stays **OPEN**.
- C7 Boof is **not** one of the Gate B three.
- No Deploy. No Specs campaign flip. No tokens / `credential.json` / Authorization headers.
