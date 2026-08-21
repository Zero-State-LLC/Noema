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
