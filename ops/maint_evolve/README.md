# maint_evolve

Thin supervisor around `maint_patrol.py`: policy packs, propose prompts, human-applied plugins, Admin read-only PLAY pulse, isolated Player probes.

Canonical source: `ops/maint_evolve/` in this repo. Live copy: `~/.config/noema/maint_evolve/`. Spec: `docs/superpowers/specs/2026-08-21-maint-evolve-design.md`.

## RFC-0120 / token split

| Process | Token | May | Must not |
|---------|--------|-----|----------|
| `maint_patrol.py` | Player (`maint.env`) | ENTER / LOOK / INSPECT / WAIT / HARVEST on PLAY | Admin JWT, reseed, force, TRADE by default |
| `supervisor.py` | Admin session read-only on PLAY; Player (`tester.env`) on isolated worlds | Load/validate packs, rebuild prompt, `/ready` + head pulse, spawn probe | PLAY inhabit, Admin-as-Player, import from `plugins/proposed/` |

Admin is never a Player. Admin JWT is never used for LOOK / HARVEST / ENTER.

## Refuse PLAY on probe

Isolated probes use `world_id` with prefix `test.` (e.g. `test.hosted-canonical.*`).

Probe refuses:

- PLAY (`world.perihelion-reach-3`)
- frozen `world-01`
- unset / non-`test.*` ids

Hard vetoes (pack cannot remove): TRADE, reseed, force, Admin-as-Player, PLAY world_id on probe.

## Packs

`packs/current.json` is auto-loaded when valid (`schema_version` 1). Missing keys fall back to `DEFAULT_PACK` in `pack.py`. Failed candidates go to `packs/proposed/` and leave `current.json` bytes unchanged (atomic replace only after validate).

Point patrol at the pack with `NOEMA_POLICY_PACK` (see `patrol_hook.py`). Patrol still runs if `maint_evolve/` is absent.

## Plugins: proposed vs enabled

```text
plugins/proposed/   # .py + sidecar .md; never imported; not on sys.path
plugins/enabled/    # human-copied only; optional after_look(obs) -> list[str] hints
```

`sys.path` includes `plugins/enabled/` only. `plugins/proposed/` is not importable.

### Enable a plugin

1. Review `plugins/proposed/<name>.py` and `<name>.md` (why, content hash, tests).
2. Copy both into `plugins/enabled/`.
3. Restart the shift / patrol that loads enabled plugins.

Enabled plugins emit **hints only**. They must not send HTTP, hold tokens, or choose verbs for patrol to execute.

## Non-goals

No new Player verbs. No reseed / force / same-id activate. No auto-import of proposed plugins. No Admin-as-Player. No live surgical pause of PLAY from this supervisor.

## CLI

Pulse PLAY identity (public `/ready`, no Admin JWT, no inhabit):

```bash
cd ops && PYTHONPATH=. python -m maint_evolve.supervisor --root "$PWD/maint_evolve"
```

Isolated probe (Player token injected by ops; **refuses PLAY**):

```bash
PYTHONPATH=ops python -m maint_evolve.probe --world-id test.hosted-canonical.ewm-cutover --root ~/.config/noema/maint_evolve
```

`--spawn-patrol` is opt-in and still blocked if `/ready` identity drifted. Do not run the probe at `world.perihelion-reach-3`.

## Tests

```bash
cd ops && PYTHONPATH=. pytest maint_evolve/tests -q
```
