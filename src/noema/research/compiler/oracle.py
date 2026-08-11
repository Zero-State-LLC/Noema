"""Behavioral oracle — claim-bearing PRESERVED / NOT_PRESERVED / INCONCLUSIVE / INVALID."""

from __future__ import annotations

from typing import Any

from noema.world.digest import sha256_digest

ORACLE_RESULTS = ("PRESERVED", "NOT_PRESERVED", "INCONCLUSIVE", "INVALID")


class BehavioralOracle:
    """Deterministic oracle over fixture unit sets.

    Default policy: target is preserved iff all protected units remain and
    required motif units (if declared) remain. Cache keyed by fixture digest.
    """

    def __init__(self, *, protected_ids: set[str], required_ids: set[str] | None = None):
        self.protected_ids = set(protected_ids)
        self.required_ids = set(required_ids or protected_ids)
        self.cache: dict[str, str] = {}
        self.calls = 0
        self.cache_hits = 0
        self.counts = {"preserved": 0, "not_preserved": 0, "inconclusive": 0, "invalid": 0}

    def fixture_digest(self, retained_unit_ids: list[str] | set[str]) -> str:
        return sha256_digest({"retained": sorted(retained_unit_ids)})

    def evaluate(
        self,
        retained_unit_ids: list[str] | set[str],
        *,
        force: str | None = None,
    ) -> dict[str, Any]:
        retained = set(retained_unit_ids)
        key = self.fixture_digest(retained)
        if key in self.cache and force is None:
            self.cache_hits += 1
            result = self.cache[key]
            return {"result": result, "fixture_digest": key, "cache_hit": True}

        self.calls += 1
        if force is not None:
            result = force
        elif not retained:
            result = "INVALID"
        elif not self.protected_ids.issubset(retained):
            # over-minimization / lost protected
            result = "NOT_PRESERVED"
        elif not self.required_ids.issubset(retained):
            result = "NOT_PRESERVED"
        else:
            result = "PRESERVED"

        self.cache[key] = result
        bucket = {
            "PRESERVED": "preserved",
            "NOT_PRESERVED": "not_preserved",
            "INCONCLUSIVE": "inconclusive",
            "INVALID": "invalid",
        }[result]
        self.counts[bucket] += 1
        return {
            "result": result,
            "fixture_digest": key,
            "cache_hit": False,
            "authorizes_removal": result == "PRESERVED",
        }

    def summary(self) -> dict[str, int]:
        return {
            "calls": self.calls,
            "preserved": self.counts["preserved"],
            "not_preserved": self.counts["not_preserved"],
            "inconclusive": self.counts["inconclusive"],
            "invalid": self.counts["invalid"],
            "cache_hits": self.cache_hits,
        }
