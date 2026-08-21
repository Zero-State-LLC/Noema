# Live successor play — 2026-08-21

**Verdict.** ENTER works. HARVEST is advertised on Civic Exchange. The materials → CONSTRUCT path is **not** proven.

**Does not.** Reseed. Point PLAY at `world-01`. Treat Admin JWT as a Player token. Invent harvest from INFRASTRUCTURE labels.

**Live.** `GET https://noema.guru/ready` ACTIVE / HEALTHY / `world.perihelion-reach-2` / `genesis.dbeb43d198ce81b1` / cycle 1 / sequence 437→439. `/ready.players` stayed **0** (that metric is live **humans**, not agents).

**Agents this run.** `player.reach-maint3` (maint.env) and `player.tester` (tester.env). Both ENTER Civic Exchange over `/v1/command` with published seal `sha256:9b9c211c…`. Prabu's Controller was **not** in this session.

---

## 1. Both agents ENTER successor — PASS

| Agent | HTTP | ok | Room |
|---|---|---|---|
| `player.reach-maint3` | 200 | true | Civic Exchange |
| `player.tester` | 200 | true | Civic Exchange |

Budgets at ENTER:

| Agent | attention | compute | energy | influence | storage |
|---|---|---|---|---|---|
| reach-maint3 | 8 | 64 | **1** | 17 | 16 |
| tester | 2 | 32 | 40 | 0 | 16 |

---

## 2. HARVEST on Civic Exchange — advertised PASS, materials path FAIL

LOOK Civic Exchange entities (both agents):

| entity_id | type | stock |
|---|---|---|
| `entity.old-market-post` | INFRASTRUCTURE | none |
| `entity.salvage-cache` | NODE | **materials × 4** (then × 3 after tester HARVEST) |

LOOK HARVEST affordance: `harvest salvage-cache 1` / `target_id=entity.salvage-cache`.

| Agent | HARVEST available | Result |
|---|---|---|
| reach-maint3 | **false** — `You need energy 2 and compute 1 to harvest.` | COMMIT HARVEST 200 `BUDGET_EXCEEDED` same message |
| tester | **true** | COMMIT HARVEST 200 **ok**. Consequence: `Harvested 1 energy from Salvage Cache.` |

After tester HARVEST:

- Node stock **4 → 3** materials (LOOK)
- tester energy 40→39, compute 32→31, storage 16→15
- CONSTRUCT still `You do not have materials in hold.`

`WAIT` as reach-maint3 restored **attention** (6→8), **not** energy (stayed 1). Hold was empty, so RFC-0119 cargo-fuel energy grant did not apply. Second HARVEST still `BUDGET_EXCEEDED`.

---

## 3. LOOK advertised vs what failed

Advertised and usable:

- ENTER_WORLD, LOOK, WAIT
- HARVEST on `entity.salvage-cache` when energy ≥ 2
- RECONSTRUCT of `entity.relay-7` for reach-maint3 (attention remaining)

Advertised and **not** usable this run:

| Affordance | Why it failed |
|---|---|
| HARVEST (reach-maint3) | energy 1 < 2 |
| All CONSTRUCT classes | `You do not have materials in hold.` after a successful HARVEST of a **materials** node |
| tester RECONSTRUCT family | `You do not have enough attention.` |

**Live defect (this packet).** LOOK tells the truth that salvage-cache holds materials. Successful HARVEST decrements that stock but credits **energy** and does not fill materials hold. CONSTRUCT stays blocked. Do not invent harvest from the market-post INFRASTRUCTURE label.

---

## Follow-ups

1. Runtime: HARVEST of `stock_resource: materials` must put materials in hold (and consequence must not say energy).
2. Prabu's agent still needs ENTER via `/connect` + official client 0.1.12.
3. Docs honesty: production closeout + `spec-compat.json` live pins name the successor, not the frozen first world.
