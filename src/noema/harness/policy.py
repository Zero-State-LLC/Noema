"""Controller-local policy. Does not change canonical action semantics."""

from __future__ import annotations

from dataclasses import dataclass, field


GATED_FAMILIES = frozenset({"CONTEST", "AGREEMENT", "ACCESS", "ORG_CREATE", "ORG_MEMBER_ADD", "ORG_MEMBER_REMOVE"})


@dataclass
class HarnessPolicy:
    allow_trade: bool = True
    allow_repair: bool = True
    allow_harvest: bool = True
    allow_message: bool = True
    allow_org_create: bool = False
    allow_contest: bool = False
    allow_access: bool = False
    stop_on_incident: bool = True
    stop_on_auth_failure: bool = True
    max_consecutive_failures: int = 3
    cooldown_seconds: float = 3.0
    pacing_mode: str = "TURN"
    allowed_action_families: list[str] = field(
        default_factory=lambda: ["LOOK", "MOVE", "INSPECT", "WAIT", "ENTER_WORLD", "OBSERVE"]
    )

    def permits(self, action: str) -> bool:
        name = action.upper()
        if name in {"LOOK", "MOVE", "INSPECT", "WAIT", "ENTER_WORLD", "OBSERVE", "LEAVE_WORLD"}:
            return True
        if name in {"REPAIR", "COMMIT.REPAIR"}:
            return self.allow_repair
        if name in {"HARVEST", "COMMIT.HARVEST"}:
            return self.allow_harvest
        if name == "TRADE":
            return self.allow_trade
        if name == "MESSAGE":
            return self.allow_message
        if name.startswith("ORG") or name in {"ORG_CREATE", "ORG_MEMBER_ADD", "ORG_MEMBER_REMOVE"}:
            return self.allow_org_create
        if name.startswith("CONTEST"):
            return self.allow_contest
        if name.startswith("AGREEMENT"):
            return self.allow_contest
        if name.startswith("ACCESS"):
            return self.allow_access
        return False

    def blocking_flag(self, action: str) -> str | None:
        """Name of the allow_* flag that rejects this action, or None when permitted.

        Actions outside every known family fall through permits() to the
        default deny; those report "default_deny" so the gate is visible too.
        """
        name = action.upper()
        if self.permits(name):
            return None
        if name in {"REPAIR", "COMMIT.REPAIR"}:
            return "allow_repair"
        if name in {"HARVEST", "COMMIT.HARVEST"}:
            return "allow_harvest"
        if name == "TRADE":
            return "allow_trade"
        if name == "MESSAGE":
            return "allow_message"
        if name.startswith("ORG"):
            return "allow_org_create"
        if name.startswith("CONTEST") or name.startswith("AGREEMENT"):
            return "allow_contest"
        if name.startswith("ACCESS"):
            return "allow_access"
        return "default_deny"

    def blocked(self, canonical_affordances: list[dict]) -> list[dict]:
        """Advertised affordances this policy would reject, tagged with the
        responsible allow_* flag. Visibility only — never changes permits().

        Answers "why won't ORG_CREATE go through" locally instead of letting a
        policy gate masquerade as server-side unavailability (#476).
        """
        out: list[dict] = []
        seen: set[str] = set()
        for aff in canonical_affordances or []:
            if not isinstance(aff, dict):
                continue
            name = str(aff.get("action") or aff.get("operation") or "").upper()
            if not name or name in seen:
                continue
            seen.add(name)
            flag = self.blocking_flag(name)
            if flag is not None:
                out.append({"action": name, "policy_flag": flag})
        return out
