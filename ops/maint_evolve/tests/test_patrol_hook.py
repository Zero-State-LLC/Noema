from maint_evolve.patrol_hook import apply_pack_to_decision, load_policy_pack


def test_no_pack_is_identity():
    out = apply_pack_to_decision("HARVEST", {"entity_id": "e1"}, {}, None, 20)
    assert out == ("HARVEST", {"entity_id": "e1"}, "no_pack")
    out2 = apply_pack_to_decision("MOVE", {"direction": "north"}, {}, {}, 5)
    assert out2 == ("MOVE", {"direction": "north"}, "no_pack")


def test_energy_floor_blocks_harvest():
    pack = {"energy_floor": 12, "harvest_caution": 0.0}
    out = apply_pack_to_decision("HARVEST", {"entity_id": "e1"}, {}, pack, 10)
    assert out == ("WAIT", {}, "energy_floor")
    # non-harvest unaffected
    out2 = apply_pack_to_decision("MOVE", {"direction": "n"}, {}, pack, 10)
    assert out2 == ("MOVE", {"direction": "n"}, "ok")


def test_harvest_caution_pressure():
    pack = {"energy_floor": 0, "harvest_caution": 0.0}
    look = {"location": {"co_evolution": {"harvest_pressure": 5}}, "scars": []}
    out = apply_pack_to_decision("HARVEST", {"entity_id": "e1"}, look, pack, 50)
    assert out == ("WAIT", {}, "harvest_caution")


def test_harvest_caution_scar():
    pack = {"energy_floor": 0, "harvest_caution": 0.4}
    look = {
        "location": {"co_evolution": {"harvest_pressure": 1}},
        "scars": [{"strength": 0.5}, {"strength": 0.2}],
    }
    out = apply_pack_to_decision("HARVEST", {"entity_id": "e1"}, look, pack, 50)
    assert out == ("WAIT", {}, "harvest_caution")


def test_harvest_caution_zero_does_not_block_on_scar():
    pack = {"energy_floor": 0, "harvest_caution": 0.0}
    look = {"location": {"co_evolution": {"harvest_pressure": 1}}, "scars": [{"strength": 0.9}]}
    out = apply_pack_to_decision("HARVEST", {"entity_id": "e1"}, look, pack, 50)
    assert out == ("HARVEST", {"entity_id": "e1"}, "ok")


def test_ok_passthrough():
    pack = {"energy_floor": 12, "harvest_caution": 0.5}
    look = {
        "location": {"co_evolution": {"harvest_pressure": 2}},
        "scars": [{"strength": 0.1}],
    }
    out = apply_pack_to_decision("HARVEST", {"entity_id": "e1"}, look, pack, 20)
    assert out == ("HARVEST", {"entity_id": "e1"}, "ok")


def test_load_policy_pack_missing_env(monkeypatch):
    monkeypatch.delenv("NOEMA_POLICY_PACK", raising=False)
    assert load_policy_pack() is None


def test_load_policy_pack_import_fail(monkeypatch, tmp_path):
    p = tmp_path / "pack.json"
    p.write_text('{"schema_version": 1, "energy_floor": 8}', encoding="utf-8")
    monkeypatch.setenv("NOEMA_POLICY_PACK", str(p))

    import builtins

    real_import = builtins.__import__

    def boom(name, *a, **k):
        if name == "maint_evolve.pack" or name.startswith("maint_evolve.pack"):
            raise ImportError("simulated absent")
        return real_import(name, *a, **k)

    monkeypatch.setattr(builtins, "__import__", boom)
    assert load_policy_pack() is None
