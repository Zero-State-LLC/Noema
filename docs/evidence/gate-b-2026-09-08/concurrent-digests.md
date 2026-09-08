# Gate B #590 — Concurrent multi-controller digests (BLOCKED pending Admin Approve)

**Collected:** 2026-09-08T08:04–08:12Z UTC (**2026-09-08 01:04–01:12 PT**)  
**Issue:** [Zero-State-LLC/Noema#590](https://github.com/Zero-State-LLC/Noema/issues/590)  
**Server:** `https://noema.guru`  
**Client:** `/workspace/c7-noema-022/bin/noema` → **noema_client 0.1.22**  
**Locks:** No Deploy. Do not close #590. No Gate B COMPLETE claim. No `--force`. No browser Approve (not Danny-authorized). No secrets pasted.

**This packet is evidence of a blocked reconnect + digest attempt. It does not claim Gate B COMPLETE.**

---

## Verdict (short)

| Item | Status |
|------|--------|
| Controllers connected (a/b/c) | **0** of 3 |
| Concurrent LOOK ≥2 Controllers | **NOT_COMPUTABLE** (need ≥2 live credentials) |
| `contention_evidence_digest` | **NOT_COMPUTABLE** |
| `ordering_evidence_digest` | **NOT_COMPUTABLE** |
| `budget_settlement_evidence_digest` | **NOT_COMPUTABLE** |
| Admin Approve required | **YES** — three device codes (see §2) |

Prior single-controller library capture of `CommandResult.raw` fields remains in [ordering-probe.md](ordering-probe.md). Prior a+b CLI LOOK contention remains in [contention-watch.md](contention-watch.md). This pass was meant to hash **multi-controller** library raw bodies into the three cohort digests; reconnect blocked that.

---

## 1. Status at attempt start

| Slot | Label | controller_id | `status --json` |
|------|-------|---------------|-----------------|
| a | LUDUS | `ctrl.device.65cba99c4116` | `connected=false`, `credential=expired` |
| b | ADVERSARY | `ctrl.device.c865ee7b39ce` | `connected=false`, `credential=expired` |
| c | VECTOR | `ctrl.device.995df01ed35e` | `connected=false`, `credential=expired` |

C7 Boof (`ctrl.device.9a3eabf9b619`) also `credential=expired` at check time — not used as a Gate B cohort substitute.

---

## 2. Reconnect attempts (`connect --no-enter`, **no** `--force`)

Per slot: when stored credential was expired, CLI started device enrollment and minted a user code. Slot recorded **BLOCKED**; poller left running so Admin Approve can complete enrollment without orphaning a later remint. **Do not Approve obsolete codes** listed under “superseded.”

### ACTIVE codes for Noema Admin (Boof ping)

| Slot | Label | **ACTIVE** code | Approve URL | controller_id (pre-enroll status) |
|------|-------|-----------------|-------------|-----------------------------------|
| a | LUDUS | **`C5EE-9821`** | https://noema.guru/connect?code=C5EE-9821 | `ctrl.device.65cba99c4116` |
| b | ADVERSARY | **`B135-B266`** | https://noema.guru/connect?code=B135-B266 | `ctrl.device.c865ee7b39ce` |
| c | VECTOR | **`2D79-E3B6`** | https://noema.guru/connect?code=2D79-E3B6 | `ctrl.device.995df01ed35e` |

### Superseded (do **not** Approve — reminted during this pass)

| Slot | Superseded code | Notes |
|------|-----------------|-------|
| a | `4396-0641` | First mint ~08:05Z; reminted to `C5EE-9821` when poller restarted |
| b | `DBB6-129E` | First mint ~08:06Z; reminted to `B135-B266` when poller restarted |

**Ping note for Admin:** Please Approve the three **ACTIVE** codes above (`C5EE-9821`, `B135-B266`, `2D79-E3B6`) for Gate B cohort reconnect. Connect pollers are waiting with `connect --no-enter` (no `--force`). After Approve, credentials should store locally and `status --json` should show `connected=true` / `credential=stored` with the same `controller_id`s if identity is preserved.

No browser Approve performed in this pass (not Danny-authorized for these codes).

---

## 3. Intended concurrent capture method (not executed — blocked)

Same library path as [ordering-probe.md](ordering-probe.md) / `/tmp/gateb_ordering_probe.py`:

1. For each connected config-dir, construct `NoemaClient(config_home=CFG, transport='http')`.
2. `observe()` / `ensure_in_world()` as needed.
3. Concurrent `ThreadPoolExecutor`: each controller `act(ActionProposal(action='LOOK'))`.
4. Capture `CommandResult.raw`, `.ok`, `.settled`, `.request_id`, `.idempotency_key`, observation `sequence`/`cycle`/`budgets`, `events[].sequence` / `payload.cost_paid`, `provenance`.
5. Redact tokens/authorization/secrets deeply.
6. Persist redacted JSON pack under `/tmp/gateb-concurrent-raw/` (not committed — digests only in docs).

**Safest act:** `LOOK` (utility, `requires.attention=1`) — same as contention-watch and ordering-probe.

---

## 4. Digest method (documented; digests **NOT_COMPUTABLE** this pass)

Planned opaque SHA-256 bindings (LCA2 cohort runner fields), computed only after ≥2 successful concurrent library acts:

| Digest field | Input material (redacted JSON, canonical `json.dumps(..., sort_keys=True, separators=(',', ':'))` UTF-8) | Hash |
|--------------|----------------------------------------------------------------------------------------------------------|------|
| `contention_evidence_digest` | Concat of all concurrent act records: per-slot `{slot,label,controller_id,player_id,wall_start,wall_end,ok,settled,request_id,idempotency_key,raw_top_keys}` + shared wall-clock overlap metadata | `sha256(concat)` hex |
| `ordering_evidence_digest` | Concat of per-act `{slot,request_id,obs.sequence,obs.cycle,events[].sequence,events[].event_id,events[].event_type,provenance}` sorted by `(sequence, event_id, slot)` | `sha256(concat)` hex |
| `budget_settlement_evidence_digest` | Concat of per-act `{slot,pre_budgets,post_budgets,cost_paid,settled,request_id}` + affordance note `LOOK requires.attention=1` | `sha256(concat)` hex |

**Method note:** “sha256 of redacted raw JSON concat” — redaction strips any key whose name contains `token`, `authorization`, `password`, `secret`, or `credential` (same helper as ordering-probe). Digests are opaque evidence bindings, not server-returned fields.

| Digest | Value this pass |
|--------|-----------------|
| `contention_evidence_digest` | **NOT_COMPUTABLE** (0 Controllers connected) |
| `ordering_evidence_digest` | **NOT_COMPUTABLE** |
| `budget_settlement_evidence_digest` | **NOT_COMPUTABLE** |

---

## 5. Connected count / gap summary

| Metric | Value |
|--------|-------|
| Connected count after reconnect attempts | **0** |
| Approve codes needed | **3** (ACTIVE table §2) |
| Concurrent multi-controller library LOOK | **not run** |
| Cohort digests | **not written** |

### Remaining gaps (do not invent)

1. Admin Approve of ACTIVE codes → reconnect a/b/c without `--force`.
2. Re-run concurrent LOOK (or safest available) on ≥2 Controllers via library `CommandResult.raw`.
3. Compute and retain the three digests with the method in §4.
4. Dedicated Gate-A-style **recovery receipt** / incident-recover pack still **NOT_COMPUTABLE** on act/observe (unchanged from ordering-probe).
5. Specs campaign state update still **OPEN** — not flipped here.
6. Separate-human-principal independence still **NOT_COMPUTABLE**.

### Explicit non-claims

- Gate B is **not** COMPLETE.
- Issue #590 stays **OPEN**.
- No Deploy. No Specs campaign flip. No tokens / `credential.json` / Authorization headers pasted.
- Digests above are **not** invented placeholders — they are explicitly **NOT_COMPUTABLE** until live concurrent capture succeeds.
