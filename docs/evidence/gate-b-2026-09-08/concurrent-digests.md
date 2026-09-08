# Gate B #590 — Concurrent multi-controller digests (PASS)

**Collected:** 2026-09-08T08:29:10–08:29:18Z UTC (**2026-09-08 01:29:10–01:29:18 PT**)  
**Issue:** [Zero-State-LLC/Noema#590](https://github.com/Zero-State-LLC/Noema/issues/590)  
**Server:** `https://noema.guru`  
**Client:** `/workspace/c7-noema-022/bin/noema` → **noema_client 0.1.22**  
**Locks:** No Deploy. Do not close #590. No Gate B COMPLETE claim. No `--force`. No secrets pasted.

**This packet supersedes the earlier BLOCKED concurrent-digests attempt (PR #657). It does not claim Gate B COMPLETE.**

---

## Verdict (short)

| Item | Status |
|------|--------|
| Controllers connected (a/b/c) | **3** of 3 |
| Concurrent LOOK ≥2 Controllers | **PASS** (a+b+c, all pairs wall-clock overlap) |
| `contention_evidence_digest` | **PASS** `be78b73854315fef9193e700f18ea0c4da3753bce506828137b40cccf77271cc` |
| `ordering_evidence_digest` | **PASS** `a1721bea4560aaf59c723d23caede64507329e80e2efee891e3560b5788db5cb` |
| `budget_settlement_evidence_digest` | **PASS** `6c9577ddde721a799b5a45e06ddfc1617abf514d3f3f163512d02dd1f0075621` |
| Library path `CommandResult.raw` | **OBSERVED** (keys: `events`, `observation`, `ok`, `provenance`, `request_id`, `settled`) |

Prior single-controller library capture remains in [ordering-probe.md](ordering-probe.md). Prior a+b CLI LOOK remains in [contention-watch.md](contention-watch.md). Earlier BLOCKED reconnect packet (PR #657) is superseded by this PASS.

---

## 1. Controllers after fresh reconnect

Reconnect codes **C5EE-9821** / **B135-B266** / **2D79-E3B6** were Approved. New `controller_id`s differ from the prior enroll cohort (expected after reconnect remint).

| Slot | Label | Prior enroll `controller_id` | **New** (this pass) | `player_id` | `status --json` |
|------|-------|------------------------------|---------------------|-------------|-----------------|
| a | LUDUS | `ctrl.device.65cba99c4116` | `ctrl.device.32bdc772bf02` | `player.device32bdc772bf02` | `connected=true`, `credential=stored` |
| b | ADVERSARY | `ctrl.device.c865ee7b39ce` | `ctrl.device.a75b4a98d334` | `player.devicea75b4a98d334` | `connected=true`, `credential=stored` |
| c | VECTOR | `ctrl.device.995df01ed35e` | `ctrl.device.d6fb4938b52a` | `player.deviced6fb4938b52a` | `connected=true`, `credential=stored` |

Config dirs: `/home/box/.local/state/noema/lca2-live/participants/controller-{a,b,c}/credentials`  
BIN: `/workspace/c7-noema-022/bin/noema --server https://noema.guru --config-dir $CFG`

World at capture: **Perihelion Reach** / `room.civic-exchange` / cycle **17257** / sequence **40566** (shared across concurrent LOOK responses).

---

## 2. Concurrent capture method

Same library path as [ordering-probe.md](ordering-probe.md) / `/tmp/gateb_ordering_probe.py`, extended to three config-dirs (`/tmp/gateb_concurrent_look_digests.py`):

1. For each slot, `NoemaClient(config_home=CFG, transport='http')`.
2. `observe()` / `ensure_in_world()` as needed (all three entered Civic Exchange).
3. Concurrent `ThreadPoolExecutor(max_workers=3)`: each controller `act(ActionProposal(action='LOOK'))`.
4. Capture `CommandResult.raw`, `.ok`, `.settled`, `.request_id`, `.idempotency_key`, observation `sequence`/`cycle`/`budgets`, `events[].sequence` / `event_id` / `event_type` / `payload.cost_paid`, `provenance`.
5. Redact tokens/authorization/secrets deeply (key name contains `token`, `authorization`, `password`, `secret`, or `credential`).
6. Persist redacted JSON pack under `/tmp/gateb-concurrent-raw/` (not committed — digests only in docs).

**Safest act:** `LOOK` (utility, `requires.attention=1`).

**Wall-clock overlap (OBSERVED):** all three acts started within ~1 ms and ended within ~1.5 s; every pair overlapped.

| Slot | wall_start (UTC) | wall_end (UTC) | ok | settled | request_id | idempotency_key |
|------|------------------|----------------|----|---------|------------|-----------------|
| a | 2026-09-08T08:29:17.142567Z | 2026-09-08T08:29:18.614983Z | True | True | `req.d8bb02c8be` | `idem.107400c761af` |
| b | 2026-09-08T08:29:17.143005Z | 2026-09-08T08:29:18.680970Z | True | True | `req.d27e56289e` | `idem.4000e3528da6` |
| c | 2026-09-08T08:29:17.143554Z | 2026-09-08T08:29:18.624829Z | True | True | `req.9534d8a0b0` | `idem.c2db25e8c27f` |

---

## 3. Digest method + values

Opaque SHA-256 bindings (LCA2 cohort runner fields). Input material is redacted JSON, canonicalized with `json.dumps(..., sort_keys=True, separators=(',', ':'))` UTF-8, then `sha256` hex.

| Digest field | Input material | Value |
|--------------|----------------|-------|
| `contention_evidence_digest` | `{kind, overlap, acts[]}` where each act has `{slot,label,controller_id,player_id,wall_start,wall_end,ok,settled,request_id,idempotency_key,raw_top_keys}` + shared wall-clock overlap metadata | `be78b73854315fef9193e700f18ea0c4da3753bce506828137b40cccf77271cc` |
| `ordering_evidence_digest` | `{kind, acts[]}` with `{slot,request_id,obs_sequence,obs_cycle,events[{sequence,event_id,event_type}],provenance}` sorted by `(sequence, event_id, slot)` | `a1721bea4560aaf59c723d23caede64507329e80e2efee891e3560b5788db5cb` |
| `budget_settlement_evidence_digest` | `{kind, affordance_note, acts[]}` with `{slot,pre_budgets,post_budgets,cost_paid,settled,request_id}` + note `LOOK requires.attention=1` | `6c9577ddde721a799b5a45e06ddfc1617abf514d3f3f163512d02dd1f0075621` |

**Method note:** Digests are opaque evidence bindings computed client-side from retained redacted library captures — not server-returned fields.

---

## 4. Ordering / budget / settlement observations

| Slot | obs.sequence | obs.cycle | pre attention | post attention | cost_paid | settled |
|------|--------------|-----------|---------------|----------------|-----------|---------|
| a | 40566 | 17257 | 8 | 7 | `{attention: 1}` | True |
| b | 40566 | 17257 | 8 | 7 | `{attention: 1}` | True |
| c | 40566 | 17257 | 8 | 7 | `{attention: 1}` | True |

Each act produced events `LOOK` + `OBSERVATION_GENERATED` at sequence **40566**. Other budgets unchanged (compute 64 / energy 80 / influence 40 / storage 16). Provenance distinct per controller (`controller_id` / `player_id` / `session_id` / `agent_id`).

`idempotency_key` remains **client-held** (sent, not echoed in server body) — unchanged from ordering-probe.

---

## 5. Connected count / gap summary

| Metric | Value |
|--------|-------|
| Connected count | **3** |
| Concurrent multi-controller library LOOK | **PASS** (a+b+c) |
| Cohort digests | **PASS** (three sha256 values above) |

### Remaining gaps (do not invent)

1. Dedicated Gate-A-style **recovery receipt** / incident-recover pack still **NOT_COMPUTABLE** on act/observe (unchanged from ordering-probe).
2. Specs campaign state update still **OPEN** — not flipped here.
3. Separate-human-principal independence still **NOT_COMPUTABLE**.
4. `acceptance_authority_digest` not computed in this pass (not requested).
5. New post-reconnect `controller_id`s differ from prior enroll — expected; prior Admin `independent_control_receipt` / binding digests were for the **old** device ids and may need re-binding if cohort identity continuity is required beyond reconnect remint.

### Explicit non-claims

- Gate B is **not** COMPLETE.
- Issue #590 stays **OPEN**.
- No Deploy. No Specs campaign flip. No tokens / `credential.json` / Authorization headers pasted.
