# Gate B — Contention / Conflict + WATCH / Health Evidence

**Collected:** 2026-09-08T06:42:57Z–06:43:19Z UTC (**2026-09-07 23:42:57–23:43:19 PT**)  
**Server:** `https://noema.guru`  
**Client:** `/workspace/c7-noema-022/bin/noema` → **0.1.22**  
**Locks honored:** no tokens pasted; no `--force`; no spend / mail / legal / Genesis; LOOK only (utility, `requires.attention=1`).

**Contention participants:** controller-a (LUDUS) + controller-b (ADVERSARY).  
controller-c (VECTOR) **not** exercised in this contention pass (fail-closed; already reconnect-PASS elsewhere).

---

## 1. Concurrent contention / conflict — LOOK × 2

### Design

- Affordance (both): `{"action":"LOOK","kind":"utility","cmd":"look","requires":{"attention":1},"available":true}`
- Overlapping safe concurrent actions: two independent Controllers issue `act LOOK` in parallel (shell background start within ~70 µs).
- Prefer LOOK (idempotent / read-like utility). No MOVE / TRADE / MESSAGE / ORG / CONTEST / HARVEST.

### Wall-clock overlap (UTC)

| Event | Timestamp (UTC) |
|-------|-----------------|
| contention start | 2026-09-08T06:42:57.152945006Z |
| act-a start | 2026-09-08T06:42:57.154870359Z |
| act-b start | 2026-09-08T06:42:57.154938372Z |
| act-b end | 2026-09-08T06:42:58.406753960Z |
| act-a end | 2026-09-08T06:42:58.458856491Z |
| contention end | 2026-09-08T06:42:58.460885174Z |

**CLI exits:** a=`0`, b=`0` (both accepted).  
**Act text (both, identical shape):** World Perihelion Reach; Place Civic Exchange; `cycle 17256` `seq 40560`; consequence `You take in Civic Exchange.`; same `Can do:` verb list.

### Ordering / sequence / budgets (from observe --json; act has no --json)

| Phase | Slot | Label | player_id | cycle | sequence | attention | compute | energy | influence | storage | room |
|-------|------|-------|-----------|-------|----------|-----------|---------|--------|-----------|---------|------|
| pre | a | LUDUS | `player.device65cba99c4116` | 17256 | 40560 | **6** | 64 | 80 | 40 | 16 | `room.civic-exchange` |
| pre | b | ADVERSARY | `player.devicec865ee7b39ce` | 17256 | 40560 | **8** | 64 | 80 | 40 | 16 | `room.civic-exchange` |
| post | a | LUDUS | `player.device65cba99c4116` | 17256 | 40560 | **5** | 64 | 80 | 40 | 16 | `room.civic-exchange` |
| post | b | ADVERSARY | `player.devicec865ee7b39ce` | 17256 | 40560 | **7** | 64 | 80 | 40 | 16 | `room.civic-exchange` |

**Observed rules behavior (evidence, not invented):**

- **Budgets:** each LOOK deducted **attention −1** independently (a 6→5, b 8→7); other budget fields unchanged. Matches affordance `requires.attention=1`.
- **World sequence:** both pre and post still `sequence=40560` / `cycle=17256` — LOOK did not advance the public ledger sequence in this sample (consistent with prior reconnect LOOK note).
- **Ordering:** wall-clock completion order was **b then a** (~52 ms apart). Act/observe responses did **not** expose an explicit server `ordering` / conflict / contention field in this client build’s printed surface.
- **Idempotency fields:** `noema act` CLI prints rendered observation only (no `--json`); response text did **not** include `idempotency_key` / `request_id` / recovery receipt. Client library `CommandResult` *can* carry `idempotency_key`/`request_id`, but those were **not observed** in CLI output. Local `.../idempotency/` and `.../action-history/` dirs remained empty. Cohort `decision-context.json` namespaces (unchanged mtime 2026-09-02) present as labels only: `cohort.234221b319de36d3.1.controller-a` / `...2.controller-b` — **not** treated as per-act receipts.

### Contention verdict: **PARTIAL**

| Check | Result |
|-------|--------|
| ≥2 Controllers overlapping safe concurrent action | **PASS** (a+b LOOK, exits 0, ~70 µs start skew) |
| Budget rules visible | **PASS** (attention −1 each) |
| Declared ordering field in responses | **NOT observed** (wall-clock only) |
| Idempotency key / receipt in responses | **NOT observed** via CLI |
| Fail-closed (no spend/mail/legal/Genesis) | **PASS** |

---

## 2. Public WATCH digest (redacted)

Fetched ~2026-09-08T06:40:53Z UTC (pre) and rechecked live pin ~06:43:19Z UTC (post). Cycle/sequence unchanged across contention.

### `GET https://noema.guru/watch`

- HTTP 200, `content-type: text/html` (theater page), title **Watch · NOEMA**, ~106 KiB, `cache-control: no-store`.
- Not JSON; used as presence/health of public Watch UI only.

### `GET https://noema.guru/v1/watch/live` (`watch-live/1.0`)

| Field | Value |
|-------|-------|
| world_id | `world.perihelion-reach-3` |
| world_status | ACTIVE |
| cycle | **17256** |
| sequence | **40560** |
| players_present | **3** |
| freshness | live |
| reconstruction_fidelity | 0.8 |
| corroboration | 1 |
| projection | public |
| rooms | 10 (sample includes Archive, Outer Works, Transit Ring, Frontier Gate, Relay Quarter, **Civic Exchange**, Generator Hall, Foundry Corridor, …) |
| notable_event | tier NOTABLE; projection `organization`; line “An institution declared a temporary repair authority.”; seq 40560 |
| public_pulses | same institutional line (count 1) |
| note | Spectator projection is never world truth and never mutates the ledger. |

Recent public event lines (redacted device suffixes only as already public in Watch): agent_move into Civic Exchange for enrolled device labels; production “Stocks recovered at Civic Exchange”; org repair-authority pulse. **No controller tokens.**

### `GET https://noema.guru/v1/watch/map` (`watch-map/1.0`)

| Field | Value |
|-------|-------|
| world_id | `world.perihelion-reach-3` |
| cycle / sequence | 17256 / 40560 |
| freshness | live |
| health | players_present 3; scar_band `deep`; reconstruction_fidelity 0.8 |
| layers | 8 |
| projection | public-map |
| note | Mapping projection is never world truth; lightweight `/watch` remains default theater. |

---

## 3. Post-cohort `/ready` + `/health` + `/version` pins

Fetched **2026-09-08T06:43:19Z UTC** (2026-09-07 23:43:19 PT) — after contention acts.

### `/version`

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

**Worker pin:** `963b5edf-17ea-41f4-892f-130e278e0bb8` (unchanged vs orientation baseline).

### `/health`

- `status`: ok  
- `service`: noema-gateway  
- `stage`: 0 / `env`: production  
- `protocol_version`: 1  
- `world_id`: `world.perihelion-reach-3`

### `/ready`

- `ready`: true  
- `play_blocked`: false  
- `status`: ACTIVE  
- `settlement_health`: HEALTHY  
- `world.world_id`: `world.perihelion-reach-3`  
- `world.world_name`: Perihelion Reach  
- `world.cycle`: 17256  
- `world.sequence`: 40560  
- `world.playable`: true  
- `world.genesis_id`: `genesis.94d0961984b2b4f8`  
- Note: `/ready.world.players` reported **0** while `/v1/watch/live.players_present` reported **3** (field semantics differ; both recorded, neither invented away).

---

## 4. Recovery receipts

| Source | Result |
|--------|--------|
| CLI `act LOOK` stdout/stderr | **NOT observed** (no recovery / idempotency / request_id lines) |
| Local `participants/controller-{a,b}/idempotency/` | empty |
| Local `.../action-history/` | empty |
| Local `.../evidence/` / `.../logs/` | empty at collection |
| Library capability | `CommandResult.idempotency_key` / `request_id` exist in client API; **not surfaced** by `act` CLI renderer |

**Recovery receipts:** **NOT_COMPUTABLE / not observed** for this pass.

---

## 5. Noema#590 Gate B checklist — remaining open items

Source checklist body ([Zero-State-LLC/Noema#590](https://github.com/Zero-State-LLC/Noema/issues/590)). Status relative to **this file + prior** orientation (`noema-gateb-orientation-2026-09-08.md`) and reconnect (`noema-gateb-reconnect-2026-09-08.md`) evidence:

| Checklist item | Status after this pass |
|----------------|------------------------|
| Record production/deployment pins, seal and room constraints, Controller versions, and **canonical heads** | **Still open / partial** — worker + `/ready`/`/health`/`/version` + client 0.1.22 + room `civic-exchange` + doctor seal=required (prior) recorded; **full pin packet with canonical Specs/Worker git heads** still missing. |
| Enroll ≥3 independently controlled external Controllers via supported onboarding | **Mostly covered** (3 approved enrollments + reconnect PASS). Independence / separate-human-principal **receipts** still thin. |
| Confirm each human principal remains authorizer/operator/spectator and **never a Player** | **Still open** — formal human≠Player proof not captured. |
| Redacted orientation + supported action surface per Agent Player | **Covered** (orientation doc). |
| Disconnect/reconnect with identity + durable state preserved | **Covered** (reconnect doc; a/b/c PASS). |
| Concurrent contention/conflict; verify ordering, idempotency, budgets | **PARTIAL this file** — concurrent LOOK PASS; budgets PASS; explicit ordering/idempotency response fields **not observed**. |
| Capture recovery receipts, WATCH digest, redacted transcripts | **PARTIAL** — WATCH digest **covered** here; recovery receipts **NOT observed**; transcripts = redacted act/observe excerpts herein. |
| Production health + public post-state checks **after** cohort run | **Covered this file** (post `/ready` `/health` `/version` + watch-live pin). |
| Update **Noema-Specs campaign state** only after all evidence complete | **Still open** (must wait until remaining gaps close). |

### Explicit still-open shortlist (for parent)

1. Specs campaign update (blocked on complete evidence).  
2. Full pin packet with **canonical heads** (Specs / Worker git SHAs + sealed bundle).  
3. Formal **human ≠ Player** principal proof.  
4. Stronger **independence receipts** for the three Controllers.  
5. Explicit server **ordering / idempotency / recovery receipts** (CLI did not surface; need alternate capture path or server-side export — not invented here).

---

## Summary for parent

| Item | Result |
|------|--------|
| Output path | `/workspace/noema-gateb-contention-watch-2026-09-08.md` |
| Contention | **PARTIAL** (concurrent LOOK a+b OK; budgets OK; ordering/idempotency fields not in CLI responses) |
| WATCH pin | world `perihelion-reach-3` cycle **17256** seq **40560** players_present **3** freshness live fidelity 0.8; HTML `/watch` 200 |
| Post health | ready true / health ok / worker `963b5edf-17ea-41f4-892f-130e278e0bb8` |
| Recovery receipts | **NOT_COMPUTABLE / not observed** |
| Secrets | none pasted |

