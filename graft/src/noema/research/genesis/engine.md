# src/noema/research/genesis/engine.py

- profile_catalog · function · L35-L42 — def profile_catalog() -> dict[str, Any]
- profile_ids · function · L45-L46 — def profile_ids() -> list[str]
- validate_profile_id · function · L49-L53 — def validate_profile_id(profile_id: str) -> dict[str, Any]
- validate_story_seeds · function · L56-L62 — def validate_story_seeds(seeds: list[str]) -> list[str]
- GenesisEngine · class · L65-L221 — class GenesisEngine
- __init__ · method · L68-L70 — def __init__(self) -> None
- preview · method · L72-L129 — def preview( self, *, world_name: str, world_seed: str, profile_id: str, story_seed_ids: list[str] | None = None, world_id: str | None = None, chamber_seed_path: Path | str | None = None, ) -> dict[str, Any]
- activate · method · L131-L144 — def activate(self, genesis_id: str, *, role: str) -> dict[str, Any]
- player_entry_view · method · L146-L167 — def player_entry_view(self, result: dict[str, Any]) -> dict[str, Any]
- admin_preview_view · method · L169-L184 — def admin_preview_view(self, result: dict[str, Any]) -> dict[str, Any]
- load_cycle0_world · method · L186-L193 — def load_cycle0_world(self, result: dict[str, Any]) -> WorldState
- _cycle0_summary · method · L195-L208 — def _cycle0_summary(self, state: WorldState, profile: dict[str, Any], seeds: list[str]) -> dict[str, Any]
- _opportunities · method · L210-L221 — def _opportunities(self, profile: dict[str, Any], seeds: list[str]) -> list[str]
