# Gate D — Bound public WATCH digest (NOT COMPLETE)

**Candidate:** `lca4-gate-d-watch-legibility`  
**Issue:** [Zero-State-LLC/Noema#667](https://github.com/Zero-State-LLC/Noema/issues/667) (**OPEN**; do not close)  
**Authority:** [runbook.md](runbook.md) §2; Specs `LCA-GATE-D-SCENARIO.md`  
**Server:** `https://noema.guru`  
**Method:** Read-only public HTTP surfaces only (A–G). No Deploy. No Admin. No Controller reconnect. No COMPLETE claim.

**This digest does not claim Gate D COMPLETE.** Blind reviewer remains **NOT ASSIGNED**. No Player run was invented for this capture.

---

## 1. Capture wall-clock

| | UTC | PT (America/Los_Angeles) |
|--|-----|--------------------------|
| Start (A–C) | **2026-09-09T03:24:15Z** | **2026-09-08 20:24:15 PT** |
| End (D–G) | **2026-09-09T03:24:24Z** | **2026-09-08 20:24:24 PT** |

**Operator box identity class:** Cursor shared Linux agent box (read-only `curl` to public URLs). No Admin session. No Controller credentials used.

**Raw capture directory (operator box):** `/workspace/gate-d-watch-capture-2026-09-08/`  
(`version.json`, `ready.json`, `health.json`, `watch-live.json`, `watch-map.json`, `headers.txt`, plus HTML/header sidecars)

---

## 2. URLs + HTTP status

| Step | URL | HTTP | Content-Type | Notes |
|------|-----|------|--------------|-------|
| A | `GET https://noema.guru/version` | **200** | `application/json` | `cache-control: no-store` |
| B | `GET https://noema.guru/ready` | **200** | `application/json` | `cache-control: no-store` |
| C | `GET https://noema.guru/health` | **200** | `application/json` | `cache-control: no-store` |
| D | `GET https://noema.guru/v1/watch/live` | **200** | `application/json` | `watch-live/1.0`; ~10 038 bytes |
| E | `GET https://noema.guru/v1/watch/map` | **200** | `application/json` | `watch-map` / public-map; ~5 389 bytes |
| F | `GET https://noema.guru/watch` | **200** | `text/html` | Title **Watch · NOEMA**; ~105 888 bytes; `cache-control: no-store` |
| G | `GET https://noema.guru/watch/map` | **200** | `text/html` | Title **Watch map · NOEMA**; ~24 805 bytes; `cache-control: no-store` |

All surfaces returned **200**. No pin-drift stop triggered.

---

## 3. Pin side-by-side match

Bound pins from #667 / Gate D stub / runbook §1.2 vs this capture:

| Pin | Bound (required) | Observed | Match |
|-----|------------------|----------|-------|
| `worker_version_id` | `2c48d671-620a-43df-bb56-87438671e734` | `/version`: `2c48d671-620a-43df-bb56-87438671e734` | **Y** |
| `world_id` | `world.perihelion-reach-3` | `/version`, `/ready`, `/health`, watch-live, watch-map | **Y** |
| `genesis_id` | `genesis.94d0961984b2b4f8` | `/ready.world.genesis_id` | **Y** |
| `deployed_at` | `2026-09-08T09:03:17.074823Z` | `/version`: `2026-09-08T09:03:17.074823Z` | **Y** |

**Pin match: Y**

Supporting `/ready` / `/health` (not alternate pins):

| Field | Observed |
|-------|----------|
| `/ready.ready` | `true` |
| `/ready.status` / world status | `ACTIVE` |
| `/ready.settlement_health` | `HEALTHY` |
| `/ready.world.playable` | `true` |
| `/ready.world.players` | `0` |
| `/health.status` | `ok` |
| `/health.service` | `noema-gateway` |
| `/health.env` | `production` |

---

## 4. `canonical_head_range` (single snapshot)

This capture is **one** public snapshot (no multi-sample window). Per runbook: start = end.

| Bound | Value |
|-------|-------|
| start | cycle **17779** / sequence **41816** |
| end | cycle **17779** / sequence **41816** |
| Sources agreeing | `/ready.world`, `GET /v1/watch/live`, `GET /v1/watch/map` |

---

## 5. Public WATCH as shown (no motives)

### 5.1 `GET /v1/watch/live` (`watch-live/1.0`) — OBSERVED useful (not empty)

| Field | Value |
|-------|-------|
| world_id | `world.perihelion-reach-3` |
| world_status | `ACTIVE` |
| cycle / sequence | **17779** / **41816** |
| players_present | **0** |
| controllers (count field) | **1** |
| freshness | `live` |
| reconstruction_fidelity | `0.8` |
| corroboration | `1` |
| projection | `public` |
| rooms | **10** (Archive, Outer Works, Transit Ring, Frontier Gate, Relay Quarter, **Civic Exchange**, Generator Hall, Foundry Corridor, Storage District, Infrastructure Vault) |
| public_descriptor_lines | `[]` (empty) |

**Notable event (as WATCH shows):**

- tier `NOTABLE`; projection_id `message_notice`; glyph `comms`
- line: **“A report is circulating.”**
- cycle 17779 / sequence 41816

**public_pulses (2):**

1. “A report is circulating.”
2. “An institution declared a temporary repair authority.”

**recent_events (8 lines, public projection — as returned):**

| seq | cycle | tier | projection_id | line | public actor/location marks |
|-----|-------|------|---------------|------|-----------------------------|
| 41816 | 17779 | NORMAL | production | Stocks recovered at Civic Exchange | actor_label `reach-maint3`; room `room.civic-exchange` |
| 41816 | 17779 | NOTABLE | message_notice | A report is circulating. | (no room_id on this line) |
| 41815 | 17779 | NOTABLE | organization | An institution declared a temporary repair authority. | (org projection; no named private actors) |
| 41814 | 17778 | NORMAL | production | Stocks recovered at Civic Exchange | `reach-maint3` / Civic Exchange |
| 41812 | 17777 | NORMAL | production | Stocks recovered at Civic Exchange | `reach-maint3` / Civic Exchange |
| 41810 | 17776 | NORMAL | production | Stocks recovered at Civic Exchange | `reach-maint3` / Civic Exchange |
| 41808 | 17775 | NORMAL | production | Stocks recovered at Civic Exchange | `reach-maint3` / Civic Exchange |
| 41806 | 17774 | NORMAL | production | Stocks recovered at Civic Exchange | `reach-maint3` / Civic Exchange |

**Rooms with public entities (labels only as WATCH shows):**

- `room.relay-quarter` (2): `relay-south` (INFRASTRUCTURE), `failed-claim` (RUIN)
- `room.civic-exchange` (7): `salvage-cache` (NODE), `freight-cage`, `exchange-fabricator` (PRODUCTION), `scarred-relay` (RUIN), `relay`, `workshop`, `route-link` (INFRASTRUCTURE)

**Honest OBSERVED on density:** watch-live returned **useful public event lines** (notable + pulses + recent production/org notices), not a sparse/empty feed. Concurrently `players_present=0` (no enrolled Players visible in this snapshot). No Gate C Player run was invented for this capture; corpus prefers public consequences already under these pins (Gate C aftermath / ongoing public pulses).

### 5.2 `GET /v1/watch/map` — agrees on heads

| Field | Value |
|-------|-------|
| world_id | `world.perihelion-reach-3` |
| cycle / sequence | **17779** / **41816** |
| freshness | `live` |
| projection | `public-map` |
| health | players_present **0**; scar_band `deep`; reconstruction_fidelity `0.8` |
| layers | **8** |

### 5.3 HTML theater presence

- `/watch` — HTTP 200, title **Watch · NOEMA** (theater presence only; not JSON ground truth).
- `/watch/map` — HTTP 200, title **Watch map · NOEMA**.

---

## 6. Spectator ≠ truth

From live JSON `note` (verbatim):

> Spectator projection is never world truth and never mutates the ledger.

From map JSON `note` (verbatim):

> Mapping projection is never world truth. Lightweight /watch remains the default theater.

HTML `/watch` and `/watch/map` are presence/UX only and must not substitute for `watch-live/1.0` / `watch-map` JSON as the digest ground.

---

## 7. Redaction / exclusion / incident / stale marks

| Mark | OBSERVED |
|------|----------|
| Explicit redaction object keys on watch-live | **None** in this snapshot |
| Incident / maintenance / stale flags on watch-live | **None** named fields |
| `freshness` | `live` (not stale) |
| Standing spectator note | Present (see §6) |
| Private MESSAGE / PLAYER_PRIVATE / tokens | **Not present** in public capture (as required) |
| Forbidden sources used | **None** (no Admin Live, Operator Digests, PLAY, STUDY, Controller reconnect) |

---

## 8. Operator actions / external inputs during window

**none declared** — this cut performed read-only public GETs only. No Deploy, no Admin Approve, no Controller reconnect, no new enrollment, no invented Player run.

---

## 9. Optional Gate C WATCH digest

**Status: NOT_COMPUTABLE**

Under these same pins, `docs/evidence/gate-c-2026-09-08/` contains civilization-run / remint / path8 receipts but **no** independently reviewable dedicated public WATCH digest file (Gate C declaration historically marked Gate C WATCH digest `NOT_COMPUTABLE` / planned). Per runbook and scenario: do **not** invent one. This Gate D capture is the fresh public snapshot of the **same** pinned world for blind-review materials.

---

## 10. Explicit non-claims

- Gate D is **not** COMPLETE because this digest exists.
- Issue **#667 stays OPEN**.
- Blind reviewer **NOT ASSIGNED** (role class only; see blind-review-packet).
- No Deploy, Genesis mutation, STUDY, Gate E/F, or Specs campaign flip.
- Humans remain HumanPrincipals, never Players.
- No tokens / credentials in this packet.

---

## 11. Raw `/version` (bound)

```json
{"product":"noema","stage":"0","env":"production","protocol_version":"1","world_id":"world.perihelion-reach-3","worker_version_id":"2c48d671-620a-43df-bb56-87438671e734","deployed_at":"2026-09-08T09:03:17.074823Z"}
```

## 12. Raw `/ready` (bound heads)

```json
{"ready":true,"play_blocked":false,"code":null,"status":"ACTIVE","settlement_health":"HEALTHY","world":{"ok":true,"world_id":"world.perihelion-reach-3","world_name":"Perihelion Reach","cycle":17779,"sequence":41816,"players":0,"status":"ACTIVE","settlement_health":"HEALTHY","genesis_id":"genesis.94d0961984b2b4f8","playable":true}}
```
