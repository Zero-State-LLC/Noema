# src/noema/ops/backup.py

- backup_world · function · L20-L131 — def backup_world( db: Path | str, dest: Path | str, *, seed_path: Path | str | None = None, objects_path: Path | str | None = None, config: dict[str, Any] | None = None, include_research: bool = False, ) -> Path
- restore_world · function · L134-L229 — def restore_world( bundle: Path | str, db: Path | str, *, seed_path: Path | str | None = None, objects_path: Path | str | None = None, force: bool = False, run_verify: bool = True, ) -> dict[str, Any]
