"""Shared state passed between the graph nodes."""

from typing import Literal, TypedDict

from rag.retriever import RetrievedChunk


class Message(TypedDict):
    role: Literal["user", "assistant"]
    content: str


class Rewrite(TypedDict):
    standalone_query: str
    language: Literal["en", "id"]
    intent: Literal["info", "booking", "smalltalk", "off_topic"]
    needs_retrieval: bool


class ChatState(TypedDict, total=False):
    # input
    message: str  # the visitor's latest message
    history: list[Message]  # earlier turns, sent by the browser
    ui_language: Literal["en", "id"]  # language the page is shown in
    # compile_history
    summary: str  # summary of turns older than the recent window
    recent: list[Message]  # most recent turns, kept verbatim
    # rewrite_query
    rewrite: Rewrite
    # retrieve
    documents: list[RetrievedChunk]
    # respond
    answer: str


def render_history(messages: list[Message]) -> str:
    """Render turns as plain text for a prompt."""
    if not messages:
        return "(no earlier messages)"
    labels = {"user": "Visitor", "assistant": "Assistant"}
    return "\n".join(f"{labels[m['role']]}: {m['content']}" for m in messages)
