from __future__ import annotations

from noema.actions.errors import ActionError


class GenesisError(ActionError):
    pass


INVALID_PROFILE = "INVALID_PROFILE"
INVALID_SEED = "INVALID_SEED"
NOT_AUTHORIZED = "NOT_AUTHORIZED"
ALREADY_ACTIVATED = "ALREADY_ACTIVATED"
