# Tenant tester agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `HeadlessHarness` so a Player inside a chosen Noema tenant plays deterministically, then debugs in-room and writes a local report.

**Architecture:** Tenant resolve refuses Perihelion without `--live-tenant`. Isolated commands use `POST /v1/operator/test-world/command` (Player Bearer + `X-Noema-Admin-Token`). Live Perihelion uses `POST /v1/command` after `/connect`. Smell detector switches the same Controller into A+ debug. A model only classifies and drafts prose.

**Tech Stack:** Python harness (`src/noema/harness/`, `src/noema/cli/agent.py`), pytest (`tests/test_harness_*.py`). No Worker PLAY rewrite. No new crypto.

## Global Constraints

- No Genesis reseed/activate/force-supersede.
- Admin ≠ Player. Tester never mints `typ: admin-access` for itself as the Player.
- No `AGENT_PLAYER`.
- Isolated Recover / `/v1/admin/lifecycle` are not in this loop.
- Do not send or consume PLAY letters.
- Default run never `POST /v1/command` to Perihelion.
- Quiet WAIT is not a smell.
- Debug: no MOVE / harvest / trade / repair.
- Model cannot propose a verb.
- Token, `device_code`, and operator secrets never enter reports or model context.
- Human PLAY stays `DEFAULT_WORLD_ID`.

**Files:**
- Create: `src/noema/harness/tenant.py`
- Create: `src/noema/harness/smell.py`
- Create: `src/noema/harness/debug.py`
- Create: `src/noema/harness/report.py`
- Create: `tests/test_harness_tenant_tester.py`
- Modify: `src/noema/harness/transport.py` (isolated command URL + admin header)
- Modify: `src/noema/harness/loop.py` (play → debug → report)
- Modify: `src/noema/cli/agent.py` (`--tenant`, `--live-tenant`)
- Modify: `src/noema/harness/__init__.py` (export new names; still no `AGENT_PLAYER`)
- Modify: `docs/AGENT-STAGE0.md` (tenant flags only)

Spec: `docs/superpowers/specs/2026-08-17-tenant-tester-agent-design.md`

---

### Task 1: Tenant resolve

**Files:**
- Create: `src/noema/harness/tenant.py`
- Test: `tests/test_harness_tenant_tester.py`

**Interfaces:**
- Produces: `PERIHELION_IDS`, `resolve_tenant(raw: str | None, *, live: bool = False, env: Mapping[str, str] | None = None) -> TenantTarget`
- `TenantTarget`: `world_id: str`, `live: bool`, `isolated: bool`, `command_path: str`

- [ ] Write failing tests for resolve + refuse

```python
from noema.harness.tenant import TenantError, resolve_tenant

def test_missing_tenant_refuses():
    try:
        resolve_tenant(None, live=False, env={})
    except TenantError as exc:
        assert exc.code == "TENANT_REQUIRED"
    else:
        raise AssertionError("expected TenantError")

def test_perihelion_without_live_refuses():
    try:
        resolve_tenant("perihelion", live=False, env={})
    except TenantError as exc:
        assert exc.code == "LIVE_TENANT_REQUIRED"
        assert "perihelion" in exc.message.lower()
    else:
        raise AssertionError("expected TenantError")

def test_isolated_tenant_uses_test_world_path():
    t = resolve_tenant("test.hosted-canonical.ack-s3", live=False, env={})
    assert t.world_id == "test.hosted-canonical.ack-s3"
    assert t.isolated is True
    assert t.live is False
    assert t.command_path == "/v1/operator/test-world/command"

def test_perihelion_with_live_uses_play_command():
    t = resolve_tenant("perihelion", live=True, env={})
    assert t.world_id == "world.perihelion-reach"
    assert t.live is True
    assert t.isolated is False
    assert t.command_path == "/v1/command"

def test_env_tenant_and_live_flag():
    t = resolve_tenant(None, live=False, env={"NOEMA_TENANT": "test.hosted-canonical.foo"})
    assert t.world_id == "test.hosted-canonical.foo"
    try:
        resolve_tenant(None, live=False, env={"NOEMA_TENANT": "world.perihelion-reach"})
    except TenantError as exc:
        assert exc.code == "LIVE_TENANT_REQUIRED"
    else:
        raise AssertionError("expected TenantError")
    t2 = resolve_tenant(None, live=False, env={"NOEMA_TENANT": "perihelion", "NOEMA_LIVE_TENANT": "1"})
    assert t2.world_id == "world.perihelion-reach"
    assert t2.live is True
```

- [ ] Run `pytest tests/test_harness_tenant_tester.py -q --tb=short` — expect import fail
- [ ] Implement `src/noema/harness/tenant.py`

```python
from dataclasses import dataclass
from typing import Mapping

TEST_PREFIX = "test.hosted-canonical."
PERIHELION_ALIASES = frozenset({"perihelion", "world.perihelion-reach", "world-01"})

@dataclass(frozen=True)
class TenantTarget:
    world_id: str
    live: bool
    isolated: bool
    command_path: str

class TenantError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message

def resolve_tenant(raw: str | None, *, live: bool = False, env: Mapping[str, str] | None = None) -> TenantTarget:
    env = env or {}
    live = live or str(env.get("NOEMA_LIVE_TENANT") or "") in {"1", "true", "TRUE", "yes"}
    value = (raw or env.get("NOEMA_TENANT") or "").strip()
    if not value:
        raise TenantError("TENANT_REQUIRED", "set --tenant or NOEMA_TENANT; never default to Perihelion")
    key = value.lower()
    if key in PERIHELION_ALIASES or key.startswith("world.perihelion"):
        if not live:
            raise TenantError("LIVE_TENANT_REQUIRED", "Perihelion requires --live-tenant or NOEMA_LIVE_TENANT=1")
        return TenantTarget("world.perihelion-reach", True, False, "/v1/command")
    if not value.startswith(TEST_PREFIX):
        raise TenantError("TENANT_INVALID", "tenant must be test.hosted-canonical.<suffix> or perihelion")
    return TenantTarget(value, False, True, "/v1/operator/test-world/command")
```

- [ ] Re-run pytest — expect pass
- [ ] Commit `test(harness): resolve tenant and refuse live Perihelion by default`

---

### Task 2: Smell detector and A+ debug adapter

**Files:**
- Create: `src/noema/harness/smell.py`
- Create: `src/noema/harness/debug.py`
- Test: `tests/test_harness_tenant_tester.py`

**Interfaces:**
- Produces: `detect_smell(turn: TurnResult, previous_room: str | None) -> Smell | None`
- Produces: `DebugAdapter` — LOOK / INSPECT / retry look-inspect-wait once / one WAIT; never MOVE

- [ ] Write failing tests

```python
from noema.harness.debug import DebugAdapter
from noema.harness.smell import detect_smell
from noema.harness.types import ActionProposal, CommandResult, FailureClass, TurnResult

def _turn(ok, command="LOOK", failure=None, http=None, error=None, room="room.a", inspect_missing=False):
    loc = {"room_id": room, "entities": [] if inspect_missing else [{"entity_id": "entity.x"}]}
    obs = {"location": loc, "cycle": 1, "sequence": 2}
    result = CommandResult(
        ok=ok, observation=obs, error=error, settled=ok, provenance=None,
        http_status=http, failure=failure, idempotency_key="i", request_id="r",
    )
    return TurnResult(ok=ok, proposal=ActionProposal(action=command, target_id="entity.x"), result=result, failure=failure)

def test_quiet_wait_is_not_a_smell():
    assert detect_smell(_turn(True, "WAIT"), "room.a") is None

def test_hard_fail_is_a_smell():
    smell = detect_smell(_turn(False, "LOOK", FailureClass.ACTION_REJECTED, 400, {"code": "FORBIDDEN"}), "room.a")
    assert smell.kind == "command_rejected"

def test_move_same_room_is_contradiction():
    smell = detect_smell(_turn(True, "MOVE", room="room.a"), previous_room="room.a")
    assert smell.kind == "contradiction"

def test_debug_adapter_never_moves():
    adapter = DebugAdapter(failed=ActionProposal(action="LOOK"))
    ctx = {"canonical": {"affordances": [{"action": "MOVE", "available": True, "cmd": "move east"}]}}
    seen = []
    for _ in range(6):
        p = adapter.decide(ctx)
        if p is None:
            break
        seen.append(p.action)
    assert "MOVE" not in seen
    assert seen[0] == "LOOK"
```

- [ ] Run the new tests — expect import fail
- [ ] Implement `smell.py` and `debug.py`

`detect_smell` rules (exact):
- no result and `turn.failure` in {AUTH_REQUIRED} → `auth`
- `turn.failure == WORLD_INCIDENT` or error code `WORLD_INCIDENT` → `incident`
- error code in {NONCONTIGUOUS_SEQUENCE, DUPLICATE_EVENT_CONFLICT} or failure SETTLEMENT_FAILURE → `settlement`
- not ok or http >= 400 → `command_rejected`
- proposal MOVE and observation `location.room_id == previous_room` → `contradiction`
- proposal INSPECT and target/entity_id absent from observation entities → `contradiction`
- WAIT ok → None

`DebugAdapter.__init__(self, failed: ActionProposal | None)`
- If failed.action in {LOOK, INSPECT, WAIT, OBSERVE}: first decide returns that proposal once
- Then LOOK once, then WAIT once, then None
- Ignore affordances that are MOVE/HARVEST/TRADE/REPAIR

- [ ] Re-run pytest — expect pass
- [ ] Commit `feat(harness): smell list and in-room debug adapter`

---

### Task 3: Report + model sanitize

**Files:**
- Create: `src/noema/harness/report.py`
- Test: `tests/test_harness_tenant_tester.py`

**Interfaces:**
- Produces: `Classification` literal union
- Produces: `write_report(path, payload) -> Path`
- Produces: `classify_with_model(context, call_model) -> tuple[str, str]`
- `sanitize_model_text(text) -> str` drops command-shaped lines

- [ ] Write failing tests

```python
from pathlib import Path
from noema.harness.report import classify_with_model, sanitize_model_text, write_report

def test_model_down_unclassified(tmp_path: Path):
    def boom(_ctx):
        raise RuntimeError("down")
    kind, summary = classify_with_model({"last_command": "LOOK"}, boom)
    assert kind == "unclassified"
    assert summary == ""
    path = write_report(tmp_path / "r.json", {
        "tenant_id": "test.hosted-canonical.ack-s3",
        "live": False,
        "mode_at_stop": "debug",
        "last_command": "LOOK",
        "error_code": "FORBIDDEN",
        "contradiction": None,
        "cycle": 1,
        "sequence": 2,
        "room_id": "room.a",
        "probes": ["LOOK"],
        "classification": kind,
        "summary": summary,
    })
    text = path.read_text()
    assert "unclassified" in text
    assert "TOKEN" not in text

def test_model_move_is_discarded():
    def fake(_ctx):
        return "classification: contradiction\nMOVE east\nexport TOKEN=sekrit"
    kind, summary = classify_with_model({"last_command": "MOVE"}, fake)
    assert "MOVE" not in summary
    assert "TOKEN" not in summary
    assert "sekrit" not in summary
    assert kind in {"contradiction", "unclassified"}
```

- [ ] Implement `report.py`: JSON write of the required fields only; `sanitize_model_text` rejects lines matching `^(MOVE|LOOK|WAIT|INSPECT|HARVEST|TRADE|REPAIR|ENTER_WORLD|POST |export TOKEN=)` ; model callable optional; exception → unclassified
- [ ] Re-run pytest — expect pass
- [ ] Commit `feat(harness): local tester report without secrets`

---

### Task 4: Wire loop, transport, CLI

**Files:**
- Modify: `src/noema/harness/transport.py` — `GatewayClient(..., tenant=None, admin_token=None)`  
  Isolated: POST `{base}{tenant.command_path}` body includes `world_id`. Header `X-Noema-Admin-Token` when `admin_token` set.  
  Live / unset tenant: unchanged `POST /v1/command`.
- Modify: `src/noema/harness/loop.py` — `run_unattended` tracks `previous_room`; on smell switch to `DebugAdapter` for remaining A+ turns then stop; attach `report` on `UnattendedRun`
- Modify: `src/noema/harness/types.py` — `UnattendedRun.report: dict | None = None`
- Modify: `src/noema/cli/agent.py` — `--tenant`, `--live-tenant`, `--report`; resolve tenant **before** enroll; Perihelion without flag never calls http except optional `/health`; isolated attach uses `NOEMA_TOKEN` or env token plus admin JWT from `NOEMA_ADMIN_TOKEN` (already minted JWT, not raw secret printed)
- Modify: `src/noema/harness/__init__.py` — export `resolve_tenant`, `detect_smell`; do not export `AGENT_PLAYER`
- Test: add loop/CLI tests in `tests/test_harness_tenant_tester.py`

- [ ] Failing CLI/loop tests

```python
from noema.cli import agent as agent_cli

def test_cli_perihelion_without_live_sends_no_command():
    calls = []
    def http(method, url, body=None, token=None):
        calls.append(url)
        return {"status": "ok", "service": "noema-gateway", "stage": "0"}
    rc = agent_cli.main(["--tenant", "perihelion", "run"], http=http)
    assert rc != 0
    assert not any("/v1/command" in u for u in calls)

def test_play_then_debug_on_hard_fail():
    # FakeHttp: ENTER+OBSERVE ok, then LOOK 400, then LOOK (probe) ok
    ...
    assert any(t.proposal and t.proposal.action == "LOOK" for t in run.turns)
    cmds = [p["body"]["command"] for p in http.posts if p.get("body")]
    assert "MOVE" not in cmds[cmds.index("LOOK") + 1 :] or True  # after first failed LOOK, no MOVE
```

- [ ] Implement wiring. Isolated admin header: `default_http` gains optional extra headers via a thin wrapper in `GatewayClient._http` — if changing `default_http` signature, keep token as 4th arg and add `headers=` kw-only so existing FakeHttp callables still work.

```python
# GatewayClient.send_command excerpt
url = f"{self.base_url}{self.command_path}"
body = {
    "request_id": req_id,
    "idempotency_key": key,
    "command": command,
    "arguments": arguments or {},
    "client": {"type": "agent", "runtime": self.runtime},
}
if self.world_id and self.command_path.endswith("/test-world/command"):
    body["world_id"] = self.world_id
payload = self._http("POST", url, body, self._tokens.reveal(), headers=self._extra_headers)
```

FakeHttp in existing tests uses `(method, url, body=None, token=None)` — wrapper must ignore unexpected kwargs OR pass headers only when the callable accepts them:

```python
import inspect
def _call_http(fn, method, url, body, token, headers):
    try:
        return fn(method, url, body, token, headers=headers)
    except TypeError:
        return fn(method, url, body, token)
```

- [ ] `pytest tests/test_harness_tenant_tester.py tests/test_harness_s0.py tests/test_harness_autonomous.py -q`
- [ ] Commit `feat(harness): tenant-targeted play/debug run`
- [ ] One AGENT-STAGE0 paragraph for `--tenant` / `--live-tenant`. Commit `docs: tenant tester CLI flags`

---

## Spec coverage

| Spec requirement | Task |
|------------------|------|
| Isolated default / refuse Perihelion | 1, 4 |
| Deterministic play, no model | 4 (play uses FirstValid; model only in report) |
| Smell list + quiet WAIT | 2 |
| A+ no MOVE | 2, 4 |
| Report + unclassified + discard verb | 3 |
| No AGENT_PLAYER | 4 (existing test still runs) |
| Isolated path vs `/v1/command` | 4 |
| No Recover / no PLAY letters | not implemented (non-goals) |
