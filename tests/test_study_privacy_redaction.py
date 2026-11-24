from pathlib import Path

from scripts.validate_study_privacy_redaction import main, validate_pack


def test_clean_pack_passes(tmp_path: Path) -> None:
    (tmp_path / "public_watch.jsonl").write_text(
        '{"actor":"surveyor-01","note":"contact owner@example.com","private_inbox":"[REDACTED]"}\n',
        encoding="utf-8",
    )
    assert validate_pack(tmp_path) == []
    assert main([str(tmp_path)]) == 0


def test_detects_raw_email(tmp_path: Path) -> None:
    (tmp_path / "events.jsonl").write_text('{"email":"alice@realdomain.org"}\n', encoding="utf-8")
    findings = validate_pack(tmp_path)
    assert any(f["rule"] == "raw_email" for f in findings)
    assert main([str(tmp_path)]) == 1


def test_detects_tokens(tmp_path: Path) -> None:
    (tmp_path / "trace.log").write_text(
        "GET /play/callback?token_hash=abc123456\nAuthorization: Bearer secret-tok\n",
        encoding="utf-8",
    )
    findings = validate_pack(tmp_path)
    assert len([f for f in findings if f["rule"] == "session_or_callback_token"]) == 2


def test_detects_private_inbox_content(tmp_path: Path) -> None:
    (tmp_path / "state.json").write_text('{"private_inbox":["secret dm"]}\n', encoding="utf-8")
    findings = validate_pack(tmp_path)
    assert any(f["rule"] == "private_inbox_content" for f in findings)


def test_detects_internal_uuid_on_public_watch_surface(tmp_path: Path) -> None:
    (tmp_path / "watch_transcript.jsonl").write_text(
        '{"entity":"123e4567-e89b-12d3-a456-426614174000"}\n',
        encoding="utf-8",
    )
    findings = validate_pack(tmp_path)
    assert any(f["rule"] == "public_surface_internal_uuid" for f in findings)
