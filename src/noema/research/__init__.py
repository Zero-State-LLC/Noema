"""Research derivation layer (WORLD TRUTH ≠ RESEARCH DERIVATION).

Research indexes are rebuildable from the canonical ledger.
Frontier may propose condition changes but must inject through the world path.
"""

from noema.research.capture import ResearchCapture
from noema.research.trajectories import TrajectoryRecord, build_trajectory

__all__ = ["ResearchCapture", "TrajectoryRecord", "build_trajectory"]
