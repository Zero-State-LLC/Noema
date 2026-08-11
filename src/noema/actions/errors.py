"""Stable machine error codes for the Chamber runtime."""

from __future__ import annotations


class ActionError(Exception):
    def __init__(self, code: str, message: str, *, retryable: bool = False, details: dict | None = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.retryable = retryable
        self.details = details or {}

    def as_dict(self) -> dict:
        return {
            "code": self.code,
            "message": self.message,
            "retryable": self.retryable,
            "details": self.details,
        }


INVALID_ACTION = "INVALID_ACTION"
PRECONDITION_FAILED = "PRECONDITION_FAILED"
NOT_AUTHORIZED = "NOT_AUTHORIZED"
VERSION_MISMATCH = "VERSION_MISMATCH"
WORLD_NOT_READY = "WORLD_NOT_READY"
FORBIDDEN = "FORBIDDEN"
NOT_FOUND = "NOT_FOUND"
CONFLICT = "CONFLICT"
