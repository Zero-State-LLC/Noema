"""Minimal role model for Phase 1.

RFC-0120: only agents are Players. Role.PLAYER is a leftover human
platform label and MUST NOT mutate. Chamber fixtures inhabit as Role.AGENT.
"""

from __future__ import annotations

from enum import Enum


class Role(str, Enum):
    ADMIN = "ADMIN"
    PLAYER = "PLAYER"
    AGENT = "AGENT"
    SPECTATOR = "SPECTATOR"
    RESEARCHER = "RESEARCHER"


class Principal:
    def __init__(self, principal_id: str, role: Role, agent_id: str | None = None):
        self.principal_id = principal_id
        self.role = role
        self.agent_id = agent_id

    def can_mutate_world(self) -> bool:
        return self.role == Role.AGENT

    def can_admin(self) -> bool:
        return self.role == Role.ADMIN

    def is_spectator(self) -> bool:
        return self.role == Role.SPECTATOR

    def can_operate_frontier(self) -> bool:
        """Frontier is a system/research function — not PLAYER/AGENT play surface."""
        return self.role in (Role.ADMIN, Role.RESEARCHER)

    def can_view_research_overlay(self) -> bool:
        return self.role in (Role.ADMIN, Role.RESEARCHER)
