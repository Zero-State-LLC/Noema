import pytest
from maint_evolve.pack import DEFAULT_PACK
from maint_evolve.probe import PLAY, ProbeRefuse, run_probe


class Fake:
    def __init__(self):
        self.calls = []
        self.harvests = 0

    def command(self, verb, args=None):
        self.calls.append(verb)
        if verb == "HARVEST":
            self.harvests += 1
        scars = [{"strength": 0.4, "visibility": "public"}] if self.harvests >= 3 else []
        return {
            "ok": True,
            "observation": {
                "scars": scars,
                "historical_context": {"fragments": self.harvests},
            },
        }


ISOLATED = "test.hosted-canonical.ewm-cutover"


def test_admin_token_raises():
    fake = Fake()
    with pytest.raises(PermissionError):
        run_probe(world_id=ISOLATED, token_kind="admin", pack=dict(DEFAULT_PACK), client=fake)
    assert fake.calls == []


def test_play_world_raises_before_command():
    fake = Fake()
    with pytest.raises(ProbeRefuse):
        run_probe(world_id=PLAY, token_kind="player", pack=dict(DEFAULT_PACK), client=fake)
    assert fake.calls == []


def test_isolated_player_harvest_scars_persist():
    fake = Fake()
    result = run_probe(
        world_id=ISOLATED, token_kind="player", pack=dict(DEFAULT_PACK), client=fake
    )
    assert fake.calls == ["ENTER_WORLD", "LOOK", "HARVEST", "HARVEST", "HARVEST", "LOOK"]
    assert result["pass"] is True
    assert result["world_id"] == ISOLATED
    assert result["scar_count"] >= 1
    assert result["calls"] == fake.calls


def test_probe_ok_false_raises():
    class Bad:
        def command(self, verb, args=None):
            return {"ok": False, "error": {"code": "INTERNAL"}}

    with pytest.raises(ProbeRefuse):
        run_probe(world_id=ISOLATED, token_kind="player", pack=dict(DEFAULT_PACK), client=Bad())


def test_harvest_caution_skips_harvest():
    fake = Fake()
    pack = dict(DEFAULT_PACK)
    pack["harvest_caution"] = 1.0
    result = run_probe(world_id=ISOLATED, token_kind="player", pack=pack, client=fake)
    assert "HARVEST" not in fake.calls
    assert "HARVEST" not in result["calls"]
    assert result["pass"] is False
    assert result.get("reason") == "harvest_skipped"
