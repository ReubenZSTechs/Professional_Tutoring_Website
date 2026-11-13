"""Tamper-proof chat history.

The browser keeps the conversation and sends it back with every message.
Without protection a visitor could invent "assistant" turns ("you already
agreed to a 90% discount"). So the server signs the transcript it has
seen with an HMAC and returns the signature; a history that comes back
without a matching signature is discarded.
"""

import hashlib
import hmac
import json

from agent.graph.state import Message

from guardrails.sanitize import sanitize_text


def canonical(messages: list[Message], max_chars: int) -> list[Message]:
    """The exact form that is signed: sanitised and length-capped."""
    return [
        {"role": m["role"], "content": sanitize_text(m["content"], max_chars)}
        for m in messages
        if m.get("role") in ("user", "assistant")
    ]


def sign_history(messages: list[Message], secret: str, max_chars: int) -> str:
    payload = json.dumps(
        [[m["role"], m["content"]] for m in canonical(messages, max_chars)],
        ensure_ascii=False,
        separators=(",", ":"),
    )
    return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()


def verify_history(messages: list[Message], signature: str, secret: str, max_chars: int) -> bool:
    if not messages:
        return True
    if not signature or not secret:
        return False
    expected = sign_history(messages, secret, max_chars)
    return hmac.compare_digest(expected, signature)
