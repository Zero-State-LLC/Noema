"""Retries and polling in code, so waiting never costs a round trip through the model."""

from __future__ import annotations

import time
from typing import Callable, TypeVar

T = TypeVar("T")


def retry(
    fn: Callable[[], T],
    *,
    attempts: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0,
    on: tuple[type[BaseException], ...] = (Exception,),
) -> T:
    """Call fn until it succeeds or attempts run out; re-raise the last error."""
    wait = delay
    for attempt in range(1, attempts + 1):
        try:
            return fn()
        except on:
            if attempt == attempts:
                raise
            time.sleep(wait)
            wait *= backoff
    raise AssertionError("unreachable")


class PollTimeout(TimeoutError):
    def __init__(self, message: str, last: object) -> None:
        super().__init__(message)
        self.last = last


def poll_until(
    fn: Callable[[], T],
    done: Callable[[T], bool],
    *,
    timeout: float = 600.0,
    interval: float = 10.0,
    max_interval: float = 60.0,
    backoff: float = 1.5,
) -> T:
    """Call fn until done(result) is true. Raises PollTimeout carrying the last result."""
    deadline = time.monotonic() + timeout
    wait = interval
    while True:
        result = fn()
        if done(result):
            return result
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise PollTimeout(f"not done after {timeout:.0f}s", result)
        time.sleep(min(wait, remaining))
        wait = min(wait * backoff, max_interval)
