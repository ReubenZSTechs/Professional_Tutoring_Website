"""The chat API.

POST /api/chat/session   Turnstile token -> short-lived chat session token.
POST /api/chat           Run the chat graph and stream the answer.

The answer is a Server-Sent Events stream with these events:

    meta     {"language", "intent", "query"}            after the rewriter runs
    token    {"text"}                                   a piece of the answer
    replace  {"text"}                                   the answer so far must be replaced
    done     {"sources", "history_signature", "history_len"}
    error    {"message"}

The browser keeps the conversation and sends it back with each message.
`history_signature` proves the history is what the server produced; a
history without a valid signature is ignored (see guardrails/history.py).
"""

import json
from collections.abc import AsyncIterator
from typing import Literal

from core.logging import get_logger
from core.rate_limit import client_ip, hash_ip
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from guardrails.history import canonical, sign_history, verify_history
from guardrails.replies import ERROR, LIMIT
from guardrails.sanitize import sanitize_text
from guardrails.session import issue_session_token, verify_session_token
from pydantic import BaseModel, ConfigDict, Field
from tools.rag_search import unique_sources

from agent.container import Container, get_container

logger = get_logger(__name__)
router = APIRouter()


class SessionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    turnstile_token: str = Field(min_length=1, max_length=4096)


class HistoryMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message: str = Field(min_length=1, max_length=2000)
    history: list[HistoryMessage] = Field(default_factory=list, max_length=40)
    history_signature: str = Field(default="", max_length=128)
    session_token: str = Field(min_length=1, max_length=200)
    language: Literal["en", "id"] = "en"


def sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("/chat/session")
async def chat_session(
    body: SessionRequest, request: Request, container: Container = Depends(get_container)
) -> dict:
    """Exchange a solved Turnstile challenge for a chat session token."""
    settings = container.settings
    ip = client_ip(request)
    await container.limiter.enforce(
        container.policies.chat_minute, hash_ip(ip, settings.ip_hash_salt)
    )
    if not settings.chat_signing_secret:
        raise HTTPException(status_code=503, detail="The chat assistant is not configured yet.")
    if not await container.turnstile.verify(body.turnstile_token, ip):
        await container.events.record("turnstile_failed", hash_ip(ip, settings.ip_hash_salt))
        raise HTTPException(status_code=403, detail={"code": "turnstile_failed"})
    token, expires = issue_session_token(
        settings.chat_signing_secret, settings.chat_session_ttl_seconds
    )
    return {
        "session_token": token,
        "expires_at": expires,
        "history_window": settings.history_window,
    }


@router.post("/chat")
async def chat(
    body: ChatRequest, request: Request, container: Container = Depends(get_container)
) -> StreamingResponse:
    settings = container.settings
    ip = client_ip(request)
    ip_key = hash_ip(ip, settings.ip_hash_salt)

    if not settings.gemini_ready:
        raise HTTPException(status_code=503, detail="The chat assistant is not configured yet.")
    session_id = verify_session_token(body.session_token, settings.chat_signing_secret)
    if session_id is None:
        raise HTTPException(status_code=401, detail={"code": "session_required"})

    limit_message = LIMIT[body.language]
    await container.limiter.enforce(container.policies.chat_minute, ip_key, limit_message)
    await container.limiter.enforce(container.policies.chat_day, ip_key, limit_message)
    await container.limiter.enforce(container.policies.chat_global_day, "all", limit_message)

    message = sanitize_text(body.message, settings.max_message_chars)
    if not message:
        raise HTTPException(status_code=422, detail="Message is empty.")

    history = canonical([m.model_dump() for m in body.history], settings.max_message_chars)
    history_ok = verify_history(
        history, body.history_signature, settings.chat_signing_secret, settings.max_message_chars
    )
    if not history_ok:
        await container.events.record("forged_history", ip_key, message)
        history = []
    history = history[-settings.history_window :]

    state = {"message": message, "history": history, "ui_language": body.language}

    async def event_stream() -> AsyncIterator[str]:
        query, answer, sources, blocked = message, "", [], ""
        try:
            async for mode, chunk in container.graph.astream(
                state, stream_mode=["custom", "updates"]
            ):
                if mode == "custom":
                    if chunk.get("type") == "token":
                        yield sse("token", {"text": chunk["text"]})
                    elif chunk.get("type") == "replace":
                        yield sse("replace", {"text": chunk["text"]})
                    continue
                for node, update in chunk.items():
                    if not isinstance(update, dict):
                        continue
                    if node == "rewrite_query":
                        rewrite = update["rewrite"]
                        query = rewrite["standalone_query"]
                        yield sse(
                            "meta",
                            {
                                "language": rewrite["language"],
                                "intent": rewrite["intent"],
                                "query": query,
                            },
                        )
                        if rewrite["risk"] != "none":
                            await container.events.record(
                                f"risk_{rewrite['risk']}", ip_key, message
                            )
                    if node == "retrieve":
                        sources = unique_sources(update["documents"])
                    if update.get("blocked"):
                        blocked = update["blocked"]
                    if node in ("screen", "canned") and update.get("answer"):
                        answer = update["answer"]
                        yield sse("token", {"text": answer})
                    if node == "respond":
                        answer = update["answer"]
                        if update.get("replaced"):
                            await container.events.record(
                                "output_replaced", ip_key, message, {"reason": update["replaced"]}
                            )
            if blocked.startswith("injection") or blocked == "classifier":
                await container.events.record(
                    f"blocked_{blocked.split(':')[0]}", ip_key, message, {"detail": blocked}
                )
            transcript = (
                history
                + [{"role": "user", "content": message}, {"role": "assistant", "content": answer}]
            )[-settings.history_window :]
            yield sse(
                "done",
                {
                    "sources": sources,
                    "history_signature": sign_history(
                        transcript, settings.chat_signing_secret, settings.max_message_chars
                    ),
                    "history_len": len(transcript),
                },
            )
        except Exception:  # noqa: BLE001 - report the failure inside the stream
            logger.exception("Chat failed")
            yield sse("error", {"message": ERROR[body.language]})
            return
        await container.chat_log.save_turn(
            session_id=session_id, question=message, rewritten_query=query, answer=answer
        )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"},
    )
