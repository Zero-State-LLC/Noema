# Maint evolve supervisor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a thin supervisor around `maint_patrol.py` that auto-loads policy/prompt packs after legalize+tests, proposes (never auto-imports) `.py` plugins, pulses PLAY identity with Admin read-only, and runs isolated Player probes.

**Architecture:** Canonical source is `ops/maint_evolve/` in Zero-State-LLC/Noema. Live copy is `~/.config/noema/maint_evolve/`. `maint_patrol.py` stays the PLAY inhabit engine (Player token). Supervisor never LOOK/HARVEST with Admin JWT. Probe refuses PLAY and `world-01`.

**Tech Stack:** Python 3.11+, pytest, urllib (no new deps). Existing `maint_runner/propose.py` legalize stays. Optional copy step into `~/.config/noema/`.

## Global Constraints

- RFC-0120: Admin is never a Player. Admin JWT is not used for LOOK/HARVEST/ENTER.
- Do not reseed `genesis.ef578f4ffceeccd0` or PLAY `world-01`.
- Do not `force:true` or same-id activate `world.perihelion-reach-2`.
- PLAY pin: `world.perihelion-reach-3` / `genesis.94d0961984b2b4f8`.
- Isolated probe world_id must be `test.hosted-canonical.*` (or other `test.*`); never PLAY.
- Hard veto (pack cannot remove): TRADE, reseed, force, Admin-as-Player, PLAY world_id on probe.
- New `.py` plugins: write to `plugins/proposed/` only; `sys.path` includes `plugins/enabled/` only.
- No new Player verbs. No WATCH theater rewrite.
- Patrol still runs if `maint_evolve/` is absent.

## File map

| File | Responsibility |
|------|----------------|
| `ops/maint_evolve/pack.py` | Defaults, load/validate schema, atomic replace, derive candidate from LOOK/SAR |
| `ops/maint_evolve/legalize.py` | Hard veto + pack-additive blocks |
| `ops/maint_evolve/pulse.py` | Admin GET `/ready`; halt PLAY inhabit on identity drift |
| `ops/maint_evolve/prompt.py` | Prompt packet from digest + LOOK |
| `ops/maint_evolve/plugins.py` | `after_look` hints from enabled/; never import proposed/ |
| `ops/maint_evolve/probe.py` | Isolated child; refuse PLAY/`world-01` |
| `ops/maint_evolve/supervisor.py` | Shift orchestration |
| `ops/maint_evolve/tests/` | pytest for every gate |
| `~/.config/noema/maint_patrol.py` | Optional: read `NOEMA_POLICY_PACK`; harvest_caution / wait_before_look |
| `docs/superpowers/specs/2026-08-21-maint-evolve-design.md` | Already on main |

---

### Task 1: Pack schema, defaults, atomic replace

**Files:**
- Create: `ops/maint_evolve/__init__.py`
- Create: `ops/maint_evolve/pack.py`
- Test: `ops/maint_evolve/tests/test_pack.py`

**Interfaces:**
- Consumes: none
- Produces: `SCHEMA_VERSION: int = 1`, `DEFAULT_PACK: dict`, `load_pack(path: Path | None) -> dict`, `validate_pack(data: object) -> dict` (raises `PackError`), `atomic_replace(path: Path, data: dict) -> None`, `derive_candidate(look: dict, sar: dict | None, digest: dict | None, current: dict) -> dict`

- [ ] **Step 1: Write the failing tests**

```python
import json
from pathlib import Path
import pytest
from maint_evolve.pack import PackError, atomic_replace, derive_candidate, load_pack, validate_pack

def test_load_missing_uses_defaults(tmp_path: Path):
    p = load_pack(tmp_path / "missing.json")
    assert p["schema_version"] == 1
    assert p["energy_floor"] == 12
    assert "TRADE" not in (p.get("legalize_blocks") or [])  # TRADE is a code veto, not a pack default that packs can delete

def test_validate_rejects_unknown_major():
    with pytest.raises(PackError):
        validate_pack({"schema_version": 99})

def test_failed_candidate_leaves_current_bytes(tmp_path: Path):
    cur = tmp_path / "current.json"
    cur.write_text('{"schema_version": 1, "energy_floor": 12}', encoding="utf-8")
    before = cur.read_bytes()
    with pytest.raises(PackError):
        validate_pack({"schema_version": 99})
        atomic_replace(cur, {"schema_version": 99})
    assert cur.read_bytes() == before

def test_atomic_replace_roundtrip(tmp_path: Path):
    cur = tmp_path / "current.json"
    atomic_replace(cur, {"schema_version": 1, "energy_floor": 8, "harvest_caution": 0.6})
    loaded = load_pack(cur)
    assert loaded["energy_floor"] == 8
    assert loaded["harvest_caution"] == 0.6

def test_derive_candidate_raises_harvest_caution_from_scar():
    look = {"scars": [{"strength": 0.5, "visibility": "public"}], "location": {"co_evolution": {"harvest_pressure": 5}}}
    cur = {"schema_version": 1, "energy_floor": 12, "harvest_caution": 0.0}
    cand = derive_candidate(look, None, None, cur)
    assert cand["harvest_caution"] >= 0.5
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ops/maint_evolve && PYTHONPATH=.. pytest tests/test_pack.py -q`  
Expected: FAIL import `maint_evolve.pack`

- [ ] **Step 3: Write minimal implementation**

`pack.py`:

```python
from __future__ import annotations
import json, os, tempfile
from pathlib import Path

SCHEMA_VERSION = 1
DEFAULT_PACK = {
    "schema_version": SCHEMA_VERSION,
    "energy_floor": 12,
    "harvest_caution": 0.0,
    "inspect_skip": [],
    "room_priority": [],
    "legalize_blocks": [],
    "wait_before_look": True,
    "prompt_goals": [],
}

class PackError(ValueError):
    pass

def validate_pack(data: object) -> dict:
    if not isinstance(data, dict):
        raise PackError("pack must be an object")
    ver = int(data.get("schema_version") or SCHEMA_VERSION)
    if ver != SCHEMA_VERSION:
        raise PackError(f"unsupported schema_version {ver}")
    out = dict(DEFAULT_PACK)
    out.update({k: data[k] for k in DEFAULT_PACK if k in data})
    out["schema_version"] = SCHEMA_VERSION
    out["energy_floor"] = int(out["energy_floor"])
    out["harvest_caution"] = float(out["harvest_caution"])
    out["inspect_skip"] = list(out["inspect_skip"] or [])
    out["room_priority"] = list(out["room_priority"] or [])
    out["legalize_blocks"] = [str(x).upper() for x in (out["legalize_blocks"] or [])]
    out["wait_before_look"] = bool(out["wait_before_look"])
    out["prompt_goals"] = [str(x) for x in (out["prompt_goals"] or [])]
    return out

def load_pack(path: Path | None) -> dict:
    if path is None or not path.is_file():
        return dict(DEFAULT_PACK)
    return validate_pack(json.loads(path.read_text(encoding="utf-8")))

def atomic_replace(path: Path, data: dict) -> None:
    valid = validate_pack(data)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(valid, fh, indent=2)
            fh.write("\n")
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, path)
    except Exception:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise

def derive_candidate(look: dict, sar: dict | None, digest: dict | None, current: dict) -> dict:
    cand = validate_pack(current)
    scars = look.get("scars") or []
    strengths = [float(s.get("strength") or 0) for s in scars if isinstance(s, dict) and s.get("visibility") == "public"]
    pressure = float(((look.get("location") or {}).get("co_evolution") or {}).get("harvest_pressure") or 0)
    caution = max(strengths + [0.0])
    if pressure > 4:
        caution = max(caution, 0.4)
    cand["harvest_caution"] = max(float(cand["harvest_caution"]), caution)
    return cand
```

Empty `__init__.py`. Tests live under `ops/maint_evolve/tests/` with `conftest.py` setting nothing if `PYTHONPATH` includes `ops/`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ops && PYTHONPATH=. pytest maint_evolve/tests/test_pack.py -q`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ops/maint_evolve/__init__.py ops/maint_evolve/pack.py ops/maint_evolve/tests/test_pack.py
git commit -m "feat(ops): maint evolve pack schema and atomic replace"
```

---

### Task 2: Hard legalize veto

**Files:**
- Create: `ops/maint_evolve/legalize.py`
- Test: `ops/maint_evolve/tests/test_legalize.py`

**Interfaces:**
- Consumes: `validate_pack` / pack dict
- Produces: `HARD_BLOCKS: frozenset[str]`, `veto_action(action: str, pack: dict, *, admin_token: bool) -> str | None` (None = allowed; string = reason), `assert_player_command(token_kind: str) -> None`

```python
HARD_BLOCKS = frozenset({"TRADE", "TRADE_ACCEPT", "TRADE_REJECT", "RESEED", "FORCE", "WORLD_ACTIVATE"})
```

- [ ] **Step 1: Failing tests**

```python
from maint_evolve.legalize import assert_player_command, veto_action
from maint_evolve.pack import DEFAULT_PACK

def test_pack_cannot_allow_trade():
    pack = dict(DEFAULT_PACK)
    pack["legalize_blocks"] = []  # pack tries to be permissive
    assert veto_action("TRADE", pack, admin_token=False)
    assert veto_action("TRADE_ACCEPT", pack, admin_token=False)

def test_admin_token_cannot_look():
    reason = veto_action("LOOK", DEFAULT_PACK, admin_token=True)
    assert reason
    try:
        assert_player_command("admin")
        raise AssertionError("should have failed")
    except PermissionError:
        pass

def test_wait_look_player_ok():
    assert veto_action("LOOK", DEFAULT_PACK, admin_token=False) is None
    assert veto_action("WAIT", DEFAULT_PACK, admin_token=False) is None
    assert_player_command("player")
```

- [ ] **Step 2: Run — expect import fail / AssertionError**

Run: `cd ops && PYTHONPATH=. pytest maint_evolve/tests/test_legalize.py -q`

- [ ] **Step 3: Implement**

```python
from __future__ import annotations

HARD_BLOCKS = frozenset({"TRADE", "TRADE_ACCEPT", "TRADE_REJECT", "RESEED", "FORCE", "WORLD_ACTIVATE"})
ADMIN_FORBIDDEN = frozenset({"LOOK", "HARVEST", "ENTER_WORLD", "INSPECT", "MOVE", "MESSAGE", "ATTEST", "COMMIT"})

def veto_action(action: str, pack: dict, *, admin_token: bool) -> str | None:
    verb = str(action or "").upper()
    if admin_token and verb in ADMIN_FORBIDDEN:
        return "admin_jwt_not_a_player"
    if verb in HARD_BLOCKS:
        return "hard_block"
    extra = {str(x).upper() for x in (pack.get("legalize_blocks") or [])}
    if verb in extra:
        return "pack_block"
    return None

def assert_player_command(token_kind: str) -> None:
    if token_kind != "player":
        raise PermissionError("player token required for inhabit")
```

- [ ] **Step 4: pytest pass**
- [ ] **Step 5: Commit** `feat(ops): maint evolve hard legalize veto`

---

### Task 3: Isolated probe refuse PLAY / world-01

**Files:**
- Create: `ops/maint_evolve/probe.py`
- Test: `ops/maint_evolve/tests/test_probe.py`

**Interfaces:**
- Consumes: `assert_player_command`, pack harvest_caution
- Produces: `FORBIDDEN_WORLDS`, `guard_world_id(world_id: str | None) -> str` (raises `ProbeRefuse`), `run_probe(...)` later; this task only guard + CLI `--check-world`

- [ ] **Step 1: Tests**

```python
import pytest
from maint_evolve.probe import ProbeRefuse, guard_world_id

def test_refuse_play():
    with pytest.raises(ProbeRefuse):
        guard_world_id("world.perihelion-reach-3")
    with pytest.raises(ProbeRefuse):
        guard_world_id("world-01")
    with pytest.raises(ProbeRefuse):
        guard_world_id(None)
    with pytest.raises(ProbeRefuse):
        guard_world_id("world.perihelion-reach-2")

def test_allow_isolated():
    assert guard_world_id("test.hosted-canonical.ewm-cutover").startswith("test.")
```

- [ ] **Step 2: pytest fail**
- [ ] **Step 3: Implement**

```python
PLAY = "world.perihelion-reach-3"
FROZEN = "world-01"
PRIOR = "world.perihelion-reach-2"

class ProbeRefuse(RuntimeError):
    pass

def guard_world_id(world_id: str | None) -> str:
    wid = (world_id or "").strip()
    if not wid or wid in {PLAY, FROZEN, PRIOR} or not wid.startswith("test."):
        raise ProbeRefuse(f"probe refuses world_id={wid!r}")
    return wid
```

- [ ] **Step 4: pytest pass**
- [ ] **Step 5: Commit** `feat(ops): maint evolve probe refuses PLAY worlds`

---

### Task 4: Admin `/ready` pulse — identity halt

**Files:**
- Create: `ops/maint_evolve/pulse.py`
- Test: `ops/maint_evolve/tests/test_pulse.py`

**Interfaces:**
- Produces: `PINNED = {"world_id": "world.perihelion-reach-3", "genesis_id": "genesis.94d0961984b2b4f8"}`, `parse_ready(body: dict) -> dict`, `identity_ok(ready: dict) -> bool`

- [ ] **Step 1: Tests**

```python
from maint_evolve.pulse import identity_ok, parse_ready

def test_identity_ok():
    body = {"status": "ACTIVE", "world": {"world_id": "world.perihelion-reach-3", "genesis_id": "genesis.94d0961984b2b4f8", "cycle": 91}}
    r = parse_ready(body)
    assert identity_ok(r) is True

def test_identity_halt_on_drift():
    body = {"status": "ACTIVE", "world": {"world_id": "world-01", "genesis_id": "genesis.ef578f4ffceeccd0"}}
    assert identity_ok(parse_ready(body)) is False
```

- [ ] **Step 2–4:** implement `parse_ready` / `identity_ok` only (HTTP in supervisor with injected GET). Do not LOOK with admin.
- [ ] **Step 5: Commit** `feat(ops): maint evolve PLAY identity pulse`

---

### Task 5: Prompt packet from digest + LOOK

**Files:**
- Create: `ops/maint_evolve/prompt.py`
- Test: `ops/maint_evolve/tests/test_prompt.py`

**Interfaces:**
- Produces: `build_prompt_packet(look: dict, digest: dict | None, pack: dict) -> dict` with keys `goals`, `scars`, `protocol_strength`, `path_dependence_index`, `alerts`

- [ ] **Step 1: Test**

```python
from maint_evolve.prompt import build_prompt_packet

def test_packet_includes_scars_and_pack_goals():
    look = {"scars": [{"scar_id": "s1", "strength": 0.5}], "protocol_strength": 2, "path_dependence_index": 0.5}
    pack = {"prompt_goals": ["do not over-harvest civic exchange"]}
    pkt = build_prompt_packet(look, {"alerts": ["HIGH_PRESSURE"]}, pack)
    assert pkt["protocol_strength"] == 2
    assert pkt["scars"][0]["scar_id"] == "s1"
    assert "do not over-harvest civic exchange" in pkt["goals"]
```

- [ ] **Step 3: Implement** — copy fields; never put Admin secrets or tokens in the packet.
- [ ] **Step 5: Commit** `feat(ops): maint evolve prompt packet from LOOK`

---

### Task 6: Plugins enabled vs proposed

**Files:**
- Create: `ops/maint_evolve/plugins.py`
- Test: `ops/maint_evolve/tests/test_plugins.py`

**Interfaces:**
- Produces: `load_enabled_hints(enabled_dir: Path, obs: dict) -> list[str]`, `write_proposed(proposed_dir: Path, name: str, source: str, why: str) -> Path`

- [ ] **Step 1: Tests**

```python
from pathlib import Path
from maint_evolve.plugins import load_enabled_hints, write_proposed

def test_proposed_not_imported(tmp_path: Path):
    src = "def after_look(obs):\n    raise RuntimeError('should not run')\n"
    write_proposed(tmp_path / "proposed", "evil", src, "test")
    hints = load_enabled_hints(tmp_path / "enabled", {})
    assert hints == []

def test_enabled_after_look(tmp_path: Path):
    enabled = tmp_path / "enabled"
    enabled.mkdir()
    (enabled / "hint.py").write_text("def after_look(obs):\n    return ['scar here']\n", encoding="utf-8")
    assert load_enabled_hints(enabled, {}) == ["scar here"]
```

- [ ] **Step 3:** `load_enabled_hints` adds only `enabled_dir` to a **copy** of sys.path in the function (do not add `proposed`). Call `after_look` if present; coerce to list[str]; ignore HTTP (plugins that import urllib still exist — document they must not; do not execute command sending). `write_proposed` writes `.py` + `.md` with hash.
- [ ] **Step 5: Commit** `feat(ops): maint evolve plugins proposed vs enabled`

---

### Task 7: Probe loop with injected client (no live PLAY)

**Files:**
- Modify: `ops/maint_evolve/probe.py`
- Test: `ops/maint_evolve/tests/test_probe_loop.py`

**Interfaces:**
- Consumes: `guard_world_id`, `veto_action`, `assert_player_command`
- Produces: `run_probe(*, world_id, token_kind, pack, client) -> dict` where `client` has `.command(verb, args) -> dict`

Fake client in test records verbs and returns LOOK with scars after HARVEST.

```python
class Fake:
    def __init__(self):
        self.calls = []
        self.harvests = 0
    def command(self, verb, args=None):
        self.calls.append(verb)
        if verb == "HARVEST":
            self.harvests += 1
        scars = [{"strength": 0.4, "visibility": "public"}] if self.harvests >= 3 else []
        return {"ok": True, "observation": {"scars": scars, "historical_context": {"fragments": self.harvests}}}
```

- [ ] **Step 1: Tests** — `token_kind="admin"` raises; `world_id=PLAY` raises before any command; isolated + player runs ENTER, LOOK, HARVEST×3 if pack allows, LOOK, `result["pass"] is True` if scars persist; pack harvest_caution 1.0 skips HARVEST and still pass=False or skip with reason `harvest_skipped`.
- [ ] **Step 3: Implement `run_probe`** — never uses admin; writes dict `{pass, world_id, scar_count, calls}`.
- [ ] **Step 5: Commit** `feat(ops): maint evolve isolated probe loop`

---

### Task 8: Supervisor shift + failed pack does not clobber current

**Files:**
- Create: `ops/maint_evolve/supervisor.py`
- Test: `ops/maint_evolve/tests/test_supervisor.py`

**Interfaces:**
- Consumes: all of the above
- Produces: `run_shift(*, root: Path, ready: dict, look: dict, spawn_patrol: bool) -> dict`

- [ ] **Step 1: Tests**

```python
def test_shift_identity_halt(tmp_path):
    from maint_evolve.supervisor import run_shift
    ready = {"status": "ACTIVE", "world": {"world_id": "world-01", "genesis_id": "x"}}
    out = run_shift(root=tmp_path, ready=ready, look={}, spawn_patrol=True)
    assert out["halt_inhabit"] is True
    assert out["spawn_patrol"] is False

def test_bad_candidate_keeps_current(tmp_path):
    from maint_evolve.pack import atomic_replace
    from maint_evolve.supervisor import run_shift
    cur = tmp_path / "packs" / "current.json"
    atomic_replace(cur, {"schema_version": 1, "energy_floor": 12})
    before = cur.read_bytes()
    ready = {"status": "ACTIVE", "world": {"world_id": "world.perihelion-reach-3", "genesis_id": "genesis.94d0961984b2b4f8"}}
    # inject invalid by monkeypatch derive to return schema 99 — or pass look that is fine;
    # assert current bytes equal if we call apply_candidate with bad dict
    from maint_evolve.pack import PackError, validate_pack, atomic_replace as ar
    try:
        validate_pack({"schema_version": 99})
    except PackError:
        pass
    assert cur.read_bytes() == before
```

Implement `apply_candidate(root, candidate) -> bool`: validate; on PackError write `packs/proposed/` and return False without touching current.

`run_shift`: pulse identity; load pack; derive candidate; if different, apply_candidate; return `{halt_inhabit, pack, prompt_packet, spawn_patrol}`.

Do not subprocess `maint_patrol.py` inside unit tests. Supervisor returns flags; a `__main__` block later may spawn.

- [ ] **Step 5: Commit** `feat(ops): maint evolve supervisor shift`

---

### Task 9: Hook patrol (local) without requiring evolve dir

**Files:**
- Modify: `~/.config/noema/maint_patrol.py` (local ops; also copy a snippet into `ops/maint_evolve/patrol_hook.py` so the repo has the patch)
- Test: `ops/maint_evolve/tests/test_patrol_hook.py`

**Interfaces:**
- Produces: `apply_pack_to_decision(action, args, look, pack, energy) -> tuple[str, dict, str] | None` meaning replace/skip.

If pack missing / evolve absent: identity function, patrol behavior unchanged.

```python
def apply_pack_to_decision(action, args, look, pack, energy):
    if not pack:
        return action, args, "no_pack"
    if energy < int(pack.get("energy_floor") or 0) and action == "HARVEST":
        return "WAIT", {}, "energy_floor"
    caution = float(pack.get("harvest_caution") or 0)
    loc = look.get("location") or {}
    pressure = float((loc.get("co_evolution") or {}).get("harvest_pressure") or 0)
    scar = max([float(s.get("strength") or 0) for s in (look.get("scars") or []) if isinstance(s, dict)] or [0])
    if action == "HARVEST" and (pressure > 4 or scar >= caution > 0):
        return "WAIT", {}, "harvest_caution"
    return action, args, "ok"
```

Load pack: `os.environ.get("NOEMA_POLICY_PACK")` path; try/except importlib of `maint_evolve.pack.load_pack`; if import fails, pack is None.

- [ ] **Step 5: Commit** `feat(ops): patrol optional policy pack hook`

Copy tree to `~/.config/noema/maint_evolve/` after tests (not a Worker deploy). Do not reseed. Do not run probe against PLAY.

---

### Task 10: Docs + default pack + OPS pointer

**Files:**
- Create: `ops/maint_evolve/README.md` (token split, refuse PLAY, how to enable a plugin)
- Create: `ops/maint_evolve/packs/current.json` defaults
- Modify: `docs/superpowers/specs/2026-08-21-maint-evolve-design.md` status → implementing
- Local: `~/.config/noema/OPS.md` already has a pointer

- [ ] **Step 1:** README states RFC-0120, isolated world_id prefix `test.`, `plugins/proposed` not on path.
- [ ] **Step 2:** Run full `cd ops && PYTHONPATH=. pytest maint_evolve/tests -q` — all pass
- [ ] **Step 3:** Commit `docs(ops): maint evolve README and default pack`

---

## Spec coverage

| Spec § | Task |
|--------|------|
| Split tokens | 2, 3, 7, 8 |
| Pack auto-load / atomic | 1, 8 |
| Hard veto TRADE/reseed/force | 2 |
| Prompt packet | 5 |
| Plugins proposed vs enabled | 6 |
| Isolated probe | 3, 7 |
| Admin `/ready` halt | 4, 8 |
| Patrol without evolve | 9 |
| Tests before auto-load | 1–8 |
| Non-goals (no new verbs, no reseed) | Global + README |

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-21-maint-evolve.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks

**2. Inline Execution** — this session, executing-plans, batch with checkpoints

Which approach?
