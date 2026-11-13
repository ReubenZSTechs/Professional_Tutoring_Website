"""Rate limiting and client identification.

Two layers:

* `RateLimiter` counts requests in Supabase (`hit_rate_limit` SQL
  function), so limits hold across every Vercel instance.
* `SlidingWindowLimiter` is the in-memory fallback used when Supabase is
  not configured or not reachable.

Visitor IP addresses are never stored or logged in clear: `hash_ip` turns
them into a salted hash first.
"""

import hashlib
import time
from collections import defaultdict, deque
from dataclasses import dataclass

from fastapi import HTTPException, Request

from core.config import Settings
from core.logging import get_logger

logger = get_logger(__name__)


def client_ip(request: Request) -> str:
    """The visitor's address as seen by Vercel's edge, which cannot be spoofed.

    `x-forwarded-for` is deliberately not trusted: a client can send its own.
    """
    for header in ("x-vercel-forwarded-for", "x-real-ip"):
        value = request.headers.get(header, "").split(",")[0].strip()
        if value:
            return value
    return request.client.host if request.client else "unknown"


def hash_ip(ip: str, salt: str) -> str:
    """Salted SHA-256 of an address, for rate-limit keys and security logs."""
    return hashlib.sha256(f"{salt}|{ip}".encode()).hexdigest()[:32]


class SlidingWindowLimiter:
    """In-memory limiter: one per policy, counters per key."""

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


@dataclass(frozen=True)
class Policy:
    name: str
    max_calls: int
    window_seconds: int


class RateLimiter:
    """Durable limiter backed by Supabase, with an in-memory fallback."""

    def __init__(self, supabase, settings: Settings) -> None:  # noqa: ANN001 - duck-typed client
        self.supabase = supabase
        self.settings = settings
        self._fallback: dict[str, SlidingWindowLimiter] = {}

    def _memory(self, policy: Policy) -> SlidingWindowLimiter:
        if policy.name not in self._fallback:
            self._fallback[policy.name] = SlidingWindowLimiter(
                policy.max_calls, policy.window_seconds
            )
        return self._fallback[policy.name]

    async def allow(self, policy: Policy, key: str) -> bool:
        full_key = f"{policy.name}:{key}"
        if getattr(self.supabase, "ready", False):
            try:
                rows = await self.supabase.rpc(
                    "hit_rate_limit",
                    {
                        "p_key": full_key,
                        "p_window_seconds": policy.window_seconds,
                        "p_max": policy.max_calls,
                    },
                )
                row = rows[0] if isinstance(rows, list) and rows else rows
                if isinstance(row, dict) and "allowed" in row:
                    return bool(row["allowed"])
            except Exception:  # noqa: BLE001 - fall back rather than fail open or closed loudly
                logger.warning("Rate limit store unavailable; using in-memory fallback")
        return self._memory(policy).allow(full_key)

    async def enforce(self, policy: Policy, key: str, message: str | None = None) -> None:
        if not await self.allow(policy, key):
            raise HTTPException(
                status_code=429,
                detail=message or "Too many requests. Please wait a moment and try again.",
                headers={"Retry-After": str(min(policy.window_seconds, 60))},
            )
