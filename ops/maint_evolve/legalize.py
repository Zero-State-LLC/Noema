from __future__ import annotations

HARD_BLOCKS = frozenset({"TRADE", "TRADE_ACCEPT", "TRADE_REJECT", "RESEED", "FORCE", "WORLD_ACTIVATE"})
ADMIN_FORBIDDEN = frozenset({"LOOK", "HARVEST", "ENTER_WORLD", "INSPECT", "MOVE", "MESSAGE", "ATTEST", "COMMIT"})


def veto_action(action: str, pack: dict, *, admin_token: bool) -> str | None:
    verb = str(action or "").upper()
    if admin_token and verb in ADMIN_FORBIDDEN:
        return "admin_jwt_not_a_player"
    if verb in HARD_BLOCKS:
        return "hard_block"
    extra = {str(x).upper() for x in (pack.get("legalize_blocks") or [])}
    if verb in extra:
        return "pack_block"
    return None


def assert_player_command(token_kind: str) -> None:
    if token_kind != "player":
        raise PermissionError("player token required for inhabit")
