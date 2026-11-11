"""Node 2: the prompt_rewriter agent.

Turns the visitor's latest message into a standalone search query using
the chat history, and labels its language and intent. If the model call
fails, the original message is used so the visitor still gets an answer.
"""

import json
import re
from collections.abc import Awaitable, Callable
from pathlib import Path

from core.config import PROMPTS_DIR, SCHEMAS_DIR, Settings
from core.logging import get_logger
from llm.gemini import GeminiClient

from agent.graph.state import ChatState, Rewrite, render_history

logger = get_logger(__name__)

# Common Indonesian words, used only when the model call fails.
_ID_WORDS = re.compile(
    r"\b(apa|apakah|berapa|bagaimana|gimana|kapan|bisa|saya|anak|les|biaya|harga|"
    r"jadwal|untuk|dengan|yang|tidak|terima kasih|halo|mau|ingin|kelas|pelajaran)\b",
    re.IGNORECASE,
)


def guess_language(text: str, default: str = "en") -> str:
    return "id" if len(_ID_WORDS.findall(text)) >= 2 else default


def fallback_rewrite(message: str, ui_language: str = "en") -> Rewrite:
    return {
        "standalone_query": message,
        "language": guess_language(message, ui_language),  # type: ignore[typeddict-item]
        "intent": "info",
        "needs_retrieval": True,
    }


def build_rewrite_prompt(state: ChatState) -> str:
    parts = []
    if state.get("summary"):
        parts.append(f"Summary of the earlier conversation:\n{state['summary']}")
    parts.append(f"Recent conversation:\n{render_history(state.get('recent', []))}")
    parts.append(f"Latest message from the visitor:\n{state['message']}")
    return "\n\n".join(parts)


def make_rewrite_query(
    llm: GeminiClient,
    settings: Settings,
    prompts_dir: Path = PROMPTS_DIR,
    schemas_dir: Path = SCHEMAS_DIR,
) -> Callable[[ChatState], Awaitable[dict]]:
    system_prompt = (prompts_dir / "rewrite.md").read_text(encoding="utf-8")
    schema = json.loads((schemas_dir / "prompt_rewriter.schema.json").read_text(encoding="utf-8"))

    async def rewrite_query(state: ChatState) -> dict:
        message = state["message"]
        fallback = fallback_rewrite(message, state.get("ui_language", "en"))
        try:
            result = await llm.generate_json(
                build_rewrite_prompt(state),
                schema=schema,
                system=system_prompt,
                model=settings.gemini_rewrite_model,
            )
        except Exception:  # noqa: BLE001 - fall back to the raw message
            logger.exception("Query rewrite failed; using the original message")
            return {"rewrite": fallback}

        query = str(result.get("standalone_query") or "").strip() or message
        language = (
            result.get("language")
            if result.get("language") in ("en", "id")
            else fallback["language"]
        )
        intent = (
            result.get("intent")
            if result.get("intent") in ("info", "booking", "smalltalk", "off_topic")
            else "info"
        )
        rewrite: Rewrite = {
            "standalone_query": query[: settings.max_message_chars],
            "language": language,
            "intent": intent,
            "needs_retrieval": bool(result.get("needs_retrieval", True)),
        }
        return {"rewrite": rewrite}

    return rewrite_query
