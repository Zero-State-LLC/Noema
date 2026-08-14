"""Phase 10: deployment-config validation + operator/WATCH HTML surfaces."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from noema.app.runtime import NoemaRuntime
from noema.config.deployment import (
    ConfigError,
    configuration_digest,
    default_local_config,
    load_deployment_config,
    validate_deployment_config,
)
from noema.gateway.http_server import serve
from noema.gateway.ui import index_html, play_html, study_html, watch_html

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "examples" / "deployment"
FIXTURES = ROOT / "fixtures" / "v01-seed"


def test_default_local_config_validates():
    cfg = default_local_config()
    warnings = validate_deployment_config(cfg)
    assert warnings == []
    assert cfg["architecture"]["shape"] == "modular-monolith"
    assert configuration_digest(cfg).startswith("sha256:")


def test_positive_fixture_validates():
    cfg = load_deployment_config(EXAMPLES / "local-deployment-config.json")
    assert cfg["schema_version"] == "deployment-config/1.0"
    assert cfg["database"]["engine"] == "postgresql"
    assert cfg["port"] == 8080


def test_secret_field_rejected():
    raw = json.loads((EXAMPLES / "invalid-deployment-config-secret-field.json").read_text())
    with pytest.raises(ConfigError, match="secret|auth_secret|unknown"):
        validate_deployment_config(raw)


def test_unknown_top_level_rejected():
    cfg = default_local_config()
    cfg["auth_password"] = "nope"
    with pytest.raises(ConfigError):
        validate_deployment_config(cfg)


def test_sqlite_engine_rejected():
    cfg = default_local_config()
    cfg["database"]["engine"] = "sqlite"
    with pytest.raises(ConfigError, match="postgresql"):
        validate_deployment_config(cfg)


def test_runtime_loads_config_and_manifest(tmp_path: Path):
    rt = NoemaRuntime(
        db_path=tmp_path / "w.db",
        deployment_config=EXAMPLES / "local-deployment-config.json",
    )
    assert rt.configuration_digest.startswith("sha256:")
    view = rt.deployment_config_view()
    assert view["configuration_digest"] == rt.configuration_digest
    assert view["config"]["env"] == "local"
    ver = rt.version()
    assert ver["configuration_digest"] == rt.configuration_digest
    rt.start_world(FIXTURES / "world-seed.json")
    man = rt.runtime_manifest()
    assert man["schema_version"] == "runtime-manifest/1.0"
    assert man["configuration_digest"] == rt.configuration_digest
    assert man["world_id"]
    rt.store.close()


def test_verify_uses_deployment_config(tmp_path: Path):
    from noema.auth.roles import Role
    from noema.ops.verify import verify_world

    db = tmp_path / "v.db"
    rt = NoemaRuntime(db_path=db, deployment_config=EXAMPLES / "local-deployment-config.json")
    rt.start_world(FIXTURES / "world-seed.json")
    sess = rt.create_session(role=Role.PLAYER, agent_id="agent.player.1")
    rt.apply_player_action(
        sess["session_id"],
        {
            "verb": "ENTER_WORLD",
            "agent_id": "agent.player.1",
            "client_action_sequence": 1,
            "action_id": "act.1",
            "idempotency_key": "idem.1",
            "parameters": {},
        },
    )
    rt.store.close()
    result = verify_world(
        db,
        seed_path=FIXTURES / "world-seed.json",
        objects_path=tmp_path / "objects",
        config_path=EXAMPLES / "local-deployment-config.json",
    )
    assert result.ok, result.failures
    assert result.checks["config"] == "PASS"


def test_verify_fails_on_secret_config(tmp_path: Path):
    from noema.ops.verify import verify_world

    db = tmp_path / "empty.db"
    # create empty store
    rt = NoemaRuntime(db_path=db)
    rt.store.close()
    result = verify_world(
        db,
        objects_path=tmp_path / "o",
        config_path=EXAMPLES / "invalid-deployment-config-secret-field.json",
        rehydrate=False,
    )
    assert not result.ok
    assert result.checks["config"] == "FAIL"


def test_html_shells_render():
    for html in (index_html(), watch_html(), play_html(), study_html()):
        assert "<!DOCTYPE html>" in html
        assert "NOEMA" in html
        assert "/watch" in html


def test_index_is_world_door_not_research_brochure():
    html = index_html()
    assert "Perihelion Reach" in html
    assert "Enter the world" in html
    assert "Enter world" in html
    assert "The world is the text" not in html
    assert "Open STUDY" not in html
    assert 'aria-label="NOEMA surfaces"' not in html
    assert 'id="home-health"' not in html
    assert "/admin/start" not in html
    assert "Operator surface" not in html
    nav = html[html.find("<nav") : html.find("</nav>")]
    assert "Study" not in nav


def test_play_surface_keeps_research_and_admin_terms_out():
    html = play_html()
    for forbidden in (
        "Situation Genome",
        "Genesis Profile",
        "Frontier",
        "Observatory",
        "Compiler",
        "Capability Graph",
        "/admin/start",
        "Load Chamber seed",
        "world-start",
    ):
        assert forbidden not in html


def test_public_surfaces_do_not_fabricate_seed_world_identity():
    for html in (index_html(), play_html(), watch_html()):
        assert "Aster Reach" not in html


def test_http_ui_and_manifest_endpoints(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "h.db")
    rt.start_world(FIXTURES / "world-seed.json")
    httpd = serve(rt, host="127.0.0.1", port=0)
    host, port = httpd.server_address[:2]
    import threading
    import urllib.request

    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    try:
        base = f"http://{host}:{port}"
        for path, ctype_prefix in (
            ("/", "text/html"),
            ("/watch", "text/html"),
            ("/play", "text/html"),
            ("/study", "text/html"),
            ("/health", "application/json"),
            ("/version", "application/json"),
            ("/manifest", "application/json"),
            ("/config", "application/json"),
            ("/watch/live", "application/json"),
        ):
            with urllib.request.urlopen(base + path, timeout=5) as resp:
                assert resp.status == 200
                ct = resp.headers.get("Content-Type", "")
                assert ct.startswith(ctype_prefix), (path, ct)
                body = resp.read()
                assert body
                if path == "/":
                    assert b"Perihelion Reach" in body
                    assert b"Enter world" in body
                    assert b"Open STUDY" not in body
                if path == "/watch":
                    assert b"WATCH" in body
                if path == "/study":
                    assert b"STUDY" in body
                if path == "/manifest":
                    data = json.loads(body)
                    assert data["schema_version"] == "runtime-manifest/1.0"
                if path == "/config":
                    data = json.loads(body)
                    assert "configuration_digest" in data
                    assert "password" not in json.dumps(data).lower() or "password" not in str(data.get("config"))
    finally:
        httpd.shutdown()
        rt.store.close()


def test_configuration_digest_stable_for_fixture():
    a = load_deployment_config(EXAMPLES / "local-deployment-config.json")
    b = load_deployment_config(EXAMPLES / "local-deployment-config.json")
    assert configuration_digest(a) == configuration_digest(b)


def test_product_ui_world_gate_and_study_learn():
    home = index_html()
    assert "Perihelion Reach" in home
    assert "Enter the world" in home
    assert "The world is the text" not in home
    assert "Load Chamber seed" not in home
    assert "/admin/start" not in home
    assert "live-orb" not in home
    assert "Open STUDY" not in home
    study = study_html()
    assert "Rebuild LEARN" in study
    assert "data-step" in study
    watch = watch_html()
    assert "createElementNS" not in watch
    assert "map-list" in watch
    play = play_html()
    assert "command-form" in play
    assert "Situation Genome" not in play


def test_product_ui_surfaces_runtime_version_errors_and_notice():
    for html in (index_html(), play_html(), watch_html(), study_html()):
        assert 'id="runtime-version"' in html
        assert "errorText" in html
    study = study_html()
    assert 'id="study-notice"' in study
    assert "Notice recent activity" in study
    assert "/research/observatory/run" in study
    for label in ("Observed", "Evidence suggests", "Possible", "Cannot determine"):
        assert label in study


def test_research_notice_role_boundary(tmp_path: Path):
    from noema.auth.roles import Role
    from noema.research.errors import ResearchError

    rt = NoemaRuntime(db_path=tmp_path / "study-boundary.db")
    rt.start_world(FIXTURES / "world-seed.json")
    player = rt.create_session(role=Role.PLAYER, agent_id="agent.player.1")
    with pytest.raises(ResearchError, match="Observatory requires RESEARCHER or ADMIN"):
        rt.run_observatory(player["session_id"])
    researcher = rt.create_session(role=Role.RESEARCHER)
    with pytest.raises(ResearchError, match="no trajectories captured"):
        rt.run_observatory(researcher["session_id"])
    rt.store.close()


def test_public_product_shells_keep_admin_boot_controls_out():
    for html in (index_html(), play_html(), watch_html(), study_html()):
        assert "/admin/start" not in html
        assert "Load Chamber seed" not in html
        assert "world-start" not in html
    for html in (play_html(), watch_html(), study_html()):
        assert "World offline" in html
