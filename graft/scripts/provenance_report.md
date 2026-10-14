# scripts/provenance_report.py

- load_json · function · L14-L16 — def load_json(path: Path)
- load_state · function · L19-L30 — def load_state(path: Path) -> dict: # Deliberately parse only the scalar authority pointers. This avoids adding a # YAML dependency and, more importantly, never rewrites or normalizes the file.
- redact · function · L33-L38 — def redact(value)
- required · function · L41-L49 — def required(obj, path)
- required_any · function · L52-L58 — def required_any(obj, *paths)
- same_pointer · function · L61-L66 — def same_pointer(left, right) -> bool
- build_report · function · L69-L114 — def build_report(specs_path: Path, compat_path: Path, version_path: Path, ready_path: Path) -> dict
- main · function · L117-L137 — def main(argv=None)
