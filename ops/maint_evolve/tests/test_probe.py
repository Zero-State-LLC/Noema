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
