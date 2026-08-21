import json
from pathlib import Path

import pytest

from maint_evolve.probe import ProbeRefuse, guard_world_id, main as probe_main, parse_probe_args
from maint_evolve.supervisor import parse_supervisor_args, run_supervisor


def test_probe_args_refuse_play():
    ns = parse_probe_args(["--world-id", "world.perihelion-reach-3"])
    with pytest.raises(ProbeRefuse):
        guard_world_id(ns.world_id)


def test_probe_main_refuse_play_exits(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("NOEMA_PROBE_WORLD_ID", "world.perihelion-reach-3")
    rc = probe_main(["--root", str(tmp_path)])
    assert rc != 0
    assert not (tmp_path / "last-probe.json").exists()


def test_probe_main_writes_last_probe(tmp_path: Path):
    class Fake:
        def command(self, verb, args=None):
            scars = [{"strength": 0.4, "visibility": "public"}] if verb == "LOOK" and "HARVEST" in self.seen else []
            if verb == "HARVEST":
                self.seen.append("HARVEST")
            return {"ok": True, "observation": {"scars": scars}}

        def __init__(self):
            self.seen = []

    rc = probe_main(
        ["--world-id", "test.hosted-canonical.ewm-cutover", "--root", str(tmp_path)],
        client=Fake(),
        token_kind="player",
        pack={"harvest_caution": 0.0},
    )
    assert rc == 0
    blob = json.loads((tmp_path / "last-probe.json").read_text(encoding="utf-8"))
    assert blob["world_id"].startswith("test.")
    assert blob["pass"] is True


def test_supervisor_parse_probe_requires_test_world():
    ns = parse_supervisor_args(["--probe", "--world-id", "world-01"])
    with pytest.raises(ProbeRefuse):
        guard_world_id(ns.world_id)


def test_supervisor_does_not_spawn_patrol_on_halt(tmp_path: Path):
    ready = {"status": "ACTIVE", "world": {"world_id": "world-01", "genesis_id": "x"}}
    spawned = []

    def spawn(_ns):
        spawned.append(True)

    out = run_supervisor(
        argv=["--root", str(tmp_path), "--spawn-patrol"],
        ready=ready,
        look={},
        spawn_patrol_cb=spawn,
    )
    assert out["halt_inhabit"] is True
    assert spawned == []
