"""Shared state passed between the graph nodes."""

import secrets
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
    risk: Literal["none", "suspected", "attack"]


class ChatState(TypedDict, total=False):
    # input
    message: str  # the visitor's latest message, already sanitised
    history: list[Message]  # earlier (verified) turns, sent by the browser
    ui_language: Literal["en", "id"]  # language the page is shown in
    # screen
    blocked: str  # reason the message was refused without a model call
    # compile_history
    summary: str  # summary of turns older than the recent window
    recent: list[Message]  # most recent turns, kept verbatim
    # rewrite_query
    rewrite: Rewrite
    # retrieve
    documents: list[RetrievedChunk]
    # respond
    answer: str
    replaced: str  # set when the output guard replaced the model's answer
    busy: bool  # the model provider refused the request (quota)


def render_history(messages: list[Message]) -> str:
    """Render turns as plain text for a prompt."""
    if not messages:
        return "(no earlier messages)"
    labels = {"user": "Visitor", "assistant": "Assistant"}
    return "\n".join(f"{labels[m['role']]}: {m['content']}" for m in messages)


def new_block_id() -> str:
    """Random id for DATA block delimiters; a visitor cannot guess it to forge a close."""
    return secrets.token_hex(4)


def data_block(kind: str, body: str, block_id: str) -> str:
    """Wrap untrusted text so the model can tell it apart from instructions."""
    return f"<<<DATA id={block_id} type={kind}>>>\n{body}\n<<<END {block_id}>>>"
