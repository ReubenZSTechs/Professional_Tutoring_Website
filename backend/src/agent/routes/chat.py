"""POST /api/chat: run the chat graph and stream the answer.

The response is a Server-Sent Events stream with these events:

    meta   {"language", "intent", "query"}   after the rewriter runs
    token  {"text"}                          a piece of the answer
    done   {"sources": [...]}                the answer is complete
    error  {"message"}                       something went wrong
"""

import json
from collections.abc import AsyncIterator
from typing import Literal

from core.logging import get_logger
from core.rate_limit import enforce
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from tools.rag_search import unique_sources

from agent.container import Container, get_container

logger = get_logger(__name__)
router = APIRouter()


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=6000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[HistoryMessage] = Field(default_factory=list, max_length=60)
    session_id: str = Field(default="", max_length=64)
    language: Literal["en", "id"] = "en"


def sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


ERROR_MESSAGES = {
    "en": "Sorry, I couldn't answer just now. Please try again, or message Reuben on WhatsApp.",
    "id": (
        "Maaf, saya belum bisa menjawab saat ini. "
        "Silakan coba lagi, atau hubungi Reuben via WhatsApp."
    ),
}


@router.post("/chat")
async def chat(
    body: ChatRequest, request: Request, container: Container = Depends(get_container)
) -> StreamingResponse:
    enforce(container.chat_limiter, request)
    settings = container.settings
    if not settings.gemini_ready:
        raise HTTPException(status_code=503, detail="The chat assistant is not configured yet.")

    message = body.message.strip()[: settings.max_message_chars]
    if not message:
        raise HTTPException(status_code=422, detail="Message is empty.")
    state = {
        "message": message,
        "history": [m.model_dump() for m in body.history],
        "ui_language": body.language,
    }

    async def event_stream() -> AsyncIterator[str]:
        query, answer, sources = message, "", []
        try:
            async for mode, chunk in container.graph.astream(
                state, stream_mode=["custom", "updates"]
            ):
                if mode == "custom":
                    if chunk.get("type") == "token":
                        yield sse("token", {"text": chunk["text"]})
                    continue
                if "rewrite_query" in chunk:
                    rewrite = chunk["rewrite_query"]["rewrite"]
                    query = rewrite["standalone_query"]
                    yield sse(
                        "meta",
                        {
                            "language": rewrite["language"],
                            "intent": rewrite["intent"],
                            "query": query,
                        },
                    )
                if "retrieve" in chunk:
                    sources = unique_sources(chunk["retrieve"]["documents"])
                if "respond" in chunk:
                    answer = chunk["respond"]["answer"]
            yield sse("done", {"sources": sources})
        except Exception:  # noqa: BLE001 - report the failure inside the stream
            logger.exception("Chat failed")
            yield sse("error", {"message": ERROR_MESSAGES[body.language]})
            return
        await container.chat_log.save_turn(
            session_id=body.session_id, question=message, rewritten_query=query, answer=answer
        )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"},
    )
