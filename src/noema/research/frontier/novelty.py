"""Novelty vector distance helpers (millipoint L1)."""

from __future__ import annotations

from typing import Any

from noema.research.errors import NOT_COMPUTABLE, ResearchError
from noema.research.frontier.catalog import novelty_axes
from noema.research.frontier.genomes import NOVELTY_AXES


def axis_ids() -> list[str]:
    cat = novelty_axes()
    return [a["axis_id"] for a in cat["axes"]]


def novelty_l1(a: dict[str, int], b: dict[str, int]) -> int:
    """Absolute millipoint L1 distance across all 9 axes."""
    total = 0
    for axis in NOVELTY_AXES:
        if axis not in a or axis not in b:
            raise ResearchError(NOT_COMPUTABLE, f"missing novelty axis {axis}")
        total += abs(int(a[axis]) - int(b[axis]))
    return total


def is_solved_near_duplicate(
    candidate_nv: dict[str, int],
    solved_nv: dict[str, int],
    *,
    solved_distance: int | None = None,
) -> bool:
    thr = solved_distance if solved_distance is not None else int(novelty_axes().get("solved_distance", 50))
    return novelty_l1(candidate_nv, solved_nv) <= thr


def pairwise_diversity(a: dict[str, int], b: dict[str, int]) -> int:
    return novelty_l1(a, b)


def default_pairwise_diversity_min() -> int:
    return int(novelty_axes().get("pairwise_diversity_min", 120))
