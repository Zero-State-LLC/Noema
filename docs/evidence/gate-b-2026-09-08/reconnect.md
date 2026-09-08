# Gate B — Disconnect/Reconnect Identity Preservation Evidence

**Date:** 2026-09-08 (PT evening / UTC morning of collection)  
**Server:** `https://noema.guru`  
**BIN:** `/workspace/c7-noema-022/bin/noema`  
**Method:** Sequential per controller (no parallel disconnects).  
**Locks honored:** no secrets pasted; no `--forget`; no `--force` re-enroll; no auto-approve browser; no spend/mail/legal acts.

## Procedure notes

- `disconnect --help`: only `--forget` (removes local credential; does not delete Player). Default disconnect keeps credential on disk — used for all three.
- `connect --help`: `--force` re-enrolls even if stored credential looks usable — **not used**.
- After `disconnect`, CLI prints `Disconnected local Controller session.` Credential file remains. `status --json` still reports `connected=true` / `credential=stored` because the stored credential remains usable (status does not expose a separate “session_active=false” flag in this client build). Mid-cycle observe still returned world state via stored credential.
- Reconnect: `connect` **without** `--force` → `Connected.` / `Credential: stored locally` — **no new device-code / human Approve URL**. Identity restored without minting a new enrollment.

## Supported action surface (names only)

Captured from observe `available_actions` (controller-a LUDUS, representative; b/c identical names in this run):

`INSPECT`, `HARVEST`, `MOVE`, `MESSAGE`, `TRADE`, `ORG_CREATE`, `LOOK`, `WAIT`, `FOCUS`, `CONTEST_DECLARE`, `AGREEMENT_FORM`, `DISMANTLE`

## Optional light act

- **Exercised:** yes, once on controller-a only.
- **Action:** `act LOOK` (utility / look-around; no spend/mail/legal). Also confirmed `LOOK` and `WAIT` present in affordances.
- **Result:** exit 0; consequence remained look-style (“You take in Civic Exchange.”); `player_id` unchanged; `in_world=true`. Sequence did not advance in this sample (40560→40560) — treated as successful no-op path exercise, not a spend.
- Controllers b/c: **act not exercised** (surface documented only; fail-closed).

---

## Controller a — LUDUS

**Config-dir:** `.../participants/controller-a/credentials`  
**Verdict: PASS**

| Field | BEFORE | AFTER reconnect |
|-------|--------|-----------------|
| player_id | `player.device65cba99c4116` | `player.device65cba99c4116` |
| controller_id (status) | `ctrl.device.65cba99c4116` | `ctrl.device.65cba99c4116` |
| world_name | Perihelion Reach | Perihelion Reach |
| location | Civic Exchange (`room.civic-exchange`) | Civic Exchange |
| in_world | true | true |

**Disconnect:** ok (credential kept; no `--forget`).  
**Post-disconnect status:** `connected=true`, `credential=stored`, same `controller_id` (see procedure notes).  
**Reconnect:** `connect` (no `--force`) → Connected, stored locally; no Approve code.  
**IDs match + in_world again:** yes.

---

## Controller b — ADVERSARY

**Config-dir:** `.../participants/controller-b/credentials`  
**Verdict: PASS**

| Field | BEFORE | AFTER reconnect |
|-------|--------|-----------------|
| player_id | `player.devicec865ee7b39ce` | `player.devicec865ee7b39ce` |
| controller_id (status) | `ctrl.device.c865ee7b39ce` | `ctrl.device.c865ee7b39ce` |
| world_name | Perihelion Reach | Perihelion Reach |
| location | Civic Exchange (`room.civic-exchange`) | Civic Exchange |
| in_world | true | true |

**Disconnect:** ok (credential kept).  
**Reconnect:** `connect` (no `--force`) → Connected, stored locally; no Approve code.  
**IDs match + in_world again:** yes.  
**Act:** not exercised.

---

## Controller c — VECTOR

**Config-dir:** `.../participants/controller-c/credentials`  
**Verdict: PASS**

| Field | BEFORE | AFTER reconnect |
|-------|--------|-----------------|
| player_id | `player.device995df01ed35e` | `player.device995df01ed35e` |
| controller_id (status) | `ctrl.device.995df01ed35e` | `ctrl.device.995df01ed35e` |
| world_name | Perihelion Reach | Perihelion Reach |
| location | Civic Exchange (`room.civic-exchange`) | Civic Exchange |
| in_world | true | true |

**Disconnect:** ok (credential kept).  
**Reconnect:** `connect` (no `--force`) → Connected, stored locally; no Approve code.  
**IDs match + in_world again:** yes.  
**Act:** not exercised.

---

## Summary

| Controller | Label | Verdict | Act exercised |
|------------|-------|---------|---------------|
| a | LUDUS | **PASS** | yes (`LOOK`) |
| b | ADVERSARY | **PASS** | no |
| c | VECTOR | **PASS** | no |

**BLOCKED:** none (no controller required a new device-code approval).  
**Secrets:** none written (no tokens, no `credential.json` body).
