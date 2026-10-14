# ops/maint_evolve/probe.py

- ProbeRefuse · class · L17-L18 — class ProbeRefuse(RuntimeError)
- guard_world_id · function · L21-L25 — def guard_world_id(world_id: str | None) -> str
- _observation · function · L28-L32 — def _observation(resp: object) -> dict
- _scar_count · function · L35-L37 — def _scar_count(obs: dict) -> int
- run_probe · function · L40-L79 — def run_probe(*, world_id, token_kind, pack, client) -> dict
- send · function · L47-L55 — def send(verb: str, args=None)
- parse_probe_args · function · L82-L87 — def parse_probe_args(argv: list[str] | None = None) -> argparse.Namespace
- main · function · L90-L109 — def main( argv: list[str] | None = None, *, client=None, token_kind: str | None = None, pack: dict | None = None, ) -> int
