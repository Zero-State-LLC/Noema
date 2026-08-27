from maint_evolve.prompt import build_prompt_packet


def test_packet_includes_scars_and_pack_goals():
    look = {"scars": [{"scar_id": "s1", "strength": 0.5}], "protocol_strength": 2, "path_dependence_index": 0.5}
    pack = {"prompt_goals": ["do not over-harvest civic exchange"]}
    pkt = build_prompt_packet(look, {"alerts": ["HIGH_PRESSURE"]}, pack)
    assert pkt["protocol_strength"] == 2
    assert pkt["scars"][0]["scar_id"] == "s1"
    assert "do not over-harvest civic exchange" in pkt["goals"]


def test_packet_has_required_keys_and_no_secrets():
    look = {
        "scars": [],
        "protocol_strength": 1,
        "path_dependence_index": 0.1,
        "token": "secret-should-not-leak",
        "access_token": "also-secret",
    }
    digest = {"alerts": ["LOW"], "admin_token": "nope"}
    pack = {"prompt_goals": ["stay cautious"], "api_key": "leak"}
    pkt = build_prompt_packet(look, digest, pack)
    assert set(pkt.keys()) == {
        "goals",
        "scars",
        "protocol_strength",
        "path_dependence_index",
        "alerts",
    }
    assert pkt["alerts"] == ["LOW"]
    assert pkt["path_dependence_index"] == 0.1
    blob = str(pkt)
    assert "secret" not in blob
    assert "token" not in blob.lower()
    assert "api_key" not in blob
    assert "nope" not in blob


def test_packet_digest_none():
    look = {"scars": [], "protocol_strength": 0, "path_dependence_index": 0.0}
    pkt = build_prompt_packet(look, None, {"prompt_goals": []})
    assert pkt["alerts"] == []
    assert pkt["goals"] == []
