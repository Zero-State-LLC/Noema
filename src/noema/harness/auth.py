"""Controller credentials stay outside model context."""

from __future__ import annotations

import os
import time
from typing import Any, Callable

from noema.harness.errors import HarnessError
from noema.harness.types import FailureClass

HttpFn = Callable[..., dict[str, Any]]


class StaticTokenProvider:
    def __init__(self, token: str) -> None:
        self._token = token

    def reveal(self) -> str:
        return self._token

    def __repr__(self) -> str:
        return "StaticTokenProvider(<redacted>)"


class EnvTokenProvider:
    def reveal(self) -> str:
        token = os.environ.get("NOEMA_TOKEN")
        if not token:
            raise HarnessError(FailureClass.AUTH_REQUIRED, "AUTH_REQUIRED", "NOEMA_TOKEN is not set")
        return token

    def __repr__(self) -> str:
        return "EnvTokenProvider(<redacted>)"


class DeviceEnrollmentProvider:
    """POST /v1/auth/device then poll /v1/auth/device/token."""

    def __init__(
        self,
        base_url: str,
        *,
        runtime: str = "openclaw",
        http: HttpFn,
        sleep: Callable[[float], None] | None = None,
        announce: Callable[[str], None] | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.runtime = runtime
        self._http = http
        self._sleep = sleep or time.sleep
        self._announce = announce or (lambda _m: None)
        self._token: str | None = None
        self._device_code: str | None = None
        self._interval = 5.0
        self._deadline = 0.0

    def start(self) -> dict[str, Any]:
        started = self._http(
            "POST",
            f"{self.base_url}/v1/auth/device",
            {"metadata": {"runtime": self.runtime}},
            None,
        )
        self._device_code = str(started.get("device_code") or "")
        if not self._device_code:
            raise HarnessError(FailureClass.AUTH_REQUIRED, "AUTH_REQUIRED", "device start failed")
        self._interval = float(started.get("interval") or 5)
        self._deadline = time.time() + float(started.get("expires_in") or 600)
        user_code = started.get("user_code") or ""
        uri = started.get("verification_uri") or f"{self.base_url}/connect"
        self._announce(f"Approve {user_code} at {uri}")
        self._announce("Never click the PLAY letter.")
        return {
            "user_code": user_code,
            "verification_uri": uri,
            "expires_in": started.get("expires_in"),
            "interval": started.get("interval"),
            "scopes": started.get("scopes"),
        }

    def poll_until_ready(self) -> None:
        if not self._device_code:
            raise HarnessError(FailureClass.AUTH_REQUIRED, "AUTH_REQUIRED", "device start required")
        while time.time() < self._deadline:
            polled = self._http(
                "POST",
                f"{self.base_url}/v1/auth/device/token",
                {"device_code": self._device_code},
                None,
            )
            status = polled.get("status")
            if status == "approved" and polled.get("access_token"):
                self._token = str(polled["access_token"])
                return
            if status and status != "authorization_pending":
                raise HarnessError(FailureClass.AUTH_REQUIRED, "AUTH_REQUIRED", f"device enroll closed: {status}")
            if int(polled.get("_http_status") or 0) >= 400:
                raise HarnessError(FailureClass.AUTH_REQUIRED, "AUTH_REQUIRED", "device enroll failed")
            self._sleep(float(polled.get("interval") or self._interval))
        raise HarnessError(FailureClass.AUTH_REQUIRED, "AUTH_REQUIRED", "device enroll expired")

    def reveal(self) -> str:
        if not self._token:
            raise HarnessError(FailureClass.AUTH_REQUIRED, "AUTH_REQUIRED", "no controller token")
        return self._token

    def __repr__(self) -> str:
        return "DeviceEnrollmentProvider(<redacted>)"


def start_device(base: str, runtime: str = "openclaw", http: HttpFn | None = None) -> dict[str, Any]:
    from noema.harness.transport import default_http

    return (http or default_http)(
        "POST",
        f"{base.rstrip('/')}/v1/auth/device",
        {"metadata": {"runtime": runtime}},
        None,
    )


def poll_device_token(base: str, device_code: str, http: HttpFn | None = None) -> dict[str, Any]:
    from noema.harness.transport import default_http

    return (http or default_http)(
        "POST",
        f"{base.rstrip('/')}/v1/auth/device/token",
        {"device_code": device_code},
        None,
    )


def enroll_device(
    base: str,
    runtime: str = "openclaw",
    http: HttpFn | None = None,
    sleep=None,
    announce=None,
) -> str:
    from noema.harness.transport import default_http

    provider = DeviceEnrollmentProvider(
        base,
        runtime=runtime,
        http=http or default_http,
        sleep=sleep,
        announce=announce,
    )
    provider.start()
    provider.poll_until_ready()
    return provider.reveal()


def resolve_token(
    base: str,
    existing: str | None,
    runtime: str = "openclaw",
    http: HttpFn | None = None,
    sleep=None,
    announce=None,
) -> str:
    if existing:
        return existing
    return enroll_device(base, runtime=runtime, http=http, sleep=sleep, announce=announce)
