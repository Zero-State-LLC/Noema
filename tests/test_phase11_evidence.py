"""Phase 11: evidence receipts + bounded resume/ack windows."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.evidence.receipts import (
    INVALID_EVIDENCE,
    create_receipt,
    generate_keyring,
    rotate_key,
    save_keyring,
    sign_export_bundle,
    verify_export_dir,
    verify_receipt,
    verify_receipts_for_bundle,
)
from noema.evidence.resume import ResumeRegistry, ResumeWindow, ResumeWindowError
from noema.ops.verify import verify_world

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "fixtures" / "v01-seed" / "world-seed.json"
EXAMPLES = ROOT / "examples" / "deployment"


def _play(db: Path) -> NoemaRuntime:
    rt = NoemaRuntime(db_path=db)
    rt.start_world(SEED)
    sess = rt.create_session(role=Role.AGENT, agent_id="agent.player.1")
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
    return rt


def test_receipt_roundtrip_and_tamper(tmp_path: Path):
    kr = generate_keyring(key_id="key.t1")
    rec = create_receipt(
        evidence_digest="sha256:" + "ab" * 32,
        world_id="world-01",
        export_profile="research-isolated",
        keyring=kr,
        version_lineage={"event_catalog_version": "event-catalog/0.1"},
    )
    assert rec["algorithm"] == "hmac-sha256"
    assert rec["key_id"] == "key.t1"
    assert "secret" not in json.dumps(rec)
    assert verify_receipt(rec, keyring=kr, expected_world_id="world-01") == "VALID"

    bad = {**rec, "signature": "00" * 32}
    assert verify_receipt(bad, keyring=kr) == INVALID_EVIDENCE

    wrong_world = verify_receipt(rec, keyring=kr, expected_world_id="world-other")
    assert wrong_world == INVALID_EVIDENCE


def test_key_rotation_preserves_historical_verify():
    kr = generate_keyring(key_id="key.old")
    rec = create_receipt(
        evidence_digest="sha256:" + "cd" * 32,
        world_id="w",
        export_profile="public-evidence-export",
        keyring=kr,
        version_lineage={},
    )
    kr2 = rotate_key(kr, new_key_id="key.new")
    assert kr2["active_key_id"] == "key.new"
    # historical receipt still verifies with retired key material
    assert verify_receipt(rec, keyring=kr2) == "VALID"
    new_rec = create_receipt(
        evidence_digest="sha256:" + "ef" * 32,
        world_id="w",
        export_profile="public-evidence-export",
        keyring=kr2,
        version_lineage={},
    )
    assert new_rec["key_id"] == "key.new"
    assert verify_receipt(new_rec, keyring=kr2) == "VALID"


def test_mandatory_profile_missing_receipt_is_invalid_evidence():
    vr = verify_receipts_for_bundle(
        {
            "export_profile": "research-isolated",
            "world_id": "w",
            "evidence_digest": "sha256:" + "11" * 32,
        },
        keyring=generate_keyring(),
        receipts=[],
    )
    assert vr["status"] == INVALID_EVIDENCE
    assert vr["required"] is True


def test_local_gameplay_optional_unsigned():
    vr = verify_receipts_for_bundle(
        {"export_profile": "local-gameplay", "world_id": "w"},
        keyring=None,
        receipts=[],
    )
    assert vr["status"] == "OPTIONAL_UNSIGNED"


def test_export_bundle_sign_and_verify(tmp_path: Path):
    db = tmp_path / "w.db"
    rt = _play(db)
    rt.store.close()

    kr_path = tmp_path / "keyring.json"
    kr = generate_keyring()
    save_keyring(kr_path, kr)

    from noema.cli.evidence import main_export, main_verify

    out = tmp_path / "export"
    code = main_export(
        [
            "--db",
            str(db),
            "--keyring",
            str(kr_path),
            "--out",
            str(out),
            "--profile",
            "research-isolated",
            "--seed",
            str(SEED),
        ]
    )
    assert code == 0
    assert (out / "receipts.jsonl").is_file()
    meta = json.loads((out / "export-meta.json").read_text())
    assert meta["export_profile"] == "research-isolated"
    assert "secret" not in json.dumps(meta)

    result = verify_export_dir(out, keyring_path=kr_path)
    assert result.ok
    assert result.line() == "NOEMA EVIDENCE: VALID"

    code = main_verify([str(out), "--keyring", str(kr_path)])
    assert code == 0

    # Tamper payload → INVALID_EVIDENCE
    payload_path = out / "evidence-payload.json"
    payload = json.loads(payload_path.read_text())
    payload["tampered"] = True
    payload_path.write_text(json.dumps(payload, sort_keys=True), encoding="utf-8")
    bad = verify_export_dir(out, keyring_path=kr_path)
    assert not bad.ok
    assert bad.status == INVALID_EVIDENCE


def test_verify_world_resume_and_evidence(tmp_path: Path):
    db = tmp_path / "v.db"
    rt = _play(db)
    # delivery window populated
    assert rt.resume.verify_bounds() == []
    rt.store.close()

    kr_path = tmp_path / "kr.json"
    save_keyring(kr_path, generate_keyring())
    export_dir = tmp_path / "ex"
    from noema.cli.evidence import main_export

    main_export(
        [
            "--db",
            str(db),
            "--keyring",
            str(kr_path),
            "--out",
            str(export_dir),
            "--profile",
            "research-isolated",
            "--seed",
            str(SEED),
        ]
    )

    result = verify_world(
        db,
        seed_path=SEED,
        objects_path=tmp_path / "obj",
        config_path=EXAMPLES / "local-deployment-config.json",
        evidence_bundle=export_dir,
        evidence_keyring=kr_path,
    )
    assert result.ok, result.failures
    assert result.checks["resume_ack_windows"] == "PASS"
    assert result.checks["evidence_receipts"] == "PASS"


def test_research_isolated_config_requires_bundle(tmp_path: Path):
    db = tmp_path / "r.db"
    rt = NoemaRuntime(
        db_path=db,
        deployment_config=EXAMPLES / "research-isolated-deployment-config.json",
    )
    rt.start_world(SEED)
    rt.store.close()
    result = verify_world(
        db,
        seed_path=SEED,
        objects_path=tmp_path / "o",
        config_path=EXAMPLES / "research-isolated-deployment-config.json",
    )
    assert not result.ok
    assert result.checks["evidence_receipts"] == "FAIL"


def test_resume_window_bounds_and_uncommitted():
    w = ResumeWindow(world_id="w", principal_id="p", max_window=4)
    w.offer_committed(1, committed_max=3)
    w.offer_committed(2, committed_max=3)
    w.offer_committed(3, committed_max=3)
    with pytest.raises(ResumeWindowError, match="UNCOMMITTED|uncommitted"):
        w.offer_committed(4, committed_max=3)
    with pytest.raises(ResumeWindowError):
        w.acknowledge(99, committed_max=3)
    w.acknowledge(2, committed_max=3)
    assert w.high_water == 2
    # still retain 3
    assert 3 in w.retained
    red = w.resume_from(2)
    assert red == [3]
    # overflow trim
    for i in range(10, 20):
        w.offer_committed(i, committed_max=20)
    assert len(w.retained) <= w.max_window


def test_play_action_exposes_delivery_window(tmp_path: Path):
    db = tmp_path / "d.db"
    rt = NoemaRuntime(db_path=db)
    rt.start_world(SEED)
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
    assert "delivery" in r
    assert r["delivery"]["max_window"] == 256
    assert r["delivery"]["retained"]
    rt.store.close()
