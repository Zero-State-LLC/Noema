"""Headless Agent Gameplay Harness — Controller runtime, not a Player class."""

from noema.harness.adapters import FirstValidAffordanceAdapter, ScriptedAdapter
from noema.harness.auth import DeviceEnrollmentProvider, EnvTokenProvider, StaticTokenProvider
from noema.harness.errors import HarnessError
from noema.harness.loop import HeadlessHarness
from noema.harness.orientation import check_orientation_s0
from noema.harness.smell import detect_smell
from noema.harness.tenant import TenantError, resolve_tenant
from noema.harness.types import ActionProposal, FailureClass, UnattendedRun

__all__ = [
    "ActionProposal",
    "DeviceEnrollmentProvider",
    "EnvTokenProvider",
    "FailureClass",
    "FirstValidAffordanceAdapter",
    "HarnessError",
    "HeadlessHarness",
    "ScriptedAdapter",
    "StaticTokenProvider",
    "TenantError",
    "UnattendedRun",
    "check_orientation_s0",
    "detect_smell",
    "resolve_tenant",
]
