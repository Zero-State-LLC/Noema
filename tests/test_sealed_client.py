from noema.cli import agent as agent_cli
from noema.harness.seal import refused_play_flag, sealed_prompt_hash


def test_published_hash_is_stable():
    assert sealed_prompt_hash() == (
        "sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395"
    )


def test_official_cli_refuses_goal_before_network():
    calls = []

    def http(*_args, **_kwargs):
        calls.append(1)
        return {"status": "ok"}

    rc = agent_cli.main(["--goal", "repair the relay", "look"], http=http)
    assert rc == 2
    assert calls == []


def test_refused_play_flag_names():
    class Ns:
        goal = None
        prompt = "win"
        system = None
        brief = None

    assert refused_play_flag(Ns()) == "prompt"
