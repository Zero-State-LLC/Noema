# C7 Boof post-enroll actions — live Noema

**Date:** 2026-09-08 (PT)  
**Server:** `https://noema.guru`  
**CFG:** `/workspace/c7-boof-022-config`  
**BIN:** `/workspace/c7-noema-022/bin/noema`  
**Invocation:** `$BIN --server https://noema.guru --config-dir $CFG <cmd>`  
**Known controller (pre-connected):** `ctrl.device.9a3eabf9b619` (0817-7E9A)  
**Secrets:** none recorded (no tokens, no credential bodies)

---

## Step 1 — Baseline: `status --json` + `observe --json`

### Command
```
$BIN --server https://noema.guru --config-dir $CFG status --json
$BIN --server https://noema.guru --config-dir $CFG observe --json
```

### status (redacted summary)
| Field | Value |
|-------|-------|
| connected | true |
| controller_id | `ctrl.device.9a3eabf9b619` |
| controller_type | agent |
| credential | stored |
| player_id (status) | null |
| protocol | agent-protocol/v1 |
| transport | http |
| server | https://noema.guru |
| isolated | false |
| policy_blocked_actions | [] |
| attention_note | WAIT restores attention; cap ~8. Mix MOVE/INSPECT so play does not stall. |

### observe (identity + attention)
| Field | Value |
|-------|-------|
| player_id | `player.device9a3eabf9b619` |
| in_world | true |
| world_name | Perihelion Reach |
| location | Civic Exchange (`room.civic-exchange`) |
| cycle | 17256 |
| sequence | 40561 |
| budgets.attention | **8** |
| budgets.energy | 80 |
| budgets.compute | 64 |
| budgets.influence | 40 |
| budgets.storage | 16 |

### available_actions (affordance action names, unique)
`AGREEMENT_FORM`, `CONTEST_DECLARE`, `FOCUS`, `HARVEST`, `INSPECT`, `LOOK`, `MESSAGE`, `MOVE`, `ORG_CREATE`, `TRADE`, `WAIT`  
(plus build/dismantle variants present in Can-do hints after act)

### Safe-act candidates
| action | attention cost | notes |
|--------|----------------|-------|
| **LOOK** | **1** | preferred; available |
| INSPECT | 2 | several targets; higher than LOOK |

**Step 1: PASS** — baseline captured; player_id and attention noted; LOOK available.

---

## Step 2 — Safe act: LOOK

Prefer LOOK (attention 1) over INSPECT (attention 2). Fail-closed on spend/mail/legal (not attempted).

### Command
```
$BIN --server https://noema.guru --config-dir $CFG act LOOK
```

### Response (plain text, truncated)
```
World: Perihelion Reach
Place: Civic Exchange  cycle 17256 seq 40561
Just happened: You take in Civic Exchange.
Can do: INSPECT, HARVEST, MOVE, MESSAGE, TRADE, ORG_CREATE, LOOK, WAIT, FOCUS, CONTEST_DECLARE, AGREEMENT_FORM, DISMANTLE
...
```
**exit code:** 0

Post-act observe budgets.attention: **7** (was 8) — consistent with LOOK costing 1 attention.

**Step 2: PASS** — LOOK succeeded once; no spend/mail/legal actions used.

---

## Step 3 — Refuse path: invalid / unsupported action

Deliberate nonsense verbs; expect fail-closed.

### Commands
```
$BIN --server https://noema.guru --config-dir $CFG act FROBNICATE_NOPE
$BIN --server https://noema.guru --config-dir $CFG act XYZZY_INVALID entity.salvage-cache
```

### Results
| Attempt | stderr / output | exit |
|---------|-----------------|------|
| `act FROBNICATE_NOPE` | `POLICY_DENIED: FROBNICATE_NOPE gated by client policy` | **1** |
| `act XYZZY_INVALID entity.salvage-cache` | `POLICY_DENIED: XYZZY_INVALID gated by client policy` | **1** |

**Step 3: PASS** — refuse fails loudly with POLICY_DENIED; non-zero exit.

---

## Step 4 — Resync: disconnect (no `--forget`) then connect (no `--force`)

### Commands
```
$BIN --server https://noema.guru --config-dir $CFG disconnect
$BIN --server https://noema.guru --config-dir $CFG connect
$BIN --server https://noema.guru --config-dir $CFG status --json
$BIN --server https://noema.guru --config-dir $CFG observe --json
```

### disconnect
```
Disconnected local Controller session.
```
exit 0. Credential retained (no `--forget`).

### connect (no `--force`)
```
Discovering…

Connected.

World: Perihelion Reach
Controller: agent
Protocol: agent-protocol/v1
Credential: stored locally
```
exit 0. No re-enrollment / approval prompt.

### Identity verification
| Field | Before | After reconnect |
|-------|--------|-----------------|
| controller_id | `ctrl.device.9a3eabf9b619` | `ctrl.device.9a3eabf9b619` |
| player_id | `player.device9a3eabf9b619` | `player.device9a3eabf9b619` |
| in_world | true | true |
| world | Perihelion Reach | Perihelion Reach |

**Step 4: PASS** — reconnect preserves controller_id and player_id.

---

## Step 5 — Optional: `doctor --json` after reconnect

### Command
```
$BIN --server https://noema.guru --config-dir $CFG doctor --json
```

### Result (redacted)
| Field | Value |
|-------|-------|
| reachability | ok |
| discovery | agent-protocol/v1 |
| credential | stored |
| config_dir | `/workspace/c7-boof-022-config` |
| config_dir_mode | 0o700 |
| seal | required |
| server | https://noema.guru |
| isolated | false |
| policy_blocked_actions | [] |

exit 0.

**Step 5: PASS** (optional).

---

## Summary scorecard

| Step | Description | Result |
|------|-------------|--------|
| 1 | status + observe baseline | **PASS** |
| 2 | Safe act LOOK | **PASS** |
| 3 | Refuse invalid verb | **PASS** |
| 4 | disconnect → connect identity preserve | **PASS** |
| 5 | doctor after reconnect | **PASS** |

**Overall: PASS** — act succeeds once; refuse fails loudly; reconnect preserves identity. No secrets written.
