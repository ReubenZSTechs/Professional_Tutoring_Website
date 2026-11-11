"""Node 1: tidy the chat history sent by the browser.

Keeps the most recent turns word for word and folds anything older into
a short summary, so prompts stay small however long the chat gets.
"""

from collections.abc import Awaitable, Callable
from pathlib import Path

from core.config import PROMPTS_DIR, Settings
from core.logging import get_logger
from llm.gemini import GeminiClient

from agent.graph.state import ChatState, Message, render_history

logger = get_logger(__name__)


def clean_history(history: list[Message] | None, max_chars: int) -> list[Message]:
    """Drop malformed entries and cap the length of each message."""
    cleaned: list[Message] = []
    for item in history or []:
        role, content = item.get("role"), str(item.get("content", "")).strip()
        if role in ("user", "assistant") and content:
            cleaned.append({"role": role, "content": content[:max_chars]})
    return cleaned


def make_compile_history(
    llm: GeminiClient, settings: Settings, prompts_dir: Path = PROMPTS_DIR
) -> Callable[[ChatState], Awaitable[dict]]:
    summarize_prompt = (prompts_dir / "summarize.md").read_text(encoding="utf-8")

    async def compile_history(state: ChatState) -> dict:
        history = clean_history(state.get("history"), settings.max_message_chars)
        recent = history[-settings.history_max_turns :]
        older = history[: -settings.history_max_turns]
        summary = ""
        if older:
            try:
                summary = await llm.generate(
                    render_history(older),
                    system=summarize_prompt,
                    model=settings.gemini_rewrite_model,
                    temperature=0.0,
                    max_output_tokens=300,
                )
            except Exception:  # noqa: BLE001 - a missing summary is not fatal
                logger.exception("History summary failed; continuing without it")
        return {"recent": recent, "summary": summary}

    return compile_history
