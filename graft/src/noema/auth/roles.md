# src/noema/auth/roles.py

- Role · class · L12-L17 — class Role(str, Enum)
- Principal · class · L20-L40 — class Principal
- __init__ · method · L21-L24 — def __init__(self, principal_id: str, role: Role, agent_id: str | None = None)
- can_mutate_world · method · L26-L27 — def can_mutate_world(self) -> bool
- can_admin · method · L29-L30 — def can_admin(self) -> bool
- is_spectator · method · L32-L33 — def is_spectator(self) -> bool
- can_operate_frontier · method · L35-L37 — def can_operate_frontier(self) -> bool
- can_view_research_overlay · method · L39-L40 — def can_view_research_overlay(self) -> bool
