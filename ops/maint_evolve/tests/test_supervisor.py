from pathlib import Path

from maint_evolve.pack import PackError, atomic_replace, validate_pack
from maint_evolve.supervisor import apply_candidate, run_shift

PINNED_READY = {
    "status": "ACTIVE",
    "world": {
        "world_id": "world.perihelion-reach-3",
        "genesis_id": "genesis.94d0961984b2b4f8",
    },
}


def test_shift_identity_halt(tmp_path: Path):
    ready = {"status": "ACTIVE", "world": {"world_id": "world-01", "genesis_id": "x"}}
    out = run_shift(root=tmp_path, ready=ready, look={}, spawn_patrol=True)
    assert out["halt_inhabit"] is True
    assert out["spawn_patrol"] is False
    assert "pack" in out
    assert "prompt_packet" in out


def test_bad_candidate_keeps_current(tmp_path: Path):
    cur = tmp_path / "packs" / "current.json"
    atomic_replace(cur, {"schema_version": 1, "energy_floor": 12})
    before = cur.read_bytes()
    try:
        validate_pack({"schema_version": 99})
    except PackError:
        pass
    ok = apply_candidate(tmp_path, {"schema_version": 99})
    assert ok is False
    assert cur.read_bytes() == before
    proposed = tmp_path / "packs" / "proposed"
    assert proposed.is_dir()
    assert any(proposed.iterdir())


def test_shift_bad_derive_keeps_current(tmp_path: Path, monkeypatch):
    cur = tmp_path / "packs" / "current.json"
    atomic_replace(cur, {"schema_version": 1, "energy_floor": 12})
    before = cur.read_bytes()

    def bad_derive(*_a, **_k):
        return {"schema_version": 99}

    monkeypatch.setattr("maint_evolve.supervisor.derive_candidate", bad_derive)
    out = run_shift(root=tmp_path, ready=PINNED_READY, look={}, spawn_patrol=True)
    assert cur.read_bytes() == before
    assert out["halt_inhabit"] is False
    assert out["spawn_patrol"] is True
    proposed = tmp_path / "packs" / "proposed"
    assert proposed.is_dir()
    assert any(proposed.iterdir())


def test_shift_good_look_applies_pack(tmp_path: Path):
    cur = tmp_path / "packs" / "current.json"
    atomic_replace(cur, {"schema_version": 1, "energy_floor": 12, "harvest_caution": 0.0})
    look = {
        "scars": [{"scar_id": "s1", "strength": 0.5, "visibility": "public"}],
        "protocol_strength": 2,
        "path_dependence_index": 0.4,
    }
    out = run_shift(root=tmp_path, ready=PINNED_READY, look=look, spawn_patrol=True)
    assert out["halt_inhabit"] is False
    assert out["spawn_patrol"] is True
    assert out["pack"]["harvest_caution"] >= 0.5
    assert out["prompt_packet"]["scars"][0]["scar_id"] == "s1"
    assert validate_pack(out["pack"])["harvest_caution"] >= 0.5
    loaded = cur.read_text(encoding="utf-8")
    assert "0.5" in loaded
