"""Harness-local failures. Not world authority."""

from __future__ import annotations

from noema.harness.types import FailureClass


class HarnessError(Exception):
    def __init__(
        self,
        failure_class: FailureClass,
        code: str,
        message: str,
        *,
        retryable: bool = False,
    ) -> None:
        self.failure_class = failure_class
        self.code = code
        self.message = message
        self.retryable = retryable
        super().__init__(message)

    def __repr__(self) -> str:
        return f"HarnessError({self.failure_class.value}, {self.code})"
