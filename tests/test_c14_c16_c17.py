"""Offline C14 / C16 / C17 — Compose reference, backup/restore, version pins.

Hosted Worker matrix still skips these (Compose + Postgres, not the Cloudflare host).
This module is the Python Chamber implementation of those cases.
"""

from __future__ import annotations

import json
import threading
import urllib.request
from pathlib import Path

import pytest

from noema.actions.errors import VERSION_MISMATCH, ActionError
from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.config.deployment import load_deployment_config, validate_deployment_config
from noema.gateway.http_server import serve
from noema.ops.backup import backup_world, restore_world
from noema.ops.verify import verify_world
from noema.world.digest import sha256_digest

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "fixtures" / "v01-seed" / "world-seed.json"
COMPOSE = ROOT / "docker-compose.yml"
DOCKERFILE = ROOT / "Dockerfile"
DEPLOY_CFG = ROOT / "examples" / "deployment" / "local-deployment-config.json"
C17_FIELDS = (
    "product_version",
    "spec_version",
    "world_rules_version",
    "agent_protocol_version",
    "event_catalog_version",
    "world_id",
    "world_version",
    "world_seed_digest",
    "configuration_digest",
    "current_cycle",
    "ledger_head",
    "snapshot_head",
)


def _play_once(db: Path | str) -> dict:
    rt = NoemaRuntime(db_path=db)
    start = rt.start_world(SEED)
    sess = rt.create_session(role=Role.AGENT, agent_id="agent.player.1")
    r = rt.apply_player_action(
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
    head = rt.store.ledger_head()
    seq = rt.store.get_state().sequence
    digest = sha256_digest(rt.acceptance_view())
    snaps = [s["state_digest"] for s in rt.store.list_snapshots()]
    manifest = rt.runtime_manifest()
    rt.store.close()
    return {
        "world_id": start["world_id"],
        "head": head,
        "seq": seq,
        "digest": digest,
        "snaps": snaps,
        "manifest": manifest,
        "commit": r["commit"],
    }


def test_c14_compose_file_is_postgres_monolith_only():
    text = COMPOSE.read_text(encoding="utf-8")
    assert "\n  postgres:\n" in text
    assert "\n  noema:\n" in text
    assert "image: postgres:16-alpine" in text
    assert "condition: service_healthy" in text
    assert "${NOEMA_PORT:-8080}:8080" in text
    services = text.split("volumes:")[0]
    assert "\n  redis:" not in services
    assert "image: redis" not in text
    assert "image: kafka" not in text
    assert "kind: Deployment" not in text
    assert "model-provider" in text


def test_c14_dockerfile_allows_local_compose_bind():
    text = DOCKERFILE.read_text(encoding="utf-8")
    assert "--allow-insecure-dev-bind" in text
    assert "examples/deployment/local-deployment-config.json" in text
    assert "EXPOSE 8080" in text
    assert "COPY examples" in text


def test_c14_deployment_config_validates_and_rejects_secrets():
    cfg = load_deployment_config(DEPLOY_CFG)
    assert validate_deployment_config(cfg) == []
    assert cfg["database"]["engine"] == "postgresql"
    assert cfg["architecture"]["shape"] == "modular-monolith"
    raw = json.loads(
        (ROOT / "examples" / "deployment" / "invalid-deployment-config-secret-field.json").read_text()
    )
    with pytest.raises(Exception, match="secret|unknown|auth"):
        validate_deployment_config(raw)


def test_c14_health_ready_version_and_surfaces(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "c14.db", deployment_config=DEPLOY_CFG)
    rt.start_world(SEED)
    httpd = serve(rt, host="127.0.0.1", port=0)
    host, port = httpd.server_address[:2]
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    try:
        base = f"http://{host}:{port}"
        for path, prefix in (
            ("/", "text/html"),
            ("/play", "text/html"),
            ("/watch", "text/html"),
            ("/health", "application/json"),
            ("/ready", "application/json"),
            ("/version", "application/json"),
        ):
            with urllib.request.urlopen(base + path, timeout=5) as resp:
                assert resp.status == 200, path
                assert resp.headers.get("Content-Type", "").startswith(prefix), path
        health = json.loads(urllib.request.urlopen(base + "/health", timeout=5).read())
        ready = json.loads(urllib.request.urlopen(base + "/ready", timeout=5).read())
        version = json.loads(urllib.request.urlopen(base + "/version", timeout=5).read())
        assert health["status"] == "ok"
        assert ready["ready"] is True
        for field in C17_FIELDS:
            assert field in version, field
        assert version["world_rules_version"] == "world/v1"
        assert version["ledger_head"].startswith("sha256:")
    finally:
        httpd.shutdown()
        rt.store.close()


def test_c16_backup_restore_equivalence(tmp_path: Path):
    db = tmp_path / "src.sqlite3"
    played = _play_once(db)
    bundle = tmp_path / "bundle"
    backup_world(db, bundle, seed_path=SEED, objects_path=tmp_path / "objects")
    dest = tmp_path / "restored.sqlite3"
    out = restore_world(bundle, dest, seed_path=SEED, objects_path=tmp_path / "objects2")
    assert out["restored"] is True
    assert out["verify_ok"] is True
    assert out["fresh_writer_fence"] is True

    verify = verify_world(dest, seed_path=SEED, objects_path=tmp_path / "objects2")
    assert verify.ok, verify.failures
    assert verify.pass_line() == "NOEMA VERIFY: PASS"

    rt = NoemaRuntime(db_path=dest)
    resumed = rt.resume_world(SEED)
    assert resumed["sequence"] == played["seq"]
    assert resumed["ledger_head"] == played["head"]
    assert sha256_digest(rt.acceptance_view()) == played["digest"]
    snaps = [s["state_digest"] for s in rt.store.list_snapshots()]
    assert snaps == played["snaps"]
    manifest = rt.runtime_manifest()
    for field in (
        "product_version",
        "spec_version",
        "world_rules_version",
        "event_catalog_version",
        "world_id",
        "ledger_head",
        "snapshot_head",
    ):
        assert manifest[field]
    assert manifest["world_id"] == played["manifest"]["world_id"]
    assert manifest["event_catalog_version"] == played["manifest"]["event_catalog_version"]
    rt.store.close()


def test_c17_version_exposes_required_lineage(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "v.db")
    rt.start_world(SEED)
    body = rt.version()
    for field in C17_FIELDS:
        assert field in body and body[field] not in (None, ""), field
    assert body["world_rules_version"] == "world/v1"
    assert body["agent_protocol_version"] == "agent-protocol/v1"
    assert str(body["world_seed_digest"]).startswith("sha256:")
    rt.store.close()


def test_c17_incompatible_rules_fail_closed(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "bad.db")
    rt.spec_compat.setdefault("versions", {})["world_rules"] = "world/v999-incompatible"
    with pytest.raises(ActionError) as exc:
        rt.start_world(SEED)
    assert exc.value.code == VERSION_MISMATCH
    assert "explicit migration" in exc.value.message
    rt.store.close()


def test_c17_resume_refuses_silent_adopt(tmp_path: Path):
    db = tmp_path / "exist.db"
    first = NoemaRuntime(db_path=db)
    first.start_world(SEED)
    first.store.close()

    later = NoemaRuntime(db_path=db)
    later.spec_compat.setdefault("versions", {})["world_rules"] = "world/v999-incompatible"
    with pytest.raises(ActionError) as exc:
        later.resume_world(SEED)
    assert exc.value.code == VERSION_MISMATCH
    later.store.close()

    migrated = NoemaRuntime(db_path=db)
    migrated.spec_compat.setdefault("versions", {})["world_rules"] = "world/v999-incompatible"
    out = migrated.resume_world(SEED, allow_migration=True)
    assert out["resumed"] is True
    migrated.store.close()
