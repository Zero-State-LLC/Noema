# src/noema/evidence/resume.py

- ResumeWindowError · class · L13-L17 — class ResumeWindowError(ValueError)
- __init__ · method · L14-L17 — def __init__(self, code: str, message: str)
- ResumeWindow · class · L21-L108 — class ResumeWindow
- key · method · L34-L35 — def key(self) -> str
- acknowledge · method · L37-L52 — def acknowledge(self, sequence: int, *, committed_max: int) -> None
- offer_committed · method · L54-L66 — def offer_committed(self, sequence: int, *, committed_max: int) -> None
- resume_from · method · L68-L91 — def resume_from(self, sequence: int) -> list[int]
- _trim · method · L93-L96 — def _trim(self) -> None
- snapshot · method · L98-L108 — def snapshot(self) -> dict[str, Any]
- ResumeRegistry · class · L111-L148 — class ResumeRegistry
- __init__ · method · L114-L116 — def __init__(self, *, default_max_window: int = 256)
- get_or_create · method · L118-L136 — def get_or_create( self, *, world_id: str, principal_id: str, stream_id: str = "observations", session_epoch: int = 1, ) -> ResumeWindow
- verify_bounds · method · L138-L148 — def verify_bounds(self) -> list[str]
