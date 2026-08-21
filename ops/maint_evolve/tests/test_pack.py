from pathlib import Path
import pytest
from maint_evolve.pack import PackError, atomic_replace, derive_candidate, load_pack, validate_pack


def test_load_missing_uses_defaults(tmp_path: Path):
    p = load_pack(tmp_path / "missing.json")
    assert p["schema_version"] == 1
    assert p["energy_floor"] == 12
    assert "TRADE" not in (p.get("legalize_blocks") or [])  # TRADE is a code veto, not a pack default that packs can delete


def test_load_missing_does_not_share_default_lists(tmp_path: Path):
    missing = tmp_path / "missing.json"
    first = load_pack(missing)
    first["inspect_skip"].append("mutated")
    second = load_pack(missing)
    assert second["inspect_skip"] == []
    assert "mutated" not in second["inspect_skip"]


def test_validate_rejects_unknown_major():
    with pytest.raises(PackError):
        validate_pack({"schema_version": 99})


def test_failed_candidate_leaves_current_bytes(tmp_path: Path):
    cur = tmp_path / "current.json"
    cur.write_text('{"schema_version": 1, "energy_floor": 12}', encoding="utf-8")
    before = cur.read_bytes()
    with pytest.raises(PackError):
        # Invalid candidate must fail inside atomic_replace (validate before write)
        # so a failed evolve does not change current.json bytes.
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
