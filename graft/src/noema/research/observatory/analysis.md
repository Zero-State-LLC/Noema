# src/noema/research/observatory/analysis.py

- ObservatoryResult · class · L23-L36 — class ObservatoryResult
- Observatory · class · L39-L346 — class Observatory
- __init__ · method · L42-L43 — def __init__(self, config: dict[str, Any] | None = None)
- run · method · L45-L300 — def run( self, *, trajectory: dict[str, Any], events: list[dict[str, Any]], agent_id: str | None = None, pre_context: dict[str, Any] | None = None, post_context: dict[str, Any] | None = None, pre_window: tuple[int, int] | None = None, post_window: tuple[int, int] | None = None, detectors: list[str] | None = None, analysis_run_id: str | None = None, freeze_baseline: dict[str, Any] | None = None, contradiction_set: dict[str, Any] | None = None, ) -> ObservatoryResult
- agent_version_compare · method · L302-L346 — def agent_version_compare( self, *, version_a: str, version_b: str, features_a: dict[str, Any], features_b: dict[str, Any], seed_control_relationship: str, baseline_id: str, confounds: list[str] | None = None, ) -> dict[str, Any]
