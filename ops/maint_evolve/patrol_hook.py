"""Optional policy-pack filter for local maint_patrol decisions.

If pack is missing / evolve absent: identity — patrol behavior unchanged.

Local patch for ~/.config/noema/maint_patrol.py (after action is chosen,
before client.command — near the `assert action is not None` line):

    # Optional maint_evolve pack filter (no-op if evolve absent).
    try:
        from patrol_hook import apply_pack_to_decision, load_policy_pack  # when cwd has maint_evolve
    except ImportError:
        try:
            from maint_evolve.patrol_hook import apply_pack_to_decision, load_policy_pack
        except ImportError:
            apply_pack_to_decision = None  # type: ignore
            load_policy_pack = None  # type: ignore
    if apply_pack_to_decision is not None:
        pack = load_policy_pack()
        # Patrol uses COMMIT+HARVEST; normalize for pack rules that key on HARVEST.
        hook_action = action
        if action == "COMMIT" and (args or {}).get("operation") == "HARVEST":
            hook_action = "HARVEST"
        hooked = apply_pack_to_decision(hook_action, args, obs, pack, energy)
        if hooked is not None:
            new_action, new_args, pack_reason = hooked
            if new_action != hook_action or new_args != args:
                action, args, reason = new_action, new_args, f"pack:{pack_reason}"
            elif pack_reason not in {"ok", "no_pack"}:
                reason = f"{reason}|pack:{pack_reason}"

Do not break patrol if maint_evolve is absent — keep the ImportError path.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from maint_evolve.legalize import veto_action


def _budget_exceeded(look: dict) -> bool:
    """True if LOOK last_error / error is BUDGET_EXCEEDED (attention)."""
    if not isinstance(look, dict):
        return False
    last = look.get("last_error")
    if last == "BUDGET_EXCEEDED":
        return True
    if isinstance(last, dict) and (
        last.get("code") == "BUDGET_EXCEEDED"
        or last.get("attention") == "BUDGET_EXCEEDED"
        or last.get("type") == "BUDGET_EXCEEDED"
    ):
        return True
    err = look.get("error")
    if err == "BUDGET_EXCEEDED":
        return True
    if isinstance(err, dict) and err.get("code") == "BUDGET_EXCEEDED":
        return True
    return False


def apply_pack_to_decision(
    action: str,
    args: dict,
    look: dict,
    pack: dict | None,
    energy: int | float,
) -> tuple[str, dict, str] | None:
    """Return (action, args, reason). Identity when pack missing/empty."""
    if not pack:
        return action, args, "no_pack"
    veto = veto_action(action, pack, admin_token=False)
    if veto:
        return "WAIT", {}, veto
    hook_action = action
    if action == "COMMIT" and isinstance(args, dict) and args.get("operation") == "HARVEST":
        hook_action = "HARVEST"
    look = look if isinstance(look, dict) else {}
    if pack.get("wait_before_look") and hook_action == "LOOK" and _budget_exceeded(look):
        return "WAIT", {}, "wait_before_look"
    if energy < int(pack.get("energy_floor") or 0) and hook_action == "HARVEST":
        return "WAIT", {}, "energy_floor"
    caution = float(pack.get("harvest_caution") or 0)
    loc = look.get("location") or {}
    pressure = float((loc.get("co_evolution") or {}).get("harvest_pressure") or 0)
    scar = max(
        [
            float(s.get("strength") or 0)
            for s in (look.get("scars") or [])
            if isinstance(s, dict)
        ]
        or [0]
    )
    if hook_action == "HARVEST" and (pressure > 4 or scar >= caution > 0):
        return "WAIT", {}, "harvest_caution"
    return action, args, "ok"


def load_policy_pack() -> dict[str, Any] | None:
    """Load pack from NOEMA_POLICY_PACK path; None if unset or evolve absent."""
    raw = os.environ.get("NOEMA_POLICY_PACK")
    if not raw:
        return None
    try:
        from maint_evolve.pack import load_pack
    except ImportError:
        return None
    try:
        return load_pack(Path(raw))
    except Exception:
        return None
