# Gate B orientation evidence (redacted)

**Collected:** 2026-09-08T06:33:39Z (2026-09-07 23:33:39 PDT)  
**Operator note:** No `credential.json`, tokens, or private strategy pasted. No ENTER, spend, act, play, or auto-approve performed in this pass.  
**Client:** `NOEMA_BIN=/workspace/c7-noema-022/bin/noema` → `noema --version` = **0.1.22**  
**Server flag:** `--server https://noema.guru` on top-level `noema` (before subcommand)  
**Config dirs:** `/home/box/.local/state/noema/lca2-live/participants/controller-{a,b,c}/credentials`  
**Cohort run_id (from local state):** `run.lca2.cohort.234221b319de36d3` (cohort `state.status` still `AWAITING_HUMAN_APPROVAL` for play receipts; enrollments themselves already connected)

---

## Worker / door pins (public)

### `GET https://noema.guru/version`

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

**Worker pin:** `963b5edf-17ea-41f4-892f-130e278e0bb8` (deployed 2026-09-08T05:52:14.712143Z UTC)

### `GET https://noema.guru/ready` (brief)

- `ready`: true  
- `play_blocked`: false  
- `status`: ACTIVE  
- `settlement_health`: HEALTHY  
- `world.world_id`: `world.perihelion-reach-3`  
- `world.world_name`: Perihelion Reach  
- `world.cycle`: 17256 (at fetch time)  
- `world.playable`: true  

### `GET https://noema.guru/health` (brief)

- `status`: ok  
- `service`: noema-gateway  
- `stage`: 0 / `env`: production  
- `protocol_version`: 1  
- `world_id`: `world.perihelion-reach-3`  

---

## Device codes used (from `/tmp/c7-cohort` connect logs; public user codes only)

| Slot | Label | Successful connect log | User code | Connect outcome in log |
|------|-------|------------------------|-----------|-------------------------|
| controller-a | LUDUS | `controller-a-connect.log` | `C326-1B75` | Approved → Connected |
| controller-b | ADVERSARY | `b2.log` (retry; earlier `controller-b-connect.log` code `1D5F-ED5D` did not show Approved) | `F25B-5D4F` | Approved → Connected |
| controller-c | VECTOR | `c2.log` | `1F36-6D59` | Approved → Connected |

Labels LUDUS / ADVERSARY / VECTOR are the enrolled Controller nicknames supplied for this cohort; they are **not** fields returned by `status`/`observe`.

---

## Per-controller orientation

Commands run for each `$CFG`:

1. `noema --server https://noema.guru --config-dir $CFG status --json`
2. `noema --server https://noema.guru --config-dir $CFG observe --json`
3. `noema --server https://noema.guru --config-dir $CFG doctor --json` (quick)

**PASS rule used here (orientation only):** `status.connected == true` AND observe returns `in_world == true` with non-null `player_id` and `world_name`, plus non-empty `available_actions`. No private strategy fields recorded.

**Note on `status` vs `observe`:** For all three Controllers, `status --json` reported `player_id: null`, `world: null`, `world_id: null` while still `connected: true`. Identity and world membership appear on **observe** (`player_id`, `world_name`, `in_world`, `location`). Evidence below records both.

Credential objects in CLI JSON were present but **not copied**; only `credential_present: true` is noted.

### controller-a — LUDUS — **PASS**

| Field | Value |
|-------|--------|
| Device code | `C326-1B75` |
| `status.connected` | true |
| `status.controller_id` | `ctrl.device.65cba99c4116` |
| `status.player_id` / `status.world` | null / null |
| `status.controller_type` / `protocol` / `transport` | agent / agent-protocol/v1 / http |
| `observe.player_id` | `player.device65cba99c4116` |
| `observe.world_name` | Perihelion Reach |
| `observe.in_world` | true |
| `observe.cycle` / `sequence` | 17256 / 40558 |
| `observe.location` | Civic Exchange (`room.civic-exchange`) |
| `doctor.reachability` / `discovery` / `seal` | ok / agent-protocol/v1 / required |

**Observe snapshot keys (no private strategy):**  
`active_norms`, `affordances`, `available_actions`, `board_lines`, `budgets`, `cascading_risk`, `channel_lines`, `compositionality`, `consequence`, `contests`, `culture_lines`, `cycle`, `discovery_lines`, `drift_alerts`, `focus_lines`, `historical_context`, `in_world`, `inherited_lines`, `location`, `lore_attractors`, `lot_lines`, `messages`, `notice_lines`, `office_lines`, `organizations`, `path_dependence_index`, `play_text`, `player_id`, `players_here`, `practice_lines`, `pressure`, `protocol_strength`, `reconstruction_lines`, `report_lines`, `reputation_summary`, `rumor_lines`, `scars`, `sequence`, `services`, `shout_lines`, `signaling_quality`, `situation`, `social_memory_lines`, `trade_notice_lines`, `trades`, `unclaimed_lines`, `world_name`

**Supported action surface (`available_actions`):**  
`INSPECT`, `HARVEST`, `MOVE`, `MESSAGE`, `TRADE`, `ORG_CREATE`, `LOOK`, `WAIT`, `FOCUS`, `CONTEST_DECLARE`, `AGREEMENT_FORM`, `DISMANTLE`

**Budgets (observe):** attention 8, compute 64, energy 80, influence 40, storage 16

### controller-b — ADVERSARY — **PASS**

| Field | Value |
|-------|--------|
| Device code | `F25B-5D4F` |
| `status.connected` | true |
| `status.controller_id` | `ctrl.device.c865ee7b39ce` |
| `status.player_id` / `status.world` | null / null |
| `status.controller_type` / `protocol` / `transport` | agent / agent-protocol/v1 / http |
| `observe.player_id` | `player.devicec865ee7b39ce` |
| `observe.world_name` | Perihelion Reach |
| `observe.in_world` | true |
| `observe.cycle` / `sequence` | 17256 / 40559 |
| `observe.location` | Civic Exchange (`room.civic-exchange`) |
| `doctor.reachability` / `discovery` / `seal` | ok / agent-protocol/v1 / required |

**Observe snapshot keys:** same top-level key set as controller-a (listed above).  
**`available_actions`:** same twelve verbs as controller-a.  
**Budgets:** attention 8, compute 64, energy 80, influence 40, storage 16

### controller-c — VECTOR — **PASS**

| Field | Value |
|-------|--------|
| Device code | `1F36-6D59` |
| `status.connected` | true |
| `status.controller_id` | `ctrl.device.995df01ed35e` |
| `status.player_id` / `status.world` | null / null |
| `status.controller_type` / `protocol` / `transport` | agent / agent-protocol/v1 / http |
| `observe.player_id` | `player.device995df01ed35e` |
| `observe.world_name` | Perihelion Reach |
| `observe.in_world` | true |
| `observe.cycle` / `sequence` | 17256 / 40560 |
| `observe.location` | Civic Exchange (`room.civic-exchange`) |
| `doctor.reachability` / `discovery` / `seal` | ok / agent-protocol/v1 / required |

**Observe snapshot keys:** same top-level key set as controller-a (listed above).  
**`available_actions`:** same twelve verbs as controller-a.  
**Budgets:** attention 8, compute 64, energy 80, influence 40, storage 16

---

## Summary PASS/FAIL

| Controller | Label | Orientation |
|------------|-------|-------------|
| controller-a | LUDUS | **PASS** |
| controller-b | ADVERSARY | **PASS** |
| controller-c | VECTOR | **PASS** |

Three distinct `controller_id` / observe `player_id` pairs; all in `world.perihelion-reach-3` / Perihelion Reach at Civic Exchange.

---

## Noema#590 Gate B acceptance checklist — coverage

Source: [Zero-State-LLC/Noema#590](https://github.com/Zero-State-LLC/Noema/issues/590) body (“Gate B acceptance checklist”).

| Checklist item | This evidence |
|----------------|---------------|
| Record production/deployment pins, seal and room constraints, Controller versions, and canonical heads | **Partial.** Worker pin + `/ready` + `/health` recorded; client `0.1.22` recorded; doctor `seal: required`; room `room.civic-exchange`. Canonical Specs/Worker **git heads** and sealed pin packet **not** fully assembled here. |
| Enroll ≥3 independently controlled external Controllers via supported onboarding | **Covered for enrollment connectivity** (three approved device codes → stored local credentials → `connected: true`). Independence *receipts* / separate human principals **not** proven in this file. |
| Confirm each human principal remains authorizer/operator/spectator and never a Player | **Still open** (no principal/role proof captured here). |
| For each Agent Player, capture redacted orientation + supported action surface without private operator strategy | **Covered** (this document). |
| Verify disconnect and reconnect with identity and durable state preserved | **Still open** (not run; locks forbid unnecessary session churn). |
| Exercise ≥1 concurrent contention/conflict case; verify ordering, idempotency, budgets | **Still open** (no act/spend/play). |
| Capture recovery receipts, WATCH digest, and redacted transcripts | **Still open**. |
| Run production health and public post-state checks **after** the cohort run | **Partial baseline only** (`/ready`, `/health` before cohort play). Post-run recheck **still open**. |
| Update Noema-Specs campaign state only after all evidence complete | **Still open**. |

### Local cohort runner gap (related, not a #590 line verbatim)

- `lca2-live/state.json` remains `AWAITING_HUMAN_APPROVAL` / processes `PENDING`.
- Approval *request* stubs exist under `approvals/controller-*.request.json`; completed `approvals/controller-*.json` receipts with required fields (`approved`, `enrollment_status`, `approval_receipt`, `independent_control_receipt`, binding digests) were **not** present at collection time.
- This orientation pass does **not** advance cohort play and does **not** write those receipts.

---

## Explicit non-disclosure

- Did **not** paste `credential.json` contents, access/refresh tokens, or Authorization headers.
- Did **not** invent strategy; observe affordance labels/cmds listed only as the public supported surface.
- Did **not** ENTER (beyond already-enrolled observe), spend, act, play, or auto-approve.
