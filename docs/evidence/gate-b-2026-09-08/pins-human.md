# Gate B addendum — pin packet + human≠Player + independence receipts

**Collected:** 2026-09-08T07:13:19Z UTC (**2026-09-08 00:13:19 PT**)  
**Issue:** [Zero-State-LLC/Noema#590](https://github.com/Zero-State-LLC/Noema/issues/590)  
**Candidate:** `lca2-gate-b-three-external-agent-population`  
**Server:** `https://noema.guru`  
**Client BIN:** `/workspace/c7-noema-022/bin/noema` → **0.1.22**  
**Extends:** this folder (PR #650) + [../c7-2026-09-08/](../c7-2026-09-08/) (PR #652)

**This packet is evidence only. It does not claim Gate B COMPLETE.**  
Do **not** close #590. Do **not** flip Noema-Specs campaign state. No Deploy. No secrets.

---

## 1) Full pin packet (OBSERVED now)

### 1.1 `GET https://noema.guru/version`

Fetched **2026-09-08T07:13:19Z UTC** (2026-09-08 00:13:19 PT).

```json
{
  "product": "noema",
  "stage": "0",
  "env": "production",
  "protocol_version": "1",
  "world_id": "world.perihelion-reach-3",
  "worker_version_id": "963b5edf-17ea-41f4-892f-130e278e0bb8",
  "deployed_at": "2026-09-08T05:52:14.712143Z"
}
```

| Field | Value |
|-------|-------|
| Worker pin | `963b5edf-17ea-41f4-892f-130e278e0bb8` (**re-verified**; unchanged vs orientation / contention / C7 packets) |
| World | `world.perihelion-reach-3` |
| Deployed at | `2026-09-08T05:52:14.712143Z` UTC |
| Env / stage / protocol | production / 0 / 1 |

### 1.2 `GET https://noema.guru/ready`

```json
{
  "ready": true,
  "play_blocked": false,
  "code": null,
  "status": "ACTIVE",
  "settlement_health": "HEALTHY",
  "world": {
    "ok": true,
    "world_id": "world.perihelion-reach-3",
    "world_name": "Perihelion Reach",
    "cycle": 17256,
    "sequence": 40561,
    "players": 0,
    "status": "ACTIVE",
    "settlement_health": "HEALTHY",
    "genesis_id": "genesis.94d0961984b2b4f8",
    "playable": true
  }
}
```

Notes (OBSERVED, not invented away): `/ready.world.players` reported **0** while prior `/v1/watch/live.players_present` reported **3** (field semantics differ; both recorded in prior contention evidence).

### 1.3 `GET https://noema.guru/health`

```json
{
  "status": "ok",
  "service": "noema-gateway",
  "stage": "0",
  "env": "production",
  "protocol_version": "1",
  "world_id": "world.perihelion-reach-3"
}
```

### 1.4 noema-client version

```text
$ /workspace/c7-noema-022/bin/noema --version
0.1.22
```

### 1.5 Canonical git heads (OBSERVED via `git ls-remote` + `gh api`)

Recorded at the same collection window as §1.1–1.4.

| Repo | Ref | Tip SHA (full) | Tip message (gh api) | Tip date (UTC) |
|------|-----|----------------|----------------------|----------------|
| Zero-State-LLC/Noema | `refs/heads/main` | `8f28a96c04eb3b0ec09c344020254b597d8c1450` | `docs: C7 Boof enroll act/refuse/resync evidence (#652)` | 2026-09-08T07:11:36Z |
| Zero-State-LLC/Noema-Specs | `refs/heads/main` | `924a1a1d338c9df4361615167be7471a2d9a9896` | `docs: reconcile current-state live Worker pin to 04ef6ecb (post-deploy) (#328)` | 2026-09-07T23:07:29Z |

**Method:** `git ls-remote https://github.com/Zero-State-LLC/{Noema,Noema-Specs}.git refs/heads/main` and `gh api repos/Zero-State-LLC/{Noema,Noema-Specs}/commits/main`.

**NOT_COMPUTABLE here:** mapping from live Worker UUID `963b5edf-17ea-41f4-892f-130e278e0bb8` to a specific Worker **source git commit** (no `source_commit` field on `/version`; no sealed Worker→SHA table in this addendum). Specs tip message still references prior Worker pin `04ef6ecb…` — live door pin is `963b5edf…` (OBSERVED mismatch vs Specs tip narrative; Specs campaign not flipped).

### 1.6 Pin summary table

| Pin | Value | Status |
|-----|-------|--------|
| Worker `worker_version_id` | `963b5edf-17ea-41f4-892f-130e278e0bb8` | **OBSERVED** (re-verified) |
| World | `world.perihelion-reach-3` / Perihelion Reach | **OBSERVED** |
| Genesis (from `/ready`) | `genesis.94d0961984b2b4f8` | **OBSERVED** |
| Client | `noema` **0.1.22** | **OBSERVED** |
| Noema `main` tip | `8f28a96c04eb3b0ec09c344020254b597d8c1450` | **OBSERVED** |
| Noema-Specs `main` tip | `924a1a1d338c9df4361615167be7471a2d9a9896` | **OBSERVED** |
| Cycle / sequence at pin fetch | 17256 / 40561 | **OBSERVED** (probe-time) |
| Sealed pin bundle artifact | — | **NOT_COMPUTABLE** (not produced in this cut) |
| Worker source git SHA for live UUID | — | **NOT_COMPUTABLE** (not on `/version`) |

---

## 2) Human principal ≠ Player (formal proof from OBSERVED enrollment semantics)

### 2.1 What is OBSERVED

| Claim | Evidence source | Label |
|-------|-----------------|-------|
| Enrollment requires an explicit human Approve click (opening the URL alone does not approve) | Connect logs: `authorization_pending: waiting for human approval` → later `Approved.` / `Connected.`; issue #590 body + O2 evidence | **OBSERVED** |
| Gate B Controllers are **agent** Controllers | Connect logs print `Controller: agent`; orientation `status.controller_type` = `agent` | **OBSERVED** |
| Agent Players use `player.device*` ids | Orientation / reconnect / contention observe: `player.device65cba99c4116`, `player.devicec865ee7b39ce`, `player.device995df01ed35e` | **OBSERVED** |
| C7 Boof is likewise an agent Controller / Player | C7 packet: `ctrl.device.9a3eabf9b619` / `player.device9a3eabf9b619` (code `0817-7E9A`) | **OBSERVED** |
| Humans authorize; Controllers play | Connect path is human Approve of an **agent** device code; observe identity is `player.device*`, not a human display name / Admin role id | **OBSERVED** (identity separation) |
| Admin-session Approve **path** stores `approver_id` / `approver_amr` = `admin_session` when an Admin Bearer approves | [O2-ADMIN-SESSION-DEVICE-APPROVE-2026-09-08.md](../O2-ADMIN-SESSION-DEVICE-APPROVE-2026-09-08.md) + Worker `ADMIN_SESSION_APPROVER` / tests | **OBSERVED** (path semantics / local Worker evidence) |
| Admin authorizer exists as a non-Player role | C6 Admin email acceptance: consume returned `role` `ADMIN` (token redacted); overview 200 | **OBSERVED** (Admin ≠ Player role on that surface) |

### 2.2 Connect-log citations (Gate B trio; public codes only)

From `/tmp/c7-cohort/` (also summarized in orientation evidence):

| Slot | Label | User code | Log | Outcome lines |
|------|-------|-----------|-----|---------------|
| controller-a | LUDUS | `C326-1B75` | `controller-a-connect.log` | `Approve this agent:` → `authorization_pending…` ×N → **`Approved.`** → `Connected.` / `Controller: agent` |
| controller-b | ADVERSARY | `F25B-5D4F` | `b2.log` | same shape → **`Approved.`** → `Connected.` / `Controller: agent` |
| controller-c | VECTOR | `1F36-6D59` | `c2.log` | same shape → **`Approved.`** → `Connected.` / `Controller: agent` |

C7 Boof enrollment used public code `0817-7E9A` (filed in `docs/evidence/c7-2026-09-08/`); post-enroll observe shows agent Player `player.device9a3eabf9b619`.

**Connect logs do not print `approver_amr`.** They only show the human-approval wait and `Approved.`

### 2.3 Roles (OBSERVED vs NOT_COMPUTABLE)

| Actor | Role in this cut | Player? | Basis |
|-------|------------------|---------|-------|
| LUDUS | Controller / Agent Player | **Yes** (`player.device65cba99c4116`) | OBSERVED observe/status |
| ADVERSARY | Controller / Agent Player | **Yes** (`player.devicec865ee7b39ce`) | OBSERVED |
| VECTOR | Controller / Agent Player | **Yes** (`player.device995df01ed35e`) | OBSERVED |
| Boof (C7) | Controller / Agent Player | **Yes** (`player.device9a3eabf9b619`) | OBSERVED (C7 packet) |
| Danny / Admin | Authorizer / operator (Approve path) | **No Player id observed for Admin** | OBSERVED: Admin role on C6; authorizer on `/connect` per O2. Human never appears as `player.device*` in these Controller observes. |

### 2.4 `approver_amr=admin_session` for Gate B trio + C7 — honesty row

| Statement | Label |
|-----------|-------|
| When Approve is performed with an Admin session Bearer, Worker persists `approver_amr=admin_session` (and `approver_id=admin_session`) | **OBSERVED** (O2 evidence + Worker code/tests) |
| Live Admin report / device-record export showing `approver_amr=admin_session` for codes `C326-1B75`, `F25B-5D4F`, `1F36-6D59`, `0817-7E9A` | **NOT_COMPUTABLE** in this corpus — no Admin overview/device report dump with those fields was captured alongside the connect logs |
| Completed local LCA2 receipts `approvals/controller-{a,b,c}.json` with `approval_receipt` / `independent_control_receipt` / binding digests | **NOT_COMPUTABLE** — only `*.request.json` stubs present under `lca2-live/approvals/`; completed receipts not written |

**Formal human≠Player proof available from OBSERVED identity separation:** authorizers act on `/connect` / Admin surfaces; Controllers redeem as `controller_type=agent` and enter as `player.device*`. That separation is **OBSERVED**. Per-code Admin-report AMR rows remain **NOT_COMPUTABLE** until an Admin report export is filed.

---

## 3) Independence receipts summary — three Gate B Controllers

Sources: `/workspace/noema-gateb-orientation-2026-09-08.md`, `reconnect`, `contention-watch`, and filed `docs/evidence/gate-b-2026-09-08/*` (PR #650). C7 Boof is a **separate** operator Controller (PR #652), not one of the Gate B trio.

### 3.1 Distinct identity table (OBSERVED)

| Slot | Label | Device user code | `controller_id` | observe `player_id` | Distinct from others? |
|------|-------|------------------|-----------------|---------------------|------------------------|
| a | LUDUS | `C326-1B75` | `ctrl.device.65cba99c4116` | `player.device65cba99c4116` | **Yes** |
| b | ADVERSARY | `F25B-5D4F` | `ctrl.device.c865ee7b39ce` | `player.devicec865ee7b39ce` | **Yes** |
| c | VECTOR | `1F36-6D59` | `ctrl.device.995df01ed35e` | `player.device995df01ed35e` | **Yes** |

All three: separate config dirs under `lca2-live/participants/controller-{a,b,c}/credentials`; separate connect logs; Approved → Connected independently; orientation PASS; reconnect PASS (no `--force` re-enroll).

### 3.2 Independence receipt fields checklist

| Receipt field (LCA2 human-approval schema) | Status |
|--------------------------------------------|--------|
| Distinct `controller_id` ×3 | **OBSERVED** |
| Distinct `player_id` ×3 | **OBSERVED** |
| Distinct device user codes ×3 | **OBSERVED** |
| Separate connect / Approve events ×3 | **OBSERVED** (logs) |
| `approval_receipt` (server) per Controller | **NOT_COMPUTABLE** (not exported into local completed receipts) |
| `independent_control_receipt` per Controller | **NOT_COMPUTABLE** (completed `approvals/controller-*.json` absent) |
| `credential_binding_digest` / `controller_binding_digest` | **NOT_COMPUTABLE** (same) |
| Proof of three *separate human principals* (vs one Admin approving three agents) | **NOT_COMPUTABLE** — connect path proves human Approve; does not prove three distinct human identities |

**Independence (identity / enrollment isolation):** **PARTIAL OBSERVED** — three distinct controller/player/code triples with independent Approved→Connected events.  
**Independence (formal receipt artifacts + separate-human-principal):** still **thin / NOT_COMPUTABLE** for the missing receipt fields above.

---

## 4) #590 checklist impact of this addendum

| Checklist item | After this addendum |
|----------------|---------------------|
| Pins + Controller versions + **canonical heads** | **MOSTLY COVERED** — live `/version` `/ready` `/health`, client 0.1.22, Worker UUID re-verified, Noema + Specs `main` tips recorded. Worker **source** SHA + sealed bundle still **NOT_COMPUTABLE**. |
| Enroll ≥3 independently controlled Controllers | **MOSTLY COVERED** — distinct ids/codes **OBSERVED**; formal `independent_control_receipt` still **NOT_COMPUTABLE**. |
| Human principal remains authorizer, never Player | **PARTIAL** — identity separation **OBSERVED**; live per-code `approver_amr` Admin report still **NOT_COMPUTABLE**. |
| Orientation / reconnect / contention / WATCH / post health | Unchanged vs PR #650 (covered / PARTIAL as before). |
| Recovery / ordering / idempotency receipts | Still **NOT observed** via CLI (unchanged). |
| Specs campaign COMPLETE | **Still open — not flipped.** |

### Still-open shortlist (do not invent)

1. Specs campaign state update (blocked).
2. Sealed pin bundle + Worker **source** git SHA for live UUID `963b5edf…`.
3. Live Admin report rows with `approver_amr` for Gate B + C7 codes (if required beyond O2 semantics + identity separation).
4. Completed `independent_control_receipt` / binding-digest artifacts.
5. Explicit server ordering / idempotency / recovery receipts.

## Explicit non-claims

- Gate B is **not** COMPLETE.
- Issue #590 stays **OPEN**.
- No Deploy. No Specs campaign flip. No tokens / `credential.json` / Authorization headers.
