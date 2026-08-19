"""In-repo Controller wrappers are not the official distribution."""

from __future__ import annotations

import sys
import warnings

OFFICIAL_CLIENT = "https://github.com/scrimshawlife-ctrl/noema-client"
INSTALL = "pipx install git+https://github.com/scrimshawlife-ctrl/noema-client.git"
MESSAGE = (
    "This in-repo Controller is deprecated for product use. "
    f"Install the official client: {INSTALL} then run `noema connect`. "
    "This path remains for server conformance."
)

_emitted = False


def warn_internal_client() -> None:
    global _emitted
    if _emitted:
        return
    _emitted = True
    warnings.warn(MESSAGE, DeprecationWarning, stacklevel=2)
    print(f"DEPRECATED: {MESSAGE}", file=sys.stderr)
