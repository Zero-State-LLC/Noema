# Gate C Path 8 — declared INCIDENT → recover receipt (existing Admin lifecycle JSON)

**Collected:** 2026-09-08 (PT) — OBSERVED Admin recover drill  
**Issue:** [Zero-State-LLC/Noema#661](https://github.com/Zero-State-LLC/Noema/issues/661) **OPEN**  
**Candidate:** `lca3-gate-c-existing-system-civilization`  
**Worker (OBSERVED):** `2c48d671-620a-43df-bb56-87438671e734`  
**World:** `world.perihelion-reach-3`  
**Paths 1–7:** PASS via Noema [#664](https://github.com/Zero-State-LLC/Noema/pull/664) (docs cut; **not** Gate C COMPLETE)  
**Operator confirm:** Danny **human-yes** — accept **EXISTING** Admin lifecycle recover JSON as Path 8 restart/recovery receipt (**no new schema**)  
**Raw workspace:** `/workspace/gate-c-path8-drill/{ready-pre,ready-post,version-pre,recover-receipt}.json`  
**Workspace mirror:** `/workspace/noema-gate-c-path8-recover-2026-09-08.md`

**This packet is evidence only. It does not claim Gate C COMPLETE.**  
Do **not** close #661. Do **not** flip Noema-Specs campaign state (separate human-yes required). No Deploy. No invented fields.

---

## 1) Purpose

File the **OBSERVED** Gate C Path 8 declared restart/recovery drill on live Worker `2c48d671…` / `world.perihelion-reach-3`:

1. Record PRE `/ready` + heads  
2. Admin lifecycle → **INCIDENT** (declared restart)  
3. Admin lifecycle **recover** — capture **full existing** response JSON  
4. Record POST `/ready` (heads unchanged)

Danny accepted the **existing** recover response form (`ok` / `status` / `settlement_health` / `revision` / `recover_mode` / `head_present` / `reason` / `operator_session`) as the Path 8 restart/recovery receipt for this candidate — **without minting a new receipt schema**.

---

## 2) Pins (OBSERVED)

| Pin | Value |
|-----|-------|
| `worker_version_id` | `2c48d671-620a-43df-bb56-87438671e734` |
| World | `world.perihelion-reach-3` |
| `deployed_at` (from `/version`) | `2026-09-08T09:03:17.074823Z` |
| PRE `/ready` | `ready=true`, `ACTIVE`, `HEALTHY`, cycle **17415**, sequence **40949** |
| PRE heads | `head_revision=20257`, `head_sequence=40949`, `head_cycle=17415` |
| POST `/ready` | `ready=true`, `ACTIVE`, `HEALTHY`, cycle **17415**, sequence **40949** (heads unchanged) |
| Recover `revision` | **20257** (matches PRE `head_revision`) |
| Recover `reason` | `gate-c-path8-declared-restart` |
| `operator_session` | `asess.824cfb77e446` |

`/version` PRE (workspace `version-pre.json`):

```json
{"product":"noema","stage":"0","env":"production","protocol_version":"1","world_id":"world.perihelion-reach-3","worker_version_id":"2c48d671-620a-43df-bb56-87438671e734","deployed_at":"2026-09-08T09:03:17.074823Z"}
```

---

## 3) INCIDENT lifecycle (OBSERVED)

Declared restart checkpoint via Admin lifecycle → status **INCIDENT**:

| Field | Value |
|-------|-------|
| status | `INCIDENT` |
| ready | `false` |
| play_blocked | `true` |
| `operator_session` | `asess.824cfb77e446` |
| reason | `gate-c-path8-declared-restart` |

---

## 4) RECOVER lifecycle — FULL JSON (OBSERVED; Danny-accepted receipt)

Existing Admin `POST /v1/admin/lifecycle` recover response (no new fields invented):

```json
{"ok":true,"status":"ACTIVE","settlement_health":"HEALTHY","revision":20257,"recover_mode":"restore","head_present":true,"reason":"gate-c-path8-declared-restart","operator_session":"asess.824cfb77e446"}
```

| Field | Value |
|-------|-------|
| `ok` | `true` |
| `status` | `ACTIVE` |
| `settlement_health` | `HEALTHY` |
| `revision` | `20257` |
| `recover_mode` | `restore` |
| `head_present` | `true` |
| `reason` | `gate-c-path8-declared-restart` |
| `operator_session` | `asess.824cfb77e446` |

Workspace twin: `/workspace/gate-c-path8-drill/recover-receipt.json`.

---

## 5) PRE / POST `/ready` (heads unchanged)

### PRE (`ready-pre.json`)

```json
{"ready":true,"play_blocked":false,"code":null,"status":"ACTIVE","settlement_health":"HEALTHY","world":{"ok":true,"world_id":"world.perihelion-reach-3","world_name":"Perihelion Reach","cycle":17415,"sequence":40949,"players":0,"status":"ACTIVE","settlement_health":"HEALTHY","genesis_id":"genesis.94d0961984b2b4f8","playable":true}}
```

### POST (`ready-post.json`)

Same ACTIVE / HEALTHY / cycle **17415** / sequence **40949** after recover (`recover_mode=restore`, `revision=20257`, `head_present=true`). Heads unchanged vs PRE.

---

## 6) Path 8 verdict (this packet)

| Item | Label |
|------|-------|
| Path 8 (restart/recovery receipts tied to candidate heads) | **PASS** — Danny human-yes accepts **existing** recover JSON above as Path 8 restart/recovery receipt (**no new schema**) |
| Paths 1–7 | **PASS** ([#664](https://github.com/Zero-State-LLC/Noema/pull/664) / [civilization-run.md](civilization-run.md)) |
| Gate C Specs campaign COMPLETE | **NOT claimed** — requires separate Specs campaign flip (separate human-yes) |
| Issue #661 | stays **OPEN** |
| Deploy | **None** |

Prior Path 8 probe left the path **NOT_COMPUTABLE** pending operator acceptance of the existing recover surface (`/workspace/noema-gate-c-path8-probe-2026-09-08.md`). This packet supersedes that Path 8 label for the Gate C candidate evidence pack **only** under Danny’s explicit acceptance of the existing JSON — it does **not** invent a `recovery_receipt` type and does **not** flip Specs COMPLETE.

---

## 7) Explicit non-claims

- Gate C Specs campaign is **not** COMPLETE in this packet.
- #661 stays **OPEN** (no close keywords).
- No Deploy. No Genesis mutation. No new Player verbs. No RFC-0130.
- No new receipt schema. No invented fields beyond the OBSERVED Admin recover JSON keys above.
- No secrets beyond the `operator_session` id already present in the Admin report (`asess.824cfb77e446`).
