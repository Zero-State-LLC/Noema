from maint_evolve.pulse import identity_ok, parse_ready


def test_identity_ok():
    body = {"status": "ACTIVE", "world": {"world_id": "world.perihelion-reach-3", "genesis_id": "genesis.94d0961984b2b4f8", "cycle": 91}}
    r = parse_ready(body)
    assert identity_ok(r) is True


def test_identity_halt_on_drift():
    body = {"status": "ACTIVE", "world": {"world_id": "world-01", "genesis_id": "genesis.ef578f4ffceeccd0"}}
    assert identity_ok(parse_ready(body)) is False
