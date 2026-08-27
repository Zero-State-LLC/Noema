from noema.cli import agent as agent_cli
from noema.harness.deprecation import MESSAGE, warn_internal_client


def test_internal_client_warns_on_cli(capsys, monkeypatch):
    import noema.harness.deprecation as dep

    monkeypatch.setattr(dep, "_emitted", False)
    warn_internal_client()
    err = capsys.readouterr().err
    assert "DEPRECATED" in err
    assert "noema connect" in err
    assert "scrimshawlife-ctrl/noema-client" in MESSAGE


def test_agent_cli_calls_deprecation_hook(monkeypatch):
    called: list[bool] = []
    monkeypatch.setattr(agent_cli, "warn_internal_client", lambda: called.append(True))

    def http(method, url, body=None, token=None, headers=None):
        if url.endswith("/health"):
            return {"status": "ok", "service": "noema-gateway", "stage": "0"}
        return {"ok": False, "error": {"code": "STOP", "message": "fixture"}}

    rc = agent_cli.main(["--base", "https://example.invalid", "look"], http=http)
    assert rc in {0, 1}
    assert called == [True]
