# Maint evolve supervisor

**Status:** approved — awaiting implementation plan  
**Date:** 2026-08-21  
**Host:** PLAY `world.perihelion-reach-3` / `genesis.94d0961984b2b4f8`; probes on isolated `test.hosted-canonical.*` only  
**Does not reseed, force-activate, or treat Admin as a Player (RFC-0120).**  
**No new Player verbs.**

A thin supervisor around existing `maint_patrol.py`: evolving **policy packs** and **propose prompts**, human-applied **plugins**, Admin **read-only** debug on PLAY, and **isolated** inhabit probes with a Player token.

---

## 1. Problem

`~/.config/noema/maint_patrol.py` already inhabits PLAY as `reach-maint3` (Player) and optionally auto-recovers INCIDENT (Admin). Legalize and Ollama propose exist in `maint_runner/`. That loop does not:

- evolve harvest caution / room priority / inspect skip from live LOOK (scars, `protocol_strength`, SAR)
- keep Admin JWT off LOOK/HARVEST while still pulsing `/ready` and head
- prove Deep Time / harvest persist on an isolated world before trusting PLAY
- accept new Python without a human

“Dynamically evolving” without those gates is how a maint worker invents TRADE thrash or reseeds.

---

## 2. Decisions (locked)

| Fork | Choice |
|------|--------|
| Actor | **Split tokens, same ops tree.** Player for inhabit; Admin only for lifecycle/debug. |
| Evolution | **Policy pack + prompt auto-evolve.** New `.py` plugins stay proposed until a human copies them to `enabled/`. |
| Debug | **Admin read-only on PLAY** (`/ready`, settlement, head pulse) plus **isolated probes** with `tester.env` (Player). Existing INCIDENT auto-recover stays in `maint_patrol.py`, not duplicated. |

Rejected: Admin-as-Player. Rejected: auto-import of proposed plugins. Rejected: live surgical pause/force from the supervisor. Rejected: rewriting inhabit on `noema-client` in this slice (client 0.1.13 remains the agent transport; patrol stays the shift engine).

---

## 3. Architecture

Two processes:

| Process | Token | May | Must not |
|---------|--------|-----|----------|
| `maint_patrol.py` | Player `maint.env` | ENTER/LOOK/INSPECT/WAIT/HARVEST on PLAY | Admin JWT, reseed, force, TRADE by default |
| `maint_evolve/supervisor.py` | Admin session read-only on PLAY; Player `tester.env` on isolated world | Load/validate packs, rebuild prompt, `/ready` + head pulse, spawn probe | PLAY inhabit, Admin-as-Player, `import` from `plugins/proposed/` |

```text
~/.config/noema/
  maint_patrol.py
  maint_runner/              # propose + legalize (keep)
  maint_evolve/
    supervisor.py
    packs/current.json       # auto-loaded if valid
    packs/proposed/          # failed or staged packs
    plugins/proposed/        # .py + sidecar .md; never imported
    plugins/enabled/         # human-copied only
    probe.py
    last-probe.json
```

`sys.path` includes `plugins/enabled/` only. `plugins/proposed/` is not importable.

Worker code in Zero-State-LLC/Noema does not need a new verb. Optional later: a docs pointer in `OPS.md` (local). Isolated probe uses existing world header / test world id (`test.hosted-canonical.*`), never `world.perihelion-reach-3`, never `world-01`.

---

## 4. Policy pack

`packs/current.json` is versioned JSON. Suggested keys (all optional; missing → built-in defaults):

| Key | Meaning |
|-----|---------|
| `schema_version` | Integer; unknown major → reject pack |
| `energy_floor` | Do not HARVEST below this energy |
| `harvest_caution` | Skip HARVEST if room `harvest_pressure` or public scar `strength` ≥ N |
| `inspect_skip` | Entity ids not to re-INSPECT |
| `room_priority` | Preferred room ids |
| `legalize_blocks` | Extra forbidden verbs (additive only) |
| `wait_before_look` | If last error `BUDGET_EXCEEDED` attention, WAIT first |
| `prompt_goals` | Strings injected into propose packet |

**Atomic replace:** write temp file, fsync, rename over `current.json` only after gates pass. Candidate failure leaves previous bytes unchanged.

Hard veto in code (pack cannot remove): TRADE (default), reseed, force, Admin JWT on command path, PLAY world_id on probe.

---

## 5. Prompt packet

Each supervisor shift rebuilds the propose packet from:

- last digest (`maint-patrol-summary.json` / `logs/last-digest.txt`)
- last LOOK: public scars, `protocol_strength`, `path_dependence_index`, SAR/economic_health alerts if present

Packet is data passed into existing `maint_runner/propose.py`. No rewriting `propose.py` from the supervisor.

---

## 6. Plugins

A proposed plugin is `plugins/proposed/<name>.py` plus `<name>.md` (why, content hash, tests run). Supervisor never imports it.

Human apply: copy to `plugins/enabled/`. Enabled plugins expose optional `after_look(obs) -> list[str]` **hints** only. They must not send HTTP or hold tokens. Patrol may print hints; it does not execute plugin-chosen verbs.

---

## 7. Isolated probe

Child `probe.py`:

1. Refuse to start if world_id is PLAY (`world.perihelion-reach-3`), frozen `world-01`, or unset.
2. Player token only (`tester.env`).
3. ENTER → LOOK → optional HARVEST if stock and pack allows → LOOK (scars/fragments must not reset if harvest applied).
4. Timeout then kill. Write `last-probe.json` (pass/fail, world_id, sequence, scar count).
5. Fail-closed on 5xx / wrong world_id in `/ready`.

---

## 8. Admin debug (PLAY)

Admin session:

- GET `/ready` (world_id, genesis_id, cycle, sequence, health)
- Canonical-head pulse / settlement health (existing operator endpoints)
- Do not LOOK/HARVEST/ENTER with Admin JWT
- Do not close/force/reseed from supervisor
- INCIDENT recover remains the existing `maint_patrol.py` `AUTO_RECOVER` path

If `/ready` identity ≠ pinned PLAY world/genesis → **stop spawning PLAY inhabit**, alert, do not reseed.

---

## 9. Shift flow

1. Load `current.json` or defaults.
2. Admin read-only pulse. Identity mismatch → halt PLAY inhabit.
3. Rebuild prompt packet.
4. Always derive a candidate pack from LOOK/SAR + last digest. If it equals `current.json`, skip. If it differs, run legalize+tests; pass → atomic current; fail → `packs/proposed/` + reason (inhabit keeps the old pack).
5. Run or continue `maint_patrol.py` with `NOEMA_POLICY_PACK` pointing at `current.json`.
6. If digest/pack requests probe → spawn `probe.py` on isolated world.
7. Append digest: coverage, harvest, scars, probe, pack version. Existing Buzz/cron delivery unchanged.

Patrol must still run if `maint_evolve/` is absent (defaults).

---

## 10. Errors

| Event | Behavior |
|-------|----------|
| Pack schema/legalize fail | Keep current pack; log; inhabit continues |
| Probe env is PLAY | Exit nonzero; no commands |
| Admin JWT on LOOK | Legalize hard error; never send |
| Probe timeout / 5xx | Fail probe; PLAY patrol continues |
| Import from `proposed/` | Impossible: not on `sys.path` |
| PLAY identity drift | Halt PLAY inhabit; alert; no reseed |

---

## 11. Tests (required before first auto-load)

- Good pack loads; missing keys use defaults
- Pack that “allows” TRADE/reseed/force still blocked in code
- Probe constructed with player token, not admin
- Probe refuse: PLAY or `world-01` world_id → nonzero
- Failed candidate leaves `current.json` bytes unchanged
- Patrol entrypoint works with no `maint_evolve/` directory

---

## 12. Non-goals

- New Player verbs
- Replacing lightweight `/watch` theater
- WATCH map UI work
- Auto-import plugins
- Admin-as-Player
- Reseed / force / same-id activate of reach-2
- Rewriting inhabit onto `noema-client` in this slice
- Live surgical pause of PLAY from the supervisor

---

## 13. Success

A shift can: pulse PLAY identity, auto-load a stricter harvest-caution pack after legalize, refuse a pack that enables TRADE, drop a plugin in `proposed/` without loading it, and pass an isolated HARVEST→LOOK scar persist probe — without reseeding and without Admin LOOK.
