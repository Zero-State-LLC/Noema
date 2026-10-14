# tests/test_phase9_ops.py

- _pg_available · function · L27-L39 — def _pg_available() -> bool
- _play_once · function · L45-L70 — def _play_once(db: Path | str) -> dict
- test_configuration_digest_stable · function · L73-L77 — def test_configuration_digest_stable()
- test_verify_pass_after_play · function · L80-L89 — def test_verify_pass_after_play(tmp_path: Path)
- test_verify_detects_broken_chain · function · L92-L115 — def test_verify_detects_broken_chain(tmp_path: Path)
- test_backup_restore_roundtrip_sqlite · function · L118-L151 — def test_backup_restore_roundtrip_sqlite(tmp_path: Path)
- test_restore_refuses_nonempty_without_force · function · L154-L162 — def test_restore_refuses_nonempty_without_force(tmp_path: Path)
- test_cli_verify_entrypoint · function · L165-L171 — def test_cli_verify_entrypoint(tmp_path: Path)
- test_build_manifest_fields · function · L174-L194 — def test_build_manifest_fields(tmp_path: Path)
- test_backup_restore_postgres · function · L199-L230 — def test_backup_restore_postgres(tmp_path: Path)
