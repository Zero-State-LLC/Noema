"""Admin-only Genesis: profile + seed → Cycle 0 world handoff."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from noema.research.genesis.errors import (
    ALREADY_ACTIVATED,
    INVALID_PROFILE,
    INVALID_SEED,
    NOT_AUTHORIZED,
    GenesisError,
)
from noema.world.digest import sha256_digest
from noema.world.state import WorldState, RoomsBundle, EntitiesBundle, load_seed

ROOT = Path(__file__).resolve().parents[4]

# Closed story seeds (catalog subset)
STORY_SEEDS = (
    "OLD_TRADE_NETWORK",
    "DAMAGED_RELAY",
    "INCOMPLETE_ARCHIVE",
    "UNRESOLVED_CLAIM",
    "DORMANT_INSTITUTION",
    "ABANDONED_ROUTE",
    "SCARRED_INFRASTRUCTURE",
)


@lru_cache(maxsize=2)
def profile_catalog() -> dict[str, Any]:
    for p in (
        ROOT / "fixtures" / "v06-catalogs" / "genesis-profiles.v06.json",
        Path("/home/scrimshawlife/Noema-Specs/specs/genesis-profiles.v06.json"),
    ):
        if p.is_file():
            return json.loads(p.read_text(encoding="utf-8"))
    return {"profiles": []}


def profile_ids() -> list[str]:
    return [p["profile_id"] for p in profile_catalog().get("profiles") or []]


def validate_profile_id(profile_id: str) -> dict[str, Any]:
    for p in profile_catalog().get("profiles") or []:
        if p["profile_id"] == profile_id:
            return p
    raise GenesisError(INVALID_PROFILE, f"unknown genesis profile {profile_id}")


def validate_story_seeds(seeds: list[str]) -> list[str]:
    out = []
    for s in seeds:
        if s not in STORY_SEEDS:
            raise GenesisError(INVALID_SEED, f"unknown story seed {s}")
        out.append(s)
    return out


class GenesisEngine:
    """One-time admin create-world. Not a public PLAY surface."""

    def __init__(self) -> None:
        self.previews: dict[str, dict[str, Any]] = {}
        self.activated: dict[str, dict[str, Any]] = {}

    def preview(
        self,
        *,
        world_name: str,
        world_seed: str,
        profile_id: str,
        story_seed_ids: list[str] | None = None,
        world_id: str | None = None,
        chamber_seed_path: Path | str | None = None,
    ) -> dict[str, Any]:
        profile = validate_profile_id(profile_id)
        seeds = validate_story_seeds(list(story_seed_ids or []))
        if not world_seed:
            raise GenesisError(INVALID_SEED, "world_seed required")
        wid = world_id or f"world.{world_name.lower().replace(' ', '-')}"
        genesis_id = "genesis." + sha256_digest(
            {
                "world_name": world_name,
                "world_seed": world_seed,
                "profile_id": profile_id,
                "story_seed_ids": seeds,
            }
        ).removeprefix("sha256:")[:16]

        # Build Cycle 0 from Chamber seed + profile overlays (deterministic)
        seed_path = Path(chamber_seed_path or ROOT / "fixtures" / "v01-seed" / "world-seed.json")
        state = load_seed(seed_path)
        state.world_id = wid
        state.seed = world_seed
        state.cycle = 0

        cycle0 = self._cycle0_summary(state, profile, seeds)
        result = {
            "schema_version": "genesis-result/0.6",
            "genesis_id": genesis_id,
            "world_id": wid,
            "world_name": world_name,
            "status": "PREVIEW",
            "world_seed": world_seed,
            "genesis_profile_id": profile_id,
            "story_seed_ids": seeds,
            "ordinary_world_valid": True,
            "starting_opportunities": self._opportunities(profile, seeds),
            "config_frozen": False,
            "admin_only": True,
            "scripts_player_outcomes": False,
            "lore_is_final": False,
            "rules_versions": {
                "canonicalization": "noema-jcs/1",
                "world_rules": "world/v1",
                "deep_time": "deep-time/0.6",
            },
            "cycle0": cycle0,
            "chamber_seed_path": str(seed_path),
        }
        result["digest"] = sha256_digest({k: v for k, v in result.items() if k != "digest"})
        self.previews[genesis_id] = result
        return result

    def activate(self, genesis_id: str, *, role: str) -> dict[str, Any]:
        if role != "ADMIN":
            raise GenesisError(NOT_AUTHORIZED, "only ADMIN may activate Genesis")
        if genesis_id in self.activated:
            raise GenesisError(ALREADY_ACTIVATED, "genesis already activated; new run requires new world")
        preview = self.previews.get(genesis_id)
        if not preview:
            raise GenesisError(INVALID_SEED, "unknown genesis preview")
        result = dict(preview)
        result["status"] = "ACTIVATED"
        result["config_frozen"] = True
        result["digest"] = sha256_digest({k: v for k, v in result.items() if k != "digest"})
        self.activated[genesis_id] = result
        return result

    def player_entry_view(self, result: dict[str, Any]) -> dict[str, Any]:
        """PLAY entry — no Genesis controls or hidden config."""
        return {
            "schema_version": "experience-view/1.0",
            "mode": "PLAY",
            "audience": "human_player",
            "disclosure_level": "SIMPLE",
            "canonical_source_refs": [result["world_id"]],
            "presentation": {
                "title": f"You enter {result['world_name']}.",
                "lines": [
                    "The world already has history.",
                    "Some structures predate every current realm.",
                ]
                + [f"Opportunity: {o}" for o in (result.get("starting_opportunities") or [])[:3]],
                "no_genesis_controls": True,
            },
            "allowed_actions": ["LOOK", "MOVE", "INSPECT"],
            "research_detail": False,
            "canonical_claim_label": "OBSERVED",
            "admin_only": False,
        }

    def admin_preview_view(self, result: dict[str, Any]) -> dict[str, Any]:
        return {
            "schema_version": "experience-view/1.0",
            "mode": "STUDY",
            "audience": "authorized_observer",
            "disclosure_level": "ADVANCED",
            "canonical_source_refs": [result["genesis_id"]],
            "presentation": {
                "title": "WORLD PREVIEW",
                "world_name": result["world_name"],
                "admin_only": True,
                "starting_conditions": result.get("starting_opportunities") or [],
                "actions": ["REGENERATE", "ADVANCED", "ACTIVATE"],
            },
            "research_detail": True,
        }

    def load_cycle0_world(self, result: dict[str, Any]) -> WorldState:
        """Load ordinary Chamber seed as Cycle 0 handoff state."""
        path = result.get("chamber_seed_path") or str(ROOT / "fixtures" / "v01-seed" / "world-seed.json")
        state = load_seed(path)
        state.world_id = result["world_id"]
        state.seed = result["world_seed"]
        state.cycle = 0
        return state

    def _cycle0_summary(self, state: WorldState, profile: dict[str, Any], seeds: list[str]) -> dict[str, Any]:
        return {
            "schema_version": "genesis-cycle0-summary/0.6",
            "world_id": state.world_id,
            "cycle": 0,
            "ordinary_world_valid": True,
            "profile_id": profile["profile_id"],
            "story_seed_ids": seeds,
            # v3.2.1: demonstrate state bundles
            "room_count": len(RoomsBundle(state).rooms),
            "entity_count": len(EntitiesBundle(state).entities),
            "uneven_resources": profile.get("resource_abundance") == "MIXED",
            "deep_time_ready": True,
        }

    def _opportunities(self, profile: dict[str, Any], seeds: list[str]) -> list[str]:
        opps = [
            f"Profile: {profile.get('title') or profile['profile_id']}",
            "Explore starting region",
            "Inspect nearby infrastructure",
        ]
        for s in seeds:
            opps.append(f"Trace: {s.replace('_', ' ').title()}")
        # require ≥3
        while len(opps) < 3:
            opps.append("Open opportunity")
        return opps[:8]
