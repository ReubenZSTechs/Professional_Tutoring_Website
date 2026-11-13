"""Short-lived chat session tokens.

A visitor passes the Turnstile bot check once; the server then issues a
signed token that must accompany every chat message until it expires.
"""

import hashlib
import hmac
import secrets
import time

VERSION = "v1"


def _sign(secret: str, body: str) -> str:
    return hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()[:40]


def issue_session_token(secret: str, ttl_seconds: int, now: float | None = None) -> tuple[str, int]:
    """Return (token, expiry as a unix timestamp)."""
    expires = int((time.time() if now is None else now) + ttl_seconds)
    session_id = secrets.token_urlsafe(12)
    body = f"{VERSION}.{session_id}.{expires}"
    return f"{body}.{_sign(secret, body)}", expires


def verify_session_token(token: str, secret: str, now: float | None = None) -> str | None:
    """The session id if the token is genuine and current, else None."""
    if not token or not secret:
        return None
    parts = token.split(".")
    if len(parts) != 4 or parts[0] != VERSION:
        return None
    version, session_id, expires, signature = parts
    body = f"{version}.{session_id}.{expires}"
    if not hmac.compare_digest(_sign(secret, body), signature):
        return None
    try:
        if int(expires) < (time.time() if now is None else now):
            return None
    except ValueError:
        return None
    return session_id
