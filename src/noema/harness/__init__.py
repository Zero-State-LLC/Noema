"""Headless Agent Gameplay Harness — in-repo Controller runtime for conformance.

Official distributed client: scrimshawlife-ctrl/noema-client.
This package remains for server-side tests. Not the first-world install path.
"""

from noema.harness.adapters import (
    AdapterStrategy,
    DebugStrategy,
    FirstValidAffordanceAdapter,
    LlmStrategy,
    ScriptedAdapter,
    ScriptedStrategy,
)
from noema.harness.auth import DeviceEnrollmentProvider, EnvTokenProvider, StaticTokenProvider
from noema.harness.errors import HarnessError
from noema.harness.loop import HeadlessHarness
from noema.harness.orientation import check_orientation_s0
from noema.harness.smell import detect_smell
from noema.harness.tenant import TenantError, resolve_tenant
from noema.harness.types import ActionProposal, FailureClass, UnattendedRun

__all__ = [
    "ActionProposal",
    "AdapterStrategy",
    "DebugStrategy",
    "DeviceEnrollmentProvider",
    "EnvTokenProvider",
    "FailureClass",
    "FirstValidAffordanceAdapter",
    "HarnessError",
    "HeadlessHarness",
    "LlmStrategy",
    "ScriptedAdapter",
    "ScriptedStrategy",
    "StaticTokenProvider",
    "TenantError",
    "UnattendedRun",
    "check_orientation_s0",
    "detect_smell",
    "resolve_tenant",
]
