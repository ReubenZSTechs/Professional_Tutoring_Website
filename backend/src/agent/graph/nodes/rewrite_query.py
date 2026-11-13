"""Node 2: the prompt_rewriter agent.

Turns the visitor's latest message into a standalone search query using
the chat history, and labels its language, intent and risk. If the model
call fails, the original message is used so the visitor still gets an
answer.
"""

import json
import re
from collections.abc import Awaitable, Callable
from pathlib import Path

from core.config import PROMPTS_DIR, SCHEMAS_DIR, Settings
from core.logging import get_logger
from guardrails.injection import score_injection
from guardrails.replies import OFF_TOPIC, SMALLTALK
from llm.gemini import GeminiClient

from agent.graph.state import ChatState, Rewrite, data_block, new_block_id, render_history

logger = get_logger(__name__)

# Common Indonesian words, used only when the model call fails.
_ID_WORDS = re.compile(
    r"\b(apa|apakah|berapa|bagaimana|gimana|kapan|bisa|saya|anak|les|biaya|harga|"
    r"jadwal|untuk|dengan|yang|tidak|terima kasih|halo|mau|ingin|kelas|pelajaran)\b",
    re.IGNORECASE,
)

INTENTS = ("info", "booking", "smalltalk", "off_topic")
RISKS = ("none", "suspected", "attack")


def guess_language(text: str, default: str = "en") -> str:
    return "id" if len(_ID_WORDS.findall(text)) >= 2 else default


def fallback_rewrite(message: str, ui_language: str = "en") -> Rewrite:
    suspicious = score_injection(message).is_suspicious
    return {
        "standalone_query": message,
        "language": guess_language(message, ui_language),  # type: ignore[typeddict-item]
        "intent": "info",
        "needs_retrieval": True,
        "risk": "suspected" if suspicious else "none",
    }


def build_rewrite_prompt(state: ChatState) -> str:
    block_id = new_block_id()
    parts = []
    if state.get("summary"):
        parts.append(
            "Summary of the earlier conversation:\n"
            + data_block("conversation", state["summary"], block_id)
        )
    parts.append(
        "Recent conversation:\n"
        + data_block("conversation", render_history(state.get("recent", [])), block_id)
    )
    parts.append(
        "Latest message from the visitor:\n" + data_block("visitor", state["message"], block_id)
    )
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
        intent = result.get("intent") if result.get("intent") in INTENTS else "info"
        risk = result.get("risk") if result.get("risk") in RISKS else "none"
        if fallback["risk"] == "suspected" and risk == "none":
            risk = "suspected"  # the pattern screen saw something; keep a note of it
        rewrite: Rewrite = {
            "standalone_query": query[: settings.max_message_chars],
            "language": language,
            "intent": intent,
            "needs_retrieval": bool(result.get("needs_retrieval", True))
            and intent in ("info", "booking"),
            "risk": risk,
        }
        return {"rewrite": rewrite}

    return rewrite_query


def after_rewrite(state: ChatState) -> str:
    """Route: canned reply for attacks, off-topic and small talk; otherwise retrieve."""
    rewrite = state["rewrite"]
    if rewrite["risk"] == "attack" or rewrite["intent"] in ("off_topic", "smalltalk"):
        return "canned"
    return "retrieve"


def make_canned() -> Callable[[ChatState], dict]:
    def canned(state: ChatState) -> dict:
        rewrite = state["rewrite"]
        lang = rewrite["language"]
        if rewrite["risk"] == "attack":
            from guardrails.replies import BLOCKED

            return {"blocked": "classifier", "answer": BLOCKED[lang]}
        if rewrite["intent"] == "smalltalk":
            return {"answer": SMALLTALK[lang]}
        return {"blocked": "off_topic", "answer": OFF_TOPIC[lang]}

    return canned
