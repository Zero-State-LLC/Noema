# tests/test_phase8_postgres.py

- _pg_available · function · L22-L34 — def _pg_available() -> bool
- test_is_postgres_url_detection · function · L43-L49 — def test_is_postgres_url_detection()
- test_open_store_sqlite_default · function · L52-L56 — def test_open_store_sqlite_default(tmp_path: Path)
- test_sqlite_serializable_cycle_and_restart · function · L59-L88 — def test_sqlite_serializable_cycle_and_restart(tmp_path: Path)
- test_stale_revision_rejected · function · L91-L100 — def test_stale_revision_rejected(tmp_path: Path)
- test_postgres_backend_play_restart_and_serializable · function · L105-L170 — def test_postgres_backend_play_restart_and_serializable(): # Isolate each run with a unique schema to avoid cross-test pollution.
- act · function · L126-L137 — def act(verb: str, seq: int, **params)
- test_postgres_stale_writer_fence · function · L175-L194 — def test_postgres_stale_writer_fence()
