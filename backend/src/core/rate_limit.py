"""Small in-memory sliding-window rate limiter.

On Vercel each serverless instance keeps its own counters, so this is a
best-effort guard against a single visitor hammering the chat or the
contact form. For a hard global limit add a Vercel Firewall rate-limit
rule (see docs/deployment.md).
"""

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request


class SlidingWindowLimiter:
    def __init__(self, max_calls: int, window_seconds: float) -> None:
        self.max_calls = max_calls
        self.window_seconds = window_seconds
        self._calls: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str, now: float | None = None) -> bool:
        now = time.monotonic() if now is None else now
        calls = self._calls[key]
        while calls and now - calls[0] >= self.window_seconds:
            calls.popleft()
        if len(calls) >= self.max_calls:
            return False
        calls.append(now)
        return True


def client_ip(request: Request) -> str:
    """Best available client address (Vercel sets x-forwarded-for)."""
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce(limiter: SlidingWindowLimiter, request: Request) -> None:
    if not limiter.allow(client_ip(request)):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait a moment and try again.",
        )
